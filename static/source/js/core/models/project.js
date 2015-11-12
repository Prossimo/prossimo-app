var app = app || {};

(function () {
    'use strict';

    app.Project = Backbone.Model.extend({
        defaults: {
            pipedrive_id: null,
            client_name: '',
            client_company_name: '',
            client_phone: '',
            client_email: '',
            client_address: '',
            project_name: '',
            project_address: ''
        },
        initialize: function () {
            this.units = new app.UnitCollection();
            this.extras = new app.AccessoryCollection();
            this.project_files = [];
        },
        getHiddenMultiplier: function () {
            var subtotal_units_price = this.units.getSubtotalPriceDiscounted();
            var hidden_price = this.extras.getHiddenPrice();

            return subtotal_units_price ? ( 1 + hidden_price / subtotal_units_price ) : 1;
        },
        getTotalPrices: function () {
            var subtotal_units_price = this.units.getSubtotalPriceDiscounted();
            var extras_price = this.extras.getRegularItemsPrice();
            var optional_extras_price = this.extras.getOptionalItemsPrice();

            var hidden_price = this.extras.getHiddenPrice();
            var shipping_price = this.extras.getShippingPrice();
            var tax_percent = this.extras.getTaxPercent();

            var subtotal_units_with_hidden = subtotal_units_price + hidden_price;
            var subtotal = subtotal_units_with_hidden + extras_price;
            var tax = (tax_percent / 100) * subtotal;
            var grand_total = subtotal + shipping_price + tax;

            return {
                subtotal_units: subtotal_units_price,
                subtotal_units_with_hidden: subtotal_units_with_hidden,
                subtotal_extras: extras_price,
                subtotal_optional_extras: optional_extras_price,
                subtotal: subtotal,
                tax_percent: tax_percent,
                tax: tax,
                shipping: shipping_price,
                grand_total: grand_total
            };
        }
    });
})();
