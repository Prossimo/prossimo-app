var app = app || {};

(function () {
    'use strict';

    var PROJECT_SETTINGS_PROPERTIES = [
        { name: 'inches_display_mode', title: 'Inches Display Mode', type: 'string' },
        { name: 'pricing_mode', title: 'Pricing Mode', type: 'string' }
    ];

    var INCHES_DISPLAY_MODES = [
        { name: 'feet_and_inches', title: 'Feet + Inches' },
        { name: 'inches_only', title: 'Inches Only' }
    ];

    var PRICING_MODES = [
        { name: 'normal', title: 'Normal' },
        { name: 'estimates', title: 'Estimates' }
    ];

    app.ProjectSettings = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(PROJECT_SETTINGS_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            var type_value_hash = {
                number: 0
            };

            var name_value_hash = {
                inches_display_mode: INCHES_DISPLAY_MODES[0].name,
                pricing_mode: PRICING_MODES[0].name
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        initialize: function (attributes, options) {
            this.options = options || {};
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( PROJECT_SETTINGS_PROPERTIES, 'name' );
            }

            _.each(PROJECT_SETTINGS_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_hash.push({ name: item.name, title: item.title, type: item.type });
                }
            });

            return name_title_hash;
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        },
        getInchesDisplayModes: function () {
            return INCHES_DISPLAY_MODES;
        },
        getPricingModes: function () {
            return PRICING_MODES;
        }
    });
})();
