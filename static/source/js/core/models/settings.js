var app = app || {};

(function () {
    'use strict';

    app.Settings = Backbone.Model.extend({
        defaults: {
            api_base_path: 'http://127.0.0.1:8000/api'
        },
        initialize: function () {
            this.profiles = new app.ProfileCollection({
                api_base_path: this.get('api_base_path')
            });

            this.profiles.fetch();
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
