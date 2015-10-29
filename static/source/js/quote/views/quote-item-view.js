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

            return {
                unit: f.price_usd(unit_price),
                subtotal: f.price_usd(subtotal_price)
            };
        },
        getProductImage: function () {
            // this.model
        },
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
