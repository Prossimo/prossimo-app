var app = app || {};

(function () {
    'use strict';

    app.AccessoryCollection = Backbone.Collection.extend({
        model: app.Accessory,
        url: function () {
            return app.settings.get('api_base_path') +
                '/projects/' + this.options.project.get('id') + '/accessories';
        },
        reorder_url: function () {
            return app.settings.get('api_base_path') +
                '/projects/' + this.options.project.get('id') + '/reorder_accessories';
        },
        reorder_property_name: 'accessories',
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_accessory = new app.Accessory(null, { proxy: true });

            //  When parent project is fully loaded, we validate positions
            this.listenTo(this.options.project, 'fully_loaded', this.validatePositions);
            this.on('loaded', this.addDefaultShipping, this);
        },
        //  Add new `Shipping` item if there's no shipping yet
        addDefaultShipping: function () {
            if ( !this.findWhere({ extras_type: 'Shipping' }) ) {
                this.add(new app.Accessory({
                    description: 'Shipping',
                    extras_type: 'Shipping'
                }));
            }
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
                return item.isOptionalType();
            });
        },
        getOptionalPercentBasedItems: function () {
            return this.models.filter(function (item) {
                return item.get('extras_type') === 'Optional, %';
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
        getRegularItemsCost: function () {
            var total_cost = 0;

            _.each(this.getRegularItems(), function (item) {
                total_cost += item.getSubtotalCost();
            });

            return total_cost;
        },
        //  Helper function
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
        getTotalTaxPercent: function () {
            var base_value = 0;

            _.each(this.getTaxes(), function (item) {
                base_value += item.getMarkupPercent();
            });

            return base_value;
        }
    });
})();
