var app = app || {};

(function () {
    'use strict';

    var MULTIUNIT_PROPERTIES = [
        { name: 'multiunit_units', title: 'Units', type: 'array' }
    ];

    app.Multiunit = app.Baseunit.extend({
        schema: _.defaults(app.schema.createSchema(MULTIUNIT_PROPERTIES), app.Baseunit.schema),
        defaults: function () {
            var defaults = {};

            _.each(MULTIUNIT_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        }
    });
})();
