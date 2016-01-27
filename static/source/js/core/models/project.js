var app = app || {};

(function () {
    'use strict';

    var PROJECT_PROPERTIES = [
        { name: 'pipedrive_id', title: 'Pipedrive ID', type: 'string' },
        { name: 'client_name', title: 'Client Name', type: 'string' },
        { name: 'client_company_name', title: 'Company', type: 'string' },
        { name: 'client_phone', title: 'Phone', type: 'string' },
        { name: 'client_email', title: 'Email', type: 'string' },
        { name: 'client_address', title: 'Client Address', type: 'string' },
        { name: 'project_name', title: 'Project Name', type: 'string' },
        { name: 'project_address', title: 'Project Address', type: 'string' },
        { name: 'quote_date', title: 'Quote Date', type: 'string' },
        { name: 'quote_revision', title: 'Quote Revision', type: 'number' }
    ];

    app.Project = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(PROJECT_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            var type_value_hash = {
                number: 0,
                pipedrive_id: null
            };

            var name_value_hash = {
                quote_revision: 1
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        sync: function (method, model, options) {
            if ( method === 'update' ) {
                options.attrs = { project: _.omit(model.toJSON(), ['id']) };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        initialize: function (attributes, options) {
            this.options = options || {};

            if ( !this.options.proxy ) {
                this.units = new app.UnitCollection(null, { project: this });
                this.extras = new app.AccessoryCollection(null, { project: this });
                this.files = new app.ProjectFileCollection(null, { project: this });

                if ( this.get('units') ) {
                    this.units.set(this.get('units'));
                    this.unset('units', { silent: true });
                }

                if ( this.get('accessories') ) {
                    this.extras.set(this.get('accessories'));
                    this.extras.trigger('loaded');
                    this.unset('accessories', { silent: true });
                }

                if ( this.get('files') ) {
                    this.files.set(this.get('files'));
                    this.unset('files', { silent: true });
                }
            }
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( PROJECT_PROPERTIES, 'name' );
            }

            _.each(PROJECT_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_hash.push({ name: item.name, title: item.title, type: item.type });
                }
            });

            return name_title_hash;
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        },
        getQuoteNumber: function () {
            return this.isNew() ? '--' : this.id;
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
        getTotalCost: function () {
            var subtotal_units_cost = this.units.getSubtotalCostDiscounted();
            var extras_cost = this.extras.getRegularItemsCost();
            var shipping = this.extras.getShippingPrice();
            var hidden = this.extras.getHiddenPrice();
            var tax = this.getTax();

            return subtotal_units_cost + extras_cost + shipping + hidden + tax;
        },
        getProfit: function () {
            return this.getGrandTotal() - this.getTotalCost();
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

            //  TODO: this value should be customizable, not just 50% always,
            //  when it'll be customizable, it should also be tested
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
                profit: profit,
                deposit_percent: deposit_percent,
                deposit_on_contract: deposit_on_contract,
                balance_due_at_delivery: balance_due_at_delivery
            };
        }
    });
})();
