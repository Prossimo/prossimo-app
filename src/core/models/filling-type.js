import Backbone from 'backbone';
import _ from 'underscore';

import Schema from '../../schema';
import { object } from '../../utils';
import FillingTypeProfileCollection from '../collections/inline/filling-type-to-profile-collection';

import {
    PRICING_SCHEME_PRICING_GRIDS,
    PRICING_SCHEME_LINEAR_EQUATION,
    UNSET_VALUE,
    FILLING_TYPE_GLASS,
    FILLING_TYPE_RECESSED,
    FILLING_TYPE_INTERIOR_FLUSH_PANEL,
    FILLING_TYPE_EXTERIOR_FLUSH_PANEL,
    FILLING_TYPE_FULL_FLUSH_PANEL,
    FILLING_TYPE_LOUVER,
    FILLING_TYPE_TITLES,
} from '../../constants';

const POSSIBLE_PRICING_SCHEMES = [
    PRICING_SCHEME_PRICING_GRIDS,
    PRICING_SCHEME_LINEAR_EQUATION,
];

// TODO: refactor how this works
const BASE_TYPES = [
    { name: FILLING_TYPE_GLASS, title: FILLING_TYPE_TITLES[FILLING_TYPE_GLASS] },
    { name: FILLING_TYPE_RECESSED, title: FILLING_TYPE_TITLES[FILLING_TYPE_RECESSED] },
    { name: FILLING_TYPE_INTERIOR_FLUSH_PANEL, title: FILLING_TYPE_TITLES[FILLING_TYPE_INTERIOR_FLUSH_PANEL] },
    { name: FILLING_TYPE_EXTERIOR_FLUSH_PANEL, title: FILLING_TYPE_TITLES[FILLING_TYPE_EXTERIOR_FLUSH_PANEL] },
    { name: FILLING_TYPE_FULL_FLUSH_PANEL, title: FILLING_TYPE_TITLES[FILLING_TYPE_FULL_FLUSH_PANEL] },
    { name: FILLING_TYPE_LOUVER, title: FILLING_TYPE_TITLES[FILLING_TYPE_LOUVER] },
];

//  TODO: `type` attribute should be actually called `base_type`, makes
//  more sense that way (but we need to get rid of `is_base_type` concept)
const FILLING_TYPE_PROPERTIES = [
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'supplier_name', title: 'Supplier Name', type: 'string' },
    { name: 'type', title: 'Type', type: 'string' },
    { name: 'is_base_type', title: 'Is Base Type', type: 'boolean' },
    { name: 'weight_per_area', title: 'Weight per Area (kg/m2)', type: 'number' },
    { name: 'position', title: 'Position', type: 'number' },
    { name: 'pricing_scheme', title: 'Pricing Scheme', type: 'string' },
    { name: 'filling_type_profiles', title: 'Profiles', type: 'collection:FillingTypeProfileCollection' },
];

