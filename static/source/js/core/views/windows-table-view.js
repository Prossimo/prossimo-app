var app = app || {};

(function () {
    'use strict';

    app.WindowsTableView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'windows-table-container',
        template: app.templates['core/windows-table-view'],
        events: {
            'click .windows-table-title': 'toggleTableVisibility',
            'click .js-add-new-window': 'addNewWindow'
        },
        toggleTableVisibility: function () {
            this.table_visibility = this.table_visibility === 'hidden' ? 'visible' : 'hidden';
            this.render();
        },
        addNewWindow: function () {
            var new_window = new app.Window();
            this.collection.add(new_window);
            console.log( this.collection );
            this.render();
        },
        getTableAttributes: function () {
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
        getWindowAttributes: function (model) {
            var table_attributes = this.getTableAttributes();
            var current_window = {};

            _.each(table_attributes, function (item) {
                current_window[item.name] = model.get(item.name);
            }, this);

            return current_window;
        },
        serializeData: function () {
            return {
                table_visibility: this.table_visibility,
                table_attributes: this.getTableAttributes(),
                table_attributes_num: this.getTableAttributes().length,
                windows_list: this.collection.map(function (model) {
                    return this.getWindowAttributes(model);
                }, this)
            };
        },
        initialize: function () {
            // this.table_visibility = 'hidden';
            this.table_visibility = 'visible';
        },
        onRender: function () {
            console.log( this.serializeData() );
        }
    });
})();
