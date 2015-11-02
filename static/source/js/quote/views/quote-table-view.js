var app = app || {};

(function () {
    'use strict';

    app.QuoteTableView = Marionette.CompositeView.extend({
        template: app.templates['quote/quote-table-view'],
        childView: app.QuoteItemView,
        childViewContainer: '.quote-table-body',
        childViewOptions: function () {
            return {
                extras: this.options.extras,
                project: this.options.project
            };
        },
        initialize: function () {
            this.listenTo(this.collection, 'all', this.render);
            this.listenTo(this.options.extras, 'all', this.render);
        },
        getQuoteTableAttributes: function () {
            var name_title_hash = {
                ref: 'Ref.',
                product_image: 'Product Image',
                product_description: 'Product Description',
                quantity: 'Quantity',
                price: 'Price'
            };

            var table_attributes = _.map(name_title_hash, function (item, key) {
                return { name: key, title: item };
            }, this);

            return table_attributes;
        },
        getTotalPrices: function () {
            var f = app.utils.format;
            var total_prices = this.options.project.getTotalPrices();

            return {
                subtotal_units: f.price_usd(total_prices.subtotal_units),
                subtotal_units_with_hidden: f.price_usd(total_prices.subtotal_units_with_hidden),
                subtotal_extras: f.price_usd(total_prices.subtotal_extras),
                subtotal: f.price_usd(total_prices.subtotal),
                shipping: f.price_usd(total_prices.shipping),
                grand_total: f.price_usd(total_prices.grand_total)
            };
        },
        serializeData: function () {
            return {
                table_attributes: this.getQuoteTableAttributes(),
                footer_colspan: this.getQuoteTableAttributes().length - 1,
                total_prices: this.getTotalPrices()
            };
        }
    });
})();
