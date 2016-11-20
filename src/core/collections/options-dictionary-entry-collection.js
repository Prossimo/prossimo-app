import Backbone from '../../backbone-extended';
import _ from 'underscore';

import OptionsDictionaryEntry from '../models/options-dictionary-entry';

export default Backbone.Collection.extend({
    model: OptionsDictionaryEntry,
    reorder_property_name: 'entries',
    url: function () {
        return App.settings.get('api_base_path') + '/dictionaries/' +
            this.options.dictionary.get('id') + '/entries';
    },
    reorder_url: function () {
        return App.settings.get('api_base_path') + '/dictionaries/' +
            this.options.dictionary.get('id') + '/reorder_entries';
    },
    parse: function (data) {
        //  We do this check to avoid confusion with native JS
        //  Array.prototype.etries() method
        return !_.isArray(data) && data.entries ? data.entries : data;
    },
    getNameTitleTypeHash: function (names) {
        return this.proxy_entry.getNameTitleTypeHash(names);
    },
    getTitles: function (names) {
        return this.proxy_entry.getTitles(names);
    },
    getAttributeType: function () {
        return this.proxy_entry.getAttributeType();
    },
    getAvailableForProfile: function (profile_id) {
        return this.models.filter(function (entry) {
            return entry.isAvailableForProfile(profile_id);
        }, this);
    },
    getDefaultForProfile: function (profile_id) {
        var available_entries = this.getAvailableForProfile(profile_id);

        var default_entry = _.find(available_entries, function (entry) {
            return entry.isDefaultForProfile(profile_id);
        });

        return default_entry || undefined;
    },
    //  We go over all profiles and make sure we only have one default
    //  entry per profile per each dictionary. If not, the first one wins
    validateDefaultEntries: function () {
        var profiles = App.settings && App.settings.profiles;

        profiles.each(function (profile) {
            var profile_id = profile.id;
            var all_entries = this.getAvailableForProfile(profile_id);
            var default_entry = this.getDefaultForProfile(profile_id);
            var non_default_entries = _.filter(all_entries, function (entry) {
                return entry !== default_entry;
            }, this);

            //  Iterate over non default entries and make sure they're
            //  set as non fefault. If all's fine, no requests are fired
            if (all_entries && default_entry && non_default_entries) {
                _.each(non_default_entries, function (entry) {
                    var entry_profiles = entry.get('profiles');
                    var connection = _.findWhere(entry_profiles, {id: profile_id});

                    if (connection.is_default === true) {
                        connection.is_default = false;
                        entry.persist('profiles', entry_profiles);
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
        this.proxy_entry = new OptionsDictionaryEntry(null, {proxy: true});

        //  When parent dictionary is fully loaded, we validate positions
        this.listenTo(this.options.dictionary, 'fully_loaded', this.validatePositions);
        this.listenTo(this.options.dictionary, 'fully_loaded', this.validateDefaultEntries);
    }
});
