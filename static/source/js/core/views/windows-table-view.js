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
            'click .js-add-new-window': 'addNewWindow',
            'click .nav-tabs a': 'onTabClick'
        },
        initialize: function () {
            // this.table_visibility = 'hidden';
            this.table_visibility = 'visible';

            this.tabs = {
                base: {
                    title: 'Base',
                    columns: ['mark', 'profile_name', 'width', 'height',
                              'quantity', 'type', 'description', 'notes']
                },
                sizes: {
                    title: 'Sizes',
                    columns: ['mark', 'width', 'height', 'width_mm', 'height_mm', 'dimensions']
                },
                colors: {
                    title: 'Colors',
                    columns: ['mark', 'external_color', 'internal_color', 'gasket_color']
                },
                images: {
                    title: 'Images',
                    columns: ['mark', 'customer_image']
                },
                prices: {
                    title: 'Prices',
                    columns: ['mark', 'quantity', 'original_cost', 'original_currency',
                              'conversion_rate', 'price_markup', 'unit_price', 'subtotal_price']
                }
            };
            this.active_tab = 'base';

            this.listenTo(this.collection, 'all', this.render);
            this.listenTo(app.vent, 'paste_image', this.onPasteImage);
        },
        getActiveTab: function () {
            return this.tabs[this.active_tab];
        },
        setActiveTab: function (tab_name) {
            if ( _.contains(_.keys(this.tabs), tab_name) ) {
                this.active_tab = tab_name;
            }
        },
        onTabClick: function (e) {
            var target = $(e.target).attr('href').replace('#', '');

            e.preventDefault();
            this.setActiveTab(target);
            this.render();
        },
        toggleTableVisibility: function () {
            this.table_visibility = this.table_visibility === 'hidden' ? 'visible' : 'hidden';
            this.render();
        },
        addNewWindow: function (e) {
            var new_window = new app.Window();

            e.stopPropagation();
            this.collection.add(new_window);
        },
        serializeData: function () {
            return {
                tabs: _.each(this.tabs, function (item, key) {
                    item.is_active = key === this.active_tab;
                    return item;
                }, this),
                table_visibility: this.table_visibility
            };
        },
        onPasteImage: function (data) {
            if ( this.hot ) {
                //  Selected cells are returned in the format:
                //  [starting_cell_column_num, starting_cell_row_num,
                //   ending_cell_column_num, ending_cell_row_num]
                var selected_cells = this.hot.getSelected();

                //  Paste to each selected sell.
                if ( selected_cells && selected_cells.length ) {
                    for (var x = selected_cells[0]; x <= selected_cells[2]; x++) {
                        for (var y = selected_cells[1]; y <= selected_cells[3]; y++) {
                            this.hot.setDataAtCell(x, y, data);
                        }
                    }
                }
            }
        },
        //  Render base64-encoded string as an image
        //  This one is from Handsontable demo on renderers
        customerImageRenderer: function (instance, td, row, col, prop, value) {
            var escaped = Handsontable.helper.stringify(value);
            var img;
            var $td = $(td);

            if ( escaped.indexOf('data:image/png') === 0 ) {
                img = document.createElement('IMG');
                img.src = value;

                Handsontable.Dom.addEvent(img, 'mousedown', function (e) {
                    e.preventDefault();
                });

                $td.empty();
                td.appendChild(img);
            } else {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
            }

            $td.addClass('hot-customer-image-cell');

            return td;
        },
        getGetterFunction: function (window_model, column_name) {
            var c = app.utils.convert;
            var f = app.utils.format;
            var getter;

            var getters_hash = {
                width_mm: function (model) {
                    return c.inches_to_mm(model.get('width'));
                },
                height_mm: function (model) {
                    return c.inches_to_mm(model.get('height'));
                },
                dimensions: function (model) {
                    return f.dimensions(model.get('width'), model.get('height'));
                },
                unit_price: function (model) {
                    return model.getUnitPrice();
                },
                subtotal_price: function (model) {
                    return model.getSubtotalPrice();
                }
            };

            if ( getters_hash[column_name] ) {
                getter = getters_hash[column_name];
            } else {
                getter = function (model, attr_name) {
                    return model.get(attr_name);
                };
            }

            return getter.apply(this, arguments);
        },
        //  TODO: use proper format parsers here
        getSetterFunction: function () {
            // var p = app.utils.parseFormat;
            var setter;

            setter = function (model, attr_name, val) {
                return model.set(attr_name, val);
            };

            return setter.apply(this, arguments);
        },
        getColumnData: function (column_name) {
            var self = this;

            return function (window_model, value) {
                if ( window_model ) {
                    if ( _.isUndefined(value) ) {
                        return self.getGetterFunction(window_model, column_name);
                    }

                    self.getSetterFunction(window_model, column_name, value);
                }
            };
        },
        getColumnExtras: function (column_name) {
            var extras_obj = {};
            var extras_hash = {
                width_mm: { readOnly: true },
                height_mm: { readOnly: true },
                dimensions: { readOnly: true },
                unit_price: { readOnly: true },
                subtotal_price: { readOnly: true },
                mark: {
                    width: 100
                },
                customer_image: {
                    width: 300,
                    renderer: this.customerImageRenderer
                }
            };

            if ( extras_hash[column_name] ) {
                extras_obj = _.extend({}, extras_hash[column_name]);
            }

            return extras_obj;
        },
        //  Return all columns
        //  TODO: describe this in a similar fashion as a following method
        getActiveTabColumnOptions: function () {
            var columns = [];

            _.each(this.getActiveTab().columns, function (column_name) {
                var column_obj = _.extend({},
                    { data: this.getColumnData(column_name) },
                    this.getColumnExtras(column_name)
                );

                columns.push(column_obj);
            }, this);

            return columns;
        },
        //  We try to get a proper heading for all columns in our active tab
        //  - first we check if we have some custom headings (mainly to
        //    redefine titles from original Window object or add new columns)
        //  - then we check if original Window object has title for that column
        //  - if both fail, we show just a system name of a column
        getActiveTabHeaders: function () {
            var headers = [];

            _.each(this.getActiveTab().columns, function (column_name) {
                var custom_header = this.getCustomColumnHeader(column_name);
                var original_header = this.collection.getTitles([column_name]);
                var title = '';

                if ( custom_header ) {
                    title = custom_header;
                } else if ( original_header && original_header[0] ) {
                    title = original_header[0];
                } else {
                    title = column_name;
                }

                headers.push(title);
            }, this);

            return headers;
        },
        getCustomColumnHeader: function (column_name) {
            var custom_column_headers_hash = {
                dimensions: 'Dimensions',
                width_mm: 'Width (mm)',
                height_mm: 'Height (mm)',
                unit_price: 'Unit Price',
                subtotal_price: 'Subtotal Price',
            };

            return custom_column_headers_hash[column_name];
        },
        onRender: function () {
            this.hot = new Handsontable(this.ui.$hot_container[0], {
                data: this.collection,
                columns: this.getActiveTabColumnOptions(),
                colHeaders: this.getActiveTabHeaders(),
                rowHeaders: true,
                stretchH: 'all',
                height: 200
            });

            //  TODO: remove this
            var self = this;
            setTimeout(function () {
                self.hot.render();
            }, 100);
        }
    });
})();
