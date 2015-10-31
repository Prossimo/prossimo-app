var app = app || {};

(function () {
    'use strict';

    app.QuoteExtrasItemView = Marionette.ItemView.extend({
        tagName: 'tr',
        className: 'quote-extras-item',
        template: app.templates['quote/quote-extras-item-view'],
        getPrices: function () {
            var f = app.utils.format;
            var subtotal_price = this.model.getSubtotalPrice();

            return {
                subtotal: f.price_usd(subtotal_price)
            };
        },
        getReferenceId: function () {
            return this.model.collection.filter(function (item) {
                return item.get('extras_type') === this.options.type;
            }, this).indexOf(this.model) + 1;
        },
        serializeData: function () {
            return {
                reference_id: this.getReferenceId(),
                description: this.model.get('description'),
                quantity: this.model.get('quantity'),
                price: this.getPrices()
            };
        }
    });
})();
