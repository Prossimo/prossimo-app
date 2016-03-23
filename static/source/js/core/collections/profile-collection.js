var app = app || {};

(function () {
    'use strict';

    app.ProfileCollection = Backbone.Collection.extend({
        model: app.Profile,
        url: function () {
            return (this.options.api_base_path ? this.options.api_base_path : '') + '/profiles';
        },
        reorder_url: function () {
            return (this.options.api_base_path ? this.options.api_base_path : '') + '/reorder_profiles';
        },
        reorder_property_name: 'profiles',
        parse: function (data) {
            return _.map(data.profiles, function (profile) {
                var keys_to_omit = ['units'];

                return _.pick(profile, function (value, key) {
                    return !_.isNull(value) && !_.contains(keys_to_omit, key);
                });
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
