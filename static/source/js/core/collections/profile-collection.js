var app = app || {};

(function () {
    'use strict';

    app.ProfileCollection = Backbone.Collection.extend({
        model: app.Profile,
        url: function () {
            return (this.options.api_base_path ? this.options.api_base_path : '') + '/profiles';
        },
        parse: function (data) {
            return _.map(data.profiles, function (profile) {
                return _.omit(profile, ['units']);
            });
        },
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_profile = new app.Profile(null, { proxy: true });
        },
        getNameTitleTypeHash: function (names) {
            return this.proxy_profile.getNameTitleTypeHash(names);
        },
        getTitles: function (names) {
            return this.proxy_profile.getTitles(names);
        },
        getUnitTypes: function () {
            return this.proxy_profile.getUnitTypes();
        }
    });
})();
