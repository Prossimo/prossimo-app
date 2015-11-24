var app = app || {};

(function () {
    'use strict';

    app.Settings = Backbone.Model.extend({
        defaults: {},
        initialize: function () {
            this.profiles = new app.ProfileCollection();
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
        }
    });
})();
