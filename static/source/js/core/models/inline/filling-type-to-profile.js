var app = app || {};

(function () {
    'use strict';

    var PRICING_SCHEME_NONE = app.constants.PRICING_SCHEME_NONE;
    var PRICING_SCHEME_PRICING_GRIDS = app.constants.PRICING_SCHEME_PRICING_GRIDS;
    var PRICING_SCHEME_LINEAR_EQUATION = app.constants.PRICING_SCHEME_LINEAR_EQUATION;

    var PROFILE_CONNECTION_PROPERTIES = [
        { name: 'profile_id', title: 'Profile ID', type: 'number' },
        { name: 'is_default', title: 'Is Default', type: 'boolean' },
        { name: 'pricing_grids', title: 'Pricing Grids', type: 'collection:PricingGridCollection' },
        {
            name: 'pricing_equation_params',
            title: 'Pricing Equation Params',
            type: 'collection:PricingEquationParamsCollection'
        }
    ];

    app.FillingTypeProfile = Backbone.Model.extend({
        schema: app.schema.createSchema(PROFILE_CONNECTION_PROPERTIES),
        defaults: function () {
            var defaults = {};

            _.each(PROFILE_CONNECTION_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            var type_value_hash = {
                number: 0,
                boolean: false
            };

            var name_value_hash = {
                pricing_grids: new app.PricingGridCollection(null, { append_default_grids: true }),
                pricing_equation_params: new app.PricingEquationParamsCollection(null, { append_default_sets: true })
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        //  See comments for `parse` function in `pricing-grid.js`
        parse: function (data) {
            var parsed_data = app.schema.parseAccordingToSchema(data, this.schema, {
                allow_id: false
            });

            //  We append default pricing grids if we aren't able to recignize
            //  source string as object
            if ( parsed_data && parsed_data.pricing_grids ) {
                parsed_data.pricing_grids = new app.PricingGridCollection(
                    app.utils.object.extractObjectOrNull(parsed_data.pricing_grids),
                    {
                        parse: true,
                        append_default_grids: true
                    }
                );
            }

            if ( parsed_data && parsed_data.pricing_equation_params ) {
                parsed_data.pricing_equation_params = new app.PricingEquationParamsCollection(
                    app.utils.object.extractObjectOrNull(parsed_data.pricing_equation_params),
                    {
                        parse: true,
                        append_default_sets: true
                    }
                );
            }

            return parsed_data;
        },
        //  We want `pricing_grids` to be serialized and stored as string
        toJSON: function () {
            var properties_to_omit = ['id'];
            var json = Backbone.Model.prototype.toJSON.apply(this, arguments);

            json.pricing_grids = JSON.stringify(this.get('pricing_grids').toJSON());
            json.pricing_equation_params = JSON.stringify(this.get('pricing_equation_params').toJSON());

            return _.omit(json, properties_to_omit);
        },
        persist: function () {
            return this.set.apply(this, arguments);
        },
        getPricingData: function () {
            var pricing_data = {
                scheme: PRICING_SCHEME_NONE
            };

            var parent_filling_type = this.collection && this.collection.options.parent_filling_type;

            if ( parent_filling_type && parent_filling_type.get('pricing_scheme') === PRICING_SCHEME_PRICING_GRIDS ) {
                pricing_data.scheme = PRICING_SCHEME_PRICING_GRIDS;
                pricing_data.pricing_grids = this.get('pricing_grids');
            } else if (
                parent_filling_type && parent_filling_type.get('pricing_scheme') === PRICING_SCHEME_LINEAR_EQUATION
            ) {
                pricing_data.scheme = PRICING_SCHEME_LINEAR_EQUATION;
                pricing_data.pricing_equation_params = this.get('pricing_equation_params');
            }

            return pricing_data;
        },
        initialize: function () {
            //  The order of events doesn't really match the way events
            //  propagate from model to collection, but it should be okay for
            //  the purpose of persisting the model on grid item change
            this.listenTo(this.get('pricing_grids'), 'change update', function (changed_object) {
                this.trigger('change:pricing_grids change', changed_object);
            });
            this.listenTo(this.get('pricing_equation_params'), 'change update', function (changed_object) {
                this.trigger('change:pricing_equation_params change', changed_object);
            });
        }
    });
})();

