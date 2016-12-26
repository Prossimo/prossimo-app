var app = app || {};

(function () {
    'use strict';

    function getDefaultGridCollection() {
        return [
            {
                name: 'fixed',
                data: [
                    { height: 500, width: 500, value: 0 },
                    { height: 914, width: 1514, value: 0 },
                    { height: 2400, width: 3000, value: 0 }
                ]
            },
            {
                name: 'operable',
                data: [
                    { height: 500, width: 500, value: 0 },
                    { height: 914, width: 1514, value: 0 },
                    { height: 1200, width: 2400, value: 0 }
                ]
            }
        ];
    }

    app.PricingGridCollection = Backbone.Collection.extend({
        model: app.PricingGrid,
        parse: function (data) {
            return app.utils.object.extractObjectOrNull(data);
        },
        getByName: function (grid_name) {
            return this.findWhere({ name: grid_name });
        },
        getValueForGrid: function (grid_name, options) {
            var target_grid = this.getByName(grid_name);

            return target_grid && target_grid.getValue(options);
        },
        initialize: function (attribures, options) {
            if ( options.append_default_grids && this.length === 0 ) {
                this.set(getDefaultGridCollection(), { parse: true });
            }
        }
    });
})();
