var app = app || {};

(function () {
    'use strict';

    app.PricingGridCollection = Backbone.Collection.extend({
        model: app.PricingGrid,
        parse: function (data) {
            return app.utils.object.extractObjectOrNull(data);
        },
        getByName: function (grid_name) {
            return this.findWhere({ name: grid_name });
        }
    });
})();
