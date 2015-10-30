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
            'click .js-add-new-accessory': 'addNewAccessory',
            'click .nav-tabs a': 'onTabClick'
        },
        initialize: function () {
            // this.table_visibility = 'hidden';
            this.table_visibility = 'visible';

            this.tabs = {
                input: {
                    title: 'Input',
                    collection: this.collection,
                    columns: ['mark', 'quantity', 'width', 'height',
                        'customer_image', 'type', 'description', 'notes']
                },
                specs: {
                    title: 'Specs',
                    collection: this.collection,
                    columns: ['mark', 'quantity', 'width', 'height', 'width_mm',
                        'height_mm', 'customer_image', 'drawing', 'type', 'description',
                        'notes', 'system', 'external_color', 'internal_color', 'gasket_color',
                        'hinge_style', 'opening_direction', 'threshold', 'internal_sill',
                        'external_sill', 'glazing', 'uw', 'uw_ip']
                },
                prices: {
                    title: 'Prices',
                    collection: this.collection,
                    columns: ['mark', 'quantity', 'original_cost', 'original_currency',
                        'conversion_rate', 'unit_cost', 'price_markup', 'unit_price',
                        'subtotal_price', 'discount', 'unit_price_discounted',
                        'subtotal_price_discounted']
                },
                extras: {
                    title: 'Extras',
                    collection: this.options.extras,
                    columns: ['description', 'quantity', 'original_cost', 'original_currency',
                        'conversion_rate', 'unit_cost', 'price_markup', 'unit_price',
                        'subtotal_cost', 'subtotal_price']
                }
            };
            this.active_tab = 'input';

            //  TODO: remake this, see issue #3
            this.listenTo(this.collection, 'all', this.render);
            this.listenTo(this.options.extras, 'all', this.render);

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
        addNewAccessory: function (e) {
            var new_accessory = new app.Accessory();

            e.stopPropagation();
            this.options.extras.add(new_accessory);
        },
        serializeData: function () {
            return {
                tabs: _.each(this.tabs, function (item, key) {
                    item.is_active = key === this.active_tab;
                    return item;
                }, this),
                mode: this.getActiveTab().title === 'Extras' ? 'extras' : 'windows',
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
                // discount: function (model) {
                //     return f.percent(model.get('discount'));
                // },
                unit_cost: function (model) {
                    return f.price_usd(model.getUnitCost());
                },
                subtotal_cost: function (model) {
                    return f.price_usd(model.getSubtotalCost());
                },
                unit_price: function (model) {
                    return f.price_usd(model.getUnitPrice());
                },
                subtotal_price: function (model) {
                    return f.price_usd(model.getSubtotalPrice());
                },
                uw_ip: function (model) {
                    return model.getUwIp();
                },
                unit_price_discounted: function (model) {
                    return f.price_usd(model.getUnitPriceDiscounted());
                },
                subtotal_price_discounted: function (model) {
                    return f.price_usd(model.getSubtotalPriceDiscounted());
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
                unit_cost: { readOnly: true },
                subtotal_cost: { readOnly: true },
                unit_price: { readOnly: true },
                subtotal_price: { readOnly: true },
                unit_price_discounted: { readOnly: true },
                subtotal_price_discounted: { readOnly: true },
                drawing: { readOnly: true },
                uw_ip: { readOnly: true },
                mark: {
                    width: 100
                },
                customer_image: {
                    // width: 300,
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
            var active_tab = this.getActiveTab();

            _.each(active_tab.columns, function (column_name) {
                var custom_header = this.getCustomColumnHeader(column_name);
                var original_header = active_tab.collection.getTitles([column_name]);
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
                unit_cost: 'Unit Cost',
                subtotal_cost: 'Subtotal Cost',
                unit_price: 'Unit Price',
                subtotal_price: 'Subtotal Price',
                drawing: 'Drawing',
                uw_ip: 'Uw-IP',
                unit_price_discounted: 'Unit Price w/Disc.',
                subtotal_price_discounted: 'Subtotal Price w/Disc.'
            };

            return custom_column_headers_hash[column_name];
        },
        onRender: function () {
            this.hot = new Handsontable(this.ui.$hot_container[0], {
                data: this.getActiveTab().collection,
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
