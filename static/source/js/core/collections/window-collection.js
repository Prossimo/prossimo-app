var app = app || {};

(function () {
    'use strict';

    app.WindowCollection = Backbone.Collection.extend({
        model: app.Window,
        //  This emulates Array.splice. From Handsontable docs example
        splice: function (index, howMany) {
            var args = _.toArray(arguments).slice(2).concat({at: index});
            var removed = this.models.slice(index, index + howMany);

            this.remove(removed).add.apply(this, args);
            return removed;
        },
        getTableAttributes: function (table_type) {
            var name_title_hash = {
                dimensions: "Dimensions",
                quantity: "Quantity",
                type: "Type",
                description: "Description",
                customer_image: "Customer Image",
                drawing: "Drawing",
                supplier_image: "Supplier Image"
            };

            var table_attributes = _.map(name_title_hash, function (item, key) {
                return { name: key, title: item };
            }, this);

            return table_attributes;
        },
        getTableHeadings: function () {
            return _.map(this.getTableAttributes(), function (item, key) {
                return item.title;
            });
        },
        getWindowAttributes: function (model) {
            var table_attributes = this.getTableAttributes();
            var current_window = {};

            _.each(table_attributes, function (item) {
                current_window[item.name] = model.get(item.name);
            }, this);

            return current_window;
        }
    });
})();
