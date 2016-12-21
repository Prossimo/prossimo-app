var app = app || {};

(function () {
    'use strict';

    var PROFILE_CONNECTION_PROPERTIES = [
        { name: 'profile_id', title: 'Profile ID', type: 'number' },
        { name: 'is_default', title: 'Is Default', type: 'boolean' },
        { name: 'pricing_grids', title: 'Pricing Grids', type: 'PricingGridCollection' }
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
                pricing_grids: new app.PricingGridCollection(null, { append_default_grids: true })
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
        parse: function (attributes) {
            var attrs = attributes || {};
            var grids_data = attributes && attributes.pricing_grids;

            //  If parsing fails, we append default pricing grids
            attrs.pricing_grids = new app.PricingGridCollection(
                app.utils.object.extractObjectOrNull(grids_data),
                {
                    parse: true,
                    append_default_grids: true
                }
            );

            return attrs;
        },
        //  We want `pricing_grids` to be serialized and stored as string
        toJSON: function () {
            var json = Backbone.Model.prototype.toJSON.apply(this, arguments);

            json.pricing_grids = JSON.stringify(this.get('pricing_grids').toJSON());

            return json;
        },
        persist: function () {
            return this.set.apply(this, arguments);
        },
        initialize: function () {
            //  The order of events doesn't really match the way events
            //  propagate from model to collection, but it should be okay for
            //  the purpose of persisting the model on grid item change
            this.listenTo(this.get('pricing_grids'), 'change update', function (changed_object) {
                this.trigger('change:pricing_grids change', changed_object);
            });
        }
    });
})();

