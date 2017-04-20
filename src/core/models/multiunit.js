import Backbone from 'backbone';
import _ from 'underscore';

import App from '../../main';
import Schema from '../../schema';
import { object, convert } from '../../utils';
import Unit from './unit';
import UnitCollection from '../collections/unit-collection';
import { mergePreviewOptions, generatePreview } from '../../components/drawing/module/preview';

const MULTIUNIT_PROPERTIES = [
    { name: 'multiunit_subunits', title: 'Subunits', type: 'array' },
    { name: 'mark', title: 'Mark', type: 'string' },
    { name: 'quantity', title: 'Quantity', type: 'number' },
    { name: 'description', title: 'Customer Description', type: 'string' },
    { name: 'notes', title: 'Notes', type: 'string' },
    { name: 'exceptions', title: 'Exceptions', type: 'string' },
    { name: 'customer_image', title: 'Customer Image', type: 'string' },
    { name: 'position', title: 'Position', type: 'number' },
    { name: 'root_section', title: 'Root Section', type: 'object' },
];

const CONNECTOR_DEFAULTS = {
    width: 20,
    facewidth: 40,
};

export default Backbone.Model.extend({
    schema: Schema.createSchema(MULTIUNIT_PROPERTIES),
    defaults() {
        const defaults = {};

        _.each(MULTIUNIT_PROPERTIES, function (item) {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        }, this);

        return defaults;
    },
    initialize(attributes, options) {
        this.options = options || {};
        this._cache = {};

        if (!this.options.proxy) {
            if (_.isArray(this.options.subunits)) {
                _.each(this.options.subunits, subunit => this.addSubunit(subunit));
            }

            this.on('change', this.updateMultiunitSize);
            this.on('add', () => {
                this.updateSubunitsMetadata();
                this.listenTo(this.collection, 'update', this.updateSubunitsMetadata);
                this.listenTo(this.collection.subunits, 'update', this.updateSubunitsMetadata);
            });
        }
    },
    getNameAttribute() {
        return 'mark';
    },
    //  TODO: stuff inside name_value_hash gets evaluated for each
    //  attribute, but we actually want it to be evaluated only for the
    //  corresponding attribute (see example for root_section)
    getDefaultValue(name, type) {
        let default_value = '';

        const type_value_hash = {
            number: 0,
            array: [],
        };

        const name_value_hash = {
            quantity: 1,
            root_section: (name === 'root_section') ? { id: _.uniqueId(), connectors: [] } : '',
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    parseAndFixRootSection(root_section_data) {
        let root_section_parsed = object.extractObjectOrNull(root_section_data);

        if (!_.isObject(root_section_parsed)) {
            root_section_parsed = this.getDefaultValue('root_section');
        }

        root_section_parsed = this.validateConnectors(root_section_parsed);

        return root_section_parsed;
    },
    parse(data) {
        const multiunit_data = data && data.multiunit ? data.multiunit : data;
        const filtered_data = Schema.parseAccordingToSchema(multiunit_data, this.schema);

        if (filtered_data && filtered_data.multiunit_subunits) {
            filtered_data.multiunit_subunits =
                object.extractObjectOrNull(filtered_data.multiunit_subunits) ||
                this.getDefaultValue('multiunit_subunits', 'array');
        }

        if (filtered_data && filtered_data.root_section) {
            filtered_data.root_section = this.parseAndFixRootSection(filtered_data.root_section);
        }

        return filtered_data;
    },
    sync(method, model, options) {
        if (method === 'create' || method === 'update') {
            options.attrs = { project_multiunit: model.toJSON() };
        }

        return Backbone.sync.call(this, method, model, options);
    },
    toJSON(...args) {
        const properties_to_omit = ['id', 'height', 'width'];
        const json = Backbone.Model.prototype.toJSON.apply(this, args);

        json.multiunit_subunits = JSON.stringify(json.multiunit_subunits);
        json.root_section = JSON.stringify(json.root_section);

        return _.omit(json, properties_to_omit);
    },
    hasOnlyDefaultAttributes() {
        let has_only_defaults = true;

        _.each(this.toJSON(), function (value, key) {
            if (key !== 'position' && has_only_defaults) {
                const property_source = _.findWhere(MULTIUNIT_PROPERTIES, { name: key });
                const type = property_source ? property_source.type : undefined;

                if (key === 'root_section') {
                    if (value !==
                        JSON.stringify(_.extend(
                            {},
                            this.getDefaultValue('root_section'),
                            { id: this.get('root_section').id },
                        ))
                    ) {
                        has_only_defaults = false;
                    }
                } else if (key === 'multiunit_subunits') {
                    if (value !== JSON.stringify(this.getDefaultValue('multiunit_subunits', 'array'))) {
                        has_only_defaults = false;
                    }
                } else if (this.getDefaultValue(key, type) !== value) {
                    has_only_defaults = false;
                }
            }
        }, this);

        return has_only_defaults;
    },
    getParentProject() {
        return this.collection && this.collection.options.project;
    },
    getParentQuote() {
        return this.collection && this.collection.options.quote;
    },
    //  Check if this unit belongs to the quote which is currently active
    isParentQuoteActive() {
        let is_active = false;

        if (App.current_quote && this.collection && this.collection.options.quote && this.collection.options.quote === App.current_quote) {
            is_active = true;
        }

        return is_active;
    },
    getInMetric(attr, metric) {
        if (!metric || (['mm', 'inches'].indexOf(metric) === -1)) {
            throw new Error('Set metric! "mm" or "inches"');
        }

        if (!attr || (['width', 'height'].indexOf(attr) === -1)) {
            throw new Error('This function is only supposed to get width or height');
        }

        const value = (attr === 'width') ? this.getWidth() : this.getHeight();

        return (metric === 'inches') ? value : convert.inches_to_mm(value);
    },
    //  Multiunits and normal units share reference numbers within project.
    //  Numbering starts with multiunits, the first multiunit within the
    //  project gets 1, and its subunits are 1a, 1b, 1c etc. Second
    //  multiunit is 2, and so on. The first normal unit that doesn't
    //  belong to any collection gets the number of last multiunit + 1,
    //  the remaining normal units are numbered according to their position
    getRefNum() {
        let ref_num = -1;

        if (this.collection) {
            ref_num = this.get('position') + 1;
        }

        return ref_num;
    },
    getTitles(names) {
        const name_title_hash = this.getNameTitleTypeHash(names);

        return _.pluck(name_title_hash, 'title');
    },
    //  Return { name: 'name', title: 'Title' } pairs for each item in
    //  `names` array. If the array is empty, return all possible pairs
    getNameTitleTypeHash(names) {
        const name_title_hash = [];

        if (!names) {
            names = _.pluck(MULTIUNIT_PROPERTIES, 'name');
        }

        _.each(MULTIUNIT_PROPERTIES, (item) => {
            if (_.indexOf(names, item.name) !== -1) {
                name_title_hash.push({ name: item.name, title: item.title, type: item.type });
            }
        });

        return name_title_hash;
    },
    /**
     * Root section looks like this:
     * {
     *     id: 123,
     *     connectors: [Array]
     * }
     */
    generateFullRoot(rootSection) {
        rootSection = rootSection || JSON.parse(JSON.stringify(this.get('root_section')));

        return rootSection;
    },
    getSubunitsSum(funcName) {
        if (!_.isFunction(this.subunits.at(0)[funcName])) { return 0; }

        const sum = this.subunits.reduce((tmpSum, subunit) => tmpSum + subunit[funcName](), 0);

        return sum;
    },
    getUnitPrice() {
        return this.getSubunitsSum('getUnitPrice');
    },
    getSubtotalPrice() {
        return this.getSubunitsSum('getSubtotalPrice');
    },
    getUnitPriceDiscounted() {
        return this.getSubunitsSum('getUnitPriceDiscounted');
    },
    getSubtotalPriceDiscounted() {
        return this.getSubunitsSum('getSubtotalPriceDiscounted');
    },
    getRelation() {
        return 'multiunit';
    },
    isMultiunit() {
        return true;
    },
    isSubunit() {
        return false;
    },
    isTrapezoid() {
        return false;
    },
    leftMetricCount() {
        return 0;
    },
    isArchedWindow() {
        return false;
    },
    rightMetricCount() {
        return 0;
    },
    isOpeningDirectionOutward() {
        return false;
    },
    // this.subunits is a collection with models from project's units collection
    createSubunitsCollection() {
        const self = this;

        this.subunits = new UnitCollection();

        // Trigger self change if any subunit changes
        this.listenTo(this.subunits, 'change', function () {
            self.trigger.apply(this, ['change'].concat(Array.prototype.slice.call(arguments)));
        });
        this.listenTo(this.subunits, 'add', function () {
            self.trigger.apply(this, ['change'].concat(Array.prototype.slice.call(arguments)));
        });
        this.listenTo(this.subunits, 'remove', function () {
            self.trigger.apply(this, ['change'].concat(Array.prototype.slice.call(arguments)));

            // Remove multiunit if last subunit is removed
            if (self.subunits.length === 0) {
                self.destroy();
            }
        });
    },
    // Reorders subunit models in their collection (not in this.subunits)
    updateSubunitsIndices() {
        const self = this;

        if (!this.collection || !this.collection.subunits || !this.subunits) {
            return;
        }

        this.subunits.forEach((subunit, subunitIndex) => {
            const firstSubunit = self.subunits.at(0);
            const firstSubunitPosition = firstSubunit.collection.indexOf(firstSubunit);
            const currentPosition = self.collection.subunits.indexOf(subunit);
            const newPosition = (firstSubunitPosition + subunitIndex < self.collection.subunits.length) ?
                firstSubunitPosition + subunitIndex :
                (firstSubunitPosition + subunitIndex) - 1;

            self.collection.subunits.setItemPosition(currentPosition, newPosition);
        });
    },
    updateSubunitsMetadata() {
        this.validateSubunits();
        this.updateConnectorsLength();
        this.updateSubunitsIndices();
    },
    updateMultiunitSize(eventData) {
        if (eventData.changed.width || eventData.changed.height) {
            this.recalculateSizes();
        }
    },
    /* eslint-disable no-unused-expressions */
    validateSubunits(options) {
        const self = this;
        const subunitsArray = (this.subunits) ? this.subunits.toArray() : undefined;
        const subunitsList = _.zip(this.get('multiunit_subunits'), subunitsArray);
        const onlyCheck = options && options.onlyCheck;  // "Only check and report, don't fix" option

        subunitsList.forEach((subunitData) => {
            const subunitId = subunitData[0];
            const subunit = subunitData[1];
            const needsConnector = !self.isOriginId(subunitId || subunit.id);
            const hasConnector = self.getParentConnector(subunitId || subunit.id);

            if (needsConnector && !hasConnector) {
                if (onlyCheck) { return; }
                self.removeSubunitId(subunitId);
                self.removeSubunitObject(subunit);
            } else if (subunitId && !subunit) {
                if (onlyCheck) { return; }
                const foundSubunit = self.getSubunitById(subunitId);
                self.addSubunitObject(foundSubunit) || self.removeSubunitId(subunitId);
            } else if (!subunitId && subunit) {
                if (onlyCheck) { return; }
                const foundSubunitId = subunit.get('id');
                self.addSubunitId(foundSubunitId) || self.removeSubunitObject(subunit);
            } else if (onlyCheck) { return true; }
        });
    },
    /* eslint-enable no-unused-expressions */
    // Low-level functions to manipulate subunit collection data; don't use unless need to
    addSubunitId(id) {
        if (!id) {
            return;
        }

        const subunitsIds = this.get('multiunit_subunits');
        subunitsIds.push(id);

        return this.set('multiunit_subunits', subunitsIds);
    },
    addSubunitObject(unit) {
        if (!unit) {
            return;
        }

        if (!this.subunits) {
            this.createSubunitsCollection();
        }

        return this.subunits.add(unit);
    },
    removeSubunitId(id) {
        if (!id) {
            return;
        }

        const subunitsIds = this.get('multiunit_subunits');

        return this.set('multiunit_subunits', _.without(subunitsIds, id));
    },
    removeSubunitObject(subunit) {
        if (!subunit || !this.subunits) {
            return;
        }

        return this.subunits.remove(subunit);
    },
    // High-level function for adding subunits; use it if not sure
    addSubunit(subunit) {
        if (!(subunit instanceof Unit)) {
            return;
        }

        const multiunit = this;
        const subunitsIds = this.get('multiunit_subunits');
        let subunitId = subunit.id;
        let isGhostId;

        if (!subunitId) {
            subunitId = 1000000000 + parseInt(subunit.cid.slice(1), 10);
            isGhostId = true;
        }

        const idRewriter = function (newId) {
            const idsToRewrite = multiunit.get('multiunit_subunits');
            const index = idsToRewrite.indexOf(subunitId);

            if (index !== -1) { idsToRewrite[index] = newId; }
        };
        const alreadyInAttribute = _.contains(subunitsIds, subunitId);
        const alreadyInCollection = _.contains(this.subunits, subunit);

        if (alreadyInAttribute && alreadyInCollection) { return; }

        if (isGhostId) {
            subunit.addGhostAttribute('id', subunitId);
            subunit.addGhostRewriter('id', idRewriter);
        }

        if (!alreadyInAttribute) { this.addSubunitId(subunitId); }
        if (!alreadyInCollection) { this.addSubunitObject(subunit); }

        if (this.validateSubunits({ onlyCheck: true })) {
            this.updateSubunitsIndices();
            this.recalculateSizes();
        }
    },
    // High-level function for removing subunits; use it if not sure
    removeSubunit(subunitOrId) {
        const subunit = (_.isNumber(subunitOrId)) ? this.getSubunitById(subunitOrId) : subunitOrId;

        if (!(subunit.isSubunitOf && subunit.isSubunitOf(this))) { return; }

        const subunitsIds = this.get('multiunit_subunits');
        const subunitId = subunit.id;
        const subunitIndex = subunitsIds.indexOf(subunitId);
        const isSubunitOf = subunitIndex !== -1;
        const isSubunitRemovable = this.isSubunitRemovable(subunitId);
        let parentConnector;

        if (isSubunitOf && isSubunitRemovable) {
            subunitsIds.splice(subunitIndex, 1);
            parentConnector = this.getParentConnector(subunitId);

            if (parentConnector) {
                this.removeConnector(parentConnector.id);
            }

            this.validateSubunits();
            this.updateSubunitsIndices();
            this.recalculateSizes();
            subunit.destroy();

            return true;
        }
    },
    getSubunitById(id) {
        let subunit;

        if (this.subunits) {
            subunit = this.subunits.get(id);
        }

        if (!subunit && this.collection && this.collection.subunits) {
            subunit = this.collection.subunits.get(id);
        }

        return subunit;
    },
    getWidth() {
        return this._cache.width || this.recalculateSizes().width;
    },
    getHeight() {
        return this._cache.height || this.recalculateSizes().height;
    },
    // Updates multiunit width/height based on subunit sizes & positions
    recalculateSizes() {
        const subunitPositionsTree = this.getSubunitsCoordinatesTree();
        const rect = this.subunitsTreeGetRect(subunitPositionsTree);

        this._cache.width = convert.mm_to_inches(rect.width);
        this._cache.height = convert.mm_to_inches(rect.height);

        return { width: rect.width, height: rect.height };
    },
    getSubunitNode(subunitId) {
        const subunitPositionsTree = this.getSubunitsCoordinatesTree();
        let subunitNode;

        this.subunitsTreeForEach(subunitPositionsTree, (node) => {
            if (node.unit.id === subunitId) {
                subunitNode = node;
            }
        });

        return subunitNode;
    },
    getSubunitCoords(subunitId) {
        const subunitNode = this.getSubunitNode(subunitId);
        let coords;

        if (subunitNode) {
            coords = {
                x: subunitNode.x,
                y: subunitNode.y,
            };
        }

        return coords;  // mm
    },
    isSubunitRemovable(subunitId) {
        const subunitNode = this.getSubunitNode(subunitId);
        const isLeafSubunit = (subunitNode.children.length === 0);

        return isLeafSubunit;
    },
    /**
     * Subunit tree consists of nodes corresponding to subunits.
     * Each node has 3 fields:
     * unit - points to the unit model associated with this node
     * parent - points to the parent node
     * children - points to array of child nodes
     */
    /* eslint-disable no-loop-func */
    getSubunitsTree() {
        const self = this;
        const subunitsIds = this.getSubunitsIds();  // Prepare flat array of node templates
        const nodeTemplates = subunitsIds.map((subunitId) => {
            const unitId = subunitId;
            const parentId = self.getParentSubunitId(subunitId);
            const childrenIds = self.getChildSubunitsIds(subunitId);
            const node = {
                unit: unitId,
                parent: parentId,
                children: childrenIds,
            };
            return node;
        });

        if (nodeTemplates.length === 0) { return; }

        const originId = this.getOriginSubunitId();  // Bootstrap tree
        const originNode = nodeTemplates.filter(node => (node.unit === originId))[0];

        originNode.unit = self.getSubunitById(originNode.unit);

        const subunitsTree = originNode;
        const processableLeafNodes = [];

        processableLeafNodes[0] = subunitsTree;

        while (processableLeafNodes.length > 0) {  // Build tree by appending nodes from array
            const currentNode = processableLeafNodes.pop();

            currentNode.children.forEach((subunitId, childIndex) => {
                // Select node
                const childNode = nodeTemplates.filter(node => node.unit === subunitId)[0];

                if (!(childNode && childNode.unit)) {
                    currentNode.children[childIndex] = undefined;
                    return;
                }

                childNode.unit = self.getSubunitById(subunitId);  // Render node to its final form
                childNode.parent = currentNode;

                currentNode.children[childIndex] = childNode;  // Append node to tree

                if (childNode.children.length > 0) {  // Mark for later processing
                    processableLeafNodes.push(childNode);
                }
            });
            currentNode.children = _.without(currentNode.children, undefined);
        }

        return subunitsTree;
    },
    /* eslint-enable no-loop-func */
    // Returns subunit tree with coordinate information at each node, in mm
    getSubunitsCoordinatesTree(options) {
        const self = this;
        const flipX = options && options.flipX;
        const subunitsTree = this.getSubunitsTree();

        this.subunitsTreeForEach(subunitsTree, (node) => {
            if (!node.unit) { return; }

            const isOrigin = self.isOriginId(node.unit.id);

            if (isOrigin) {
                node.width = node.unit.getInMetric('width', 'mm');
                node.height = node.unit.getInMetric('height', 'mm');
                node.x = 0;
                node.y = 0;
            } else {
                const width = node.unit.getInMetric('width', 'mm');
                const height = node.unit.getInMetric('height', 'mm');
                const parentX = node.parent.x;
                const parentY = node.parent.y;
                const parentWidth = node.parent.unit.getInMetric('width', 'mm');
                const parentHeight = node.parent.unit.getInMetric('height', 'mm');
                const parentConnector = self.getParentConnector(node.unit.id);
                const gap = parentConnector.width;
                const side = parentConnector.side;

                node.width = width;
                node.height = height;

                if (side && side === 'top') {
                    node.x = (flipX) ? parentX + (parentWidth - width) : parentX;
                    node.y = parentY - gap - height;
                } else if (side && side === 'right') {
                    node.x = (flipX) ? parentX - gap - width : parentX + parentWidth + gap;
                    node.y = parentY;
                } else if (side && side === 'bottom') {
                    node.x = (flipX) ? parentX + (parentWidth - width) : parentX;
                    node.y = parentY + parentHeight + gap;
                } else if (side && side === 'left') {
                    node.x = (flipX) ? parentX + parentWidth + gap : parentX - gap - width;
                    node.y = parentY;
                }
            }
        });

        const rect = this.subunitsTreeGetRect(subunitsTree);

        if (rect.x < 0) {
            const delta = Math.abs(rect.x);

            this.subunitsTreeForEach(subunitsTree, (node) => {
                node.x += delta;
            });
        }

        return subunitsTree;
    },
    subunitsTreeForEach(subunitNode, func) {
        if (!subunitNode || !_.isFunction(func)) { return; }

        const self = this;
        const children = subunitNode.children;  // start at node and apply down

        func.call(this, subunitNode);

        if (children && children.length > 0) {
            children.forEach((node) => {  // recursive walk
                self.subunitsTreeForEach(node, func);
            });
        }
    },
    subunitsTreeGetRect(subunitPositionsTree) {
        if (!subunitPositionsTree) { return {}; }

        let minX = 0;
        let maxX = 0;
        let minY = 0;
        let maxY = 0;

        this.subunitsTreeForEach(subunitPositionsTree, (node) => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x + node.width);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y + node.height);
        });

        const multiunitWidth = maxX - minX;
        const multiunitHeight = maxY - minY;

        return { x: minX, y: minY, width: multiunitWidth, height: multiunitHeight };
    },
    getSubunitsIds() {
        return this.get('multiunit_subunits').slice();
    },
    getOriginSubunitId() {
        return this.get('multiunit_subunits')[0];
    },
    isOriginId(subunitId) {
        return (subunitId === this.getOriginSubunitId());
    },
    getParentSubunitId(subunitId) {
        if (this.isOriginId(subunitId)) { return; }

        const parentConnectorId = this.getParentConnector(subunitId).id;
        const parentSubunitId = this.getConnectorParentSubunitId(parentConnectorId);

        return parentSubunitId;
    },
    getChildSubunitsIds(subunitId) {
        const self = this;
        const childConnectors = this.getChildConnectors(subunitId);
        const childSubunitsIds = childConnectors.map(connector => self.getConnectorChildSubunitId(connector.id));

        return childSubunitsIds;
    },
    /**
     * = Conceptual connector model:
     *
     * The multiunit is a tree of subunits. Each connection is
     * parent subunit <- connector <- child subunit.
     *
     * Connector connects to parent on a side.
     * Connector adds a gap between parent and child, but may itself appear thicker than that gap.
     *
     * = Connector format:
     * {
     *     id: '<id>',                       // Multiunit-scope unique numeric ID for the connector
     *     side: '<top|right|bottom|left>',  // Attach connector to parent side
     *     connects: [                       // IDs of subunits connected
     *         '<id>',                           // Parent subunit ID
     *         '<id>'                            // Child subunit ID
     *     ],
     *     width: <number>,                  // Actual gap between connected units, mm
     *     facewidth: <number>               // How wide the connector drawing appears, mm
     *     length: <number>,                 // Connector length, mm
     * }
     *
     * = Example:
     * { id: '17', side: 'right', connects: ['123', '124'], width: 20, facewidth: 40 }
     */
    validateConnectors(alternativeRoot) {
        const self = this;
        const rootSection = alternativeRoot || this.get('root_section');
        const connectors = rootSection.connectors;

        if (!connectors) {
            rootSection.connectors = [];
        }

        rootSection.connectors.forEach((connector, index) => {
            const hasId = _.isNumber(parseInt(connector.id, 10));
            const hasSide = (['top', 'right', 'bottom', 'left'].indexOf(connector.side) !== 0);
            const hasConnects = (
                _.isArray(connector.connects) &&
                connector.connects.length === 2 &&
                self.getSubunitById(connector.connects[0]) &&
                self.getSubunitById(connector.connects[1])
            );
            const hasWidth = _.isNumber(connector.width);
            const hasFacewidth = _.isNumber(connector.facewidth);
            const hasLength = _.isNumber(connector.length);

            if (!hasWidth) {
                connector.width = CONNECTOR_DEFAULTS.width;
            }

            if (!hasFacewidth) {
                connector.width = CONNECTOR_DEFAULTS.facewidth;
            }

            if (!hasId || !hasSide || !hasConnects) {
                connectors[index] = undefined;
                return;
            }

            if (!hasLength) {
                connectors[index] = self.updateConnectorLength(connector);
            }
        });
        rootSection.connectors = _.without(rootSection.connectors, undefined);

        return rootSection;
    },
    getConnectors() {
        return this.get('root_section').connectors.slice();
    },
    getConnectorById(id) {
        return _(this.getConnectors()).find(connector => connector.id === id);
    },
    getParentConnector(subunitId) {
        const parentConnector = this.getConnectors()
            .filter(connector => connector.connects[1] === subunitId)[0];

        return parentConnector;
    },
    getConnectedSides(subunitId) {
        const parentConnector = this.getParentConnector(subunitId);
        const childConnectors = this.getChildConnectors(subunitId);
        const oppositeSides = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right',
        };
        let connectedSides = [];

        if (parentConnector) {
            connectedSides.push(oppositeSides[parentConnector.side]);
        }

        connectedSides = connectedSides.concat(_.pluck(childConnectors, 'side'));

        return connectedSides;
    },
    getChildConnectors(subunitId) {
        const childConnectors = this.getConnectors()
            .filter(connector => connector.connects[0] === subunitId);

        return childConnectors;
    },
    getConnectorParentSubunitId(connectorId) {
        const parentSubunitId = this.getConnectorById(connectorId).connects[0];

        return parentSubunitId;
    },
    getConnectorChildSubunitId(connectorId) {
        const childSubunitId = this.getConnectorById(connectorId).connects[1];

        return childSubunitId;
    },
    addConnector(options) {
        if (!(options && options.connects && options.side)) { return; }

        const self = this;
        const parentSubunit = this.getSubunitById(options.connects[0]);
        const connectors = this.get('root_section').connectors;
        let highestId = 0;

        const pushConnector = function () {
            const connector = {
                id: highestId + 1,
                connects: options.connects,
                side: options.side,
                width: options.width || CONNECTOR_DEFAULTS.width,
                facewidth: options.facewidth || CONNECTOR_DEFAULTS.facewidth,
            };

            connectors.push(connector);
            self.updateConnectorLength(connector);

            if (options.success) {
                options.success();
            }
        };

        let newChildSubunit;

        highestId = connectors
            .map(connector => connector.id)
            .reduce((lastHighestId, currentId) => Math.max(currentId, lastHighestId), 0);

        if (!options.connects[1]) {
            newChildSubunit = new Unit();
            parentSubunit.collection.add(newChildSubunit);
            newChildSubunit.persist({
                width: parentSubunit.get('width'),
                height: parentSubunit.get('height'),
            }, {
                success() {
                    options.connects[1] = newChildSubunit.id;
                    pushConnector();
                    self.addSubunit(newChildSubunit);
                },
            });
        } else {
            pushConnector();
        }
    },
    removeConnector(id) {
        const connectors = this.get('root_section').connectors;
        let connector;

        const connectorIndex = connectors.indexOf(this.getConnectorById(id));

        if (connectorIndex !== -1) {
            connector = connectors.splice(connectorIndex, 1)[0];
        }

        return connector;
    },
    updateConnectorLength(connector) {
        const parent = this.getSubunitById(connector.connects[0]);
        const child = this.getSubunitById(connector.connects[1]);
        let parentSide;
        let childSide;

        if (!(parent && child)) { return; }

        if (connector.side === 'top' || connector.side === 'bottom') {
            parentSide = parent.getInMetric('width', 'mm');
            childSide = child.getInMetric('width', 'mm');
        } else {
            parentSide = parent.getInMetric('height', 'mm');
            childSide = child.getInMetric('height', 'mm');
        }

        connector.length = Math.min(parentSide, childSide);

        return connector;
    },
    updateConnectorsLength() {
        const connectors = this.get('root_section').connectors;

        connectors.forEach(connector => this.updateConnectorLength(connector));
    },
    //  Drawing representation for multiunits includes subunits as well,
    //  so if any subunit did change, we want to redraw multiunut preview
    getDrawingRepresentation() {
        const model_attributes_to_cache = [
            'multiunit_subunits', 'root_section',
        ];

        return {
            model: this.pick(model_attributes_to_cache),
            subunits: this.subunits.map(subunit => subunit.getDrawingRepresentation()),
        };
    },
    //  TODO: this is identical to getPreview from Unit model so maybe
    //  we want to move them both to a mixin or something
    //  TODO: use this._cache.preview instead of this.preview
    getPreview(preview_options) {
        const complete_preview_options = mergePreviewOptions(this, preview_options);
        let use_cache = true;

        //  In some cases we want to ignore the cache completely, like when
        //  preview is expected to return a canvas or a Konva.Group
        if (complete_preview_options.mode === 'canvas' || complete_preview_options.mode === 'group') {
            use_cache = false;
        }

        const drawing_representation_string = JSON.stringify(this.getDrawingRepresentation());
        const options_json_string = JSON.stringify(_.omit(complete_preview_options, 'model'));

        //  If we already got an image for the same model representation
        //  and same preview options, just return it from the cache
        if (
            use_cache === true && this.preview && this.preview.result &&
            this.preview.result[options_json_string] &&
            drawing_representation_string === this.preview.drawing_representation_string
        ) {
            return this.preview.result[options_json_string];
        }

        const result = generatePreview(this, preview_options);

        //  If model representation changes, preview cache should be erased
        if (
            (use_cache === true && (!this.preview || !this.preview.result)) ||
            (use_cache === true && drawing_representation_string !== this.preview.drawing_representation_string)
        ) {
            this.preview = {
                drawing_representation_string,
                result: {},
            };
        }

        //  Add new preview to cache
        if (use_cache === true) {
            this.preview.result[options_json_string] = result;
        }

        return result;
    },
});
