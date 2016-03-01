var app = app || {};

(function () {
    'use strict';

    app.UnitCollection = Backbone.Collection.extend({
        model: app.Unit,
        //  TODO: rename this prop
        property_name: 'units',
        url: function () {
            return app.settings.get('api_base_path') +
                '/projects/' + this.options.project.get('id') + '/units';
        },
        reorder_url: function () {
            return app.settings.get('api_base_path') +
                '/projects/' + this.options.project.get('id') + '/reorder_units';
        },
        // comparator: function (item) {
        //     //  Special case is when multiple units with `position` = 0 exist
        //     //  which means our project was created before sorting features
        //     //  were introduced, so units had no `position` set
        //     var no_positions_state_flag = this.length > 0 && this.getMaxPosition() === 0;

        //     return no_positions_state_flag ? item.id : item.get('position');
        // },
        //  TODO: could call generic comparator from extensions
        comparator: function (item) {
            //  Special case is when multiple units with `position` = 0 exist
            //  which means our project was created before sorting features
            //  were introduced, so units had no `position` set
            // var no_positions_state_flag = this.length > 0 && this.getMaxPosition() === 0;
            // var no_positions_state_flag = this.length > 0 && this.getMaxPosition() === 0;
            console.log( 'comparator', item );

            var no_positions_state_flag = item.collection.length > 0 && item.collection.getMaxPosition() === 0;

            console.log( 'no positions state', no_positions_state_flag );

            return no_positions_state_flag ? item.id : item.get('position');
        },
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_unit = new app.Unit(null, { proxy: true });

            //  When parent project is set active, we validate unit positions
            this.listenTo(this.options.project, 'set_active', this.validatePositions);

            // this.on('add', this.setNewItemPosition, this);

            this.on('all', function (e) {
                console.log( e );
            }, this);
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
        }
    });
})();
