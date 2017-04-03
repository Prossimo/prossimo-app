import _ from 'underscore';
import Backbone from 'backbone';

import FillingType from '../models/filling-type';

export default Backbone.Collection.extend({
    model: FillingType,
    reorder_property_name: 'filling_types',
    url: function () {
        return (this.options.api_base_path ? this.options.api_base_path : '') + '/fillingtypes';
    },
    reorder_url: function () {
        return (this.options.api_base_path ? this.options.api_base_path : '') + '/reorder_fillingtypes';
    },
    parse: function (data) {
        return data.filling_types || data;
    },
    getMaxPosition: function () {
        var filtered = _.map(this.filter(function (model) {
            return model.get('is_base_type') === false;
        }), function (model) {
            return model.get('position');
        });
        var max = _.max(filtered, null, this);

        return max > 0 ? max : 0;
    },
    comparator: function (item) {
        var no_positions_state_flag = item.collection.length > 0 && item.collection.getMaxPosition() === 0;
        var is_base_type_flag = item.get('is_base_type');

        return is_base_type_flag ? 9999 :
            (no_positions_state_flag ? item.id : item.get('position'));
    },
    getBaseTypes: function () {
        return this.proxy_type.getBaseTypes();
    },
    appendBaseTypes: function () {
        var base_types = [];

        _.each(this.getBaseTypes(), function (item) {
            base_types.push(new FillingType({
                name: item.title,
                type: item.name,
                weight_per_area: item.weight_per_area,
                is_base_type: true,
                no_backend: true
            }));
        }, this);

        this.add(base_types, {silent: true});
    },
    getNameTitleTypeHash: function (names) {
        return this.proxy_type.getNameTitleTypeHash(names);
    },
    getTitles: function (names) {
        return this.proxy_type.getTitles(names);
    },
    //  TODO: why this works by cid? probably because we have base types
    //  we need to rework this to use ids when we get rid of base types.
    //  Also, there is a get() actually available on collections natively
    getById: function (cid) {
        return this.get(cid);
    },
    getByName: function (name) {
        return this.findWhere({name: name});
    },
    //  TODO:  remove , thisis used only once
    getNames: function () {
        return this.models.map(function (item) {
            return item.get('name');
        });
    },
    //  TODO: weshould add a flag to indicate whetherwe want to// put thedefault item to the topspot in the returned list
    getAvailableForProfile: function (profile_id) {
        return this.models.filter(function (item) {
            return item.isAvailableForProfile(profile_id);
        }, this);
    },
    getDefaultForProfile: function (profile_id) {
        var available_items = this.getAvailableForProfile(profile_id);

        var default_item = _.find(available_items, function (item) {
            return item.isDefaultForProfile(profile_id);
        });

        return default_item || undefined;
    },
    getDefaultOrFirstAvailableForProfile: function (profile_id) {
        var available_items = this.getAvailableForProfile(profile_id);

        var default_item = _.find(available_items, function (item) {
            return item.isDefaultForProfile(profile_id);
        });

        return default_item || ( available_items.length ? available_items[0] : undefined );
    },
    //  We collect an array of ids for all profiles that are connected to
    //  at least one item in our collection
    getIdsOfAllConnectedProfiles: function () {
        var arrays = this.map(function (item) {
            return item.getIdsOfProfilesWhereIsAvailable();
        });

        return _.uniq(_.flatten(arrays, true).sort(function (a, b) {
            return a - b;
        }), true);
    },
    //  We go over all profiles and make sure we only have one default
    //  filling type per profile. If not, the first one wins.
    //  This is executed on collection load.
    //  TODO: this might have a different name (to distinguish from
    //  validation which is a slightly different concept)
    validatePerProfileDefaults: function () {
        var profiles = this.getIdsOfAllConnectedProfiles();

        _.each(profiles, function (profile_id) {
            var all_items = this.getAvailableForProfile(profile_id);
            var default_item = this.getDefaultForProfile(profile_id);
            var non_default_items = _.without(all_items, default_item);

            //  Iterate over non default items and make sure they're
            //  set as non default. If all's fine, no requests are fired
            if (default_item && non_default_items) {
                _.each(non_default_items, function (item) {
                    item.setProfileAvailability(profile_id, true, false);
                }, this);
            }
        }, this);
    },
    setItemAvailabilityForProfile: function (profile_id, target_item, new_value) {
        if (!this.get(target_item)) {
            throw new Error('Cannot set item availability: target item does not belong to this collection ');
        }

        target_item.setProfileAvailability(profile_id, new_value);
    },
    //  new_item could either point to an item within collection, or be an
    //  undefined value, in which case we want to unset the default value
    //  foragiven profile
    setItemAsDefaultForProfile: function (profile_id, new_item) {
        var old_item = this.getDefaultForProfile(profile_id);

        if (new_item) {
            if (!this.get(new_item)) {
                throw new Error(
                    'Cannot set item as default for profile: target item does not belong to this collection'
                );
            }

            //  Set new_itemas available and default for profile_id
            new_item.setProfileAvailability(profile_id, true, true);
        }

        if (old_item) {
            //  Set old_item as available but not default for profile_id
            old_item.setProfileAvailability(profile_id, true, false);
        }
    },
    initialize: function (models, options) {
        this.options = options || {};
        this.proxy_type = new FillingType(null, {proxy: true});

        if (this.options.append_base_types) {
            this.appendBaseTypes();
        }
    }
});
