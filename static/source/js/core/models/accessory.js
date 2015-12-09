var app = app || {};

(function () {
    'use strict';

    var EXTRAS_TYPES = ['Regular', 'Shipping', 'Optional', 'Optional, %', 'Hidden', 'Tax'];
    var DEFAULT_EXTRAS_TYPE = 'Regular';
    var PERCENT_BASED_EXTRAS_TYPES = ['Optional, %', 'Tax'];
    var OPTIONAL_EXTRAS_TYPES = ['Optional', 'Optional, %'];

    var ACCESSORY_PROPERTIES = [
        { name: 'description', title: 'Description', type: 'string' },
        { name: 'quantity', title: 'Quantity', type: 'number' },
        { name: 'extras_type', title: 'Extras type', type: 'extras_type' },

        { name: 'original_cost', title: 'Original Cost', type: 'number' },
        { name: 'original_currency', title: 'Original Currency', type: 'string' },
        { name: 'conversion_rate', title: 'Conversion Rate', type: 'number' },
        { name: 'price_markup', title: 'Markup', type: 'number' },
        { name: 'discount', title: 'Discount', type: 'number' }
    ];

    app.Accessory = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(ACCESSORY_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            var type_value_hash = {
                number: 0
            };

            var name_value_hash = {
                original_currency: 'USD',
                conversion_rate: 1,
                extras_type: DEFAULT_EXTRAS_TYPE,
                price_markup: 1
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        save: function () {
            return Backbone.Model.prototype.saveAndGetId.apply(this, arguments);
        },
        sync: function (method, model, options) {
            if ( method === 'create' || method === 'update' ) {
                options.attrs = { project_accessory: _.omit(model.toJSON(), ['id']) };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        initialize: function (attributes, options) {
            this.options = options || {};
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( ACCESSORY_PROPERTIES, 'name' );
            }

            _.each(ACCESSORY_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_hash.push({ name: item.name, title: item.title, type: item.type });
                }
            });

            return name_title_hash;
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        },
        getExtrasTypes: function () {
            return EXTRAS_TYPES;
        },
        isPercentBasedType: function () {
            return _.indexOf(PERCENT_BASED_EXTRAS_TYPES, this.get('extras_type')) !== -1;
        },
        isOptionalType: function () {
            return _.indexOf(OPTIONAL_EXTRAS_TYPES, this.get('extras_type')) !== -1;
        },
        getMarkupPercent: function () {
            return (parseFloat(this.get('price_markup')) - 1) * 100;
        },
        getUnitCost: function () {
            return parseFloat(this.get('original_cost')) / parseFloat(this.get('conversion_rate'));
        },
        getSubtotalCost: function () {
            return this.getUnitCost() * parseFloat(this.get('quantity'));
        },
        getUnitPrice: function () {
            return this.getUnitCost() * parseFloat(this.get('price_markup'));
        },
        getSubtotalPrice: function () {
            var subtotal_price = this.getUnitPrice() * parseFloat(this.get('quantity'));

            if ( app.current_project ) {
                //  If this is percent-based optional extras, base is Unit Subtotal
                if ( this.get('extras_type') !== 0 && this.isPercentBasedType() && this.isOptionalType() ) {
                    subtotal_price = (this.getMarkupPercent() / 100) *
                        (app.current_project.getSubtotalUnitsPrice() + app.current_project.getHiddenPrice() );
                //  If this is tax, base is everything except shipping
                } else if ( this.get('extras_type') !== 0 && this.isPercentBasedType() ) {
                    subtotal_price = (this.getMarkupPercent() / 100) * app.current_project.getSubtotalPrice();
                }
            }

            return subtotal_price;
        },
        getUnitPriceDiscounted: function () {
            return this.getUnitPrice() * (100 - this.get('discount')) / 100;
        },
        getSubtotalPriceDiscounted: function () {
            return this.getSubtotalPrice() * (100 - this.get('discount')) / 100;
        }
    });
})();
