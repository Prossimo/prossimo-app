var app = app || {};

(function () {
    'use strict';

    app.QuoteExtrasItemView = Marionette.ItemView.extend({
        tagName: 'tr',
        className: 'quote-extras-item',
        template: app.templates['quote/quote-extras-item-view'],
        getPrices: function () {
            var f = app.utils.format;
            var unit_price = this.model.getUnitPrice();
            var subtotal_price = this.model.getSubtotalPrice();

            return {
                unit: unit_price ? f.price_usd(unit_price) : null,
                subtotal: f.price_usd(subtotal_price)
            };
        },
        getReferenceId: function () {
            return this.model.collection.filter(function (item) {
                return this.options.type === 'Optional' ?
                    item.isOptionalType() :
                    item.get('extras_type') === this.options.type;
            }, this).indexOf(this.model) + 1;
        },
        getDescription: function () {
            var f = app.utils.format;
            var description = this.model.get('description');

            if ( this.model.isOptionalType() && this.model.isPercentBasedType() ) {
                description += ' (' + f.percent(this.model.getMarkupPercent()) + ' of Subtotal for units)';
            }

            return description;
        },
        getQuantity: function () {
            var quantity = this.model.get('quantity');

            if ( this.model.isOptionalType() && this.model.isPercentBasedType() ) {
                quantity = '--';
            }

            return quantity;
        },
        serializeData: function () {
            return {
                reference_id: this.getReferenceId(),
                description: this.getDescription(),
                quantity: this.getQuantity(),
                price: this.getPrices(),
                show_price: this.options.show_price !== false
            };
        }
    });
})();
