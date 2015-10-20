var app = app || {};

(function () {
    'use strict';

    app.QuoteItemView = Marionette.ItemView.extend({
        tagName: 'tr',
        className: 'quote-item',
        template: app.templates['quote/quote-item-view'],
        getPrices: function () {
            var unit_price = Math.ceil(Math.random() * 10) * 100;

            return {
                unit: unit_price,
                total: unit_price * this.model.get('quantity')
            };
        },
        getDescription: function () {
            var name_title_hash = {
                mark: 'Mark',
                size: 'Size',
                area: 'Area',
                type: 'Type',
                u_factor: 'U-Factor',
                shgc: 'SHGC',
                air_leakage: 'Air Leakage (CFM/SF)',
                notes: 'Notes'
            };

            var example_params = {
                mark: 'A',
                size: '5\'-6"x6\'-10"',
                area: '37.5',
                type: 'CASEMENT',
                u_factor: '0.2 MAX',
                shgc: '0.4 MAX',
                air_leakage: '0.2 MAX',
                notes: 'TILT AND TURN INSWING/FIXED PVC'
            };

            return _.map(name_title_hash, function (item, key) {
                return { name: key, title: item, value: example_params[key] };
            }, this);
        },
        serializeData: function () {
            return {
                reference_id: this.model.cid,
                description: this.getDescription(),
                quantity: this.model.get('quantity'),
                price: this.getPrices(),
            };
        }
    });
})();
