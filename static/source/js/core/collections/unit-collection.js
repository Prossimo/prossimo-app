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
            this.proxy_unit = new app.Unit(null, {proxy: true});

            if (this.options.profile) {
                this.profile = this.options.profile;
            }

            //  When parent project is fully loaded, we validate unit positions
            this.listenTo(this.options.project, 'fully_loaded', this.validatePositions);
        },
        /* eslint-disable eqeqeq */
        getById: function (id) {
            return _.find(this.models, function (model) {
                return model.get('root_section').id == id;
            });
        },
        /* eslint-enable eqeqeq */
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
        /**
         * Return length of the collection
         * @return {Number} length of the collection or 0
         */
        getTotalUnitTypes: function () {
            return this.length;
        },
        /**
         * Return sum all "quantity" of the collection
         * @returns {Number} sum all "quantity" of the collection or 0
         */
        getTotalUnitQuantity: function () {
            var total_quantity = 0;

            this.each(function (item) {
                if ( item.get('quantity') ) {
                    total_quantity += parseFloat(item.get('quantity'));
                }
            }, this);

            return total_quantity;
        },
        /**
         * Return units by profiles
         * @returns {Array.<Backbone.Collection>} аn array of collections with units or empty array
         */
        getUnitsByProfiles: function () {
            return _.map(this.groupBy('profile_id'), function (units, profile_id) {
                return new this.constructor(units, {
                    model: this.model,
                    comparator: this.comparator,
                    profile: app.settings.getProfileByIdOrDummy(profile_id)
                });
            }.bind(this));
        },
        /**
         * Return sum all squares of the models
         * @returns {Number} sum all squares of the models or 0
         */
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
