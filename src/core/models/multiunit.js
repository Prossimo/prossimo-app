import Backbone from 'backbone';
import _ from 'underscore';

import App from '../../main';
import Schema from '../../schema';
import { object, convert } from '../../utils';
import Unit from './unit';
import MultiunitSubunitCollection from '../collections/inline/multiunit-subunit-collection';
import { mergePreviewOptions, generatePreview } from '../../components/drawing/module/preview';

const MULTIUNIT_PROPERTIES = [
    { name: 'multiunit_subunits', title: 'Subunits', type: 'collection:MultiunitSubunitCollection' },
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

        _.each(MULTIUNIT_PROPERTIES, (item) => {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        });

        return defaults;
    },
    initialize(attributes, options) {
        this.options = options || {};
        this._cache = {};

        if (!this.options.proxy) {
            this.on('add', this.updateSubunitsMetadata);

            //  TODO: maybe we want to trigger this by less events (no change?)
            this.listenTo(this.get('multiunit_subunits'), 'change update reset', () => {
                this.persist('multiunit_subunits', this.get('multiunit_subunits'), {
                    success: () => {
                        this.validateSubunits();
                        this.recalculateSizes();
                    },
                });
            });

            //  Destroy multiunit when we removed the last subunit
            this.listenTo(this.get('multiunit_subunits'), 'remove', () => {
                if (this.get('multiunit_subunits').length === 0) {
                    this.destroy();
                }
            });

            //  When multiunit is removed, we destroy each subunit
            this.on('remove', () => {
                this.get('multiunit_subunits').forEach(subunit => subunit.invokeOnUnit('destroy'));
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
            multiunit_subunits: (name === 'multiunit_subunits') ? new MultiunitSubunitCollection(null, {
                units: this.getParentQuoteUnits(),
            }) : [],
            root_section: (name === 'root_section') ?
                { id: _.uniqueId(), originCoords: { x: 0, y: 0 }, connectors: [] } :
                '',
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    parseAndFixRootSection(root_section_data, subunits) {
        let root_section_parsed = object.extractObjectOrNull(root_section_data);

        if (!_.isObject(root_section_parsed)) {
            root_section_parsed = this.getDefaultValue('root_section');
        }

        root_section_parsed = this.validateConnectors(root_section_parsed, subunits);

        return root_section_parsed;
    },
    parse(data, options) {
        const multiunit_data = data && data.multiunit ? data.multiunit : data;
        const filtered_data = Schema.parseAccordingToSchema(multiunit_data, this.schema);
        let units = (options && options.units) ? options.units : this.getParentQuoteUnits();

        if (filtered_data && filtered_data.multiunit_subunits) {
            filtered_data.multiunit_subunits = new MultiunitSubunitCollection(
                object.extractObjectOrNull(filtered_data.multiunit_subunits),
                {
                    units,
                    parse: true,
                },
            );
        }

        if (filtered_data && filtered_data.root_section) {
            filtered_data.root_section = this.parseAndFixRootSection(filtered_data.root_section, filtered_data.multiunit_subunits);
        }

        //  If this multiunit is created via Unit's toMultiunit() function
        if (options && options.from_unit) {
            units = options.from_unit.collection || units;

            filtered_data.multiunit_subunits = filtered_data.multiunit_subunits || new MultiunitSubunitCollection(
                null,
                { units },
            );

            filtered_data.multiunit_subunits.add({
                unit_id: options.from_unit.id,
                unit_cid: options.from_unit.cid,
            }, { parse: true });
        }

        return filtered_data;
    },
    sync(method, model, options) {
        const current_options = options;

        if (method === 'create' || method === 'update') {
            current_options.attrs = { multiunit: model.toJSON() };
        }

        return Backbone.sync.call(this, method, model, current_options);
    },
    toJSON(...args) {
        const properties_to_omit = ['id', 'height', 'width'];
        const json = Backbone.Model.prototype.toJSON.apply(this, args);

        json.multiunit_subunits = _.isFunction(this.get('multiunit_subunits').toJSON) ?
            this.get('multiunit_subunits').toJSON() :
            this.get('multiunit_subunits');
        json.root_section = JSON.stringify(json.root_section);

        return _.omit(json, properties_to_omit);
    },
    hasOnlyDefaultAttributes() {
        let has_only_defaults = true;

        _.each(this.toJSON(), (value, key) => {
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
                    if (JSON.stringify(value) !== JSON.stringify(this.getDefaultValue('multiunit_subunits', 'array'))) {
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
        const parent_quote = this.getParentQuote();
        let is_active = false;

        if (App.current_quote && parent_quote && parent_quote === App.current_quote) {
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
        const selected_names = names || _.pluck(MULTIUNIT_PROPERTIES, 'name');
        const name_title_hash = [];

        _.each(MULTIUNIT_PROPERTIES, (item) => {
            if (_.indexOf(selected_names, item.name) !== -1) {
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
        const currentRoot = rootSection || JSON.parse(JSON.stringify(this.get('root_section')));

        return currentRoot;
    },
    getSubunitsSum(funcName) {
        const sum = this.get('multiunit_subunits').reduce((tmpSum, subunit) => tmpSum + subunit.invokeOnUnit(funcName), 0);

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
    hasSubunitsWithDiscount() {
        return this.get('multiunit_subunits').some(subunit => subunit.invokeOnUnit('get', 'discount') > 0);
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
        const connectors = this.getConnectorsByOrientation();
        const metricRowCount = (connectors.horizontal.length > 0) ? 2 : 1;
        return metricRowCount;
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
    getParentQuoteUnits() {
        const parent_quote = this.getParentQuote();

        return parent_quote && parent_quote.units;
    },
    hasSubunit(unit_model) {
        return !!this.get('multiunit_subunits').getByUnitId(unit_model.id || unit_model.cid);
    },
    updateSubunitsMetadata() {
        this.validateSubunits();
        this.updateConnectorsLength();
    },
    //  If validation succeeds, there is no return value. Otherwise, it returns
    //  the error object. This is consistent with how Backbone does validation
    validateSubunits(options) {
        // "Only check and report, don't fix" option
        const onlyCheck = options && options.onlyCheck;
        let hasErrors = false;
        let validationError;

        this.get('multiunit_subunits').forEach((subunit_link) => {
            //  This check here is to prevent error in situation when subunit
            //  is removed while the collection is iterated over
            if (!subunit_link) {
                return;
            }

            const subunitId = subunit_link.get('unit_id');
            const subunit = subunit_link.getUnit();
            const isOrigin = this.isOriginId(subunitId);

            const needsConnector = !isOrigin;
            const hasConnector = this.getParentConnector(subunitId || (subunit && subunit.id));

            //  Subunit is listed in multiunit_subunits, but there aren't any
            //  corresponding connectors inside root_section
            if (subunitId && subunit && needsConnector && !hasConnector) {
                hasErrors = true;
                validationError = {
                    error: `Subunit ${subunitId} needs a connector, but doesn't have one`,
                };

                if (onlyCheck) {
                    return;
                }

                this.removeSubunit(subunit);
            } else if (subunitId && !subunit) {
                hasErrors = true;
                validationError = {
                    error: `Subunit ${subunitId} does not exist in Unit collection`,
                };

                if (onlyCheck) {
                    return;
                }

                subunit_link.destroy();
            }
        });

        return (hasErrors && validationError) || undefined;
    },
    addSubunit(subunit) {
        if (!(subunit instanceof Unit)) {
            throw new Error('Subunit should be an instance of the Unit model');
        }

        this.get('multiunit_subunits').add({
            unit_id: subunit.id,
            unit_cid: subunit.cid,
        }, { parse: true });

        if (!this.validateSubunits({ onlyCheck: true })) {
            this.recalculateSizes();
        }
    },
    removeSubunit(subunit) {
        if (!this.hasSubunit(subunit)) {
            throw new Error('Argument should be a child subunit of this multiunit');
        }

        const subunitId = subunit.id;
        const isRemovable = this.isSubunitRemovable(subunitId);
        const parentConnector = this.getParentConnector(subunitId);

        if (isRemovable) {
            const subunit_link = this.get('multiunit_subunits').getByUnitId(subunitId);

            if (parentConnector) {
                this.removeConnector(parentConnector);
            }

            subunit_link.destroy();
            subunit.destroy();
        }
    },
    //  This returns a MultiunitSubunit instance, not Unit
    getSubunitById(id) {
        return this.get('multiunit_subunits').getByUnitId(id);
    },
    getSubunitLinkedUnitById(id) {
        const subunit_link = this.getSubunitById(id);

        return subunit_link && subunit_link.getUnit();
    },
    getWidth() {
        const is_cache_valid = this.checkIfCacheIsValid();

        return (is_cache_valid && this._cache.width) || this.recalculateSizes().width;
    },
    getHeight() {
        const is_cache_valid = this.checkIfCacheIsValid();

        return (is_cache_valid && this._cache.height) || this.recalculateSizes().height;
    },
    // Updates multiunit width/height based on subunit sizes & positions
    recalculateSizes() {
        const isFloating = (coordTree) => {
            let result = true;
            this.subunitsTreeForEach(coordTree, (node) => {
                if (node.y === 0) { result = false; }
            });
            return result;
        };
        const isOverhung = rect => rect.y < 0;
        const coordTree = this.getSubunitsCoordinatesTree();
        let rect = this.subunitsTreeGetRect(coordTree);

        if (isOverhung(rect)) {
            this.shiftOrigin({ offsetY: -rect.y });
            rect = this.subunitsTreeGetRect(this.getSubunitsCoordinatesTree());
        } else if (isFloating(coordTree)) {
            const originY = this.get('root_section').originCoords.y;
            this.shiftOrigin({ offsetY: -originY });
            rect = this.subunitsTreeGetRect(this.getSubunitsCoordinatesTree());
        }

        this._cache.width = convert.mm_to_inches(rect.width);
        this._cache.height = convert.mm_to_inches(rect.height);

        return { width: rect.width, height: rect.height };
    },
    getSubunitNode(subunitId) {
        const subunitPositionsTree = this.getSubunitsCoordinatesTree();
        let subunitNode;

        this.subunitsTreeForEach(subunitPositionsTree, (node) => {
            if (node.unit.id === subunitId || node.unit.cid === subunitId) {
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
    //  Take note that this function only returns false when there is a
    //  subunit, and it's clearly not removable. In all other cases, including
    //  when there is no such subunit at all, it returns true
    isSubunitRemovable(subunitId) {
        const subunitNode = this.getSubunitNode(subunitId);
        const isLeafSubunit = !subunitNode || (subunitNode.children.length === 0);

        return isLeafSubunit;
    },
    getSubunitsList() {
        return this.get('multiunit_subunits').models;
    },
    /**
     * Subunit tree consists of nodes corresponding to subunits.
     * Each node has 3 fields:
     * unit - points to the unit model associated with this node
     * parent - points to the parent node
     * children - points to array of child nodes
     */
    getSubunitsTree() {
        // Prepare flat array of node templates
        const nodeTemplates = this.get('multiunit_subunits').map((subunit_link) => {
            const parent = this.getParentSubunit(subunit_link);
            const children = this.getChildSubunits(subunit_link);
            const node = {
                unit: subunit_link,
                parent,
                children,
            };
            return node;
        });

        if (nodeTemplates.length === 0) {
            return {};
        }

        // Bootstrap tree
        const originId = this.getOriginSubunitId();
        const originNode = nodeTemplates.find(node => (node.unit.isLinkingToUnit(originId)));

        //  This is possible while subunit is being removed
        if (!originNode) {
            return {};
        }

        originNode.unit = originNode.unit.getUnit();

        const subunitsTree = originNode;
        const processableLeafNodes = [];

        processableLeafNodes[0] = subunitsTree;

        // Build tree by appending nodes from array
        while (processableLeafNodes.length > 0) {
            const currentNode = processableLeafNodes.pop();

            currentNode.children.forEach((subunit, childIndex) => {
                // Select node
                const childNode = nodeTemplates.find(node => node.unit === subunit);

                if (!(childNode && childNode.unit)) {
                    currentNode.children[childIndex] = undefined;
                    return;
                }

                // Render node to its final form
                childNode.unit = subunit.getUnit();
                childNode.parent = currentNode;

                // Append node to tree
                currentNode.children[childIndex] = childNode;

                // Mark for later processing
                if (childNode.children.length > 0) {
                    processableLeafNodes.push(childNode);
                }
            });

            currentNode.children = _.without(currentNode.children, undefined);
        }

        return subunitsTree;
    },
    // Returns subunit tree with coordinate information at each node, in mm
    getSubunitsCoordinatesTree(options) {
        const self = this;
        const flipX = options && options.flipX;
        const originCoords = this.get('root_section').originCoords;
        const subunitsTree = this.getSubunitsTree();

        this.subunitsTreeForEach(subunitsTree, (node) => {
            if (!node.unit) { return; }

            const currentNode = node;
            const isOrigin = self.isOriginId(node.unit.id);

            if (isOrigin) {
                currentNode.width = node.unit.getInMetric('width', 'mm');
                currentNode.height = node.unit.getInMetric('height', 'mm');
                currentNode.x = (originCoords && originCoords.x) || 0;
                currentNode.y = (originCoords && originCoords.y) || 0;
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

                currentNode.width = width;
                currentNode.height = height;

                if (side && side === 'top') {
                    currentNode.x = (flipX) ? parentX + (parentWidth - width) : parentX;
                    currentNode.y = parentY - gap - height;
                } else if (side && side === 'right') {
                    currentNode.x = (flipX) ? parentX - gap - width : parentX + parentWidth + gap;
                    currentNode.y = parentY;
                } else if (side && side === 'bottom') {
                    currentNode.x = (flipX) ? parentX + (parentWidth - width) : parentX;
                    currentNode.y = parentY + parentHeight + gap;
                } else if (side && side === 'left') {
                    currentNode.x = (flipX) ? parentX + parentWidth + gap : parentX - gap - width;
                    currentNode.y = parentY;
                }
            }
        });

        const rect = this.subunitsTreeGetRect(subunitsTree);

        if (rect.x < 0) {
            const delta = Math.abs(rect.x);

            this.subunitsTreeForEach(subunitsTree, (node) => {
                const currentNode = node;

                currentNode.x += delta;
            });
        }

        return subunitsTree;
    },
    subunitsTreeForEach(subunitNode, func) {
        if (!subunitNode || _.isEmpty(subunitNode) || !_.isFunction(func)) { return; }

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
    //  Generate all possible unique traversal sequences from the list of
    //  connectors. If we have connectors [[1, 3], [3, 5], [1, 7]], the
    //  resulting traversal sequences would be [[1, 3, 5], [1, 7]]. These
    //  sequences could be used for validation or obtaining the origin id
    getSubunitsTraversalSequences(connectors) {
        //  Checks that [1, 2] is subsequence of [1, 2, 3]. Order is important
        function isSubsequence(sequence, parentSequence) {
            return sequence.map(entry => parentSequence.indexOf(entry)).every((value, index, array) =>
                (value !== -1 && (index === 0 || value - array[index - 1] === 1)),
            );
        }

        function canBeLeftJoined(left, right) {
            return right.length > 1 && left[0] === right[right.length - 1];
        }

        function canBeRightJoined(right, left) {
            return left.length > 1 && right[0] === left[left.length - 1];
        }

        function canBeJoined(left, right) {
            return canBeLeftJoined(left, right) || canBeRightJoined(right, left);
        }

        function leftJoinConnectors(left, right) {
            return canBeLeftJoined(left, right) ? right.slice().concat(left.slice(1)) : [left, right];
        }

        function rightJoinConnectors(right, left) {
            return canBeRightJoined(right, left) ? left.slice().concat(right.slice(1)) : [right, left];
        }

        function joinConnectors(left, right) {
            let result = [left, right];

            if (canBeLeftJoined(left, right)) {
                result = leftJoinConnectors(left, right);
            } else if (canBeRightJoined(right, left)) {
                result = rightJoinConnectors(right, left);
            }

            return result;
        }

        let result = connectors.slice();

        result.forEach((connector1) => {
            result.forEach((connector2) => {
                if (canBeJoined(connector1, connector2) && !_.contains((joinConnectors(connector1, connector2), result))) {
                    result.push(joinConnectors(connector1, connector2));
                }
            });
        });

        result = result.filter((entry) => {
            let is_unique = true;

            result.forEach((another_entry) => {
                if (another_entry.length > entry.length && isSubsequence(entry, another_entry)) {
                    is_unique = false;
                }
            });

            return is_unique;
        });

        return result;
    },
    getSubunitsIds() {
        return this.get('multiunit_subunits').map(subunit => subunit.get('unit_id') || subunit.get('unit_cid'));
    },
    getOriginSubunitId() {
        const subunits = this.get('multiunit_subunits');
        const has_single_subunit = subunits && subunits.length === 1;

        if (has_single_subunit) {
            return subunits.at(0).get('unit_id') || subunits.at(0).get('unit_cid');
        }

        const connections = this.getConnectors().map(connector => connector.connects);
        const traversal_sequences = this.getSubunitsTraversalSequences(connections);
        const has_same_origin = traversal_sequences.length && traversal_sequences.map(item => item[0])
            .every((value, index, array) => (index === 0 || value === array[index - 1]));

        return has_same_origin ? traversal_sequences[0][0] : undefined;
    },
    isOriginId(subunitId) {
        return (subunitId === this.getOriginSubunitId());
    },
    getParentSubunit(subunit) {
        if (this.isOriginId(subunit.get('unit_id') || subunit.get('unit_cid'))) {
            return undefined;
        }

        const parentConnector = this.getParentConnector(subunit.get('unit_id') || subunit.get('unit_cid'));
        const parentConnectorId = (parentConnector && parentConnector.id) || undefined;
        const parentSubunitId = parentConnectorId && this.getConnectorParentSubunitId(parentConnectorId);

        return (parentSubunitId && this.get('multiunit_subunits').getByUnitId(parentSubunitId)) || undefined;
    },
    getChildSubunits(subunit) {
        const childConnectors = this.getChildConnectors(subunit.get('unit_id') || subunit.get('unit_cid'));
        const childSubunitsIds = childConnectors.map(connector => this.getConnectorChildSubunitId(connector.id));

        return this.get('multiunit_subunits').filter(entry =>
            _.contains(childSubunitsIds, entry.get('unit_id') || entry.get('unit_cid')),
        );
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
    validateConnectors(alternativeRoot, subunitsList) {
        const rootSection = alternativeRoot || this.get('root_section');
        const subunits = subunitsList || this.get('multiunit_subunits');
        const connectors = rootSection.connectors;

        if (!connectors) {
            rootSection.connectors = [];
        }

        rootSection.connectors.forEach((connector, index) => {
            const hasId = _.isNumber(parseInt(connector.id, 10));
            const hasSide = (['top', 'right', 'bottom', 'left'].indexOf(connector.side) !== -1);
            const parentSubunit = subunits.getByUnitId(connector.connects[0]);
            const childSubunit = subunits.getByUnitId(connector.connects[1]);
            const hasConnects = !!(
                _.isArray(connector.connects) &&
                connector.connects.length === 2 &&
                parentSubunit &&
                childSubunit
            );
            const hasWidth = _.isNumber(connector.width);
            const hasFacewidth = _.isNumber(connector.facewidth);
            const hasLength = _.isNumber(connector.length);
            const currentConnector = connector;

            if (!hasWidth) {
                currentConnector.width = CONNECTOR_DEFAULTS.width;
            }

            if (!hasFacewidth) {
                currentConnector.width = CONNECTOR_DEFAULTS.facewidth;
            }

            if (!hasId || !hasSide || !hasConnects) {
                connectors[index] = undefined;
                return;
            }

            if (!hasLength) {
                connectors[index] = this.updateConnectorLength(
                    currentConnector,
                    parentSubunit && parentSubunit.getUnit(),
                    childSubunit && childSubunit.getUnit(),
                );
            }
        }, this);

        rootSection.connectors = _.without(rootSection.connectors, undefined);

        return rootSection;
    },
    getConnectors() {
        return this.get('root_section').connectors.slice();
    },
    getConnectorsByOrientation() {
        const connectorsByOrientation = { vertical: [], horizontal: [] };
        const connectors = this.getConnectors();
        if (!connectors) { return connectorsByOrientation; }
        connectors.forEach((connector) => {
            if (connector.side === 'top' || connector.side === 'bottom') {
                connectorsByOrientation.horizontal.push(connector);
            } else if (connector.side === 'left' || connector.side === 'right') {
                connectorsByOrientation.vertical.push(connector);
            }
        });
        return connectorsByOrientation;
    },
    getConnectorById(id) {
        return _(this.getConnectors()).find(connector => connector.id === id);
    },
    getParentConnector(subunitId) {
        return this.getConnectors().find(connector => connector.connects[1] === subunitId);
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
        if (!(options && options.connects && options.side)) {
            return;
        }

        const self = this;
        const currentOptions = options;
        const parentSubunit = this.getSubunitLinkedUnitById(currentOptions.connects[0]);
        const connectors = this.get('root_section').connectors;
        let newChildSubunit;

        const pushConnector = () => {
            const connector = {
                id: _.uniqueId(),
                connects: currentOptions.connects,
                side: currentOptions.side,
                width: currentOptions.width || CONNECTOR_DEFAULTS.width,
                facewidth: currentOptions.facewidth || CONNECTOR_DEFAULTS.facewidth,
            };

            connectors.push(connector);
            self.updateConnectorLength(connector, parentSubunit, newChildSubunit);

            if (currentOptions.success) {
                currentOptions.success();
            }
        };

        if (!currentOptions.connects[1]) {
            newChildSubunit = new Unit({
                position: parentSubunit.collection.getMaxPosition() + 1,
            });
            parentSubunit.collection.add(newChildSubunit);
            newChildSubunit.persist({
                width: parentSubunit.get('width'),
                height: parentSubunit.get('height'),
            }, {
                success() {
                    currentOptions.connects[1] = newChildSubunit.id;
                    pushConnector();
                    self.addSubunit(newChildSubunit);
                },
            });
        } else {
            pushConnector();
        }
    },
    removeConnector(connector) {
        const connectors = this.get('root_section').connectors;
        const connectorIndex = connectors.indexOf(connector);
        let removed_connector;

        if (connectorIndex !== -1) {
            removed_connector = connectors.splice(connectorIndex, 1)[0];
        }

        return removed_connector;
    },
    updateConnectorLength(connector, parentSubunit, childSubunit) {
        const currentConnector = connector;
        const parent = parentSubunit || this.getSubunitLinkedUnitById(connector.connects[0]);
        const child = childSubunit || this.getSubunitLinkedUnitById(connector.connects[1]);
        let parentSide;
        let childSide;

        if (!(parent && child)) {
            return undefined;
        }

        if (currentConnector.side === 'top' || currentConnector.side === 'bottom') {
            parentSide = parent.getInMetric('width', 'mm');
            childSide = child.getInMetric('width', 'mm');
        } else {
            parentSide = parent.getInMetric('height', 'mm');
            childSide = child.getInMetric('height', 'mm');
        }

        currentConnector.length = Math.min(parentSide, childSide);

        return currentConnector;
    },
    updateConnectorsLength() {
        const connectors = this.get('root_section').connectors;

        connectors.forEach(connector => this.updateConnectorLength(connector));
    },
    shiftOrigin(options) {
        if (!options) { return; }
        const [offsetX, offsetY] = [options.offsetX, options.offsetY];
        const rootSection = this.get('root_section');
        if (!rootSection.originCoords) { rootSection.originCoords = { x: 0, y: 0 }; }
        const originCoords = rootSection.originCoords;

        if (offsetX) { originCoords.x += offsetX; }
        if (offsetY) { originCoords.y += offsetY; }
        if ((offsetX || offsetY) && options.success) { options.success(); }
    },
    //  Drawing representation for multiunits includes subunits as well,
    //  so if any subunit did change, we want to redraw multiunut preview
    getDrawingRepresentation() {
        const model_attributes_to_cache = [
            'multiunit_subunits', 'root_section', 'position',
        ];

        return {
            model: this.pick(model_attributes_to_cache),
            subunits: this.get('multiunit_subunits').map(subunit => subunit.invokeOnUnit('getDrawingRepresentation')),
        };
    },
    checkIfCacheIsValid() {
        const old_drawing_representation = this._cache && this._cache.drawing_representation_string;
        const new_drawing_representation = JSON.stringify(this.getDrawingRepresentation());
        let is_valid = false;

        if (old_drawing_representation === new_drawing_representation) {
            is_valid = true;
        } else {
            this._cache = {
                drawing_representation_string: new_drawing_representation,
            };
        }

        return is_valid;
    },
    //  TODO: this is identical to getPreview from Unit model so maybe
    //  we want to move them both to a mixin or something
    getPreview(preview_options) {
        const complete_preview_options = mergePreviewOptions(this, preview_options);
        let use_cache = true;

        //  In some cases we want to ignore the cache completely, like when
        //  preview is expected to return a canvas or a Konva.Group
        if (complete_preview_options.mode === 'canvas' || complete_preview_options.mode === 'group') {
            use_cache = false;
        }

        const options_json_string = JSON.stringify(_.omit(complete_preview_options, 'model'));
        const is_cache_valid = this.checkIfCacheIsValid();

        //  If we already got an image for the same model representation
        //  and same preview options, just return it from the cache
        if (use_cache === true && this._cache.preview && this._cache.preview[options_json_string] && is_cache_valid) {
            return this._cache.preview[options_json_string];
        }

        const result = generatePreview(this, preview_options);

        //  If model representation changes, preview cache should be erased
        if (use_cache === true && (!this._cache.preview || !is_cache_valid)) {
            this._cache.preview = {};
        }

        //  Add new preview to cache
        if (use_cache === true) {
            this._cache.preview[options_json_string] = result;
        }

        return result;
    },
});
