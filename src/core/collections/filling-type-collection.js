import _ from 'underscore';
import Backbone from 'backbone';
import App from '../../main';
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
    getTypeTitle: function (name) {
        return this.findWhere({name: name}).get('title') || this.proxy_type.getBaseTypeTitle(name);
    },
    //  TODO: why this works by cid? probably because we have base types
    getFillingTypeById: function (cid) {
        return this.get(cid);
    },
    //  TODO: rename to `getByName`
    getFillingTypeByName: function (name) {
        return this.findWhere({name: name});
    },
    //  TODO: rename? remove completely?
    getAvailableFillingTypes: function () {
        return this.models;
    },
    //  TODO: rename to `getNames` or smth similar
    getAvailableFillingTypeNames: function () {
        return this.models.map(function (item) {
            return item.get('name');
        });
    },
    //  TODO: should we allow to put default item at the top?
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
    //  We go over all profiles and make sure we only have one default
    //  filling type per profile. If not, the first one wins.
    //  This is executed on collection load
    validatePerProfileDefaults: function () {
        var profiles = App.settings && App.settings.profiles;

        profiles.each(function (profile) {
            var profile_id = profile.id;
            var all_items = this.getAvailableForProfile(profile_id);
            var default_item = this.getDefaultForProfile(profile_id);
            var non_default_items = _.filter(all_items, function (item) {
                return item !== default_item;
            }, this);

            //  Iterate over non default items and make sure they're
            //  set as non fefault. If all's fine, no requests are fired
            if (all_items && default_item && non_default_items) {
                _.each(non_default_items, function (item) {
                    var item_profiles = item.get('profiles');
                    var connection = _.findWhere(item_profiles, {id: profile_id});

                    if (connection && connection.is_default === true) {
                        connection.is_default = false;
                        item.persist('profiles', item_profiles);
                    }
                }, this);
            }
        }, this);
    },
    setItemAvailabilityForProfile: function (profile_id, target_item, new_value) {
        if (!this.get(target_item)) {
            throw new Error('Cannot set item availability: target item does not belong to this collection ');
        }

        var old_profiles_list = target_item.get('profiles');
        var new_profiles_list;

        if (new_value === true || new_value === 'true') {
            var profile_to_add = {
                id: profile_id,
                is_default: false
            };
            new_profiles_list = _.union(old_profiles_list, [profile_to_add]);
            new_profiles_list.sort(function (a, b) {
                return a.id - b.id;
            });
        } else if (new_value === false || new_value === 'false') {
            var profile_to_remove = _.findWhere(old_profiles_list, {id: profile_id});
            new_profiles_list = _.without(old_profiles_list, profile_to_remove);
            new_profiles_list.sort(function (a, b) {
                return a.id - b.id;
            });
        }

        if (old_profiles_list !== new_profiles_list) {
            target_item.persist('profiles', new_profiles_list);
        }
    },
    setItemAsDefaultForProfile: function (profile_id, new_item, old_item) {
        //  We want to make profile default for a new item
        if (new_item) {
            if (!this.get(new_item)) {
                throw new Error(
                    'Cannot set item as default for profile: target item does not belong to this collection'
                );
            }

            var new_item_profiles = new_item.get('profiles');
            var profile_to_set = _.findWhere(new_item_profiles, {id: profile_id});

            if (profile_to_set && profile_to_set.is_default === false) {
                profile_to_set.is_default = true;
                new_item.persist('profiles', new_item_profiles);
            }
        }

        //  And we also want to make sure this profile is not default
        //  anymore for an old item
        if (old_item) {
            if (!this.get(old_item)) {
                throw new Error(
                    'Cannot unset item as default for profile: target item does not belong to this collection'
                );
            }

            var old_item_profiles = old_item.get('profiles');
            var profile_to_unset = _.findWhere(old_item_profiles, {id: profile_id});

            if (profile_to_unset && profile_to_unset.is_default === true) {
                profile_to_unset.is_default = false;
                old_item.persist('profiles', old_item_profiles);
            }
        }
    },
    initialize: function (models, options) {
        this.options = options || {};
        this.proxy_type = new FillingType(null, {proxy: true});
        this.appendBaseTypes();
    }
});
