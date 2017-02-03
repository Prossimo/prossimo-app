var app = app || {};

(function () {
    'use strict';

    function getDefaultEquationCollection() {
        return [
            {
                name: 'fixed',
                param_a: 0,
                param_b: 0
            },
            {
                name: 'operable',
                param_a: 0,
                param_b: 0
            }
        ];
    }

    app.PricingEquationParamsCollection = Backbone.Collection.extend({
        model: app.PricingEquationParams,
        parse: function (data) {
            var data_object = app.utils.object.extractObjectOrNull(data);

            return data_object;
        },
        getByName: function (equation_name) {
            return this.findWhere({ name: equation_name });
        },
        initialize: function (attribures, options) {
            if ( options.append_default_sets && this.length === 0 ) {
                this.set(getDefaultEquationCollection(), { parse: true });
            }
        }
    });
})();
