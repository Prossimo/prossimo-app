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
            var collection_price = this.model.collection.getSubtotalPriceDiscounted();
            var hidden_price = this.options.extras ? this.options.extras.getHiddenPrice() : 0;
            var hidden_multiplier = 1 + hidden_price / collection_price;

            return {
                unit: f.price_usd(unit_price * hidden_multiplier),
                subtotal: f.price_usd(subtotal_price * hidden_multiplier),
                discount: discount ? f.percent(discount) : null,
                subtotal_discounted: discount ? f.price_usd(subtotal_price_discounted * hidden_multiplier) : null
            };
        },
        // getProductImage: function () {
        //     // this.model
        // },
        getDescription: function () {
            var f = app.utils.format;

            var name_title_hash = {
                mark: 'Mark',
                size: 'Size',
                // area: 'Area',
                type: 'Type',
                // u_factor: 'U-Factor',
                // shgc: 'SHGC',
                // air_leakage: 'Air Leakage (CFM/SF)',
                glazing: 'Glazing',
                notes: 'Notes'
            };

            //  TODO: remove this eventually
            // var example_params = {
            //     mark: 'A',
            //     size: '5\'-6"x6\'-10"',
            //     area: '37.5',
            //     type: 'CASEMENT',
            //     u_factor: '0.2 MAX',
            //     shgc: '0.4 MAX',
            //     air_leakage: '0.2 MAX',
            //     notes: 'TILT AND TURN INSWING/FIXED PVC'
            // };

            var params_source = {
                mark: this.model.get('mark'),
                size: f.dimensions(this.model.get('width'), this.model.get('height')),
                type: this.model.get('type'),
                glazing: this.model.get('glazing'),
                // notes: this.model.get('description') + ', ' + this.model.get('notes')
                notes: this.model.get('description')
            };

            return _.map(name_title_hash, function (item, key) {
                // return { name: key, title: item, value: example_params[key] };
                return { name: key, title: item, value: params_source[key] };
            }, this);
        },
        serializeData: function () {
            return {
                reference_id: this.model.collection.indexOf(this.model) + 1,
                description: this.getDescription(),
                quantity: this.model.get('quantity'),
                price: this.getPrices()
            };
        }
    });
})();
