import Backbone from 'backbone';
import _ from 'underscore';

import Schema from '../../schema';
import { object } from '../../utils';
import DictionaryEntryProfileCollection from '../collections/inline/dictionary-entry-to-profile-collection';

const UNSET_VALUE = '--';

const ENTRY_PROPERTIES = [
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'supplier_name', title: 'Supplier Name', type: 'string' },
    { name: 'data', title: 'Additional Data', type: 'string' },
    { name: 'position', title: 'Position', type: 'number' },
    { name: 'dictionary_entry_profiles', title: 'Profiles', type: 'collection:DictionaryEntryProfileCollection' },
];

function getDefaultEntryData() {
    return _.clone({});
}

export default Backbone.Model.extend({
    schema: Schema.createSchema(ENTRY_PROPERTIES),
    defaults() {
        const defaults = {};

        _.each(ENTRY_PROPERTIES, function (item) {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        }, this);

        return defaults;
    },
    getNameAttribute() {
        return 'name';
    },
    getDefaultValue(name, type) {
        let default_value = '';

        const type_value_hash = {
            number: 0,
        };

        const name_value_hash = {
            data: getDefaultEntryData(),
            dictionary_entry_profiles: new DictionaryEntryProfileCollection(null, {
                parent_entry: this,
            }),
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    sync(method, model, options) {
        if (method === 'create' || method === 'update') {
            options.attrs = { entry: model.toJSON() };
        }

        return Backbone.sync.call(this, method, model, options);
    },
    parse(data) {
        const entry_data = data && data.entry ? data.entry : data;
        const parsed_data = Schema.parseAccordingToSchema(entry_data, this.schema);

        if (parsed_data && parsed_data.dictionary_entry_profiles) {
            parsed_data.dictionary_entry_profiles = new DictionaryEntryProfileCollection(
                object.extractObjectOrNull(parsed_data.dictionary_entry_profiles),
                {
                    parent_entry: this,
                    parse: true,
                },
            );
        }

        if (parsed_data && parsed_data.data) {
            parsed_data.data = object.extractObjectOrNull(parsed_data.data) || this.getDefaultValue('data');
        }

        return parsed_data;
    },
    toJSON() {
        const properties_to_omit = ['id'];
        const json = Backbone.Model.prototype.toJSON.apply(this, arguments);

        json.dictionary_entry_profiles = this.get('dictionary_entry_profiles').toJSON();
        json.data = _.isString(json.data) ? json.data : JSON.stringify(json.data);

        return _.omit(json, properties_to_omit);
    },
    validate(attributes, options) {
        let error_obj = null;
        const collection_names = this.collection && _.map(this.collection.without(this), item => item.get('name'));

        //  We want to have unique option names across the collection
        if (options.validate && collection_names &&
            _.contains(collection_names, attributes.name)
        ) {
            return {
                attribute_name: 'name',
                error_message: `Entry name "${attributes.name}" is already used in this collection`,
            };
        }

        //  Don't allow option names that consist of numbers only ("123")
        if (options.validate && attributes.name &&
            parseInt(attributes.name, 10).toString() === attributes.name
        ) {
            return {
                attribute_name: 'name',
                error_message: 'Entry name can\'t consist of only numbers',
            };
        }

        //  Don't allow option names that is similar to UNSET_VALUE
        if (options.validate && attributes.name && UNSET_VALUE === attributes.name) {
            return {
                attribute_name: 'name',
                error_message: `Entry name can't be set to ${UNSET_VALUE}`,
            };
        }

        //  Simple type validation for numbers and booleans
        _.find(attributes, function (value, key) {
            let attribute_obj = this.getNameTitleTypeHash([key]);

            attribute_obj = attribute_obj.length === 1 ? attribute_obj[0] : null;

            if (attribute_obj && attribute_obj.type === 'number' &&
                (!_.isNumber(value) || _.isNaN(value))
            ) {
                error_obj = {
                    attribute_name: key,
                    error_message: `${attribute_obj.title} can't be set to "${value}", it should be a number`,
                };

                return false;
            } else if (attribute_obj && attribute_obj.type === 'boolean' && !_.isBoolean(value)) {
                error_obj = {
                    attribute_name: key,
                    error_message: `${attribute_obj.title} can't be set to "${value}", it should be a boolean`,
                };

                return false;
            }
        }, this);

        if (options.validate && error_obj) {
            return error_obj;
        }
    },
    hasOnlyDefaultAttributes() {
        let has_only_defaults = true;

        _.each(this.toJSON(), function (value, key) {
            if (key !== 'position' && has_only_defaults) {
                const property_source = _.findWhere(ENTRY_PROPERTIES, { name: key });
                const type = property_source ? property_source.type : undefined;

                if (key === 'data') {
                    if (value !== JSON.stringify(this.getDefaultValue('data'))) {
                        has_only_defaults = false;
                    }
                } else if (key === 'dictionary_entry_profiles') {
                    if (value.length !== 0) {
                        has_only_defaults = false;
                    }
                } else if (this.getDefaultValue(key, type) !== value) {
                    has_only_defaults = false;
                }
            }
        }, this);

        return has_only_defaults;
    },
    //  Return { name: 'name', title: 'Title' } pairs for each item in
    //  `names` array. If the array is empty, return all possible pairs
    getNameTitleTypeHash(names) {
        const name_title_hash = [];

        if (!names) {
            names = _.pluck(ENTRY_PROPERTIES, 'name');
        }

        _.each(ENTRY_PROPERTIES, (item) => {
            if (_.indexOf(names, item.name) !== -1) {
                name_title_hash.push({ name: item.name, title: item.title, type: item.type });
            }
        });

        return name_title_hash;
    },
    getAttributeType(attribute_name) {
        const name_title_hash = this.getNameTitleTypeHash();
        const target_attribute = _.findWhere(name_title_hash, { name: attribute_name });

        return target_attribute ? target_attribute.type : undefined;
    },
    getTitles(names) {
        const name_title_hash = this.getNameTitleTypeHash(names);

        return _.pluck(name_title_hash, 'title');
    },
    isAvailableForProfile(profile_id) {
        return this.get('dictionary_entry_profiles') &&
            _.contains(this.get('dictionary_entry_profiles').pluck('profile_id'), profile_id);
    },
    isDefaultForProfile(profile_id) {
        let is_default = false;

        if (this.isAvailableForProfile(profile_id)) {
            const connection = this.get('dictionary_entry_profiles').getByProfileId(profile_id);

            is_default = connection.get('is_default') || false;
        }

        return is_default;
    },
    //  TODO: Do we need to validate it against the list of globally
    //  available profiles in the app? Or maybe we do want to validate
    //  them, but not on creation, rather separately, just to indicate
    //  where it's wrong?
    /**
     * Toggle item availability and default status for a certain profile
     *
     * @param {number} profile_id - id of the target profile
     * @param {boolean} make_available - true to make item available,
     * false to make it unavailable for this profile
     * @param {boolean} make_default - true to set as default, false
     * to unset. You can't make item default when it's not available
     */
    setProfileAvailability(profile_id, make_available, make_default) {
        const profiles_list = this.get('dictionary_entry_profiles');
        const connection = profiles_list.getByProfileId(profile_id);

        //  If there is an existing connection that we want to unset
        if (make_available === false && connection) {
            connection.destroy();
        } else if (make_available === true) {
            //  If connection doesn't exist and we want to add it
            if (!connection) {
                profiles_list.add({
                    profile_id,
                    is_default: make_default === true,
                });
            //  If connection exists and we want to just modify is_default
            } else if (make_default === true || make_default === false) {
                connection.set('is_default', make_default);
            }
        }
    },
    //  We assume that profiles list is sorted and deduplicated
    getIdsOfProfilesWhereIsAvailable() {
        return this.get('dictionary_entry_profiles').pluck('profile_id');
    },
    //  We assume that profiles list is sorted and deduplicated
    getIdsOfProfilesWhereIsDefault() {
        return _.map(
            this.get('dictionary_entry_profiles').where({ is_default: true }),
            item => item.get('profile_id'),
        );
    },
    //  It returns a combination of scheme and data to calculate cost
    getPricingDataForProfile(profile_id) {
        let pricing_data = null;

        if (this.isAvailableForProfile(profile_id)) {
            const connection = this.get('dictionary_entry_profiles').getByProfileId(profile_id);

            pricing_data = connection.getPricingData();
        }

        return pricing_data;
    },
    getParentDictionary() {
        return this.collection && this.collection.options.dictionary;
    },
    isParentDictionaryHidden() {
        const dictionary = this.getParentDictionary();

        return dictionary && dictionary.get('is_hidden');
    },
    initialize(attributes, options) {
        this.options = options || {};

        //  Any change to `dictionary_entry_profiles` should be persisted
        this.listenTo(this.get('dictionary_entry_profiles'), 'change update', function () {
            this.persist('dictionary_entry_profiles', this.get('dictionary_entry_profiles'));
        });
    },
});
