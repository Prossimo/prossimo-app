var app = app || {};

(function () {
    'use strict';

    app.QuoteExtrasTableView = Marionette.CompositeView.extend({
        template: app.templates['quote/quote-extras-table-view'],
        childView: app.QuoteExtrasItemView,
        childViewContainer: '.quote-extras-table-body',
        initialize: function () {
            this.listenTo(this.collection, 'all', this.render);
        },
        getExtrasTableAttributes: function () {
            var name_title_hash = {
                ref: 'Ref.',
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
            // var shipping_price = Math.ceil(Math.random() * 30) * 100;
            var subtotal_price = 0;
            var shipping_price = 0;

            this.collection.each(function (item) {
                subtotal_price += item.getSubtotalPrice();
            });

            return {
                subtotal: f.price_usd(subtotal_price),
                // shipping: f.price_usd(shipping_price),
                total: f.price_usd(subtotal_price + shipping_price)
            };
        },
        serializeData: function () {
            return {
                table_attributes: this.getExtrasTableAttributes(),
                footer_colspan: this.getExtrasTableAttributes().length - 1,
                total_prices: this.getTotalPrices()
            };
        }
    });
})();
