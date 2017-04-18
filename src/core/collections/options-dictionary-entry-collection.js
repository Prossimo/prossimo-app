import Backbone from 'backbone';
import _ from 'underscore';

import App from '../../main';
import OptionsDictionaryEntry from '../models/options-dictionary-entry';

export default Backbone.Collection.extend({
    model: OptionsDictionaryEntry,
    reorder_property_name: 'entries',
    url() {
        return `${App.settings.get('api_base_path')}/dictionaries/${
            this.options.dictionary.get('id')}/entries`;
    },
    reorder_url() {
        return `${App.settings.get('api_base_path')}/dictionaries/${
            this.options.dictionary.get('id')}/reorder_entries`;
    },
    parse(data) {
        //  We do this check to avoid confusion with native JS
        //  Array.prototype.etries() method
        return !_.isArray(data) && data.entries ? data.entries : data;
    },
    getNameTitleTypeHash(names) {
        return this.proxy_entry.getNameTitleTypeHash(names);
    },
    getTitles(names) {
        return this.proxy_entry.getTitles(names);
    },
    getAttributeType() {
        return this.proxy_entry.getAttributeType();
    },
    getByName(name) {
        return this.findWhere({ name });
    },
    getAvailableForProfile(profile_id) {
        return this.models.filter(entry => entry.isAvailableForProfile(profile_id), this);
    },
    getDefaultForProfile(profile_id) {
        const available_entries = this.getAvailableForProfile(profile_id);
        const default_entry = _.find(available_entries, entry => entry.isDefaultForProfile(profile_id));

        return default_entry || undefined;
    },
    getDefaultOrFirstAvailableForProfile(profile_id) {
        const available_items = this.getAvailableForProfile(profile_id);
        const default_item = _.find(available_items, item => item.isDefaultForProfile(profile_id));

        return default_item || (available_items.length ? available_items[0] : undefined);
    },
    //  We collect an array of ids for all profiles that are connected to
    //  at least one item in our collection
    getIdsOfAllConnectedProfiles() {
        const arrays = this.map(item => item.getIdsOfProfilesWhereIsAvailable());

        return _.uniq(_.flatten(arrays, true).sort((a, b) => a - b), true);
    },
    //  We go over all profiles and make sure we only have one default
    //  entry per profile per each dictionary. If not, the first one wins.
    //  This is executed on collection load.
    //  TODO: this might have a different name (to distinguish from
    //  validation which is a slightly different concept)
    validatePerProfileDefaults() {
        const profiles = this.getIdsOfAllConnectedProfiles();

        _.each(profiles, function (profile_id) {
            const all_items = this.getAvailableForProfile(profile_id);
            const default_item = this.getDefaultForProfile(profile_id);
            const non_default_items = _.without(all_items, default_item);

            //  Iterate over non default items and make sure they're
            //  set as non default. If all's fine, no requests are fired
            if (default_item && non_default_items) {
                _.each(non_default_items, (item) => {
                    item.setProfileAvailability(profile_id, true, false);
                }, this);
            }
        }, this);
    },
    setItemAvailabilityForProfile(profile_id, target_item, new_value) {
        if (!this.get(target_item)) {
            throw new Error('Cannot set item availability: target item does not belong to this collection');
        }

        target_item.setProfileAvailability(profile_id, new_value);
    },
    setItemAsDefaultForProfile(profile_id, new_item) {
        const old_item = this.getDefaultForProfile(profile_id);

        if (new_item) {
            if (!this.get(new_item)) {
                throw new Error(
                    'Cannot set item as default for profile: target item does not belong to this collection',
                );
            }

            //  Set new_item as available and default for profile_id
            new_item.setProfileAvailability(profile_id, true, true);
        }

        if (old_item) {
            //  Set old_item as available but not default for profile_id
            old_item.setProfileAvailability(profile_id, true, false);
        }
    },
    initialize(models, options) {
        this.options = options || {};
        this.proxy_entry = new OptionsDictionaryEntry(null, { proxy: true });

        this.once('fully_loaded', function () {
            this.validatePositions();
            this.validatePerProfileDefaults();
        }, this);
    },
});
