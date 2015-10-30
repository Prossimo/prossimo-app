var app = app || {};

(function () {
    'use strict';

    app.QuoteExtrasItemView = Marionette.ItemView.extend({
        tagName: 'tr',
        className: 'quote-extras-item',
        template: app.templates['quote/quote-extras-item-view'],
        getPrices: function () {
            var f = app.utils.format;
            // var unit_price = this.model.getUnitPrice();
            var subtotal_price = this.model.getSubtotalPrice();
            // var discount = this.model.get('discount');
            // var subtotal_price_discounted = this.model.getSubtotalPriceDiscounted();

            return {
                // unit: f.price_usd(unit_price),
                subtotal: f.price_usd(subtotal_price),
                // discount: discount ? f.percent(discount) : null,
                // subtotal_discounted: discount ? f.price_usd(subtotal_price_discounted) : null
            };
        },
        serializeData: function () {
            return {
                reference_id: this.model.collection.indexOf(this.model) + 1,
                description: this.model.get('description'),
                quantity: this.model.get('quantity'),
                price: this.getPrices()
            };
        }
    });
})();
