var app = app || {};

(function () {
    'use strict';

    var UNIT_PROPERTIES = [
        { name: 'glazing_bar_width', title: 'Glazing Bar Width (mm)', type: 'number' },

        { name: 'profile_name', title: 'Profile', type: 'string' },
        { name: 'profile_id', title: 'Profile', type: 'string' },

        { name: 'opening_direction', title: 'Opening Direction', type: 'string' },
        { name: 'glazing', title: 'Glass Packet / Panel Type', type: 'string' }
    ];

    app.Unit = app.Baseunit.extend({
        schema: _.defaults(app.schema.createSchema(UNIT_PROPERTIES), app.Baseunit.schema),
        defaults: function () {
            var defaults = app.Baseunit.prototype.defaults.apply(this, arguments);

            _.each(UNIT_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        hasOnlyDefaultAttributes: function () {
            return app.Baseunit.prototype.hasOnlyDefaultAttributes.apply(this,
                Array.prototype.concat(
                    Array.prototype.slice.call(arguments),
                    [{SUBCLASS_PROPERTIES: UNIT_PROPERTIES}]
                )
            );
        },
        getNameTitleTypeHash: function () {
            return app.Baseunit.prototype.getNameTitleTypeHash.apply(this,
                Array.prototype.concat(
                    Array.prototype.slice.call(arguments),
                    [{SUBCLASS_PROPERTIES: UNIT_PROPERTIES}]
                )
            );
        }
    });
})();
