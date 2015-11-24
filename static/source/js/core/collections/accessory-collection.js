var app = app || {};

(function () {
    'use strict';

    app.AccessoryCollection = Backbone.Collection.extend({
        model: app.Accessory,
        //  This emulates Array.splice. From Handsontable docs example
        splice: function (index, howMany) {
            var args = _.toArray(arguments).slice(2).concat({at: index});
            var removed = this.models.slice(index, index + howMany);

            this.remove(removed).add.apply(this, args);
            return removed;
        },
        initialize: function () {
            this.proxy_accessory = new app.Accessory(null, { proxy: true });
        },
        getNameTitleTypeHash: function (names) {
            return this.proxy_accessory.getNameTitleTypeHash(names);
        },
        getTitles: function (names) {
            return this.proxy_accessory.getTitles(names);
        },
        getExtrasTypes: function () {
            return this.proxy_accessory.getExtrasTypes();
        },
        getRegularItems: function () {
            return this.models.filter(function (item) {
                return item.get('extras_type') === 'Regular';
            });
        },
        getOptionalItems: function () {
            return this.models.filter(function (item) {
                return item.get('extras_type') === 'Optional';
            });
        },
        getHiddenItems: function () {
            return this.models.filter(function (item) {
                return item.get('extras_type') === 'Hidden';
            });
        },
        getShipping: function () {
            return this.models.filter(function (item) {
                return item.get('extras_type') === 'Shipping';
            });
        },
        getTaxes: function () {
            return this.models.filter(function (item) {
                return item.get('extras_type') === 'Tax';
            });
        },
        getPrice: function (collection) {
            var total_price = 0;

            _.each(collection, function (item) {
                total_price += item.getSubtotalPriceDiscounted();
            });

            return total_price;
        },
        getRegularItemsPrice: function () {
            return this.getPrice(this.getRegularItems());
        },
        getOptionalItemsPrice: function () {
            return this.getPrice(this.getOptionalItems());
        },
        getHiddenPrice: function () {
            return this.getPrice(this.getHiddenItems());
        },
        getShippingPrice: function () {
            return this.getPrice(this.getShipping());
        },
        getTaxPercent: function () {
            var base_value = 0;

            _.each(this.getTaxes(), function (item) {
                base_value += (parseFloat(item.get('price_markup')) - 1) * 100;
            });

            return base_value;
        }
    });
})();
