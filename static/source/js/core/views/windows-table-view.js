var app = app || {};

(function () {
    'use strict';

    app.WindowsTableView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'windows-table-container',
        template: app.templates['core/windows-table-view'],
        ui: {
            '$hot_container': '.handsontable-container'
        },
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

            this.collection.add([
                { dimensions: "110x130", quantity: 1, type: "Full", description: "Nice" },
                { dimensions: "120x115", quantity: 2, type: "Vertical", description: "Very heavy", }
            ]);

            this.listenTo(this.collection, 'all', this.render);
        },
        getNewWindow: function () {
            return new app.Window();
        },
        //  This one is from Handsontable / Backbone integration docs
        getAttributesColumn: function (attr_name) {
            return {
                data: function (window_model, value) {
                    if ( _.isUndefined(value) ) {
                        return window_model.get(attr_name);
                    }
                    window_model.set(attr_name, value);
                }
            };
        },
        getColumns: function () {
            return _.map(this.getTableAttributes(), function (item) {
                return this.getAttributesColumn(item.name);
            }, this);
        },
        onRender: function () {
            // this.hot = new Handsontable(this.ui.$hot_container[0], {
            this.hot = this.ui.$hot_container.handsontable({
                data: this.collection,
                // dataSchema: this.getNewWindow,
                // startRows: 5,
                // startCols: 5,
                // colHeaders: true,
                // minSpareRows: 1
                // contextMenu: true,
                // columns: [
                //     this.getAttributesColumn('dimensions'),
                //     this.getAttributesColumn('quantity'),
                //     this.getAttributesColumn('type'),
                //     this.getAttributesColumn('description')
                // ],
                columns: this.getColumns(),
                colHeaders: this.getTableHeadings()
                // minSpareRows: 1 //see notes on the left for `minSpareRows`
            });
        }
    });
})();
