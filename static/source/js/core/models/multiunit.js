var app = app || {};

(function () {
    'use strict';
    var self;

    var MULTIUNIT_PROPERTIES = [
        { name: 'multiunit_subunits', title: 'Subunits', type: 'object' }  // I.e. {<id>: [<x>, <y>], ...}, in mm
    ];

    app.Multiunit = app.Baseunit.extend({
        schema: _.defaults(app.schema.createSchema(MULTIUNIT_PROPERTIES), app.Baseunit.schema),
        defaults: function () {
            var defaults = app.Baseunit.prototype.defaults.apply(this, arguments);

            _.each(MULTIUNIT_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        initialize: function (attributes, options) {
            self = this;

            app.Baseunit.prototype.initialize.apply(this, arguments);

        },
        populateSubunits: function () {
            if (!this.collection) { return; }

            if (!this.subunits) {
                this.subunits = new app.BaseunitCollection();
                this.listenTo(this.subunits, 'change', function () {  // Trigger self change if any subunit changes
                    self.trigger.apply(this, ['change'].concat(Array.prototype.slice.call(arguments)));
                });
            }

            var unitIds = Object.keys(this.get('multiunit_subunits'));

            this.subunits.add(unitIds
                .map(function (id) { return self.collection.getById(id); })
                .filter(function (subunit) { return !_.isUndefined(subunit); }));
        }
    });
})();
