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
        getProfileByName: function (profile_name) {
            var profile = this.profiles.findWhere({name: profile_name});
            return profile ? profile : new app.Profile();
        }
    });
})();
