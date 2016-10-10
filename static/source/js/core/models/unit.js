var app = app || {};

(function () {
    'use strict';

    var UNIT_PROPERTIES = [];

    app.Unit = app.Baseunit.extend({
        schema: _.defaults(app.schema.createSchema(UNIT_PROPERTIES), app.Baseunit.schema),
        defaults: function () {
            var defaults = {};

            _.each(UNIT_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        }
    });
})();
