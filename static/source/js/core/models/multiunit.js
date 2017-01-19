var app = app || {};

(function () {
    'use strict';

    var MULTIUNIT_PROPERTIES = [
        { name: 'multiunit_subunits', title: 'Subunits', type: 'array' },

        { name: 'mark', title: 'Mark', type: 'string' },
        { name: 'quantity', title: 'Quantity', type: 'number' },
        { name: 'description', title: 'Customer Description', type: 'string' },
        { name: 'notes', title: 'Notes', type: 'string' },
        { name: 'exceptions', title: 'Exceptions', type: 'string' },
        { name: 'customer_image', title: 'Customer Image', type: 'string' },

        { name: 'position', title: 'Position', type: 'number' },
        { name: 'root_section', title: 'Root Section', type: 'object' }
    ];

    var CONNECTOR_DEFAULTS = {
        width: 20,
        facewidth: 40
    };

    app.Multiunit = Backbone.Model.extend({
        schema: app.schema.createSchema(MULTIUNIT_PROPERTIES),
        defaults: function () {
            var defaults = {};

            _.each(MULTIUNIT_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getNameAttribute: function () {
            return 'mark';
        },
        //  TODO: stuff inside name_value_hash gets evaluated for each
        //  attribute, but we actually want it to be evaluated only for the
        //  corresponding attribute (see example for root_section)
        getDefaultValue: function (name, type) {
            var default_value = '';

            var type_value_hash = {
                number: 0,
                array: []
            };

            var name_value_hash = {
                quantity: 1,
                root_section: (name === 'root_section') ? { id: _.uniqueId(), connectors: [] } : ''
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        //  TODO: implement connector validation here, make sure it's
        //  consistent with multiunit_subunits array
        parseAndFixRootSection: function (root_section_data) {
            var root_section_parsed = app.utils.object.extractObjectOrNull(root_section_data);

            if ( !_.isObject(root_section_parsed) ) {
                root_section_parsed = this.getDefaultValue('root_section');
            }

            return root_section_parsed;
        },
        parse: function (data) {
            var multiunit_data = data && data.multiunit ? data.multiunit : data;
            var filtered_data = app.schema.parseAccordingToSchema(multiunit_data, this.schema);

            if ( filtered_data && filtered_data.multiunit_subunits ) {
                filtered_data.multiunit_subunits =
                    app.utils.object.extractObjectOrNull(filtered_data.multiunit_subunits) ||
                    this.getDefaultValue('multiunit_subunits', 'array');
            }

            if ( filtered_data && filtered_data.root_section ) {
                filtered_data.root_section = this.parseAndFixRootSection(filtered_data.root_section);
            }

            return filtered_data;
        },
        sync: function (method, model, options) {
            if ( method === 'create' || method === 'update' ) {
                options.attrs = { project_multiunit: model.toJSON() };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        toJSON: function () {
            var properties_to_omit = ['id', 'height', 'width'];
            var json = Backbone.Model.prototype.toJSON.apply(this, arguments);

            json.multiunit_subunits = JSON.stringify(json.multiunit_subunits);
            json.root_section = JSON.stringify(json.root_section);

            return _.omit(json, properties_to_omit);
        },
        hasOnlyDefaultAttributes: function () {
            var has_only_defaults = true;

            _.each(this.toJSON(), function (value, key) {
                if ( key !== 'position' && has_only_defaults ) {
                    var property_source = _.findWhere(MULTIUNIT_PROPERTIES, { name: key });
                    var type = property_source ? property_source.type : undefined;

                    if ( key === 'root_section' ) {
                        if ( value !==
                            JSON.stringify(_.extend(
                                {},
                                this.getDefaultValue('root_section'),
                                { id: this.get('root_section').id }
                            ))
                        ) {
                            has_only_defaults = false;
                        }
                    } else if ( key === 'multiunit_subunits' ) {
                        if ( value !==
                            JSON.stringify(this.getDefaultValue('multiunit_subunits', 'array'))
                        ) {
                            has_only_defaults = false;
                        }
                    } else if ( this.getDefaultValue(key, type) !== value ) {
                        has_only_defaults = false;
                    }
                }
            }, this);

            return has_only_defaults;
        },
        //  Check if this unit belongs to the project which is currently active
        isParentProjectActive: function () {
            var is_active = false;

            if ( app.current_project && this.collection && this.collection.options.project &&
                this.collection.options.project === app.current_project
            ) {
                is_active = true;
            }

            return is_active;
        },
        getInMetric: function (attr, metric) {
            if (!metric || (['mm', 'inches'].indexOf(metric) === -1)) {
                throw new Error('Set metric! "mm" or "inches"');
            }

            if (!attr || (['width', 'height'].indexOf(attr) === -1)) {
                throw new Error('This function is only supposed to get width or height');
            }

            var value = (attr === 'width') ? this.getWidth() : this.getHeight();

            return (metric === 'inches') ? value : app.utils.convert.inches_to_mm(value);
        },
        //  Multiunits and normal units share reference numbers within project.
        //  Numbering starts with multiunits, the first multiunit within the
        //  project gets 1, and its subunits are 1a, 1b, 1c etc. Second
        //  multiunit is 2, and so on. The first normal unit that doesn't
        //  belong to any collection gets the number of last multiunit + 1,
        //  the remaining normal units are numbered according to their position
        getRefNum: function () {
            var ref_num = -1;

            if (this.collection) {
                ref_num = this.get('position') + 1;
            }

            return ref_num;
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( MULTIUNIT_PROPERTIES, 'name' );
            }

            _.each(MULTIUNIT_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
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
        generateFullRoot: function (rootSection) {
            rootSection = rootSection || JSON.parse(JSON.stringify(this.get('root_section')));

            return rootSection;
        },
        getSubunitsSum: function (funcName) {
            if (!_.isFunction(this.subunits.at(0)[funcName])) { return 0; }

            var sum = this.subunits.reduce(function (tmpSum, subunit) {
                return tmpSum + subunit[funcName]();
            }, 0);

            return sum;
        },
        getUnitPrice: function () {
            return this.getSubunitsSum('getUnitPrice');
        },
        getSubtotalPrice: function () {
            return this.getSubunitsSum('getSubtotalPrice');
        },
        getUnitPriceDiscounted: function () {
            return this.getSubunitsSum('getUnitPriceDiscounted');
        },
        getSubtotalPriceDiscounted: function () {
            return this.getSubunitsSum('getSubtotalPriceDiscounted');
        },
        getRelation: function () {
            return 'multiunit';
        },
        isMultiunit: function () {
            return true;
        },
        isSubunit: function () {
            return false;
        },
        isTrapezoid: function () {
            return false;
        },
        leftMetricCount: function () {
            return 0;
        },
        isArchedWindow: function () {
            return false;
        },
        rightMetricCount: function () {
            return 0;
        },
        isOpeningDirectionOutward: function () {
            return false;
        },
        initialize: function (attributes, options) {
            var self = this;

            this.options = options || {};
            this._cache = {};

            if ( !this.options.proxy ) {
                this.on('add', function () {
                    if (_.isArray(this.options.subunits)) {
                        _.each(this.options.subunits, function (subunit) {
                            self.addSubunit(subunit);
                        });
                    }

                    self.listenTo(self.collection, 'update', function (event) {
                        self.updateSubunitsCollection();
                        self.updateConnectorsLength();
                        self.updateSubunitsIndices();
                    });
                    self.listenTo(self.collection.subunits, 'update', function (event) {
                        self.updateSubunitsCollection();
                        self.updateConnectorsLength();
                        self.updateSubunitsIndices();
                    });
                });

                this.on('change', function (eventData) {
                    if (eventData.changed.width || eventData.changed.height) {
                        self.recalculateSizes();
                    }
                });
            }
        },
        // this.subunits is a collection with models from project's units collection
        updateSubunitsCollection: function () {
            var self = this;

            if (!this.subunits) {
                this.subunits = new app.UnitCollection();
                this.listenTo(this.subunits, 'change', function () {  // trigger self change if any subunit changes
                    self.trigger.apply(this, ['change'].concat(Array.prototype.slice.call(arguments)));
                });
                this.listenTo(this.subunits, 'remove', function () {  // remove multiunit if last subunit is removed
                    if (self.subunits.length === 0) {
                        self.destroy();
                    }
                });
            }

            var subunitsIds = this.getSubunitsIds();

            this.subunits.add(
                subunitsIds
                    .map(function (id) { return self.getSubunitById(id); })
                    .filter(function (subunit) { return !_.isUndefined(subunit); })
                    .filter(function (subunit) { return self.subunits.indexOf(subunit) === -1; })
            );
            this.subunits.remove(
                this.subunits
                    .filter(function (subunit) { return subunitsIds.indexOf(subunit.id) === -1; })
            );
        },
        updateSubunitsIndices: function () {  // reorders subunit models in their collection (not in this.subunits)
            var self = this;

            this.subunits.forEach(function (subunit, subunitIndex) {
                var firstSubunit = self.subunits.at(0);
                var firstSubunitPosition = firstSubunit.collection.indexOf(firstSubunit);
                var currentPosition = self.collection.subunits.indexOf(subunit);
                var newPosition = (firstSubunitPosition + subunitIndex < self.collection.subunits.length) ?
                    firstSubunitPosition + subunitIndex :
                    firstSubunitPosition + subunitIndex - 1;
                self.collection.subunits.setItemPosition(currentPosition, newPosition);
            });
        },
        getSubunitById: function (id) {
            return this.collection.subunits.get(id);
        },
        //  TODO: check that subunit has id, throw if it doesn't
        //  TODO: or maybe we should just persist subunit to the backend and
        //  then attach it (or maybe use cid, but attempt to obtain id asap)
        addSubunit: function (subunit) {
            if (!(subunit instanceof app.Unit)) { return; }

            var subunitsIds = this.get('multiunit_subunits');
            var subunitId = subunit.id;

            if (!_.contains(subunitsIds, subunitId)) {
                subunitsIds.push(subunitId);
                this.updateSubunitsCollection();
                this.updateSubunitsIndices();
                this.recalculateSizes();
            }
        },
        // This is the only proper way to remove a subunit
        removeSubunit: function (subunit) {
            if (!(subunit.isSubunitOf && subunit.isSubunitOf(this))) { return; }

            var subunitsIds = this.get('multiunit_subunits');
            var subunitId = subunit.id;
            var subunitIndex = subunitsIds.indexOf(subunitId);
            var isSubunitOf = subunitIndex !== -1;
            var isSubunitRemovable = this.isSubunitRemovable(subunitId);
            var parentConnector;

            if (isSubunitOf && isSubunitRemovable) {
                subunitsIds.splice(subunitIndex, 1);
                parentConnector = this.getParentConnector(subunitId);
                if (parentConnector) {
                    this.removeConnector(parentConnector.id);
                }
                this.updateSubunitsCollection();
                this.updateSubunitsIndices();
                this.recalculateSizes();
                subunit.destroy();
                return true;
            }
        },
        getWidth: function () {
            return this._cache.width || this.recalculateSizes().width;
        },
        getHeight: function () {
            return this._cache.height || this.recalculateSizes().height;
        },
        recalculateSizes: function () {  // updates multiunit width/height from subunit changes
            var subunitPositionsTree = this.getSubunitsCoordinatesTree();
            var rect = this.subunitsTreeGetRect(subunitPositionsTree);

            this._cache.width = app.utils.convert.mm_to_inches(rect.width);
            this._cache.height = app.utils.convert.mm_to_inches(rect.height);

            return { width: rect.width, height: rect.height };
        },
        getSubunitNode: function (subunitId) {
            var subunitPositionsTree = this.getSubunitsCoordinatesTree();
            var subunitNode;
            this.subunitsTreeForEach(subunitPositionsTree, function (node) {
                if (node.unit.id === subunitId) {
                    subunitNode = node;
                }
            });

            return subunitNode;
        },
        getSubunitCoords: function (subunitId) {
            var subunitNode = this.getSubunitNode(subunitId);
            var coords;
            if (subunitNode) {
                coords = {
                    x: subunitNode.x,
                    y: subunitNode.y
                };
            }

            return coords;  // mm
        },
        isSubunitRemovable: function (subunitId) {
            var subunitNode = this.getSubunitNode(subunitId);
            var isLeafSubunit = (subunitNode.children.length === 0);

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
        getSubunitsTree: function () {
            var self = this;
            var subunitsIds = this.getSubunitsIds();  // prepare flat array of node templates
            var nodeTemplates = subunitsIds.map(function (subunitId) {
                var unitId = subunitId;
                var parentId = self.getParentSubunitId(subunitId);
                var childrenIds = self.getChildSubunitsIds(subunitId);
                var node = {
                    unit: unitId,
                    parent: parentId,
                    children: childrenIds
                };
                return node;
            });

            if (nodeTemplates.length === 0) { return; }

            var originId = this.getOriginSubunitId();  // bootstrap tree
            var originNode = nodeTemplates.filter(function (node) {
                return (node.unit === originId);
            })[0];
            originNode.unit = self.getSubunitById(originNode.unit);
            var subunitsTree = originNode;
            var processableLeafNodes = [];
            processableLeafNodes[0] = subunitsTree;

            while (processableLeafNodes.length > 0) {  // build tree by appending nodes from array
                var currentNode = processableLeafNodes.pop();
                currentNode.children.forEach(function (subunitId, childIndex) {
                    var childNode = nodeTemplates.filter(function (node) {  // append a node
                        return (node.unit === subunitId);
                    })[0];
                    currentNode.children[childIndex] = childNode;

                    childNode.unit = self.getSubunitById(subunitId);  // render node to its final form
                    childNode.parent = currentNode;

                    if (childNode.children.length > 0) {  // earmark for later processing
                        processableLeafNodes.push(childNode);
                    }
                });
            }

            return subunitsTree;
        },
        /* eslint-enable no-loop-func */
        // Returns subunit tree with coordinate information at each node, in mm
        getSubunitsCoordinatesTree: function (options) {
            var self = this;
            var flipX = options && options.flipX;
            var subunitsTree = this.getSubunitsTree();
            this.subunitsTreeForEach(subunitsTree, function (node) {
                var isOrigin = self.isOriginId(node.unit.id);

                if (isOrigin) {
                    node.width = node.unit.getInMetric('width', 'mm');
                    node.height = node.unit.getInMetric('height', 'mm');
                    node.x = 0;
                    node.y = 0;
                } else {
                    var width = node.unit.getInMetric('width', 'mm');
                    var height = node.unit.getInMetric('height', 'mm');
                    var parentX = node.parent.x;
                    var parentY = node.parent.y;
                    var parentWidth = node.parent.unit.getInMetric('width', 'mm');
                    var parentHeight = node.parent.unit.getInMetric('height', 'mm');
                    var parentConnector = self.getParentConnector(node.unit.id);
                    var gap = parentConnector.width;
                    var side = parentConnector.side;

                    node.width = width;
                    node.height = height;

                    if (side && side === 'top') {
                        node.x = (flipX) ?
                            parentX + parentWidth - width :
                            parentX;
                        node.y = parentY - gap - height;
                    } else if (side && side === 'right') {
                        node.x = (flipX) ?
                            parentX - gap - width :
                            parentX + parentWidth + gap;
                        node.y = parentY;
                    } else if (side && side === 'bottom') {
                        node.x = (flipX) ?
                            parentX + parentWidth - width :
                            parentX;
                        node.y = parentY + parentHeight + gap;
                    } else if (side && side === 'left') {
                        node.x = (flipX) ?
                            parentX + parentWidth + gap :
                            parentX - gap - width;
                        node.y = parentY;
                    }
                }
            });

            var rect = this.subunitsTreeGetRect(subunitsTree);
            if (rect.x < 0) {
                var delta = Math.abs(rect.x);
                this.subunitsTreeForEach(subunitsTree, function (node) {
                    node.x = node.x + delta;
                });
            }

            return subunitsTree;
        },
        subunitsTreeForEach: function (subunitNode, func) {
            if (!subunitNode || !_.isFunction(func)) { return; }

            var self = this;
            var children = subunitNode.children;  // start at node and apply down
            func.call(this, subunitNode);
            if (children && children.length > 0) {
                children.forEach(function (node) {  // recursive walk
                    self.subunitsTreeForEach(node, func);
                });
            }
        },
        subunitsTreeGetRect: function (subunitPositionsTree) {
            if (!subunitPositionsTree) { return {}; }

            var minX = 0;
            var maxX = 0;
            var minY = 0;
            var maxY = 0;
            this.subunitsTreeForEach(subunitPositionsTree, function (node) {
                minX = Math.min(minX, node.x);
                maxX = Math.max(maxX, node.x + node.width);
                minY = Math.min(minY, node.y);
                maxY = Math.max(maxY, node.y + node.height);
            });
            var multiunitWidth = maxX - minX;
            var multiunitHeight = maxY - minY;

            return { x: minX, y: minY, width: multiunitWidth, height: multiunitHeight };
        },
        getSubunitsIds: function () {
            return this.get('multiunit_subunits').slice();
        },
        getOriginSubunitId: function () {
            return this.get('multiunit_subunits')[0];
        },
        isOriginId: function (subunitId) {
            return (subunitId === this.getOriginSubunitId());
        },
        getParentSubunitId: function (subunitId) {
            if (this.isOriginId(subunitId)) { return; }

            var parentConnectorId = this.getParentConnector(subunitId).id;
            var parentSubunitId = this.getConnectorParentSubunitId(parentConnectorId);

            return parentSubunitId;
        },
        getChildSubunitsIds: function (subunitId) {
            var self = this;
            var childConnectors = this.getChildConnectors(subunitId);
            var childSubunitsIds = childConnectors.map(function (connector) {
                return self.getConnectorChildSubunitId(connector.id);
            });

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
        getConnectors: function () {
            return this.get('root_section').connectors.slice();
        },
        getConnectorById: function (id) {
            return this.getConnectors().find(function (connector) { return connector.id === id; });
        },
        getParentConnector: function (subunitId) {
            var parentConnector = this.getConnectors()
                .filter(function (connector) {
                    return (connector.connects[1] === subunitId);
                })[0];

            return parentConnector;
        },
        getChildConnectors: function (subunitId) {
            var childConnectors = this.getConnectors()
                .filter(function (connector) {
                    return (connector.connects[0] === subunitId);
                });

            return childConnectors;
        },
        getConnectorParentSubunitId: function (connectorId) {
            var parentSubunitId = this.getConnectorById(connectorId).connects[0];

            return parentSubunitId;
        },
        getConnectorChildSubunitId: function (connectorId) {
            var childSubunitId = this.getConnectorById(connectorId).connects[1];

            return childSubunitId;
        },
        addConnector: function (options) {
            if (!(options && options.connects && options.side)) { return; }

            var self = this;
            var parentSubunit = this.getSubunitById(options.connects[0]);
            var connectors = this.get('root_section').connectors;
            var newChildSubunit;

            function pushConnector() {
                var connector = {
                    id: highestId + 1,
                    connects: options.connects,
                    side: options.side,
                    width: options.width || CONNECTOR_DEFAULTS.width,
                    facewidth: options.facewidth || CONNECTOR_DEFAULTS.facewidth
                };

                connectors.push(connector);
                self.updateConnectorLength(connector);

                if ( options.success ) {
                    options.success();
                }
            }

            var highestId = connectors
                .map(function (connector) { return connector.id; })
                .reduce(function (lastHighestId, currentId) { return Math.max(currentId, lastHighestId); }, 0);

            if (!options.connects[1]) {
                newChildSubunit = new app.Unit();
                parentSubunit.collection.add(newChildSubunit);
                newChildSubunit.persist({
                    width: parentSubunit.get('width'),
                    height: parentSubunit.get('height')
                }, {
                    success: function () {
                        options.connects[1] = newChildSubunit.id;
                        pushConnector();
                        self.addSubunit(newChildSubunit);
                    }
                });
            } else {
                pushConnector();
            }
        },
        removeConnector: function (id) {
            var connectors = this.get('root_section').connectors;
            var connector;

            var connectorIndex = connectors.indexOf(this.getConnectorById(id));

            if (connectorIndex !== -1) {
                connector = connectors.splice(connectorIndex, 1)[0];
            }

            return connector;
        },
        updateConnectorLength: function (connector) {
            var parent = this.getSubunitById(connector.connects[0]);
            var child = this.getSubunitById(connector.connects[1]);
            var parentSide;
            var childSide;

            if (!(parent || child)) { return; }

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
        updateConnectorsLength: function () {
            var self = this;
            var connectors = this.get('root_section').connectors;

            connectors.forEach(function (connector) {
                self.updateConnectorLength(connector);
            });
        },
        //  Drawing representation for multiunits includes subunits as well,
        //  so if any subunit did change, we want to redraw multiunut preview
        getDrawingRepresentation: function () {
            var model_attributes_to_cache = [
                'multiunit_subunits', 'root_section'
            ];

            return {
                model: this.pick(model_attributes_to_cache),
                subunits: this.subunits.map(function (subunit) {
                    return subunit.getDrawingRepresentation();
                })
            };
        },
        //  TODO: this is identical to getPreview from Unit model so maybe
        //  we want to move them both to a mixin or something
        //  TODO: use this._cache.preview instead of this.preview
        getPreview: function (preview_options) {
            var complete_preview_options = app.preview.mergeOptions(this, preview_options);
            var use_cache = true;

            //  In some cases we want to ignore the cache completely, like when
            //  preview is expected to return a canvas or a Konva.Group
            if ( complete_preview_options.mode === 'canvas' || complete_preview_options.mode === 'group' ) {
                use_cache = false;
            }

            var drawing_representation_string = JSON.stringify(this.getDrawingRepresentation());
            var options_json_string = JSON.stringify(_.omit(complete_preview_options, 'model'));

            //  If we already got an image for the same model representation
            //  and same preview options, just return it from the cache
            if (
                use_cache === true && this.preview && this.preview.result &&
                this.preview.result[options_json_string] &&
                drawing_representation_string === this.preview.drawing_representation_string
            ) {
                return this.preview.result[options_json_string];
            }

            var result = app.preview.getPreview(this, preview_options);

            //  If model representation changes, preview cache should be erased
            if (
                use_cache === true && (!this.preview || !this.preview.result) ||
                use_cache === true && drawing_representation_string !== this.preview.drawing_representation_string
            ) {
                this.preview = {
                    drawing_representation_string: drawing_representation_string,
                    result: {}
                };
            }

            //  Add new preview to cache
            if ( use_cache === true ) {
                this.preview.result[options_json_string] = result;
            }

            return result;
        }
    });
})();
