var app = app || {};

(function () {
    'use strict';

    app.UnitCollection = Backbone.Collection.extend({
        model: app.Unit,
        reorder_property_name: 'units',
        url: function () {
            return app.settings.get('api_base_path') +
                '/projects/' + this.options.project.get('id') + '/units';
        },
        reorder_url: function () {
            return app.settings.get('api_base_path') +
                '/projects/' + this.options.project.get('id') + '/reorder_units';
        },
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_unit = new app.Unit(null, { proxy: true });

            //  When parent project is fully loaded, we validate unit positions
            this.listenTo(this.options.project, 'fully_loaded', this.validatePositions);
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
        getSubtotalCost: function () {
            var total_cost = 0;

            this.each(function (item) {
                total_cost += item.getSubtotalCost();
            });

            return total_cost;
        },
        getSubtotalCostDiscounted: function () {
            var total_cost = 0;

            this.each(function (item) {
                total_cost += item.getSubtotalCostDiscounted();
            });

            return total_cost;
        },
        hasAtLeastOneCustomerImage: function () {
            return this.any(function (item) {
                return item.get('customer_image') !== '';
            });
        },
        getTotalUnitTypes: function () {
            return this.length;
        },
        getTotalUnitQuantity: function () {
            var total_quantity = 0;

            this.each(function (item) {
                if ( item.get('quantity') ) {
                    total_quantity += parseFloat(item.get('quantity'));
                }
            }, this);

            return total_quantity;
        },
        getTotalSquareFeet: function () {
            var total_area = 0;

            this.each(function (item) {
                total_area += item.getTotalSquareFeet();
            });

            return total_area;
        },
        getAveragePricePerSquareFoot: function () {
            var total_area = this.getTotalSquareFeet();
            var total_price = this.getSubtotalPriceDiscounted();

            return total_area ? total_price / total_area : 0;
        }
    });
})();
