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
        length: 200,
        facewidth: 40
    };

    function getSectionDefaults() {
        return {
            id: _.uniqueId(),
            connectors: []
        };
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
                    .map(function (id) { return self.collection.getById(id); })
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
        /**
         * Connector format:
         * {   id: <number>,                     // Multiunit-scope unique numeric ID for the connector
         *     side: '<top|right|bottom|left>',  // Which frame side the connector is on
         *     connects: [<number>, <number>],   // IDs of subunits connected. First subunit closer to multiunit root
         *     offsets: [<number>, <number>],    // Connector offset to parent subunit; subunit offset to connector, mm
         *     width: <number>,                  // Actual gap between connected units, mm
         *     length: <number>,                 // Connector length, mm
         *     facewidth: <number> }             // How wide the connector appears in the drawing, mm
         * Example:
         * { id: 123, side: 'right', connects: [123, 124], offsets: [0, 100], width: 20, length: 200, facewidth: 40 }
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

            var highestId = this.getConnectors()
                .map(function (connector) { return connector.id; })
                .reduce(function (lastHighestId, currentId) { return Math.max(currentId, lastHighestId); }, 0);

            if (!options.connects[1]) {
                var newSubunit = new app.Unit();
                options.connects[1] = this.collection.add(newSubunit);
                this.addSubunit(newSubunit);
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
        addSubunit: function (subunit) {
            if (!(subunit instanceof app.Baseunit)) { return; }

            var subunitIds = this.get('multiunit_subunits');
            var subunitId = subunit.getId();

            if (subunitIds.indexOf(subunitId) === -1) {
                subunitIds.push(subunitId);
                this.updateSubunitsCollection();
            }
        }
    });
})();
