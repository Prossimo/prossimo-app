import Backbone from 'backbone';

import Profile from '../models/profile';

export default Backbone.Collection.extend({
    model: Profile,
    reorder_property_name: 'profiles',
    url: function () {
        return (this.options.api_base_path ? this.options.api_base_path : '') + '/profiles';
    },
    reorder_url: function () {
        return (this.options.api_base_path ? this.options.api_base_path : '') + '/reorder_profiles';
    },
    parse: function (data) {
        return data.profiles || data;
    },
    initialize: function (models, options) {
        this.options = options || {};
        this.proxy_profile = new Profile(null, {proxy: true});
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
