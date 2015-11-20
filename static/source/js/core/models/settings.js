var app = app || {};

(function () {
    'use strict';

    app.Settings = Backbone.Model.extend({
        defaults: {
            api_base_path: 'http://127.0.0.1:8000/api'
        },
        initialize: function () {
            this.profiles = new app.ProfileCollection();
        },
        getAvailableProfileNames: function () {
            return this.profiles.map(function (item) {
                return item.get('name');
            });
        },
        getProfileByName: function (profile_name) {
            var profile = this.profiles.findWhere({name: profile_name});
            return profile ? profile : new app.Profile();
        }
    });
})();
