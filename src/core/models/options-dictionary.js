import Backbone from 'backbone';
import _ from 'underscore';

import Schema from '../../schema';
import { object } from '../../utils';
import constants from '../../constants';
import OptionsDictionaryEntryCollection from '../collections/options-dictionary-entry-collection';

const PRICING_SCHEME_NONE = constants.PRICING_SCHEME_NONE;
const PRICING_SCHEME_PRICING_GRIDS = constants.PRICING_SCHEME_PRICING_GRIDS;
const PRICING_SCHEME_PER_ITEM = constants.PRICING_SCHEME_PER_ITEM;
const PRICING_SCHEME_LINEAR_EQUATION = constants.PRICING_SCHEME_LINEAR_EQUATION;

//  TODO: should `rules_and_restrctions` here be an array? or inline model?
const DICTIONARY_PROPERTIES = [
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'rules_and_restrictions', title: 'Rules and Restrictions', type: 'string' },
    { name: 'pricing_scheme', title: 'Pricing Scheme', type: 'string' },
    { name: 'is_hidden', title: 'Is Hidden', type: 'boolean' },
    { name: 'position', title: 'Position', type: 'number' },
];

const POSSIBLE_RULES_AND_RESTRICTIONS = [
    'DOOR_ONLY', 'OPERABLE_ONLY', 'GLAZING_BARS_ONLY', 'IS_OPTIONAL',
];

const POSSIBLE_PRICING_SCHEMES = [
    PRICING_SCHEME_NONE,
    PRICING_SCHEME_PRICING_GRIDS,
    PRICING_SCHEME_PER_ITEM,
    PRICING_SCHEME_LINEAR_EQUATION,
];

function getDefaultRulesAndRestrictions() {
    return [];
}

export default Backbone.Model.extend({
    schema: Schema.createSchema(DICTIONARY_PROPERTIES),
    defaults() {
        const defaults = {};

        _.each(DICTIONARY_PROPERTIES, function (item) {
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
            boolean: false,
        };

        const name_value_hash = {
            rules_and_restrictions: getDefaultRulesAndRestrictions(),
            pricing_scheme: this.getPossiblePricingSchemes()[0],
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    parse(data) {
        const dictionary_data = data && data.dictionary ? data.dictionary : data;
        const filtered_data = Schema.parseAccordingToSchema(dictionary_data, this.schema);

        //  Entries are not part of the schema, so they were filtered out,
        //  but we want them back
        if (dictionary_data && dictionary_data.entries) {
            filtered_data.entries = dictionary_data.entries;
        }

        if (filtered_data && filtered_data.rules_and_restrictions) {
            filtered_data.rules_and_restrictions =
                object.extractObjectOrNull(filtered_data.rules_and_restrictions) ||
                this.getDefaultValue('rules_and_restrictions');
        }

        return filtered_data;
    },
    sync(method, model, options) {
        if (method === 'create' || method === 'update') {
            options.attrs = { dictionary: model.toJSON() };
        }

        return Backbone.sync.call(this, method, model, options);
    },
    toJSON() {
        const properties_to_omit = ['id', 'entries'];
        const json = Backbone.Model.prototype.toJSON.apply(this, arguments);

        json.rules_and_restrictions = JSON.stringify(json.rules_and_restrictions);

        return _.omit(json, properties_to_omit);
    },
    validate(attributes, options) {
        let error_obj = null;
        const collection_names = this.collection && _.map(this.collection.without(this), item => item.get('name'));

        //  We want to have unique dictionary names across the collection
        if (options.validate && collection_names &&
            _.contains(collection_names, attributes.name)
        ) {
            return {
                attribute_name: 'name',
                error_message: `Dictionary name "${attributes.name}" is already used in this collection`,
            };
        }

        //  Don't allow dictionary names that consist of numbers only ("123")
        if (options.validate && attributes.name &&
            parseInt(attributes.name, 10).toString() === attributes.name
        ) {
            return {
                attribute_name: 'name',
                error_message: 'Dictionary name can\'t consist of only numbers',
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
                const property_source = _.findWhere(DICTIONARY_PROPERTIES, { name: key });
                const type = property_source ? property_source.type : undefined;

                if (key === 'rules_and_restrictions') {
                    if (JSON.stringify(value) !==
                        JSON.stringify(this.getDefaultValue('rules_and_restrictions'))
                    ) {
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
            names = _.pluck(DICTIONARY_PROPERTIES, 'name');
        }

        _.each(DICTIONARY_PROPERTIES, (item) => {
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
    getPossibleRulesAndRestrictions() {
        return POSSIBLE_RULES_AND_RESTRICTIONS;
    },
    getPossiblePricingSchemes() {
        return POSSIBLE_PRICING_SCHEMES;
    },
    hasQuantity() {
        return this.get('pricing_scheme') === PRICING_SCHEME_PER_ITEM;
    },
    initialize(attributes, options) {
        this.options = options || {};

        if (!this.options.proxy) {
            this.entries = new OptionsDictionaryEntryCollection(this.get('entries'), {
                parse: true,
                dictionary: this,
            });
            this.unset('entries', { silent: true });
            this.entries.trigger('fully_loaded');

            this.listenTo(this.entries, 'change', function (e) {
                this.trigger('entries_change', e);
            });
        }
    },
});
