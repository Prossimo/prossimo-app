import Backbone from 'backbone';

import FillingTypeProfile from '../../models/inline/filling-type-to-profile';

export default Backbone.Collection.extend({
    model: FillingTypeProfile,
    //  We sort items not by profile id, but by the order of profiles
    //  in their respective collection
    comparator(item) {
        const corresponding_profile = this.options.profiles && this.options.profiles.get(item.get('profile_id'));

        return corresponding_profile ? corresponding_profile.get('position') : Infinity;
    },
    getByProfileId(profile_id) {
        return this.findWhere({ profile_id });
    },
    initialize(models, options) {
        this.options = options || {};
    },
});
