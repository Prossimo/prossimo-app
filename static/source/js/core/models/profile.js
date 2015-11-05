var app = app || {};

(function () {
    'use strict';

    //  Profile sizes are set in millimeters
    var ProfileProperties = [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'frameWidth', title: 'Frame Width (mm)', type: 'number' },
        { name: 'mullionWidth', title: 'Mullion Width (mm)', type: 'number' },
        { name: 'sashFrameWidth', title: 'Sash Frame Width (mm)', type: 'number' }
    ];

    app.Profile = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(ProfileProperties, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            if ( type === 'number' ) {
                default_value = 0;
            }

            return default_value;
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( ProfileProperties, 'name' );
            }

            _.each(ProfileProperties, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_hash.push({ name: item.name, title: item.title, type: item.type });
                }
            });

            return name_title_hash;
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        }
    });
})();
