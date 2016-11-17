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
                self.listenTo(self.collection, 'update', function () {
                    self.updateSubunitsCollection();
                });
            });
        },
        updateSubunitsCollection: function () {
            if (!this.collection) { return; }

            if (!this.subunits) {
                this.subunits = new app.BaseunitCollection();
                this.listenTo(this.subunits, 'change', function () {  // Trigger self change if any subunit changes
                    self.trigger.apply(this, ['change'].concat(Array.prototype.slice.call(arguments)));
                });
            }

            var subunitIds = this.get('multiunit_subunits');

            this.subunits.add(
                subunitIds
                    .map(function (id) { return self.getSubunitById(id); })
                    .filter(function (subunit) { return !_.isUndefined(subunit); })
                    .filter(function (subunit) { return self.subunits.indexOf(subunit) === -1; })
            );
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

            var subunitIds = this.get('multiunit_subunits');
            var subunitId = subunit.getId();

            if (!_.contains(subunitIds, subunitId)) {
                subunitIds.push(subunitId);
                this.updateSizes();
                this.updateSubunitsCollection();
            }
        },
        updateSizes: function () {
            this.set('width', 280);
            this.set('height', 150);
            // FIXME implement
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
            return this.get('root_section').connectors;
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
        getParentSubunit: function (connectorId) {
            if (_.isUndefined(connectorId)) { return; }

            return this.getConnectorById(connectorId).connects[0];
        },
        getChildSubunit: function (connectorId) {
            if (_.isUndefined(connectorId)) { return; }

            return this.getConnectorById(connectorId).connects[1];
        },
        addConnector: function (options) {
            if (!(options && options.connects && options.side)) { return; }

            var parentSubunit = this.getSubunitById(options.connects[0]);

            var highestId = this.getConnectors()
                .map(function (connector) { return connector.id; })
                .reduce(function (lastHighestId, currentId) { return Math.max(currentId, lastHighestId); }, 0);

            if (!options.connects[1]) {
                var childSubunit = new app.Unit({
                    width: parentSubunit.get('width'),
                    height: parentSubunit.get('height')
                });
                options.connects[1] = this.collection.add(childSubunit).getId();
                this.addSubunit(childSubunit);
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

            this.getConnectors().push(connector);
            this.connectorToEssentialFormat(connector);
            return connector;
        },
        removeConnector: function (id) {
            if (_.isUndefined(id)) { return; }
            var connector;

            var connectorIndex = this.getConnectors().indexOf(this.getConnectorById(id));

            if (connectorIndex !== -1) {
                connector = this.getConnectors().splice(connectorIndex, 1)[0];
            }

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

            return connector;
        },
        connectorToEssentialFormat: function (connector) {
            if (_.isUndefined(connector)) { return; }

            var parentId = this.getParentSubunit(connector.id);
            var parent = this.getSubunitById(parentId);
            var parentSide = (connector.side === 'top' || connector.side === 'bottom') ?
                parent.get('width') :
                parent.get('height');

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
        }
    });
})();
