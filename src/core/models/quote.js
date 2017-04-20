import _ from 'underscore';
import Backbone from 'backbone';

import Schema from '../../schema';
import AccessoryCollection from '../collections/accessory-collection';
import UnitCollection from '../collections/unit-collection';

const QUOTE_PROPERTIES = [
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'is_default', title: 'Is Default', type: 'boolean' },
    { name: 'date', title: 'Quote Date', type: 'string' },
    { name: 'revision', title: 'Quote Revision', type: 'number' },
    { name: 'position', title: 'Position', type: 'number' },
];

export default Backbone.Model.extend({
    schema: Schema.createSchema(QUOTE_PROPERTIES),
    defaults() {
        const defaults = {};

        _.each(QUOTE_PROPERTIES, function (item) {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        }, this);

        return defaults;
    },
    getDefaultValue(name, type) {
        let default_value = '';

        const type_value_hash = {
            number: 0,
        };

        const name_value_hash = {
            revision: 1,
            is_default: false,
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    getNameAttribute() {
        return 'name';
    },
    getAttributeType(attribute_name) {
        const name_title_hash = this.getNameTitleTypeHash();
        const target_attribute = _.findWhere(name_title_hash, { name: attribute_name });

        return target_attribute ? target_attribute.type : undefined;
    },
    sync(method, model, options) {
        if (method === 'create' || method === 'update') {
            options.attrs = { quote: model.toJSON() };
        }

        return Backbone.sync.call(this, method, model, options);
    },
    parse(data) {
        const quote_data = data && data.quote ? data.quote : data;
        const filtered_data = Schema.parseAccordingToSchema(quote_data, this.schema);

        if (quote_data && quote_data.accessories) {
            filtered_data.accessories = quote_data.accessories;
        }

        if (quote_data && quote_data.units) {
            filtered_data.units = quote_data.units;
        }

        return filtered_data;
    },
    toJSON(...args) {
        const properties_to_omit = ['id', 'is_default'];
        const json = Backbone.Model.prototype.toJSON.apply(this, args);

        return _.omit(json, properties_to_omit);
    },
    hasOnlyDefaultAttributes() {
        let has_only_defaults = true;

        _.each(this.toJSON(), function (value, key) {
            if (key !== 'position' && has_only_defaults) {
                const property_source = _.findWhere(QUOTE_PROPERTIES, { name: key });
                const type = property_source ? property_source.type : undefined;

                if (this.getDefaultValue(key, type) !== value) {
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
            names = _.pluck(QUOTE_PROPERTIES, 'name');
        }

        _.each(QUOTE_PROPERTIES, (item) => {
            if (_.indexOf(names, item.name) !== -1) {
                name_title_hash.push({ name: item.name, title: item.title, type: item.type });
            }
        });

        return name_title_hash;
    },
    getTitles(names) {
        const name_title_hash = this.getNameTitleTypeHash(names);

        return _.pluck(name_title_hash, 'title');
    },
    getParentProject() {
        return this.collection && this.collection.options.project;
    },
    getQuoteNumber() {
        const parent_project = this.getParentProject();
        let quote_number = '--';

        if (parent_project && !parent_project.isNew()) {
            quote_number = parent_project.id;

            if (!this.get('is_default') && this.get('name')) {
                quote_number += ` - ${this.get('name')}`;
            }
        }

        return quote_number;
    },
    getSubtotalUnitsPrice() {
        return this.units.getSubtotalPriceDiscounted();
    },
    getExtrasPrice() {
        return this.extras.getRegularItemsPrice();
    },
    //  This is what we use as tax base. Subtotal price for units + extras,
    //  but no shipping or optional extras
    getSubtotalPrice() {
        const subtotal_units_price = this.getSubtotalUnitsPrice();
        const extras_price = this.extras.getRegularItemsPrice();

        return subtotal_units_price + extras_price;
    },
    getTax() {
        const total_tax_percent = this.extras.getTotalTaxPercent();
        const subtotal = this.getSubtotalPrice();
        const tax = (total_tax_percent / 100) * subtotal;

        return tax;
    },
    getGrandTotal() {
        const subtotal = this.getSubtotalPrice();
        const shipping_price = this.extras.getShippingPrice();
        const tax = this.getTax();

        const grand_total = subtotal + shipping_price + tax;

        return grand_total;
    },
    getSubtotalCost() {
        const subtotal_units_cost = this.units.getSubtotalCostDiscounted();
        const extras_cost = this.extras.getRegularItemsCost();

        return subtotal_units_cost + extras_cost;
    },
    getTotalCost() {
        const subtotal_units_cost = this.units.getSubtotalCostDiscounted();
        const extras_cost = this.extras.getRegularItemsCost();
        const shipping = this.extras.getShippingPrice();
        const hidden = this.extras.getHiddenPrice();
        const tax = this.getTax();

        return subtotal_units_cost + extras_cost + shipping + hidden + tax;
    },
    getProfit() {
        return {
            gross_profit: this.getSubtotalPrice() - this.getSubtotalCost(),
            net_profit: this.getGrandTotal() - this.getTotalCost(),
        };
    },
    getTotalPrices() {
        const subtotal_units_price = this.getSubtotalUnitsPrice();
        const extras_price = this.getExtrasPrice();
        const optional_extras_price = this.extras.getOptionalItemsPrice();

        const shipping_price = this.extras.getShippingPrice();
        const total_tax_percent = this.extras.getTotalTaxPercent();

        const subtotal = this.getSubtotalPrice();
        const tax = this.getTax();
        const grand_total = this.getGrandTotal();

        const total_cost = this.getTotalCost();
        const profit = this.getProfit();
        const net_profit_percent = grand_total ? (profit.net_profit / grand_total) * 100 : 0;

        //  TODO: this value should be customizable, not just 50% always,
        //  when it'll be customizable, it should also be tested. Maybe it
        //  could be a special type of accessory? Or just a quote attr?
        const deposit_percent = 50;
        const deposit_on_contract = (deposit_percent / 100) * grand_total;
        const balance_due_at_delivery = grand_total - deposit_on_contract;

        return {
            subtotal_units: subtotal_units_price,
            subtotal_extras: extras_price,
            subtotal_optional_extras: optional_extras_price,
            subtotal,
            tax_percent: total_tax_percent,
            tax,
            shipping: shipping_price,
            grand_total,
            total_cost,
            gross_profit: profit.gross_profit,
            net_profit: profit.net_profit,
            net_profit_percent,
            deposit_percent,
            deposit_on_contract,
            balance_due_at_delivery,
        };
    },
    getName() {
        return this.get('is_default') ? 'Default Quote' : this.get('name');
    },
    preparePricingDataForExport(options) {
        const units_data = this.units.invoke('preparePricingDataForExport', options);

        return units_data;
    },
    setDependencies() {
        let changed_flag = false;

        if (this.get('units')) {
            this.units.set(this.get('units'), { parse: true });
            this.unset('units', { silent: true });
            changed_flag = true;
        }

        if (this.get('accessories')) {
            this.extras.set(this.get('accessories'), { parse: true });
            this.extras.trigger('loaded');
            this.unset('accessories', { silent: true });
            changed_flag = true;
        }

        if (changed_flag) {
            this.trigger('set_dependencies');
        }

        if (!this._wasLoaded) {
            this._wasLoaded = true;
            this.trigger('fully_loaded');
        }
    },
    validate(attributes, options) {
        let error_obj = null;

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
    initialize(attributes, options) {
        this.options = options || {};
        //  Was it fully loaded already? This means it was fetched and all
        //  dependencies (units etc.) were processed correctly. This flag
        //  could be used to tell if it's good to render any views
        this._wasLoaded = false;

        if (!this.options.proxy) {
            this.units = new UnitCollection(null, {
                quote: this,
                project: this.collection && this.collection.options.project,
            });
            this.extras = new AccessoryCollection(null, {
                quote: this,
                project: this.collection && this.collection.options.project,
            });

            this.on('sync', this.setDependencies, this);
            this.on('set_active', this.setDependencies, this);

            if (this.collection && this.collection.options.project) {
                this.listenTo(this.collection.options.project, 'fully_loaded', this.setDependencies);
            }
        }
    },
});
