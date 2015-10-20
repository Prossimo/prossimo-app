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
        addNewWindow: function (e) {
            e.stopPropagation();
            var new_window = new app.Window();
            this.collection.add(new_window);
        },
        serializeData: function () {
            return {
                table_visibility: this.table_visibility,
                table_attributes: this.collection.getTableAttributes()
            };
        },
        initialize: function () {
            this.table_visibility = 'hidden';
            // this.table_visibility = 'visible';

            // this.listenTo(this.collection, 'all', this.render);
            this.listenTo(this.collection, 'all', this.renderTable);
        },
        // getNewWindow: function () {
        //     return new app.Window();
        // },
        //  This one is from Handsontable / Backbone integration docs
        getAttributesColumn: function (attr_name) {
            return {
                data: function (window_model, value) {
                    if ( window_model ) {
                        if ( _.isUndefined(value) ) {
                            return window_model.get(attr_name);
                        }

                        window_model.set(attr_name, value);
                    }
                }
            };
        },
        getColumns: function () {
            return _.map(this.collection.getTableAttributes(), function (item) {
                return this.getAttributesColumn(item.name);
            }, this);
        },
        renderTable: function () {
            if ( this.hot ) {
                this.hot.render();
            }
        },
        onRender: function () {
            this.hot = new Handsontable(this.ui.$hot_container[0], {
                data: this.collection,
                columns: this.getColumns(),
                colHeaders: this.collection.getTableHeadings(),
                stretchH: 'all',
                height: 200
            });

            Handsontable.hooks.once('afterInit', this.renderTable, this.hot);
        }
    });
})();
