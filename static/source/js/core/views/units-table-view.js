var app = app || {};

(function () {
    'use strict';

    app.UnitsTableView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'units-table-container',
        template: app.templates['core/units-table-view'],
        ui: {
            '$hot_container': '.handsontable-container'
        },
        events: {
            'click .units-table-title': 'toggleTableVisibility',
            'click .js-add-new-unit': 'addNewUnit',
            'click .js-add-new-accessory': 'addNewAccessory',
            'click .nav-tabs a': 'onTabClick',
            'click .js-remove-item': 'onRemoveItem',
            'click .js-move-item-up': 'onMoveItemUp',
            'click .js-move-item-down': 'onMoveItemDown'
        },
        initialize: function () {
            this.table_visibility = this.options.is_always_visible ? 'visible' :
                (this.options.table_visibility ? this.options.table_visibility : 'hidden');

            this.tabs = {
                input: {
                    title: 'Input',
                    collection: this.collection,
                    columns: ['mark', 'quantity', 'width', 'height',
                        'drawing', 'customer_image', 'type', 'description',
                        'notes', 'move_item', 'remove_item']
                },
                specs: {
                    title: 'Specs',
                    collection: this.collection,
                    columns: ['mark', 'quantity', 'width', 'height', 'drawing',
                        'customer_image', 'width_mm', 'height_mm', 'type', 'description',
                        'notes', 'profile_name', 'system', 'external_color', 'internal_color',
                        'interior_handle', 'exterior_handle', 'hardware_type',
                        'lock_mechanism', 'glazing_bead', 'gasket_color',
                        'hinge_style', 'opening_direction', 'threshold',
                        'internal_sill', 'external_sill', 'glazing', 'glazing_bar_width',
                        'uw', 'u_value', 'move_item', 'remove_item']
                },
                prices: {
                    title: 'Prices',
                    collection: this.collection,
                    columns: ['mark', 'quantity', 'original_cost', 'original_currency',
                        'conversion_rate', 'unit_cost', 'price_markup', 'unit_price',
                        'subtotal_price', 'discount', 'unit_price_discounted',
                        'subtotal_price_discounted', 'total_square_feet',
                        'square_feet_price', 'square_feet_price_discounted',
                        'move_item', 'remove_item']
                },
                extras: {
                    title: 'Extras',
                    collection: this.options.extras,
                    columns: ['description', 'quantity', 'extras_type', 'original_cost',
                        'original_currency', 'conversion_rate', 'unit_cost', 'price_markup',
                        'unit_price', 'subtotal_cost', 'subtotal_price',
                        'move_item', 'remove_item']
                },
                project_info: {
                    title: 'Project Info',
                    collection: app.projects,
                    columns: ['pipedrive_id', 'project_name', 'client_name',
                        'client_company_name', 'client_phone', 'client_email',
                        'client_address', 'project_address']
                }
            };
            this.active_tab = 'input';

            this.listenTo(this.collection, 'all', this.updateTable);
            this.listenTo(this.options.extras, 'all', this.updateTable);
            this.listenTo(this.options.parent_view, 'attach', this.updateTable);

            this.listenTo(app.vent, 'paste_image', this.onPasteImage);
        },
        appendPopovers: function () {
            this.$el.popover('destroy');

            this.$el.popover({
                container: 'body',
                html: true,
                selector: '.customer-image, .drawing-preview',
                content: function () {
                    return $(this).clone();
                },
                trigger: 'hover',
                placement: 'top',
                delay: {
                    show: 300
                }
            });

            this.$el.off('show.bs.popover').on('show.bs.popover', function () {
                $('.popover').remove();
            });
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
            if ( !this.options.is_always_visible ) {
                this.table_visibility = this.table_visibility === 'hidden' ? 'visible' : 'hidden';
                this.render();
            }
        },
        addNewUnit: function (e) {
            var new_unit = new app.Unit();

            e.stopPropagation();
            this.collection.add(new_unit);
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
                mode: this.getActiveTab().title === 'Extras' ? 'extras' :
                    (this.getActiveTab().title === 'Project Info' ? 'none' : 'units'),
                table_visibility: this.table_visibility,
                is_always_visible: this.options.is_always_visible
            };
        },
        onRemoveItem: function (e) {
            var target_row = $(e.target).data('row');
            var target_object;

            if ( this.hot ) {
                target_object = this.hot.getData().at(target_row);
                target_object.destroy();
            }
        },
        onMoveItemUp: function (e) {
            var target_row = $(e.target).data('row');
            var target_object;

            if ( this.hot && $(e.target).hasClass('disabled') === false ) {
                target_object = this.hot.getData().at(target_row);
                this.hot.getData().moveItemUp(target_object);
            }
        },
        onMoveItemDown: function (e) {
            var target_row = $(e.target).data('row');
            var target_object;

            if ( this.hot && $(e.target).hasClass('disabled') === false ) {
                target_object = this.hot.getData().at(target_row);
                this.hot.getData().moveItemDown(target_object);
            }
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
        getGetterFunction: function (unit_model, column_name) {
            var f = app.utils.format;
            var getter;

            var getters_hash = {
                width_mm: function (model) {
                    return model.getWidthMM();
                },
                height_mm: function (model) {
                    return model.getHeightMM();
                },
                dimensions: function (model) {
                    return f.dimensions(model.get('width'), model.get('height'));
                },
                unit_cost: function (model) {
                    return model.getUnitCost();
                },
                //  FIXME: disabled due to performance issues, see
                //  https://bitbucket.org/prossimo/prossimo-app/issues/78/handsontable-performance-is-slowwwww
                //  https://bitbucket.org/prossimo/prossimo-app/issues/87/disable-image-preview-in-spreadsheet
                // drawing: function (model) {
                //     return app.preview(model, {
                //         width: 500,
                //         height: 500,
                //         mode: 'base64'
                //     });
                // },
                subtotal_cost: function (model) {
                    return model.getSubtotalCost();
                },
                unit_price: function (model) {
                    return model.getUnitPrice();
                },
                subtotal_price: function (model) {
                    return model.getSubtotalPrice();
                },
                u_value: function (model) {
                    return model.getUValue();
                },
                unit_price_discounted: function (model) {
                    return model.getUnitPriceDiscounted();
                },
                subtotal_price_discounted: function (model) {
                    return model.getSubtotalPriceDiscounted();
                },
                system: function (model) {
                    return model.profile.get('system');
                },
                threshold: function (model) {
                    return model.profile.getThresholdType();
                },
                total_square_feet: function (model) {
                    return model.getTotalSquareFeet();
                },
                square_feet_price: function (model) {
                    return model.getSquareFeetPrice();
                },
                square_feet_price_discounted: function (model) {
                    return model.getSquareFeetPriceDiscounted();
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
        getSetterFunction: function (unit_model, column_name) {
            var p = app.utils.parseFormat;
            var setter;

            var setters_hash = {
                discount: function (model, attr_name, val) {
                    return model.persist(attr_name, p.percent(val));
                },
                width: function (model, attr_name, val) {
                    return model.persist(attr_name, p.dimensions(val, 'width'));
                },
                height: function (model, attr_name, val) {
                    return model.persist(attr_name, p.dimensions(val, 'height'));
                }
            };

            if ( setters_hash[column_name] ) {
                setter = setters_hash[column_name];
            } else {
                setter = function (model, attr_name, val) {
                    return model.persist(attr_name, val);
                };
            }

            return setter.apply(this, arguments);
        },
        getColumnData: function (column_name) {
            var self = this;

            return function (unit_model, value) {
                if ( unit_model ) {
                    if ( _.isUndefined(value) ) {
                        return self.getGetterFunction(unit_model, column_name);
                    }

                    self.getSetterFunction(unit_model, column_name, value);
                }
            };
        },
        getColumnExtraProperties: function (column_name) {
            var properties_obj = {};

            var names_title_type_hash = this.getActiveTab()
                .collection.getNameTitleTypeHash([column_name]);
            var original_type = names_title_type_hash.length &&
                names_title_type_hash[0].type || undefined;

            if ( original_type ) {
                if ( original_type === 'number' ) {
                    properties_obj.type = 'numeric';
                }
            }

            var format_hash = {
                width: { format: '0,0[.]00' },
                height: { format: '0,0[.]00' },
                quantity: { format: '0,0[.]00' },
                original_cost: { format: '0,0[.]00' },
                conversion_rate: { format: '0[.]00000' },
                price_markup: { format: '0,0[.]00' },
                uw: { format: '0[.]00' }
            };

            var properties_hash = {
                width_mm: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('fixed_minimal')
                },
                height_mm: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('fixed_minimal')
                },
                dimensions: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('price_usd')
                },
                unit_cost: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('price_usd')
                },
                subtotal_cost: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('price_usd')
                },
                unit_price: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('price_usd')
                },
                subtotal_price: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('price_usd')
                },
                unit_price_discounted: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('price_usd')
                },
                subtotal_price_discounted: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('price_usd')
                },
                drawing: {
                    readOnly: true,
                    renderer: app.hot_renderers.drawingPreviewRenderer
                },
                u_value: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('fixed', 3)
                },
                system: { readOnly: true },
                threshold: { readOnly: true },
                mark: {
                    width: 100
                },
                customer_image: {
                    renderer: app.hot_renderers.customerImageRenderer
                },
                extras_type: {
                    type: 'dropdown',
                    source: this.options.extras.getExtrasTypes()
                },
                discount: {
                    renderer: app.hot_renderers.getFormattedRenderer('discount')
                },
                profile_name: {
                    type: 'dropdown',
                    source: app.settings.getAvailableProfileNames()
                },
                total_square_feet: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('fixed_minimal')
                },
                square_feet_price: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('price_usd')
                },
                square_feet_price_discounted: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('price_usd')
                },
                move_item: {
                    readOnly: true,
                    renderer: app.hot_renderers.moveItemRenderer
                },
                remove_item: {
                    readOnly: true,
                    renderer: app.hot_renderers.removeItemRenderer
                },
                internal_color: {
                    type: 'autocomplete',
                    source: app.settings.getColors()
                },
                external_color: {
                    type: 'autocomplete',
                    source: app.settings.getColors()
                },
                interior_handle: {
                    type: 'autocomplete',
                    source: app.settings.getInteriorHandleTypes()
                },
                hinge_style: {
                    type: 'autocomplete',
                    source: app.settings.getHingeTypes()
                },
                glazing_bead: {
                    type: 'autocomplete',
                    source: app.settings.getGlazingBeadTypes()
                },
                glazing: {
                    type: 'autocomplete',
                    source: app.settings.getGlassOrPanelTypes()
                },
                glazing_bar_width: {
                    type: 'autocomplete',
                    source: app.settings.getGlazingBarWidths()
                },
                gasket_color: {
                    type: 'autocomplete',
                    source: app.settings.getGasketColors()
                },
                exterior_handle: {
                    renderer: app.hot_renderers.doorOnlyRenderer
                },
                lock_mechanism: {
                    renderer: app.hot_renderers.doorOnlyRenderer
                },
                pipedrive_id: {
                    readOnly: true
                }
            };


            if ( format_hash[column_name] ) {
                properties_obj = _.extend(properties_obj, format_hash[column_name]);
            }

            if ( properties_hash[column_name] ) {
                properties_obj = _.extend(properties_obj, properties_hash[column_name]);
            }

            if ( _.indexOf(this.tabs.project_info.columns, column_name) !== -1 ) {
                properties_obj = _.extend(properties_obj, {
                    renderer: app.hot_renderers.projectInfoRenderer
                });
            }

            return properties_obj;
        },
        //  Return all columns
        //  TODO: describe this in a similar fashion as a following method
        getActiveTabColumnOptions: function () {
            var columns = [];

            _.each(this.getActiveTab().columns, function (column_name) {
                var column_obj = _.extend({},
                    { data: this.getColumnData(column_name) },
                    this.getColumnExtraProperties(column_name)
                );

                columns.push(column_obj);
            }, this);

            return columns;
        },
        //  We try to get a proper heading for all columns in our active tab
        //  - first we check if we have some custom headings (mainly to
        //    redefine titles from original Unit object or add new columns)
        //  - then we check if original Unit object has title for that column
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
                u_value: 'U Value',
                unit_price_discounted: 'Unit Price w/Disc.',
                subtotal_price_discounted: 'Subtotal Price w/Disc.',
                system: 'System',
                threshold: 'Threshold',
                total_square_feet: 'Total Sq.Ft',
                square_feet_price: 'Price per Sq.Ft',
                square_feet_price_discounted: 'Price per Sq.Ft w/Disc.',
                move_item: 'Move',
                remove_item: ' '
            };

            return custom_column_headers_hash[column_name];
        },
        updateTable: function () {
            if ( this.hot ) {
                this.hot.render();
            }
        },
        onRender: function () {
            var self = this;
            var fixed_columns = ['mark', 'quantity', 'width', 'height', 'drawing'];
            var active_tab_columns = self.getActiveTab().columns;
            var fixed_columns_count = 0;

            _.each(fixed_columns, function (column) {
                if ( _.indexOf(active_tab_columns, column) !== -1 ) {
                    fixed_columns_count += 1;
                }
            });

            //  We use setTimeout because we want to wait until flexbox
            //  sizes are calculated properly
            setTimeout(function () {
                self.hot = new Handsontable(self.ui.$hot_container[0], {
                    data: self.getActiveTab().collection,
                    columns: self.getActiveTabColumnOptions(),
                    colHeaders: self.getActiveTabHeaders(),
                    rowHeaders: true,
                    trimDropdown: false,
                    maxRows: function () {
                        return self.getActiveTab().collection.length;
                    },
                    fixedColumnsLeft: fixed_columns_count
                });
            }, 5);

            this.appendPopovers();
        },
        onDestroy: function () {
            this.$el.off('show.bs.popover');
            this.$el.popover('destroy');

            if ( this.hot ) {
                this.hot.destroy();
            }
        }
    });
})();
