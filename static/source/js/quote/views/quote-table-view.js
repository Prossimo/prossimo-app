var app = app || {};

(function () {
    'use strict';

    app.QuoteTableView = Marionette.CompositeView.extend({
        template: app.templates['quote/quote-table-view'],
        childView: app.QuoteItemView,
        childViewContainer: '.quote-table-body',
        childViewOptions: function () {
            return {
                extras: this.options.extras
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
            var subtotal_price = this.collection.getSubtotalPriceDiscounted();
            var hidden_price = this.options.extras ? this.options.extras.getHiddenPrice() : 0;
            var shipping_price = this.options.extras ? this.options.extras.getShippingPrice() : 0;

            return {
                subtotal: f.price_usd(subtotal_price + hidden_price),
                shipping: f.price_usd(shipping_price),
                total: f.price_usd(subtotal_price + hidden_price + shipping_price)
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
