var app = app || {};

(function () {
    'use strict';

    var WindowProperties = [
        { name: 'mark', title: 'Mark', type: 'string' },
        { name: 'width', title: 'Width (inches)', type: 'number' },
        { name: 'height', title: 'Height (inches)', type: 'number' },
        { name: 'profile_name', title: 'Profile', type: 'string' },
        { name: 'quantity', title: 'Quantity', type: 'number' },
        { name: 'type', title: 'Type', type: 'string' },
        { name: 'description', title: 'Description', type: 'string' },
        { name: 'notes', title: 'Notes', type: 'string' },
        { name: 'customer_image', title: 'Customer Image', type: 'base64image' },
        { name: 'internal_color', title: 'Color Internal', type: 'string' },
        { name: 'external_color', title: 'Color External', type: 'string' },
        { name: 'gasket_color', title: 'Gasket Color', type: 'string' },
        { name: 'original_cost', title: 'Original Cost', type: 'number' },
        { name: 'original_currency', title: 'Original Currency', type: 'string' },
        { name: 'conversion_rate', title: 'Conversion Rate', type: 'number' },
        { name: 'price_markup', title: 'Markup', type: 'number' }
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

            return default_value;
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        //  TODO: return sorted array according to the way values are sorted
        //  in the `names`
        getNameTitleHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( WindowProperties, 'name' );
            }

            _.each(WindowProperties, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_hash.push({ name: item.name, title: item.title });
                }
            });

            return name_title_hash;
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleHash(names);

            return _.pluck(name_title_hash, 'title');
        },
        //  TODO: do some checks? return error value in some cases?
        getUnitPrice: function () {
            var price = parseFloat(this.get('original_cost')) *
                parseFloat(this.get('conversion_rate')) * parseFloat(this.get('price_markup'));

            return price;
        },
        getSubtotalPrice: function () {
            return this.getUnitPrice() * parseFloat(this.get('quantity'));
        }
    });
})();
