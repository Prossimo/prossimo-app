var app = app || {};

(function () {
    'use strict';

    var PROJECT_SETTINGS_PROPERTIES = [
        { name: 'inches_display_mode', title: 'Inches Display Mode', type: 'string' },
        { name: 'hinge_indicator_mode', title: 'Hinge Indicator Mode', type: 'string' },
        { name: 'pricing_mode', title: 'Pricing Mode', type: 'string' },
        { name: 'show_drawings_in_quote', title: 'Show Drawings in Quote', type: 'string' }      
    ];

    var INCHES_DISPLAY_MODES = [
        { value: 'feet_and_inches', title: 'Feet + Inches' },
        { value: 'inches_only', title: 'Inches Only' }
    ];

    var HINGE_INDICATOR_MODES = [
        { value: 'american', title: 'American' },
        { value: 'european', title: 'European' }
    ];

    var PRICING_MODES = [
        { value: 'normal', title: 'Normal' },
        { value: 'estimates', title: 'Estimates' }
    ];

    var SHOW_DRAWINGS_IN_QUOTE_OPTIONS = [
        { value: true, title: 'Yes' },
        { value: false, title: 'No' }
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
                inches_display_mode: INCHES_DISPLAY_MODES[0].value,
                hinge_indicator_mode: HINGE_INDICATOR_MODES[0].value,
                pricing_mode: PRICING_MODES[0].value,
                show_drawings_in_quote: SHOW_DRAWINGS_IN_QUOTE_OPTIONS[0].value                
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
        getPossibleValuesHash: function () {
            return {
                inches_display_mode: INCHES_DISPLAY_MODES,
                hinge_indicator_mode: HINGE_INDICATOR_MODES,
                pricing_mode: PRICING_MODES,
                show_drawings_in_quote: SHOW_DRAWINGS_IN_QUOTE_OPTIONS                
            };
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        }
    });
})();
