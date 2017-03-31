import _ from 'underscore';
import Backbone from 'backbone';
import Schema from '../../schema';
import AccessoryCollection from '../collections/accessory-collection';
import UnitCollection from '../collections/unit-collection';

var QUOTE_PROPERTIES = [
    {name: 'name', title: 'Name', type: 'string'},
    {name: 'is_default', title: 'Is Default', type: 'boolean'},
    {name: 'date', title: 'Quote Date', type: 'string'},
    {name: 'revision', title: 'Quote Revision', type: 'number'},
    {name: 'position', title: 'Position', type: 'number'}
];

export default Backbone.Model.extend({
    schema: Schema.createSchema(QUOTE_PROPERTIES),
    defaults: function () {
        var defaults = {};

        _.each(QUOTE_PROPERTIES, function (item) {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        }, this);

        return defaults;
    },
    getDefaultValue: function (name, type) {
        var default_value = '';

        var type_value_hash = {
            number: 0
        };

        var name_value_hash = {
            revision: 1,
            is_default: false
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    getNameAttribute: function () {
        return 'name';
    },
    getAttributeType: function (attribute_name) {
        var name_title_hash = this.getNameTitleTypeHash();
        var target_attribute = _.findWhere(name_title_hash, {name: attribute_name});

        return target_attribute ? target_attribute.type : undefined;
    },
    sync: function (method, model, options) {
        if (method === 'create' || method === 'update') {
            options.attrs = {quote: model.toJSON()};
        }

        return Backbone.sync.call(this, method, model, options);
    },
    parse: function (data) {
        var quote_data = data && data.quote ? data.quote : data;
        var filtered_data = Schema.parseAccordingToSchema(quote_data, this.schema);

        if (quote_data && quote_data.accessories) {
            filtered_data.accessories = quote_data.accessories;
        }

        if (quote_data && quote_data.units) {
            filtered_data.units = quote_data.units;
        }

        return filtered_data;
    },
    toJSON: function () {
        var properties_to_omit = ['id', 'is_default'];
        var json = Backbone.Model.prototype.toJSON.apply(this, arguments);

        return _.omit(json, properties_to_omit);
    },
    hasOnlyDefaultAttributes: function () {
        var has_only_defaults = true;

        _.each(this.toJSON(), function (value, key) {
            if (key !== 'position' && has_only_defaults) {
                var property_source = _.findWhere(QUOTE_PROPERTIES, {name: key});
                var type = property_source ? property_source.type : undefined;

                if (this.getDefaultValue(key, type) !== value) {
                    has_only_defaults = false;
                }
            }
        }, this);

        return has_only_defaults;
    },
    //  Return { name: 'name', title: 'Title' } pairs for each item in
    //  `names` array. If the array is empty, return all possible pairs
    getNameTitleTypeHash: function (names) {
        var name_title_hash = [];

        if (!names) {
            names = _.pluck(QUOTE_PROPERTIES, 'name');
        }

        _.each(QUOTE_PROPERTIES, function (item) {
            if (_.indexOf(names, item.name) !== -1) {
                name_title_hash.push({name: item.name, title: item.title, type: item.type});
            }
        });

        return name_title_hash;
    },
    getTitles: function (names) {
        var name_title_hash = this.getNameTitleTypeHash(names);

        return _.pluck(name_title_hash, 'title');
    },
    getParentProject: function () {
        return this.collection && this.collection.options.project;
    },
    getQuoteNumber: function () {
        var parent_project = this.getParentProject();
        var quote_number = '--';

        if (parent_project && !parent_project.isNew()) {
            quote_number = parent_project.id;

            if (!this.get('is_default') && this.get('name')) {
                quote_number += ' - ' + this.get('name');
            }
        }

        return quote_number;
    },
    getSubtotalUnitsPrice: function () {
        return this.units.getSubtotalPriceDiscounted();
    },
    getExtrasPrice: function () {
        return this.extras.getRegularItemsPrice();
    },
    //  This is what we use as tax base. Subtotal price for units + extras,
    //  but no shipping or optional extras
    getSubtotalPrice: function () {
        var subtotal_units_price = this.getSubtotalUnitsPrice();
        var extras_price = this.extras.getRegularItemsPrice();

        return subtotal_units_price + extras_price;
    },
    getTax: function () {
        var total_tax_percent = this.extras.getTotalTaxPercent();
        var subtotal = this.getSubtotalPrice();
        var tax = (total_tax_percent / 100) * subtotal;

        return tax;
    },
    getGrandTotal: function () {
        var subtotal = this.getSubtotalPrice();
        var shipping_price = this.extras.getShippingPrice();
        var tax = this.getTax();

        var grand_total = subtotal + shipping_price + tax;

        return grand_total;
    },
    getSubtotalCost: function () {
        var subtotal_units_cost = this.units.getSubtotalCostDiscounted();
        var extras_cost = this.extras.getRegularItemsCost();

        return subtotal_units_cost + extras_cost;
    },
    getTotalCost: function () {
        var subtotal_units_cost = this.units.getSubtotalCostDiscounted();
        var extras_cost = this.extras.getRegularItemsCost();
        var shipping = this.extras.getShippingPrice();
        var hidden = this.extras.getHiddenPrice();
        var tax = this.getTax();

        return subtotal_units_cost + extras_cost + shipping + hidden + tax;
    },
    getProfit: function () {
        return {
            gross_profit: this.getSubtotalPrice() - this.getSubtotalCost(),
            net_profit: this.getGrandTotal() - this.getTotalCost()
        };
    },
    getTotalPrices: function () {
        var subtotal_units_price = this.getSubtotalUnitsPrice();
        var extras_price = this.getExtrasPrice();
        var optional_extras_price = this.extras.getOptionalItemsPrice();

        var shipping_price = this.extras.getShippingPrice();
        var total_tax_percent = this.extras.getTotalTaxPercent();

        var subtotal = this.getSubtotalPrice();
        var tax = this.getTax();
        var grand_total = this.getGrandTotal();

        var total_cost = this.getTotalCost();
        var profit = this.getProfit();
        var net_profit_percent = grand_total ? profit.net_profit / grand_total * 100 : 0;

        //  TODO: this value should be customizable, not just 50% always,
        //  when it'll be customizable, it should also be tested. Maybe it
        //  could be a special type of accessory? Or just a quote attr?
        var deposit_percent = 50;
        var deposit_on_contract = (deposit_percent / 100) * grand_total;
        var balance_due_at_delivery = grand_total - deposit_on_contract;

        return {
            subtotal_units: subtotal_units_price,
            subtotal_extras: extras_price,
            subtotal_optional_extras: optional_extras_price,
            subtotal: subtotal,
            tax_percent: total_tax_percent,
            tax: tax,
            shipping: shipping_price,
            grand_total: grand_total,
            total_cost: total_cost,
            gross_profit: profit.gross_profit,
            net_profit: profit.net_profit,
            net_profit_percent: net_profit_percent,
            deposit_percent: deposit_percent,
            deposit_on_contract: deposit_on_contract,
            balance_due_at_delivery: balance_due_at_delivery
        };
    },
    getName: function () {
        return this.get('is_default') ? 'Default Quote' : this.get('name');
    },
    preparePricingDataForExport: function (options) {
        var units_data = this.units.invoke('preparePricingDataForExport', options);

        return units_data;
    },
    setDependencies: function () {
        var changed_flag = false;

        if (this.get('units')) {
            this.units.set(this.get('units'), {parse: true});
            this.unset('units', {silent: true});
            changed_flag = true;
        }

        if (this.get('accessories')) {
            this.extras.set(this.get('accessories'), {parse: true});
            this.extras.trigger('loaded');
            this.unset('accessories', {silent: true});
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
    validate: function (attributes, options) {
        var error_obj = null;

        //  Simple type validation for numbers and booleans
        _.find(attributes, function (value, key) {
            var attribute_obj = this.getNameTitleTypeHash([key]);

            attribute_obj = attribute_obj.length === 1 ? attribute_obj[0] : null;

            if (attribute_obj && attribute_obj.type === 'number' &&
                (!_.isNumber(value) || _.isNaN(value))
            ) {
                error_obj = {
                    attribute_name: key,
                    error_message: attribute_obj.title + ' can\'t be set to "' + value + '", it should be a number'
                };

                return false;
            } else if (attribute_obj && attribute_obj.type === 'boolean' && !_.isBoolean(value)) {
                error_obj = {
                    attribute_name: key,
                    error_message: attribute_obj.title + ' can\'t be set to "' + value + '", it should be a boolean'
                };

                return false;
            }
        }, this);

        if (options.validate && error_obj) {
            return error_obj;
        }
    },
    initialize: function (attributes, options) {
        this.options = options || {};
        //  Was it fully loaded already? This means it was fetched and all
        //  dependencies (units etc.) were processed correctly. This flag
        //  could be used to tell if it's good to render any views
        this._wasLoaded = false;

        if (!this.options.proxy) {
            this.units = new UnitCollection(null, {
                quote: this,
                project: this.collection && this.collection.options.project
            });
            this.extras = new AccessoryCollection(null, {
                quote: this,
                project: this.collection && this.collection.options.project
            });

            this.on('sync', this.setDependencies, this);
            this.on('set_active', this.setDependencies, this);

            if (this.collection && this.collection.options.project) {
                this.listenTo(this.collection.options.project, 'fully_loaded', this.setDependencies);
            }
        }
    }
});