export default Backbone.Model.extend({
    schema: Schema.createSchema(FILLING_TYPE_PROPERTIES),
    defaults() {
        const defaults = {};

        _.each(FILLING_TYPE_PROPERTIES, (item) => {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        });

        return defaults;
    },
    getNameAttribute() {
        return 'name';
    },
    getAttributeType(attribute_name) {
        const name_title_hash = this.getNameTitleTypeHash();
        const target_attribute = _.findWhere(name_title_hash, { name: attribute_name });

        return target_attribute ? target_attribute.type : undefined;
    },
    getDefaultValue(name, type) {
        let default_value = '';

        const type_value_hash = {
            number: 0,
            boolean: false,
        };

        const name_value_hash = {
            type: this.getBaseTypes()[0].name,
            pricing_scheme: this.getPossiblePricingSchemes()[0],
            filling_type_profiles: new FillingTypeProfileCollection(null, {
                parent_filling_type: this,
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
        const current_options = options;

        if (method === 'create' || method === 'update') {
            current_options.attrs = { filling_type: model.toJSON() };
        }

        return Backbone.sync.call(this, method, model, current_options);
    },
    parse(data) {
        const filling_type_data = data && data.filling_type ? data.filling_type : data;
        const parsed_data = Schema.parseAccordingToSchema(filling_type_data, this.schema);

        if (parsed_data && parsed_data.filling_type_profiles) {
            parsed_data.filling_type_profiles = new FillingTypeProfileCollection(
                object.extractObjectOrNull(parsed_data.filling_type_profiles),
                {
                    parent_filling_type: this,
                    parse: true,
                },
            );
        }

        return parsed_data;
    },
    toJSON(...args) {
        const properties_to_omit = ['id', 'is_base_type'];
        const json = Backbone.Model.prototype.toJSON.apply(this, args);

        json.filling_type_profiles = this.get('filling_type_profiles').toJSON();

        return _.omit(json, properties_to_omit);
    },
    validate(attributes) {
        let error_obj = null;
        const collection_names = this.collection && _.map(this.collection.without(this), item => item.get('name'));

        //  We want to have unique filling type names across the collection
        if (collection_names && _.contains(collection_names, attributes.name)) {
            return {
                attribute_name: 'name',
                error_message: `Filling type name "${attributes.name}" is already used in this collection`,
            };
        }

        //  Don't allow filling type names that is similar to UNSET_VALUE
        if (attributes.name && UNSET_VALUE === attributes.name) {
            return {
                attribute_name: 'name',
                error_message: `Filling type name can't be set to ${UNSET_VALUE}`,
            };
        }

        //  Simple type validation for numbers and booleans
        _.find(attributes, (value, key) => {
            let attribute_obj = this.getNameTitleTypeHash([key]);
            let has_validation_error = false;

            attribute_obj = attribute_obj.length === 1 ? attribute_obj[0] : null;

            if (attribute_obj && attribute_obj.type === 'number' &&
                (!_.isNumber(value) || _.isNaN(value))
            ) {
                error_obj = {
                    attribute_name: key,
                    error_message: `${attribute_obj.title} can't be set to "${value}", it should be a number`,
                };

                has_validation_error = true;
            } else if (attribute_obj && attribute_obj.type === 'boolean' && !_.isBoolean(value)) {
                error_obj = {
                    attribute_name: key,
                    error_message: `${attribute_obj.title} can't be set to "${value}", it should be a boolean`,
                };

                has_validation_error = true;
            }

            return has_validation_error;
        });

        return error_obj;
    },
    hasOnlyDefaultAttributes() {
        let has_only_defaults = true;

        _.each(this.toJSON(), (value, key) => {
            if (key !== 'position' && has_only_defaults) {
                const property_source = _.findWhere(FILLING_TYPE_PROPERTIES, { name: key });
                const type = property_source ? property_source.type : undefined;

                //  This might not be super accurate, but should work
                if (key === 'filling_type_profiles') {
                    if (value.length !== 0) {
                        has_only_defaults = false;
                    }
                } else if (this.getDefaultValue(key, type) !== value) {
                    has_only_defaults = false;
                }
            }
        });

        return has_only_defaults;
    },
    //  Return { name: 'name', title: 'Title', type: 'type' } objects for
    //  each item in `names`. If `names` is empty, return everything
    getNameTitleTypeHash(names) {
        const selected_names = names || _.pluck(FILLING_TYPE_PROPERTIES, 'name');
        const name_title_hash = [];

        _.each(FILLING_TYPE_PROPERTIES, (item) => {
            if (_.indexOf(selected_names, item.name) !== -1) {
                name_title_hash.push({ name: item.name, title: item.title, type: item.type });
            }
        });

        return name_title_hash;
    },
    getTitles(names) {
        const name_title_hash = this.getNameTitleTypeHash(names);

        return _.pluck(name_title_hash, 'title');
    },
    getBaseTypes() {
        return BASE_TYPES;
    },
    getBaseTypeTitle() {
        return _.findWhere(this.getBaseTypes(), { name: this.get('type') }).title || '';
    },
    getPossiblePricingSchemes() {
        return POSSIBLE_PRICING_SCHEMES;
    },
    isAvailableForProfile(profile_id) {
        return this.get('is_base_type') === true ||
            (this.get('filling_type_profiles') && _.contains(this.get('filling_type_profiles').pluck('profile_id'), profile_id));
    },
    isDefaultForProfile(profile_id) {
        let is_default = false;

        if (!this.get('is_base_type') && this.isAvailableForProfile(profile_id)) {
            const connection = this.get('filling_type_profiles').getByProfileId(profile_id);

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
        const profiles_list = this.get('filling_type_profiles');
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
        return this.get('filling_type_profiles').pluck('profile_id');
    },
    //  We assume that profiles list is sorted and deduplicated
    getIdsOfProfilesWhereIsDefault() {
        return _.map(
            this.get('filling_type_profiles').where({ is_default: true }),
            item => item.get('profile_id'),
        );
    },
    //  It returns a combination of scheme and data to calculate price
    getPricingDataForProfile(profile_id) {
        let pricing_data = null;

        if (this.isAvailableForProfile(profile_id)) {
            const connection = this.get('filling_type_profiles').getByProfileId(profile_id);

            pricing_data = (connection && connection.getPricingData()) || null;
        }

        return pricing_data;
    },
    initialize(attributes, options) {
        this.options = options || {};

        //  Any change to `filling_type_profiles` should be persisted
        this.listenTo(this.get('filling_type_profiles'), 'change update', () => {
            this.persist('filling_type_profiles', this.get('filling_type_profiles'));
        });
    },
});
