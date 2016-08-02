var app = app || {};

(function () {
    'use strict';

    //  TODO: we better have original_cost and original_currency here as well
    //  instead of price
    var ENTRY_PROPERTIES = [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'price', title: 'Price', type: 'number' },
        { name: 'data', title: 'Additional Data', type: 'string' },
        { name: 'position', title: 'Position', type: 'number' }
    ];

    app.OptionsDictionaryEntry = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(ENTRY_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getNameAttribute: function () {
            return 'name';
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            var type_value_hash = {
                number: 0
            };

            // var name_value_hash = {
            //     unit_type: DEFAULT_UNIT_TYPE,
            //     low_threshold: false,
            //     threshold_width: 20,
            //     pricing_grids: getDefaultPricingGrids()
            // };

            // if ( app.settings ) {
            //     name_value_hash.system = app.settings.getSystems()[0];
            //     name_value_hash.supplier_system = app.settings.getSupplierSystems()[0];
            //     name_value_hash.frame_corners = app.settings.getFrameCornerTypes()[0];
            //     name_value_hash.sash_corners = app.settings.getSashCornerTypes()[0];
            // }

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            // if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
            //     default_value = name_value_hash[name];
            // }

            return default_value;
        },
        // save: function () {
        //     return Backbone.Model.prototype.saveAndGetId.apply(this, arguments);
        // },
        // sync: function (method, model, options) {
        //     var properties_to_omit = ['id'];

        //     if ( method === 'create' || method === 'update' ) {
        //         options.attrs = { profile: _.extendOwn(_.omit(model.toJSON(), properties_to_omit), {
        //             pricing_grids: JSON.stringify(model.get('pricing_grids'))
        //         }) };
        //     }

        //     return Backbone.sync.call(this, method, model, options);
        // },
        initialize: function (attributes, options) {
            this.options = options || {};

            // if ( !this.options.proxy ) {
            //     this.validatePricingGrids();
            //     this.on('change:unit_type', this.onTypeUpdate, this);
            // }
        }
    });
})();
