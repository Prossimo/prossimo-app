var app = app || {};

(function () {
    'use strict';

    var WindowProperties = [
        { name: 'mark', title: 'Mark', type: 'string' },
        { name: 'width', title: 'Width (inches)', type: 'number' },
        { name: 'height', title: 'Height (inches)', type: 'number' },
        { name: 'quantity', title: 'Quantity', type: 'number' },
        { name: 'type', title: 'Type', type: 'string' },
        { name: 'description', title: 'Description', type: 'string' },
        { name: 'notes', title: 'Notes', type: 'string' },

        { name: 'system', title: 'System', type: 'string' },
        { name: 'customer_image', title: 'Customer Image', type: 'base64image' },
        { name: 'internal_color', title: 'Color Internal', type: 'string' },
        { name: 'external_color', title: 'Color External', type: 'string' },
        { name: 'gasket_color', title: 'Gasket Color', type: 'string' },

        { name: 'hinge_style', title: 'Hinge Style', type: 'string' },
        { name: 'opening_direction', title: 'Opening Direction', type: 'string' },
        { name: 'threshold', title: 'Threshold', type: 'string' },
        { name: 'internal_sill', title: 'Internal Sill', type: 'string' },
        { name: 'external_sill', title: 'External Sill', type: 'string' },
        { name: 'glazing', title: 'Glazing', type: 'string' },
        { name: 'uw', title: 'Uw', type: 'number' },

        { name: 'original_cost', title: 'Original Cost', type: 'number' },
        { name: 'original_currency', title: 'Original Currency', type: 'string' },
        { name: 'conversion_rate', title: 'Conversion Rate', type: 'number' },
        { name: 'price_markup', title: 'Markup', type: 'number' },
        { name: 'discount', title: 'Discount', type: 'number' }
    ];

    //  Window properties that could be copied from a spreadsheet or a PDF
    app.Window = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(WindowProperties, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        initialize: function () {
            this.drawing = new app.WindowDrawing();
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
                names = _.pluck( WindowProperties, 'name' );
            }

            _.each(WindowProperties, function (item) {
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
        getRefNum: function () {
            return this.collection ? this.collection.indexOf(this) + 1 : -1;
        },
        //  TODO: do some checks? return error value in some cases?
        getUnitCost: function () {
            return parseFloat(this.get('original_cost')) / parseFloat(this.get('conversion_rate'));
        },
        getUnitPrice: function () {
            return this.getUnitCost() * parseFloat(this.get('price_markup'));
        },
        getSubtotalPrice: function () {
            return this.getUnitPrice() * parseFloat(this.get('quantity'));
        },
        getUwIp: function () {
            return parseFloat(this.get('uw')) * 0.176;
        },
        getUnitPriceDiscounted: function () {
            return this.getUnitPrice() * (100 - this.get('discount')) / 100;
        },
        getSubtotalPriceDiscounted: function () {
            return this.getSubtotalPrice() * (100 - this.get('discount')) / 100;
        }
    });
})();
