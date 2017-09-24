import _ from 'underscore';
import Backbone from 'backbone';

import Schema from '../../schema';

const EXTRAS_TYPES = ['Regular', 'Shipping', 'Optional', 'Optional, %', 'Hidden', 'Tax'];
const DEFAULT_EXTRAS_TYPE = 'Regular';
const PERCENT_BASED_EXTRAS_TYPES = ['Optional, %', 'Tax'];
const OPTIONAL_EXTRAS_TYPES = ['Optional', 'Optional, %'];

const ACCESSORY_PROPERTIES = [
    { name: 'description', title: 'Description', type: 'string' },
    { name: 'quantity', title: 'Quantity', type: 'number' },
    { name: 'extras_type', title: 'Extras type', type: 'string' },

    { name: 'original_cost', title: 'Original Cost', type: 'number' },
    { name: 'original_currency', title: 'Original Currency', type: 'string' },
    { name: 'conversion_rate', title: 'Conversion Rate', type: 'number' },
    { name: 'price_markup', title: 'Markup', type: 'number' },
    { name: 'discount', title: 'Discount', type: 'number' },

    { name: 'position', title: 'Position', type: 'number' },
];

export default Backbone.Model.extend({
    schema: Schema.createSchema(ACCESSORY_PROPERTIES),
    defaults() {
        const defaults = {};

        _.each(ACCESSORY_PROPERTIES, (item) => {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        });

        return defaults;
    },
    initialize(attributes, options) {
        this.options = options || {};

        if (!this.options.proxy) {
            this.data_store = this.options.data_store || (this.collection && this.collection.options.data_store);
        }
    },
    getNameAttribute() {
        return 'description';
    },
    getDefaultValue(name, type) {
        let default_value = '';

        const type_value_hash = {
            number: 0,
        };

        const name_value_hash = {
            original_currency: 'USD',
            conversion_rate: 1,
            extras_type: DEFAULT_EXTRAS_TYPE,
            price_markup: 1,
            quantity: 1,
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
            current_options.attrs = { accessory: model.toJSON() };
        }

        return Backbone.sync.call(this, method, model, current_options);
    },
    toJSON(...args) {
        const properties_to_omit = ['id'];
        const json = Backbone.Model.prototype.toJSON.apply(this, args);

        return _.omit(json, properties_to_omit);
    },
    parse(data) {
        const accessory_data = data && data.accessory ? data.accessory : data;

        return Schema.parseAccordingToSchema(accessory_data, this.schema);
    },
    //  If validation is successful, return null, otherwise return error
    validate(attributes) {
        let error_obj = null;

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
                const property_source = _.findWhere(ACCESSORY_PROPERTIES, { name: key });
                const type = property_source ? property_source.type : undefined;

                if (this.getDefaultValue(key, type) !== value) {
                    has_only_defaults = false;
                }
            }
        });

        return has_only_defaults;
    },
    //  Return { name: 'name', title: 'Title' } pairs for each item in
    //  `names` array. If the array is empty, return all possible pairs
    getNameTitleTypeHash(names) {
        const selected_names = names || _.pluck(ACCESSORY_PROPERTIES, 'name');
        const name_title_hash = [];

        _.each(ACCESSORY_PROPERTIES, (item) => {
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
    getExtrasTypes() {
        return EXTRAS_TYPES;
    },
    isPercentBasedType() {
        return _.indexOf(PERCENT_BASED_EXTRAS_TYPES, this.get('extras_type')) !== -1;
    },
    isRegularType() {
        return this.get('extras_type') === 'Regular';
    },
    isOptionalType() {
        return _.indexOf(OPTIONAL_EXTRAS_TYPES, this.get('extras_type')) !== -1;
    },
    getMarkupPercent() {
        return (parseFloat(this.get('price_markup')) - 1) * 100;
    },
    getUnitCost() {
        return parseFloat(this.get('original_cost')) / parseFloat(this.get('conversion_rate'));
    },
    getSubtotalCost() {
        return this.getUnitCost() * parseFloat(this.get('quantity'));
    },
    getUnitPrice() {
        return this.getUnitCost() * parseFloat(this.get('price_markup'));
    },
    //  Get subtotal price for the extras item. For regular or optional
    //  extras it's just unit price * quantity
    getSubtotalPrice() {
        const current_quote = this.data_store && this.data_store.current_quote;
        let subtotal_price = this.getUnitPrice() * parseFloat(this.get('quantity'));

        if (current_quote) {
            //  If this is percent-based optional extras, base is Unit Subtotal
            if (this.isPercentBasedType() && this.isOptionalType()) {
                subtotal_price = (this.getMarkupPercent() / 100) * current_quote.getSubtotalUnitsPrice();
            //  If this is tax, base is everything except shipping
            } else if (this.isPercentBasedType()) {
                subtotal_price = (this.getMarkupPercent() / 100) * current_quote.getSubtotalPrice();
            }
        }

        return subtotal_price;
    },
    getUnitPriceDiscounted() {
        return (this.getUnitPrice() * (100 - this.get('discount'))) / 100;
    },
    getSubtotalPriceDiscounted() {
        return (this.getSubtotalPrice() * (100 - this.get('discount'))) / 100;
    },
    getSubtotalProfit() {
        let profit = 0;

        if (this.isRegularType()) {
            profit = this.getSubtotalPriceDiscounted() - this.getSubtotalCost();
        }

        return profit;
    },
});
