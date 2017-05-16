import _ from 'underscore';
import Backbone from 'backbone';

import App from '../../main';
import Schema from '../../schema';
import constants from '../../constants';
import { object } from '../../utils';
import PricingGridCollection from '../collections/inline/pricing-grid-collection';
import PricingEquationParamsCollection from '../collections/inline/pricing-equation-params-collection';

const PRICING_SCHEME_NONE = constants.PRICING_SCHEME_NONE;
const PRICING_SCHEME_PRICING_GRIDS = constants.PRICING_SCHEME_PRICING_GRIDS;
const PRICING_SCHEME_LINEAR_EQUATION = constants.PRICING_SCHEME_LINEAR_EQUATION;

const POSSIBLE_PRICING_SCHEMES = [
    PRICING_SCHEME_PRICING_GRIDS,
    PRICING_SCHEME_LINEAR_EQUATION,
];
const UNIT_TYPES = ['Window', 'Patio Door', 'Entry Door'];
const DEFAULT_UNIT_TYPE = 'Window';
const TYPES_WITH_POSSIBLE_THRESHOLD = ['Patio Door', 'Entry Door'];
const TYPES_WITH_EDITABLE_THRESHOLD = ['Patio Door'];
const TYPES_WITH_ALWAYS_LOW_THRESHOLD = ['Entry Door'];
const TYPES_WITH_POSSIBLE_SOLID_PANEL = ['Patio Door', 'Entry Door'];
const TYPES_WITH_POSSIBLE_FLUSH_PANEL = ['Entry Door', 'Window'];
const TYPES_WITH_OUTSIDE_HANDLE = ['Patio Door', 'Entry Door'];

//  Profile sizes are set in millimeters
const PROFILE_PROPERTIES = [
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'unit_type', title: 'Type', type: 'string' },
    { name: 'system', title: 'System', type: 'string' },
    { name: 'supplier_system', title: 'Supplier System', type: 'string' },
    { name: 'frame_width', title: 'Frame Width (mm)', type: 'number' },
    { name: 'mullion_width', title: 'Mullion Width (mm)', type: 'number' },
    { name: 'sash_frame_width', title: 'Sash Frame Width (mm)', type: 'number' },
    { name: 'sash_frame_overlap', title: 'Sash-Frame Overlap (mm)', type: 'number' },
    { name: 'sash_mullion_overlap', title: 'Sash-Mullion Overlap (mm)', type: 'number' },
    { name: 'frame_corners', title: 'Frame Corners', type: 'string' },
    { name: 'sash_corners', title: 'Sash Corners', type: 'string' },
    { name: 'threshold_width', title: 'Threshold Height (mm)', type: 'number' },
    { name: 'low_threshold', title: 'Low Threshold', type: 'boolean' },
    { name: 'frame_u_value', title: 'Frame U Value', type: 'number' },
    { name: 'spacer_thermal_bridge_value', title: 'Spacer Thermal Bridge Value', type: 'number' },
    { name: 'position', title: 'Position', type: 'number' },
    { name: 'depth', title: 'Depth (mm)', type: 'number' },
    { name: 'weight_per_length', title: 'Weight per Length (kg/m)', type: 'number' },
    { name: 'clear_width_deduction', title: 'Clear Width Deduction (mm)', type: 'number' },
    { name: 'pricing_scheme', title: 'Pricing Scheme', type: 'string' },
    { name: 'pricing_grids', title: 'Pricing Grids', type: 'collection:PricingGridCollection' },
    {
        name: 'pricing_equation_params',
        title: 'Pricing Equation Params',
        type: 'collection:PricingEquationParamsCollection',
    },
];

