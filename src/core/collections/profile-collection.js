import _ from 'underscore';
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
    //  TODO: this function is not really needed, it's too obvious
    //  TODO: some other functions below are also redundant
    getAvailableProfileNames() {
        return this.pluck('name');
    },
    getProfileNamesByIds(ids_array) {
        let name_list = [];

        this.each((item) => {
            const index = ids_array.indexOf(item.id);

            if (index !== -1) {
                name_list.push({ index, name: item.get('name') });
            }
        });

        name_list = _.pluck(name_list, 'name');

        return name_list;
    },
    getProfileByIdOrDummy(profile_id) {
        return this.get(profile_id) || new Profile({
            is_dummy: true,
        });
    },
    getProfileIdByName(profile_name) {
        const profile = this.findWhere({ name: profile_name });

        return profile ? profile.get('id') : null;
    },
    getDefaultProfileId() {
        return this.length ? this.at(0).get('id') : undefined;
    },
});
