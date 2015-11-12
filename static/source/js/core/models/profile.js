var app = app || {};

(function () {
    'use strict';

    var UNIT_TYPES = ['Window', 'Patio Door', 'Entry Door', 'Tilt + Slide', 'Lift + Slide', 'Folding'];
    var DEFAULT_UNIT_TYPE = 'Window';
    var TYPES_WITH_THRESHOLD = ['Patio Door'];

    //  Profile sizes are set in millimeters
    var PROFILE_PROPERTIES = [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'unitType', title: 'Type', type: 'string' },
        { name: 'system', title: 'System', type: 'string' },
        { name: 'frameWidth', title: 'Frame Width (mm)', type: 'number' },
        { name: 'mullionWidth', title: 'Mullion Width (mm)', type: 'number' },
        { name: 'sashFrameWidth', title: 'Sash Frame Width (mm)', type: 'number' },
        { name: 'sashFrameOverlap', title: 'Sash-Frame Overlap (mm)', type: 'number' },
        { name: 'sashMullionOverlap', title: 'Sash-Mullion Overlap (mm)', type: 'number' },
        { name: 'thresholdWidth', title: 'Threshold width (mm)', type: 'number' },
        { name: 'lowThreshold', title: 'Low Threshold', type: 'boolean' }
    ];

    app.Profile = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(PROFILE_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            if ( type === 'number' ) {
                default_value = 0;
            }

            if ( name === 'unitType' ) {
                default_value = DEFAULT_UNIT_TYPE;
            }

            if ( name === 'lowThreshold' ) {
                default_value = false;
            }

            return default_value;
        },
        isThresholdPossible: function () {
            return _.indexOf(TYPES_WITH_THRESHOLD, this.get('unitType')) !== -1;
        },
        getThresholdType: function () {
            var threshold_type = '--';

            if ( this.isThresholdPossible() ) {
                if ( this.get('lowThreshold') === true ) {
                    threshold_type = 'Low';
                } else {
                    threshold_type = 'Standard';
                }
            }

            return threshold_type;
        },
        onTypeUpdate: function () {
            if ( !this.isThresholdPossible() ) {
                this.set('lowThreshold', false);
            }
        },
        initialize: function () {
            this.on('change:unitType', this.onTypeUpdate, this);
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( PROFILE_PROPERTIES, 'name' );
            }

            _.each(PROFILE_PROPERTIES, function (item) {
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
        getUnitTypes: function () {
            return UNIT_TYPES;
        }
    });
})();