export default Backbone.Model.extend({
    schema: Schema.createSchema(PROFILE_PROPERTIES),
    defaults() {
        const defaults = {};

        _.each(PROFILE_PROPERTIES, (item) => {
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
        };

        const name_value_hash = {
            unit_type: DEFAULT_UNIT_TYPE,
            low_threshold: false,
            threshold_width: 20,
            pricing_scheme: this.getPossiblePricingSchemes()[0],
            pricing_grids: new PricingGridCollection(null, { append_default_grids: true }),
            pricing_equation_params: new PricingEquationParamsCollection(null, { append_default_sets: true }),
        };

        if (App.settings) {
            name_value_hash.system = App.settings.getSystems()[0];
            name_value_hash.supplier_system = App.settings.getSupplierSystems()[0];
            name_value_hash.frame_corners = App.settings.getFrameCornerTypes()[0];
            name_value_hash.sash_corners = App.settings.getSashCornerTypes()[0];
        }

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
            current_options.attrs = { profile: model.toJSON() };
        }

        return Backbone.sync.call(this, method, model, current_options);
    },
    parse(data) {
        const profile_data = data && data.profile ? data.profile : data;
        const parsed_data = Schema.parseAccordingToSchema(profile_data, this.schema);

        //  We append default pricing grids if we aren't able to recignize
        //  source string as object
        if (parsed_data && parsed_data.pricing_grids) {
            parsed_data.pricing_grids = new PricingGridCollection(
                object.extractObjectOrNull(parsed_data.pricing_grids),
                {
                    parse: true,
                    append_default_grids: true,
                },
            );
        }

        if (parsed_data && parsed_data.pricing_equation_params) {
            parsed_data.pricing_equation_params = new PricingEquationParamsCollection(
                object.extractObjectOrNull(parsed_data.pricing_equation_params),
                {
                    parse: true,
                    append_default_sets: true,
                },
            );
        }

        return parsed_data;
    },
    toJSON(...args) {
        const properties_to_omit = ['id'];
        const json = Backbone.Model.prototype.toJSON.apply(this, args);

        json.pricing_grids = JSON.stringify(this.get('pricing_grids').toJSON());
        json.pricing_equation_params = JSON.stringify(this.get('pricing_equation_params').toJSON());

        return _.omit(json, properties_to_omit);
    },
    validate(attributes) {
        let error_obj = null;
        const collection_names = this.collection && _.map(this.collection.without(this), item => item.get('name'));

        //  We want to have unique profile names across the collection
        if (collection_names && _.contains(collection_names, attributes.name)) {
            return {
                attribute_name: 'name',
                error_message: `Profile name "${attributes.name}" is already used in this collection`,
            };
        }

        //  Don't allow profile names that consist of numbers only ("123")
        if (attributes.name && parseInt(attributes.name, 10).toString() === attributes.name) {
            return {
                attribute_name: 'name',
                error_message: 'Profile name can\'t consist of only numbers',
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
                const property_source = _.findWhere(PROFILE_PROPERTIES, { name: key });
                const type = property_source ? property_source.type : undefined;

                if (key === 'pricing_grids') {
                    if (value !== JSON.stringify(this.getDefaultValue('pricing_grids').toJSON())) {
                        has_only_defaults = false;
                    }
                } else if (key === 'pricing_equation_params') {
                    if (value !== JSON.stringify(this.getDefaultValue('pricing_equation_params').toJSON())) {
                        has_only_defaults = false;
                    }
                } else if (this.getDefaultValue(key, type) !== value) {
                    has_only_defaults = false;
                }
            }
        });

        return has_only_defaults;
    },
    isThresholdPossible() {
        return _.indexOf(TYPES_WITH_POSSIBLE_THRESHOLD, this.get('unit_type')) !== -1;
    },
    isThresholdEditable() {
        return _.indexOf(TYPES_WITH_EDITABLE_THRESHOLD, this.get('unit_type')) !== -1;
    },
    hasAlwaysLowThreshold() {
        return _.indexOf(TYPES_WITH_ALWAYS_LOW_THRESHOLD, this.get('unit_type')) !== -1;
    },
    isSolidPanelPossible() {
        return _.indexOf(TYPES_WITH_POSSIBLE_SOLID_PANEL, this.get('unit_type')) !== -1;
    },
    isFlushPanelPossible() {
        return _.indexOf(TYPES_WITH_POSSIBLE_FLUSH_PANEL, this.get('unit_type')) !== -1;
    },
    hasOutsideHandle() {
        return _.indexOf(TYPES_WITH_OUTSIDE_HANDLE, this.get('unit_type')) !== -1;
    },
    isEntryDoor() {
        return this.get('unit_type') === 'Entry Door';
    },
    getThresholdType() {
        let threshold_type = '(None)';

        if (this.isThresholdPossible()) {
            if (this.get('low_threshold') === true) {
                threshold_type = 'Low';
            } else {
                threshold_type = 'Standard';
            }
        }

        return threshold_type;
    },
    //  This is to set unit_type and low_threshold at once, because under
    //  certain conditions low_threshold value depends on unit_type
    setUnitType(new_type) {
        const data_to_persist = {
            unit_type: new_type,
        };

        if (!_.contains(TYPES_WITH_POSSIBLE_THRESHOLD, new_type)) {
            data_to_persist.low_threshold = false;
        } else if (_.contains(TYPES_WITH_ALWAYS_LOW_THRESHOLD, new_type)) {
            data_to_persist.low_threshold = true;
        }

        this.persist(data_to_persist);
    },
    //  Return { name: 'name', title: 'Title' } pairs for each item in
    //  `names` array. If the array is empty, return all possible pairs
    getNameTitleTypeHash(names) {
        const selected_names = names || _.pluck(PROFILE_PROPERTIES, 'name');
        const name_title_hash = [];

        _.each(PROFILE_PROPERTIES, (item) => {
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
    getUnitTypes() {
        return UNIT_TYPES;
    },
    getPossiblePricingSchemes() {
        return POSSIBLE_PRICING_SCHEMES;
    },
    getVisibleFrameWidthFixed() {
        return this.get('frame_width');
    },
    getVisibleFrameWidthOperable() {
        return (parseFloat(this.get('frame_width')) + parseFloat(this.get('sash_frame_width'))) -
            parseFloat(this.get('sash_frame_overlap'));
    },
    getPricingData() {
        const pricing_data = {
            scheme: PRICING_SCHEME_NONE,
        };

        if (this.get('pricing_scheme') === PRICING_SCHEME_PRICING_GRIDS) {
            pricing_data.scheme = PRICING_SCHEME_PRICING_GRIDS;
            pricing_data.pricing_grids = this.get('pricing_grids');
        } else if (this.get('pricing_scheme') === PRICING_SCHEME_LINEAR_EQUATION) {
            pricing_data.scheme = PRICING_SCHEME_LINEAR_EQUATION;
            pricing_data.pricing_equation_params = this.get('pricing_equation_params');
        }

        return pricing_data;
    },
    initialize(attributes, options) {
        this.options = options || {};

        //  Save pricing grids on grid item change
        this.listenTo(this.get('pricing_grids'), 'change update', (changed_object) => {
            this.trigger('change:pricing_grids change', changed_object);
            this.persist('pricing_grids', this.get('pricing_grids'));
        });

        //  Save pricing_equation_params on param change
        this.listenTo(this.get('pricing_equation_params'), 'change update', (changed_object) => {
            this.trigger('change:pricing_equation_params change', changed_object);
            this.persist('pricing_equation_params', this.get('pricing_equation_params'));
        });
    },
});
