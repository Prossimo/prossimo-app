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
                table_name_title_hash: this.collection.getNameTitleHash()
            };
        },
        initialize: function () {
            // this.table_visibility = 'hidden';
            this.table_visibility = 'visible';

            this.listenTo(this.collection, 'all', this.render);
            // this.listenTo(this.collection, 'all', this.renderTable);
        },
        // getNewWindow: function () {
        //     return new app.Window();
        // },
        //  TODO: add better description
        //  This one is from Handsontable / Backbone integration docs
        getModelAttributeValue: function (attr_name) {
            //  TODO: add types and validation
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
        getDimensions: function () {
            return {
                data: function (window_model, value) {
                    var f = app.utils.format;
                    var p = app.utils.parseFormat;

                    if ( window_model ) {
                        if ( _.isUndefined(value) ) {
                            return f.dimensions(window_model.get('width'), window_model.get('height'));
                        }

                        //  TODO: add proper format parser (with a validator)
                        // window_model.set('width', p.dimensions(value, 'width'));
                        // window_model.set('width', value);
                    }
                },
                readOnly: true
            };
        },
        getWidthMM: function () {
            return {
                data: function (window_model, value) {
                    var c = app.utils.convert;

                    if ( window_model ) {
                        if ( _.isUndefined(value) ) {
                            return c.inches_to_mm(window_model.get('width'));
                        }
                    }
                },
                readOnly: true
            };
        },
        getHeightMM: function () {
            return {
                data: function (window_model, value) {
                    var c = app.utils.convert;

                    if ( window_model ) {
                        if ( _.isUndefined(value) ) {
                            return c.inches_to_mm(window_model.get('height'));
                        }
                    }
                },
                readOnly: true
            };
        },
        getColumnValues: function () {
            var basic_values = _.map(this.collection.getNameTitleHash(), function (item) {
                return this.getModelAttributeValue(item.name);
            }, this);

            basic_values.push(this.getDimensions());
            basic_values.push(this.getWidthMM());
            basic_values.push(this.getHeightMM());

            return basic_values;
        },
        // renderTable: function () {
        //     if ( this.hot ) {
        //         this.hot.render();
        //     }
        // },
        getHeaders: function () {
            var headers = this.collection.getTitles();
            headers.push('Dimensions');
            headers.push('Width (mm)');
            headers.push('Height (mm)');
            return headers;
        },
        onRender: function () {
            this.hot = new Handsontable(this.ui.$hot_container[0], {
                data: this.collection,
                columns: this.getColumnValues(),
                colHeaders: this.getHeaders(),
                stretchH: 'all',
                height: 200
            });

            // Handsontable.hooks.once('afterInit', this.renderTable, this.hot);
        },
        // onShow: function () {
        //     this.renderTable();
        // }
    });
})();
