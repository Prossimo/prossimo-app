var app = app || {};

(function () {
    'use strict';

    app.UnitCollection = Backbone.Collection.extend({
        model: app.Unit,
        url: function () {
            return app.settings.get('api_base_path') +
                '/projects/' + this.options.project.get('id') + '/units';
        },
        comparator: function (item) {
            return item.id;
        },
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_unit = new app.Unit(null, { proxy: true });
        },
        getNameTitleTypeHash: function (names) {
            return this.proxy_unit.getNameTitleTypeHash(names);
        },
        getTitles: function (names) {
            return this.proxy_unit.getTitles(names);
        },
        getSubtotalPrice: function () {
            var total_price = 0;

            this.each(function (item) {
                total_price += item.getSubtotalPrice();
            });

            return total_price;
        },
        getSubtotalPriceDiscounted: function () {
            var total_price = 0;

            this.each(function (item) {
                total_price += item.getSubtotalPriceDiscounted();
            });

            return total_price;
        },
        hasAtLeastOneCustomerImage: function () {
            return this.any(function (model) {
                return model.get('customer_image') !== '';
            });
        }
    });
})();
