var app = app || {};

(function () {
    'use strict';

    var PRICING_GRID_PROPERTIES = [
        // { name: 'name', title: 'Name', type: 'string' },
        { name: 'rows_number', title: 'Number of Rows', type: 'number' },
        { name: 'columns_number', title: 'Number of Columns', type: 'number' }
    ];

    app.PricingGrid = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(PRICING_GRID_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            var type_value_hash = {
                number: 0
            };

            var name_value_hash = {};

            // if ( app.settings ) {
            //     name_value_hash.system = app.settings.getSystems()[0];
            //     name_value_hash.supplier_system = app.settings.getSupplierSystems()[0];
            //     name_value_hash.frame_corners = app.settings.getFrameCornerTypes()[0];
            //     name_value_hash.sash_corners = app.settings.getSashCornerTypes()[0];
            // }

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        // save: function () {
        //     return Backbone.Model.prototype.saveAndGetId.apply(this, arguments);
        // },
        // sync: function (method, model, options) {
        //     if ( method === 'create' || method === 'update' ) {
        //         options.attrs = { profile: _.omit(model.toJSON(), ['id']) };
        //     }

        //     return Backbone.sync.call(this, method, model, options);
        // },
        initialize: function (attributes, options) {
            this.options = options || {};

            // if ( !this.options.proxy ) {
            //     this.on('change:unit_type', this.onTypeUpdate, this);
            // }
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        //  TODO: change this to be like in settings (and do this everywhere
        //  else as well)
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( PRICING_GRID_PROPERTIES, 'name' );
            }

            _.each(PRICING_GRID_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_hash.push({ name: item.name, title: item.title, type: item.type });
                }
            });

            return name_title_hash;
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        }
    });
})();
