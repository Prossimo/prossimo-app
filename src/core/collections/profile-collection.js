import Backbone from 'backbone';

import Profile from '../models/profile';

export default Backbone.Collection.extend({
    model: Profile,
    reorder_property_name: 'profiles',
    url() {
        return `${this.options.api_base_path ? this.options.api_base_path : ''}/profiles`;
    },
    reorder_url() {
        return `${this.options.api_base_path ? this.options.api_base_path : ''}/reorder_profiles`;
    },
    parse(data) {
        return data.profiles || data;
    },
    initialize(models, options) {
        this.options = options || {};
        this.proxy_profile = new Profile(null, { proxy: true });
    },
    getNameTitleTypeHash(names) {
        return this.proxy_profile.getNameTitleTypeHash(names);
    },
    getTitles(names) {
        return this.proxy_profile.getTitles(names);
    },
    getUnitTypes() {
        return this.proxy_profile.getUnitTypes();
    },
});
