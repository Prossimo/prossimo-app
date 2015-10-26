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
            //  Pretend we already have tabs, and this is the default tab
            //  TODO: update this comment later
            this.base_tab_names = ['width', 'height', 'quantity', 'description', 'type'];

            this.listenTo(this.collection, 'all', this.render);
            // this.listenTo(this.collection, 'all', this.renderTable);
            this.listenTo(app.vent, 'paste_image', this.onPasteImage);
        },
        onPasteImage: function (data) {
            console.log( 'detected paste image event', data );

            if ( this.hot ) {
                //  Selected cells are returned in the format:
                //  [starting_cell_column_num, starting_cell_row_num,
                //   ending_cell_column_num, ending_cell_row_num]
                var selected_cells = this.hot.getSelected();
                console.log( 'selected', selected_cells );

                if ( selected_cells && selected_cells.length ) {
                    for (var x = selected_cells[0]; x <= selected_cells[2]; x++) {
                        for (var y = selected_cells[1]; y <= selected_cells[3]; y++) {
                            console.log( 'pasting to cell', x, y );
                            this.hot.setDataAtCell(x, y, data);
                            // this.hot.setDataAtCell(0, 8, 'dfdfd');
                        }
                    }
                }

            }
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
        //  TODO: rename all similar functions, they shouldn't be called
        //  getSomething
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
        getCustomerImage: function () {
            return {
                data: function (window_model, value) {
                    if ( window_model ) {
                        if ( _.isUndefined(value) ) {
                            return window_model.get('customer_image');
                        }

                        window_model.set('customer_image', value);
                    }
                },
                // editor: false,
                // readOnly: true,
                width: 100,
                renderer: this.customerImageRenderer
            };
        },
        //  This one is from Handsontable demo on renderers
        customerImageRenderer: function (instance, td, row, col, prop, value, cellProperties) {
            console.log( 'render customer image', value );

            var escaped = Handsontable.helper.stringify(value);
            var img;

            var $td = $(td);

            if ( escaped.indexOf('data:image/png') === 0 ) {
                img = document.createElement('IMG');
                img.src = value;

                Handsontable.Dom.addEvent(img, 'mousedown', function (e) {
                    e.preventDefault();
                });

                // Handsontable.Dom.empty(td);
                $td.empty();
                td.appendChild(img);
            } else {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
            }

            $td.addClass('hot-customer-image-cell');

            return td;
        },
        getColumnValues: function () {
            var basic_values = _.map(this.collection.getNameTitleHash(this.base_tab_names), function (item) {
                return this.getModelAttributeValue(item.name);
            }, this);

            basic_values.push(this.getDimensions());
            basic_values.push(this.getWidthMM());
            basic_values.push(this.getHeightMM());
            basic_values.push(this.getCustomerImage());

            return basic_values;
        },
        // renderTable: function () {
        //     if ( this.hot ) {
        //         this.hot.render();
        //     }
        // },
        getHeaders: function () {
            var headers = this.collection.getTitles(this.base_tab_names);
            headers.push('Dimensions');
            headers.push('Width (mm)');
            headers.push('Height (mm)');
            headers.push('Customer Image');
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

            // this.hot.setDataAtCell(0, 1, 'dfdfdf');

            // Handsontable.hooks.once('afterInit', this.renderTable, this.hot);
        },
        // onShow: function () {
        //     this.renderTable();
        // }
    });
})();
