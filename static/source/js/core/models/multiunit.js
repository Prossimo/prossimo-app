var app = app || {};

(function () {
    'use strict';

    var self;

    var MULTIUNIT_PROPERTIES = [
        { name: 'multiunit_subunits', title: 'Subunits', type: 'array' }
    ];

    var CONNECTOR_DEFAULTS = {
        offsets: [0, 0],
        width: 20,
        facewidth: 40,
        length: '100%'
    };

    function getSectionDefaults() {
        return {
            id: _.uniqueId(),
            connectors: []
        };
    }

    function isPercentage(value) {
        if (_.isArray(value)) {
            return value.some(function (subvalue) { return isPercentage(subvalue); });
        } else {
            return (_.isString(value) && value.indexOf('%') !== -1);
        }
    }

    app.Multiunit = app.Baseunit.extend({
        schema: _.defaults(app.schema.createSchema(MULTIUNIT_PROPERTIES), app.Baseunit.schema),
        defaults: function () {
            var defaults = app.Baseunit.prototype.defaults.apply(this, arguments);

            _.each(MULTIUNIT_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getDefaultValue: function (name) {
            var value;
            var defaults = {
                unit_composition: 'multiunit',
                root_section: getSectionDefaults()
            };

            if (Object.keys(defaults).indexOf(name) !== -1) {
                value = defaults[name];
            } else {
                value = app.Baseunit.prototype.getDefaultValue.apply(this, arguments);
            }

            return value;
        },
        initialize: function () {
            self = this;

            app.Baseunit.prototype.initialize.apply(this, arguments);

            this.on('add', function () {
                self.listenTo(self.collection, 'update', function (event) {
                    self.connectorsToEssentialFormat();
                    self.updateSubunitsCollection();
                    self.updateCollectionPositions();
                });
                self.listenTo(self.collection, 'remove', function (unit) {
                    if (unit.isSubunitOf(self)) {
                        self.removeSubunit(unit);
                    }
                });
            });
        },
        getUnitPrice: function () {
            var price = this.subunits.reduce(function (priceSum, subunit) {
                return priceSum + subunit.getUnitPrice();
            }, 0);

            return price;
        },
        /**
         * this.subunits is a backbone collection that holds respective subunit models, the very same models that exist
         * in multiunit's primary parent collection.
         */
        updateSubunitsCollection: function () {
            if (!this.collection) { return; }

            if (!this.subunits) {
                this.subunits = new app.BaseunitCollection();
                this.listenTo(this.subunits, 'change', function () {  // trigger self change if any subunit changes
                    self.trigger.apply(this, ['change'].concat(Array.prototype.slice.call(arguments)));
                });
            }

            var subunitsIds = this.getSubunitsIds();

            this.subunits.add(
                subunitsIds
                    .map(function (id) { return self.getSubunitById(id); })
                    .filter(function (subunit) { return !_.isUndefined(subunit); })
                    .filter(function (subunit) { return self.subunits.indexOf(subunit) === -1; })
            );
        },
        /** Reorders subunit models in multiunit's parent collection (not in this.subunits) */
        updateCollectionPositions: function () {
            this.subunits.forEach(function (subunit, subunitIndex) {
                var subunitOffset = subunitIndex + 1;
                var multiunitPosition = self.collection.indexOf(self);
                var subunitPosition = self.collection.indexOf(subunit);
                var newPosition = (multiunitPosition + subunitOffset < self.collection.length) ?
                    multiunitPosition + subunitOffset :
                    multiunitPosition + subunitOffset - 1;
                self.collection.setItemPosition(subunitPosition, newPosition);
            });
        },
        hasOnlyDefaultAttributes: function () {
            return app.Baseunit.prototype.hasOnlyDefaultAttributes.apply(this,
                Array.prototype.concat(
                    Array.prototype.slice.call(arguments),
                    [{SUBCLASS_PROPERTIES: MULTIUNIT_PROPERTIES}]
                )
            );
        },
        getNameTitleTypeHash: function () {
            return app.Baseunit.prototype.getNameTitleTypeHash.apply(this,
                Array.prototype.concat(
                    Array.prototype.slice.call(arguments),
                    [{SUBCLASS_PROPERTIES: MULTIUNIT_PROPERTIES}]
                )
            );
        },
        getSubunitById: function (id) {
            return this.collection.getById(id);
        },
        addSubunit: function (subunit) {
            if (!(subunit instanceof app.Baseunit)) { return; }

            var subunitsIds = this.get('multiunit_subunits');
            var subunitId = subunit.getId();

            if (!_.contains(subunitsIds, subunitId)) {
                subunitsIds.push(subunitId);
                this.updateSubunitsCollection();
                this.updateCollectionPositions();
                this.recalculateSizes();
            }
        },
        removeSubunit: function (subunit) {
            if (!(subunit.isSubunitOf && subunit.isSubunitOf(this))) { return; }

            var subunitsIds = this.get('multiunit_subunits');
            var subunitId = subunit.getId();
            var subunitIndex = subunitsIds.indexOf(subunitId);

            if (subunitIndex !== -1) {
                subunitsIds.splice(subunitIndex, 1);
                this.removeConnector(this.getParentConnector(subunitId).id);
                this.updateSubunitsCollection();
                this.updateCollectionPositions();
                this.recalculateSizes();
            }
        },
        recalculateSizes: function () {  // updates multiunit width/height from subunit changes
            var subunitPositionsTree = this.getSubunitsCoordinatesTree();

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
            var multiunitWidth = app.utils.convert.mm_to_inches(maxX - minX).toFixed(5);
            var multiunitHeight = app.utils.convert.mm_to_inches(maxY - minY).toFixed(5);
            this.set('width', multiunitWidth);
            this.set('height', multiunitHeight);

            return { width: multiunitWidth, height: multiunitHeight };
        },
        getSubunitNode: function (subunitId) {
            var subunitPositionsTree = this.getSubunitsCoordinatesTree();
            var subunitNode;
            this.subunitsTreeForEach(subunitPositionsTree, function (node) {
                if (node.unit.getId() === subunitId) {
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
        /**
         * Subunit tree consists of nodes corresponding to subunits.
         * Each node has 3 fields:
         * unit - points to the unit model associated with this node
         * parent - points to the parent node
         * children - points to array of child nodes
         */
        getSubunitsTree: function () {

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
        // Returns subunit tree with coordinate information at each node, in mm
        getSubunitsCoordinatesTree: function () {
            var subunitsTree = this.getSubunitsTree();
            this.subunitsTreeForEach(subunitsTree, function (node) {
                var isOrigin = self.isOriginId(node.unit.getId());

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
                    var parentConnector = self.getParentConnector(node.unit.getId());
                    var gap = parentConnector.width;
                    var offset = parentConnector.offsets[1] + parentConnector.offsets[0];
                    var side = parentConnector.side;

                    node.width = width;
                    node.height = height;

                    if (side && side === 'top') {
                        node.x = parentX + offset;
                        node.y = parentY - gap - height;
                    } else if (side && side === 'right') {
                        node.x = parentX + parentWidth + gap;
                        node.y = parentY + offset;
                    } else if (side && side === 'bottom') {
                        node.x = parentX + offset;
                        node.y = parentY + parentHeight + gap;
                    } else if (side && side === 'left') {
                        node.x = parentX - gap - width;
                        node.y = parentY + offset;
                    }
                }
            });

            return subunitsTree;
        },
        subunitsTreeForEach: function (subunitNode, func) {
            if (!subunitNode || !_.isFunction(func)) { return; }

            var children = subunitNode.children;  // start at node and apply down
            func.call(this, subunitNode);
            if (children && children.length > 0) {
                children.forEach(function (node) {  // recursive walk
                    self.subunitsTreeForEach(node, func);
                });
            }
        },
        getSubunitRelativePosition: function (subunit) {
            return this.subunits.indexOf(subunit);
        },
        getSubunitsIds: function () {
            return this.get('multiunit_subunits').slice();
        },
        getOriginSubunitId: function () {
            return this.get('multiunit_subunits')[0];
        },
        isOriginId: function (subunitId) {
            return (subunitId === this.getOriginSubunitId())
        },
        getParentSubunitId: function (subunitId) {
            if (_.isUndefined(subunitId)) { return; }
            if (this.isOriginId(subunitId)) { return; }

            var parentConnectorId = this.getParentConnector(subunitId).id;
            var parentSubunitId = this.getConnectorParentSubunitId(parentConnectorId);

            return parentSubunitId;
        },
        getChildSubunitsIds: function (subunitId) {
            if (_.isUndefined(subunitId)) { return; }

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
         * Connector connects to parent on a side with offset along the side ("sliding" on the side).
         * Connector adds a gap between parent and child, but may itself appear thicker than that gap.
         * Child connects to connector with another offset in the same direction.
         *
         * = Essential connector format:
         * {
         *     id: '<id>',                       // Multiunit-scope unique numeric ID for the connector
         *     side: '<top|right|bottom|left>',  // Attach connector to parent side
         *     connects: [                       // IDs of subunits connected
         *         '<id>',                           // Parent subunit ID
         *         '<id>'                            // Child subunit ID
         *     ],
         *     offsets: [                        // Offsets along chosen parent side
         *         <number>,                         // Connector offset relative to parent, mm
         *         <number>                          // Child offset relative to connector, mm
         *     ],
         *     width: <number>,                  // Actual gap between connected units, mm
         *     facewidth: <number>               // How wide the connector drawing appears, mm
         *     length: <number>,                 // Connector length, mm
         * }
         *
         * = Optional ad-hoc extensions:
         * Use for particular tasks. Convert to essential format after use.
         * {
         *     offsets: [
         *         '<number>%',                      // Connector offset relative to parent, % of parent side length
         *         '<number>%'                       // Child offset relative to connector, % of connector length
         *     ],
         *     length: '<number>%',              // Connector length, % of parent side length
         * }
         *
         * = Example:
         * { id: '17', side: 'right', connects: ['123', '124'], offsets: [0, 100], width: 20, facewidth: 40, length: 200 }
         */
        getConnectors: function () {
            var connectors = this.get('root_section').connectors.slice();

            return connectors;
        },
        getConnectorById: function (id) {
            if (_.isUndefined(id)) { return; }

            return this.getConnectors().find(function (connector) { return connector.id === id; });
        },
        getParentConnector: function (subunitId) {
            if (_.isUndefined(subunitId)) { return; }

            var parentConnector = this.getConnectors()
                .filter(function (connector) {
                    return (connector.connects[1] === subunitId);
                })[0];

            return parentConnector;
        },
        getChildConnectors: function (subunitId) {
            if (_.isUndefined(subunitId)) { return; }

            var childConnectors = this.getConnectors()
                .filter(function (connector) {
                    return (connector.connects[0] === subunitId);
                });

            return childConnectors;
        },
        getConnectorParentSubunitId: function (connectorId) {
            if (_.isUndefined(connectorId)) { return; }

            var parentSubunitId = this.getConnectorById(connectorId).connects[0];
            
            return parentSubunitId;
        },
        getConnectorChildSubunitId: function (connectorId) {
            if (_.isUndefined(connectorId)) { return; }

            var childSubunitId = this.getConnectorById(connectorId).connects[1];
            
            return childSubunitId;
        },
        addConnector: function (options) {
            if (!(options && options.connects && options.side)) { return; }

            var parentSubunit = this.getSubunitById(options.connects[0]);
            var connectors = this.get('root_section').connectors;
            var newChildSubunit;

            var highestId = connectors
                .map(function (connector) { return connector.id; })
                .reduce(function (lastHighestId, currentId) { return Math.max(currentId, lastHighestId); }, 0);

            if (!options.connects[1]) {
                newChildSubunit = new app.Unit({
                    width: parentSubunit.get('width'),
                    height: parentSubunit.get('height')
                });
                options.connects[1] = this.collection.add(newChildSubunit).getId();
            }

            var connector = {
                id: highestId + 1,
                connects: options.connects,
                side: options.side,
                offsets: options.offsets || CONNECTOR_DEFAULTS.offsets,
                width: options.width || CONNECTOR_DEFAULTS.width,
                length: options.length || CONNECTOR_DEFAULTS.length,
                facewidth: options.facewidth || CONNECTOR_DEFAULTS.facewidth
            };


            connectors.push(connector);
            this.connectorToEssentialFormat(connector);
            if (newChildSubunit) { this.addSubunit(newChildSubunit); }
            return connector;
        },
        removeConnector: function (id) {
            if (_.isUndefined(id)) { return; }

            var connectors = this.get('root_section').connectors;
            var connector;

            var connectorIndex = connectors.indexOf(this.getConnectorById(id));

            if (connectorIndex !== -1) {
                connector = connectors.splice(connectorIndex, 1)[0];
            }
            // FIXME implement
            return connector;
        },
        moveConnector: function () {
            // FIXME implement
        },
        setConnectorProperties: function (id, options) {
            if (_.isUndefined(id)) { return; }
            if (!options || options.constructor !== Object) { return; }

            var connector = this.getConnectorById(id);

            if (connector) {
                Object.keys(options).forEach(function (key) {
                    connector[key] = options[key];
                });
            }
            // FIXME implement
            return connector;
        },
        connectorToEssentialFormat: function (connector) {
            if (_.isUndefined(connector)) { return; }

            var parentId = connector.connects[0];
            var parent = this.getSubunitById(parentId);

            if (_.isUndefined(parent)) { return; }

            var parentSide = (connector.side === 'top' || connector.side === 'bottom') ?
                parent.getInMetric('width', 'mm') :
                parent.getInMetric('height', 'mm');

            if (isPercentage(connector.length)) {
                connector.length = parseFloat(connector.length) * 0.01 * parentSide;
            }

            if (isPercentage(connector.offsets[0])) {
                connector.offsets[0] = parseFloat(connector.offsets[0]) * 0.01 * parentSide;
            }

            if (isPercentage(connector.offsets[1])) {
                connector.offsets[1] = parseFloat(connector.offsets[1]) * 0.01 * connector.length;
            }

            return connector;
        },
        connectorsToEssentialFormat: function () {
            var connectors = this.get('root_section').connectors;

            connectors.forEach(function (connector) {
                self.connectorToEssentialFormat(connector);
            });
        }
    });
})();
