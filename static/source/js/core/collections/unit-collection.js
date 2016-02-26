var app = app || {};

(function () {
    'use strict';

    app.UnitCollection = Backbone.Collection.extend({
        model: app.Unit,
        url: function () {
            return app.settings.get('api_base_path') +
                '/projects/' + this.options.project.get('id') + '/units';
        },
        reorder_url: function () {
            return app.settings.get('api_base_path') +
                '/projects/' + this.options.project.get('id') + '/reorder_units';
        },
        comparator: function (item) {
            //  Special case is when multiple units with `position` = 0 exist
            //  which means our project was created before sorting features
            //  were introduced, so units had no `position` set
            var no_positions_state_flag = this.length > 0 && this.getMaxPosition() === 0;

            // console.log( 'no_positions_state_flag', no_positions_state_flag );

            return no_positions_state_flag ? item.id : item.get('position');
        },
        //  TODO: this could be moved to backbone-extensions probably
        getMaxPosition: function () {
            console.log( 'getmaxposition' );
            var max = _.max(this.pluck('position'), this);

            console.log( 'collection length', this.length );

            return max > 0 ? max : 0;
        },
        //  TODO: how to deal with the existing order of units in projects? It
        //  could be messy after we roll out this feature initially
        validatePositions: function () {
            console.log( 'validate positions for collection', this );
            var invalid_flag = false;
            var proper_order = [];

            this.each(function (item) {
                console.log( 'id', item.id );
                console.log( 'position', item.get('position') );
            }, this);

            // var no_positions_state_flag = this.length > 0 && this.getMaxPosition() === 0;

            // console.log( 'no_positions_state_flag', no_positions_state_flag );

            //  TODO: what to do with items that has no id yet? In which cases
            //  this could possibly happen?
            for ( var i = 0; i < this.length; i++ ) {
                var current_model = this.models[i];

                if ( current_model.get('position') !== i ) {
                    console.log( 'model ' + current_model.id + ' position is ' + current_model.get('position') +
                        ' while it should be ' + i );
                    invalid_flag = true;
                    current_model.set('position', i, { silent: true });
                }

                proper_order.push(current_model.id);
            }

            // proper_order.push(current_model.id);

            console.log( 'invalid flag', invalid_flag );

            if ( invalid_flag ) {
                console.log( 'positions were invalid, force new order', proper_order );
                this.trigger('sort');

                //  TODO: add sync call here or use jquery ajax
                // this.sync('reorder', this, {});
            }
        },
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_unit = new app.Unit(null, { proxy: true });

            //  When parent project is set active, we validate unit positions
            this.listenTo(this.options.project, 'set_active', this.validatePositions);
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
