import Backbone from 'backbone';
import _ from 'underscore';

import OptionsDictionary from '../models/options-dictionary';

export default Backbone.Collection.extend({
    model: OptionsDictionary,
    reorder_property_name: 'dictionaries',
    url() {
        return `${this.options.api_base_path ? this.options.api_base_path : ''}/dictionaries`;
    },
    reorder_url() {
        return `${this.options.api_base_path ? this.options.api_base_path : ''}/reorder_dictionaries`;
    },
    parse(data) {
        return data.dictionaries || data;
    },
    initialize(models, options) {
        this.options = options || {};
        this.proxy_dictionary = new OptionsDictionary(null, { proxy: true });
    },
    getNameTitleTypeHash(names) {
        return this.proxy_dictionary.getNameTitleTypeHash(names);
    },
    getTitles(names) {
        return this.proxy_dictionary.getTitles(names);
    },
    getAttributeType() {
        return this.proxy_dictionary.getAttributeType();
    },
    getAvailableOptions(dictionary_id, profile_id, put_default_first) {
        const target_dictionary = this.get(dictionary_id);
        let available_options = [];
        let default_option;

        put_default_first = put_default_first || false;

        if (target_dictionary) {
            available_options = target_dictionary.entries.getAvailableForProfile(profile_id);
            default_option = target_dictionary.entries.getDefaultForProfile(profile_id);
        }

        //  Union merges arrays and removes duplicates
        if (put_default_first && default_option && available_options.length > 1) {
            available_options = _.union([default_option], available_options);
        }

        return available_options;
    },
    getDefaultOption(dictionary_id, profile_id) {
        const target_dictionary = this.get(dictionary_id);
        let default_option;

        if (target_dictionary) {
            default_option = target_dictionary.entries.getDefaultForProfile(profile_id);
        }

        return default_option || undefined;
    },
    getFirstAvailableOption(dictionary_id, profile_id) {
        const available_options = this.getAvailableOptions(dictionary_id, profile_id);

        return available_options.length ? available_options[0] : undefined;
    },
    //  This function use a composition of two functions above
    getDefaultOrFirstAvailableOption(dictionary_id, profile_id) {
        let target_option = this.getDefaultOption(dictionary_id, profile_id);

        if (!target_option) {
            target_option = this.getFirstAvailableOption(dictionary_id, profile_id);
        }

        return target_option;
    },
    //  TODO: Why do we need this? This should not be public. We might have
    //  getByName function, but we need to return the whole thing, not just id
    getDictionaryIdByName(name) {
        const target_dictionary = this.findWhere({ name });

        return target_dictionary ? target_dictionary.id : undefined;
    },
    //  TODO: we probably want to return item, not an id (getEntryByName)
    getDictionaryEntryIdByName(dictionary_id, name) {
        const target_dictionary = this.get(dictionary_id);

        if (!target_dictionary) {
            throw new Error(`No dictionary with id=${dictionary_id}`);
        }

        const target_entry = target_dictionary.entries.findWhere({ name });

        return target_entry ? target_entry.id : undefined;
    },
    //  TODO: this is not really needed, should be removed everywhere
    getAvailableDictionaryNames() {
        return this.pluck('name');
    },
});
