var app = app || {};

(function () {
    'use strict';

    var self;

    var MULTIUNIT_PROPERTIES = [
        { name: 'multiunit_subunits', title: 'Subunits', type: 'array' }
    ];

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

            return app.Baseunit.prototype.initialize.apply(this, arguments);
        },
        updateSubunitsCollection: function () {
            if (!this.collection) { return; }

            if (!this.subunits) {
                this.subunits = new app.BaseunitCollection();
                this.listenTo(this.subunits, 'change', function () {  // Trigger self change if any subunit changes
                    self.trigger.apply(this, ['change'].concat(Array.prototype.slice.call(arguments)));
                });
            }

            var subunitIds = this.get('multiunit_subunits')
                .map(function (subunit) { return subunit.id; });

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
        getSubunitAttributesById: function (id) {
            return this.get('multiunit_subunits').find(function (attributes) { return attributes.id === id; });
        },
        /**
         * Connector format:
         * {   id: <id>                             // Multiunit-scope unique numeric ID for the connector
         *     side: '<top|right|bottom|left>',     // Which frame side the connector is on
         *     offset: <number>,                    // Offset from top/left of the frame side, mm
         *     width: <number>,                     // Actual gap between connected units, mm
         *     length: <number>,                    // Connector length, mm
         *     facewidth: <number> }                // How wide the connector appears in the drawing, mm
         * Example:
         * { id: 123, side: 'right', offset: 0, width: 20, length: 200, facewidth: 40 }
         */
        getConnectors: function () {
            return this.get('root_section').connectors;
        },
        getConnectorById: function (id) {
            if (_.isUndefined(id)) { return; }

            return this.getConnectors().find(function (connector) { return connector.id === id; });
        },
        addConnector: function (options) {
            if (!options || options.constructor !== Object) { options = {}; }

            var highestId = this.getConnectors()
                .map(function (connector) { return connector.id; })
                .reduce(function (lastHighestId, currentId) { return Math.max(currentId, lastHighestId); }, 0);

            var connector = {
                id: highestId + 1,
                side: options.side,
                offset: options.offset,
                width: options.width,
                length: options.length,
                facewidth: options.facewidth
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

            var subunitsAttr = this.get('multiunit_subunits');
            var subunitId = subunit.getId();

            if (_.pluck(subunitsAttr, 'id').indexOf(subunitId) === -1) {
                this.addSubunitAttr(subunitId);
                this.updateSubunitsCollection();
            }
        },
        addSubunitAttr: function (id, x, y) {
            id = parseInt(id, 10);
            x = x || 0;
            y = y || 0;

            if (_.isNaN(parseInt(id, 10))) { return; }

            var subunitAttr = {id: id, x: x, y: y};
            this.get('multiunit_subunits').push(subunitAttr);
            return subunitAttr;
        }
    });
})();
