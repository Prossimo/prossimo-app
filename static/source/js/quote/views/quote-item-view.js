var app = app || {};

(function () {
    'use strict';

    app.QuoteItemView = Marionette.ItemView.extend({
        tagName: 'tr',
        className: 'quote-item',
        template: app.templates['quote/quote-item-view'],
        getPrices: function () {
            var f = app.utils.format;
            var unit_price = this.model.getUnitPrice();
            var subtotal_price = this.model.getSubtotalPrice();
            var discount = this.model.get('discount');
            var subtotal_price_discounted = this.model.getSubtotalPriceDiscounted();

            //  We split "hidden" extras equally between all units
            var hidden_multiplier = this.options.project ? this.options.project.getHiddenMultiplier() : 1;

            return {
                unit: f.price_usd(unit_price * hidden_multiplier),
                subtotal: f.price_usd(subtotal_price * hidden_multiplier),
                discount: discount ? f.percent(discount) : null,
                subtotal_discounted: discount ? f.price_usd(subtotal_price_discounted * hidden_multiplier) : null
            };
        },
        getDescription: function () {
            var f = app.utils.format;

            var name_title_hash = {
                mark: 'Mark',
                size: 'Size',
                type: 'Type',
                glazing: 'Glazing',
                desc: 'Description',
                threshold: 'Threshold'
            };

            var params_source = {
                mark: this.model.get('mark'),
                size: f.dimensions(this.model.get('width'), this.model.get('height'), 'fraction'),
                type: this.model.get('type'),
                glazing: this.model.get('glazing'),
                desc: this.model.get('description'),
                threshold: this.model.profile.isThresholdPossible() ?
                    this.model.profile.getThresholdType() : false
            };

            return _.map(name_title_hash, function (item, key) {
                return { name: key, title: item, value: params_source[key] };
            }, this);
        },
        getProductImage: function () {
            return app.preview(this.model, 200, 200, 'base64');
        },
        serializeData: function () {
            return {
                reference_id: this.model.getRefNum(),
                description: this.getDescription(),
                notes: this.model.get('notes'),
                quantity: this.model.get('quantity'),
                price: this.getPrices(),
                product_image: this.getProductImage(),
                show_price: this.options.show_price !== false
            };
        }
    });
})();
