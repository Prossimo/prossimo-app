var app = app || {};

(function () {
    'use strict';

    //  That's what we use for Units
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
    var GLASS_OR_PANEL_TYPES = [
        'Triple Standard - Ug=.09 SGHC=.50 LT=71%', 'Triple Tempered',
        'Triple Low Gain', 'Triple Low Gain Tempered', 'Triple High Gain',
        'Triple High Gain Tempered', 'Triple Standard-Outer Frosted', 'Triple Tempered-Outer Frosted'
    ];

    //  That's what we use for Profiles
    var SYSTEMS = ['Workhorse uPVC', 'Pinnacle uPVC'];
    var CORNER_TYPES = ['Mitered', 'Square (Vertical)', 'Square (Horizontal)'];

    app.Settings = Backbone.Model.extend({
        defaults: {
            api_base_path: $('meta[name="api-base-path"]').attr('value') || '/api'
        },
        initialize: function () {
            this.profiles = new app.ProfileCollection(null, {
                api_base_path: this.get('api_base_path')
            });

            this.profiles.fetch({ remove: false });
        },
        getAvailableProfileNames: function () {
            return this.profiles.map(function (item) {
                return item.get('name');
            });
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
        getGlassOrPanelTypes: function () {
            return GLASS_OR_PANEL_TYPES;
        },
        getSystems: function () {
            return SYSTEMS;
        },
        getFrameCornerTypes: function () {
            return CORNER_TYPES;
        },
        getSashCornerTypes: function () {
            return CORNER_TYPES;
        }
    });
})();
