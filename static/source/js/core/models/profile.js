var app = app || {};

(function () {
    'use strict';

    var UNIT_TYPES = ['Window', 'Patio Door', 'Entry Door', 'Tilt + Slide', 'Lift + Slide', 'Folding'];
    var DEFAULT_UNIT_TYPE = 'Window';
    var TYPES_WITH_POSSIBLE_THRESHOLD = ['Patio Door', 'Entry Door'];
    var TYPES_WITH_EDITABLE_THRESHOLD = ['Patio Door'];
    var TYPES_WITH_ALWAYS_LOW_THRESHOLD = ['Entry Door'];
    var TYPES_WITH_POSSIBLE_SOLID_PANEL = ['Patio Door', 'Entry Door'];
    var TYPES_WITH_POSSIBLE_FLUSH_PANEL = ['Entry Door'];
    var TYPES_WITH_OUTSIDE_HANDLE = ['Patio Door', 'Entry Door'];

    //  Profile sizes are set in millimeters
    var PROFILE_PROPERTIES = [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'unit_type', title: 'Type', type: 'string' },
        { name: 'system', title: 'System', type: 'string' },
        { name: 'frame_width', title: 'Frame Width (mm)', type: 'number' },
        { name: 'mullion_width', title: 'Mullion Width (mm)', type: 'number' },
        { name: 'sash_frame_width', title: 'Sash Frame Width (mm)', type: 'number' },
        { name: 'sash_frame_overlap', title: 'Sash-Frame Overlap (mm)', type: 'number' },
        { name: 'sash_mullion_overlap', title: 'Sash-Mullion Overlap (mm)', type: 'number' },
        { name: 'threshold_width', title: 'Threshold Width (mm)', type: 'number' },
        { name: 'low_threshold', title: 'Low Threshold', type: 'boolean' }
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

            if ( name === 'unit_type' ) {
                default_value = DEFAULT_UNIT_TYPE;
            }

            if ( name === 'low_threshold' ) {
                default_value = false;
            }

            return default_value;
        },
        sync: function (method, model, options) {
            console.log( 'Syncing profile', arguments );

            console.log( 'method', method );
            console.log( 'model', model );
            console.log( 'options', options );

            options.attrs = { profile: _.omit(model.toJSON(),
                ['id', 'low_threshold', 'windows', 'unitType']) };

            // return Backbone.sync.apply(this, arguments);
            return Backbone.sync.call(this, method, model, options);
        },
        isThresholdPossible: function () {
            return _.indexOf(TYPES_WITH_POSSIBLE_THRESHOLD, this.get('unit_type')) !== -1;
        },
        isThresholdEditable: function () {
            return _.indexOf(TYPES_WITH_EDITABLE_THRESHOLD, this.get('unit_type')) !== -1;
        },
        hasAlwaysLowThreshold: function () {
            return _.indexOf(TYPES_WITH_ALWAYS_LOW_THRESHOLD, this.get('unit_type')) !== -1;
        },
        isSolidPanelPossible: function () {
            return _.indexOf(TYPES_WITH_POSSIBLE_SOLID_PANEL, this.get('unit_type')) !== -1;
        },
        isFlushPanelPossible: function () {
            return _.indexOf(TYPES_WITH_POSSIBLE_FLUSH_PANEL, this.get('unit_type')) !== -1;
        },
        hasOutsideHandle: function() {
            return _.indexOf(TYPES_WITH_OUTSIDE_HANDLE, this.get('unit_type')) !== -1;
        },
        getThresholdType: function () {
            var threshold_type = '--';

            if ( this.isThresholdPossible() ) {
                if ( this.get('low_threshold') === true ) {
                    threshold_type = 'Low';
                } else {
                    threshold_type = 'Standard';
                }
            }

            return threshold_type;
        },
        onTypeUpdate: function () {
            if ( !this.isThresholdPossible() ) {
                this.set('low_threshold', false);
            } else if ( this.hasAlwaysLowThreshold() ) {
                this.set('low_threshold', true);
            }
        },
        initialize: function () {
            this.on('change:unit_type', this.onTypeUpdate, this);
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
