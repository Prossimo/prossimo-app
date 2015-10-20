var app = app || {};

(function () {
    'use strict';

    app.QuoteTableView = Marionette.CompositeView.extend({
        template: app.templates['quote/quote-table-view'],
        childView: app.QuoteItemView,
        childViewContainer: 'tbody',
        initialize: function () {
            this.listenTo(this.collection, 'all', this.render);
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
            var unit_price = Math.ceil(Math.random() * 10) * 100;
            var shipping_price = Math.ceil(Math.random() * 30) * 100;
            var total_quantity = 0;

            this.collection.each(function (item) {
                total_quantity += parseInt(item.get('quantity'), 10);
            });

            return {
                subtotal: unit_price * total_quantity,
                shipping: shipping_price,
                total: unit_price * total_quantity + shipping_price
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
