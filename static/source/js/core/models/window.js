var app = app || {};

(function () {
    'use strict';

    var WindowProperties = [
        { name: 'width', title: 'Width (inches)', type: 'number' },
        { name: 'height', title: 'Height (inches)', type: 'number' },
        { name: 'quantity', title: 'Quantity', type: 'number' },
        { name: 'description', title: 'Description', type: 'string' },
        { name: 'type', title: 'Type', type: 'string' }
    ];

    //  Window properties that could be copied from a spreadsheet or a PDF
    app.Window = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};
            _.each(WindowProperties, function (item) {
                defaults[item.name] = this.getDefaultValue(item.type);
            }, this);
            return defaults;
        },
        initialize: function () {
            this.drawing = new app.WindowDrawing();

            // console.log( this.getNameTitleHash(['width']) );
            // console.log( this.getNameTitleHash() );
        },
        getDefaultValue: function (type) {
            var default_value = '';

            if ( type === 'number' ) {
                default_value = 0;
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
        }
    });
})();
