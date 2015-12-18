var app = app || {};

(function () {
    'use strict';


    //  --------------------------------------------------------------------
    //  That's what we use for Units
    //  --------------------------------------------------------------------

    var COLORS = ['White', 'Golden Oak', 'Mahagony', 'Grey'];
    var GASKET_COLORS = ['Black', 'Grey'];
    var INTERIOR_HANDLE_TYPES = [
        'White Plastic-No Lock', 'Brushed Silver Metal-No Lock', 'Brass Metal-No Lock',
        'Brown Plastic-No Lock', 'White Plastic-W/Lock + Key', 'Brushed Silver Metal-W/Lock + Key',
        'Brass Metal-W/Lock + Key', 'Brown Plastic-W/Lock + Key'
    ];
    var HINGE_TYPES = [
        'Flush Mount-White Plastic Cover', 'Flush Mount-Brown Plastic Cover',
        'Flush Mount-Brushed Silver Metal Cover', 'Flush Mount-Brass Metal Cover'
    ];
    var GLAZING_BEAD_TYPES = ['Rounded', 'Square'];
    var GLAZING_BAR_WIDTHS = [12, 22, 44];


    //  --------------------------------------------------------------------
    //  That's what we use for Profiles
    //  --------------------------------------------------------------------


    var SYSTEMS = ['Workhorse uPVC', 'Pinnacle uPVC'];
    var SUPPLIER_SYSTEMS = ['Gaelan S8000', 'Gaelan S9000'];
    var CORNER_TYPES = ['Mitered', 'Square (Vertical)', 'Square (Horizontal)'];


    //  --------------------------------------------------------------------
    // That's what we use for settings
    //  --------------------------------------------------------------------

    var SETTINGS_PROPERTIES = [
        { name: 'api_base_path', title: 'API Base Path', type: 'string' },
        { name: 'inches_display_mode', title: 'Inches Display Mode', type: 'string' }
    ];
    var UI_SETTINGS = ['inches_display_mode'];
    var INCHES_DISPLAY_MODES = [
        { name: 'feet_and_inches', title: 'Feet + Inches' },
        { name: 'inches_only', title: 'Inches Only' }
    ];


    app.Settings = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(SETTINGS_PROPERTIES, function (item) {
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
                api_base_path: $('meta[name="api-base-path"]').attr('value') || '/api',
                inches_display_mode: INCHES_DISPLAY_MODES[0].name
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        initialize: function () {
            this.profiles = new app.ProfileCollection(null, {
                api_base_path: this.get('api_base_path')
            });

            this.filling_types = new app.FillingTypeCollection(null, {
                api_base_path: this.get('api_base_path')
            });

            this.profiles.fetch({
                remove: false,
                data: {
                    limit: 0
                }
            });
        },
        getNameTitleTypeHash: function (names) {
            var name_title_type_hash = {};

            if ( !names ) {
                names = _.pluck( SETTINGS_PROPERTIES, 'name' );
            }

            _.each(SETTINGS_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_type_hash[item.name] = { title: item.title, type: item.type };
                }
            });

            return name_title_type_hash;
        },
        getUISettingsList: function () {
            return UI_SETTINGS;
        },
        getInchesDisplayModes: function () {
            return INCHES_DISPLAY_MODES;
        },
        getAvailableProfileNames: function () {
            return this.profiles.map(function (item) {
                return item.get('name');
            });
        },
        getFillingTypeById: function (cid) {
            return this.filling_types.get(cid);
        },
        getFillingTypeByName: function (name) {
            return this.filling_types.findWhere({ name: name });
        },
        getAvailableFillingTypes: function () {
            return this.filling_types.models;
        },
        getProfileByNameOrNew: function (profile_name) {
            var profile = this.profiles.findWhere({name: profile_name});
            return profile ? profile : new app.Profile();
        },
        getDefaultProfileName: function () {
            var default_profile_name = '';

            if ( this.profiles.length ) {
                default_profile_name = this.profiles.at(0).get('name');
            }

            return default_profile_name;
        },
        getColors: function () {
            return COLORS;
        },
        getInteriorHandleTypes: function () {
            return INTERIOR_HANDLE_TYPES;
        },
        getHingeTypes: function () {
            return HINGE_TYPES;
        },
        getGlazingBeadTypes: function () {
            return GLAZING_BEAD_TYPES;
        },
        getGasketColors: function () {
            return GASKET_COLORS;
        },
        getGlazingBarWidths: function () {
            return GLAZING_BAR_WIDTHS;
        },
        getSystems: function () {
            return SYSTEMS;
        },
        getSupplierSystems: function () {
            return SUPPLIER_SYSTEMS;
        },
        getFrameCornerTypes: function () {
            return CORNER_TYPES;
        },
        getSashCornerTypes: function () {
            return CORNER_TYPES;
        }
    });
})();
