var app = app || {};

(function () {
    'use strict';

    var ExtrasTypes = ['Regular', 'Shipping', 'Optional', 'Hidden', 'Tax'];

    var AccessoryProperties = [
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

            _.each(AccessoryProperties, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        //  TODO: change to hash format like everywhere else
        getDefaultValue: function (name, type) {
            var default_value = '';

            if ( type === 'number' ) {
                default_value = 0;
            }

            if ( name === 'original_currency' ) {
                default_value = 'USD';
            }

            if ( name === 'conversion_rate' ) {
                default_value = 1;
            }

            if ( name === 'extras_type' ) {
                default_value = 'Regular';
            }

            if ( name === 'price_markup' ) {
                default_value = 1;
            }

            return default_value;
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( AccessoryProperties, 'name' );
            }

            _.each(AccessoryProperties, function (item) {
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
            return ExtrasTypes;
        },
        //  TODO: do some checks? return error value in some cases?
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
            return this.getUnitPrice() * parseFloat(this.get('quantity'));
        },
        getUnitPriceDiscounted: function () {
            return this.getUnitPrice() * (100 - this.get('discount')) / 100;
        },
        getSubtotalPriceDiscounted: function () {
            return this.getSubtotalPrice() * (100 - this.get('discount')) / 100;
        }
    });
})();
