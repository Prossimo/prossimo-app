var app = app || {};

(function () {
    'use strict';

    app.UnitsTableView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'units-table-container',
        template: app.templates['core/units-table-view'],
        ui: {
            $total_prices_container: '.units-table-total-prices-container',
            $hot_container: '.handsontable-container'
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
            this.table_update_timeout = null;
            this.dropdown_scroll_timer = null;
            this.table_visibility = this.options.is_always_visible ? 'visible' :
                (this.options.table_visibility ? this.options.table_visibility : 'hidden');

            this.tabs = {
                specs: {
                    title: 'Specs',
                    collection: this.collection,
                    columns: ['mark', 'quantity', 'width', 'height', 'drawing',
                        'customer_image', 'width_mm', 'height_mm', 'rough_opening', 'description',
                        'notes', 'exceptions', 'profile_name', 'system', 'external_color',
                        'internal_color', 'interior_handle', 'exterior_handle', 'hardware_type',
                        'lock_mechanism', 'glazing_bead', 'gasket_color',
                        'hinge_style', 'opening_direction', 'threshold',
                        'internal_sill', 'external_sill', 'glazing', 'glazing_bar_type', 'glazing_bar_width',
                        'uw', 'u_value', 'move_item', 'remove_item']
                },
                prices: {
                    title: 'Prices',
                    collection: this.collection,
                    columns: ['mark', 'quantity', 'width', 'height', 'drawing', 'width_mm', 'height_mm',
                        'original_cost', 'original_currency', 'conversion_rate', 'unit_cost', 'subtotal_cost',
                        'supplier_discount', 'unit_cost_discounted', 'subtotal_cost_discounted', 'price_markup',
                        'unit_price', 'subtotal_price', 'discount', 'unit_price_discounted',
                        'subtotal_price_discounted', 'subtotal_profit', 'total_square_feet', 'square_feet_price',
                        'square_feet_price_discounted', 'move_item', 'remove_item']
                },
                extras: {
                    title: 'Extras',
                    collection: this.options.extras,
                    columns: ['description', 'quantity', 'extras_type', 'original_cost',
                        'original_currency', 'conversion_rate', 'unit_cost', 'price_markup',
                        'unit_price', 'subtotal_cost', 'subtotal_price', 'subtotal_profit',
                        'move_item', 'remove_item']
                },
                project_info: {
                    title: 'Project Info',
                    collection: app.projects,
                    columns: ['pipedrive_id', 'project_name', 'client_name',
                        'client_company_name', 'client_phone', 'client_email',
                        'client_address', 'project_address', 'quote_date',
                        'quote_revision', 'quote_number']
                }
            };
            this.active_tab = 'specs';

            this.listenTo(this.collection, 'all', this.updateTable);
            this.listenTo(this.options.extras, 'all', this.updateTable);
            this.listenTo(app.projects, 'all', this.updateTable);
            this.listenTo(this.options.parent_view, 'attach', this.updateTable);

            this.listenTo(app.current_project.settings, 'change', this.render);

            this.listenTo(this.collection, 'invalid', this.showValidationError);
            this.listenTo(this.options.extras, 'invalid', this.showValidationError);
            this.listenTo(app.projects, 'invalid', this.showValidationError);

            this.listenTo(app.vent, 'paste_image', this.onPasteImage);
        },
        appendPopovers: function () {
            this.$el.popover('destroy');
            $('.popover').remove();

            this.$el.popover({
                container: 'body',
                html: true,
                selector: '.customer-image, .drawing-preview',
                content: function () {
                    return $(this).clone();
                },
                trigger: 'hover',
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
            var new_position = this.collection.length ? this.collection.getMaxPosition() + 1 : 0;
            var new_unit = new app.Unit({
                position: new_position
            });

            e.stopPropagation();
            this.collection.add(new_unit);
        },
        addNewAccessory: function (e) {
            var new_position = this.options.extras.length ? this.options.extras.getMaxPosition() + 1 : 0;
            var new_accessory = new app.Accessory({
                position: new_position
            });

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
                target_object = this.hot.getSourceData().at(target_row);
                target_object.destroy();
            }
        },
        onMoveItemUp: function (e) {
            var target_row = $(e.target).data('row');
            var target_object;

            if ( this.hot && $(e.target).hasClass('disabled') === false ) {
                target_object = this.hot.getSourceData().at(target_row);
                this.hot.getSourceData().moveItemUp(target_object);
            }
        },
        onMoveItemDown: function (e) {
            var target_row = $(e.target).data('row');
            var target_object;

            if ( this.hot && $(e.target).hasClass('disabled') === false ) {
                target_object = this.hot.getSourceData().at(target_row);
                this.hot.getSourceData().moveItemDown(target_object);
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
            var project_settings = app.settings.getProjectSettings();
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
                    return f.dimensions(model.get('width'), model.get('height'), null,
                        project_settings.get('inches_display_mode') || null);
                },
                unit_cost: function (model) {
                    return model.getUnitCost();
                },
                unit_cost_discounted: function (model) {
                    return model.getUnitCostDiscounted();
                },
                drawing: function (model) {
                    return app.preview(model, {
                        width: 600,
                        height: 600,
                        mode: 'base64',
                        position: 'outside'
                    });
                },
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
                subtotal_cost_discounted: function (model) {
                    return model.getSubtotalCostDiscounted();
                },
                subtotal_profit: function (model) {
                    return model.getSubtotalProfit();
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
                },
                quote_number: function (model) {
                    return model.getQuoteNumber();
                },
                original_cost: function (model) {
                    return model.getOriginalCost();
                },
                rough_opening: function (model) {
                    return f.dimensions(model.getRoughOpeningWidth(), model.getRoughOpeningHeight(), null,
                        project_settings.get('inches_display_mode') || null);
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
        getSetterParser: function (column_name) {
            var p = app.utils.parseFormat;
            var parser;

            var parsers_hash = {
                discount: function (attr_name, val) {
                    return p.percent(val);
                },
                supplier_discount: function (attr_name, val) {
                    return p.percent(val);
                },
                width: function (attr_name, val) {
                    return p.dimensions(val, 'width');
                },
                height: function (attr_name, val) {
                    return p.dimensions(val, 'height');
                },
                glazing_bar_width: function (attr_name, val) {
                    return parseFloat(val);
                }
            };

            if ( parsers_hash[column_name] ) {
                parser = parsers_hash[column_name];
            } else {
                parser = function (attr_name, val) {
                    return val;
                };
            }

            return parser.apply(this, arguments);
        },
        getSetterFunction: function (unit_model, column_name) {
            var self = this;
            var setter;

            setter = function (model, attr_name, val) {
                return model.persist(attr_name, self.getSetterParser(column_name, val));
            };

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
        showValidationError: function (model, error) {
            if ( this.hot && model.collection === this.getActiveTab().collection ) {
                var hot = this.hot;
                var self = this;

                var row_index = model.collection.indexOf(model);
                var col_index = _.indexOf(this.getActiveTab().columns, error.attribute_name);
                var target_cell = hot.getCell(row_index, col_index);
                var $target_cell = $(target_cell);

                $target_cell.popover({
                    container: 'body',
                    title: 'Validation Error',
                    content: error.error_message,
                    trigger: 'manual'
                });

                $target_cell.popover('show');

                setTimeout(function () {
                    $target_cell.popover('destroy');
                    hot.setCellMeta(row_index, col_index, 'valid', true);
                    self.updateTable();
                }, 5000);
            }
        },
        getColumnValidator: function (column_name) {
            var self = this;
            var validator;

            validator = function (value, callback) {
                var attributes_object = {};
                var model = this.instance.getSourceData().at(this.row);

                attributes_object[column_name] = self.getSetterParser(column_name, value);

                if ( !model.validate || !model.validate(attributes_object, { validate: true }) ) {
                    callback(true);
                } else {
                    callback(false);
                }
            };

            return validator;
        },
        getColumnExtraProperties: function (column_name) {
            var project_settings = app.settings.getProjectSettings();
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
                quantity: { format: '0,0[.]00' },
                original_cost: { format: '0,0[.]00' },
                conversion_rate: { format: '0[.]00000' },
                price_markup: { format: '0,0[.]00' },
                uw: { format: '0[.]00' }
            };

            var properties_hash = {
                width: {
                    renderer: app.hot_renderers.getFormattedRenderer('dimension', null,
                        project_settings.get('inches_display_mode') || null)
                },
                height: {
                    renderer: app.hot_renderers.getFormattedRenderer('dimension', null,
                        project_settings.get('inches_display_mode') || null)
                },
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
                    renderer: app.hot_renderers.getFormattedRenderer('align_right')
                },
                unit_cost: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('price_usd')
                },
                unit_cost_discounted: {
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
                    renderer: app.hot_renderers.getFormattedRenderer('percent')
                },
                supplier_discount: {
                    renderer: app.hot_renderers.getFormattedRenderer('percent')
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
                    type: 'dropdown',
                    source: _.union(
                        app.settings.getColors(),
                        this.getActiveTab().collection.pluck('internal_color')
                    ).sort()
                },
                external_color: {
                    type: 'dropdown',
                    source: _.union(
                        app.settings.getColors(),
                        this.getActiveTab().collection.pluck('external_color')
                    ).sort()
                },
                interior_handle: {
                    type: 'dropdown',
                    source: _.union(
                        app.settings.getInteriorHandleTypes(),
                        this.getActiveTab().collection.pluck('interior_handle')
                    ).sort()
                },
                hinge_style: {
                    type: 'dropdown',
                    source: _.union(
                        app.settings.getHingeTypes(),
                        this.getActiveTab().collection.pluck('hinge_style')
                    ).sort()
                },
                glazing_bead: {
                    type: 'dropdown',
                    source: _.union(
                        app.settings.getGlazingBeadTypes(),
                        this.getActiveTab().collection.pluck('glazing_bead')
                    ).sort()
                },
                glazing: {
                    type: 'dropdown',
                    source: app.settings.getAvailableFillingTypeNames()
                },
                glazing_bar_type: {
                    type: 'dropdown',
                    source: _.union(
                        app.settings.getGlazingBarTypes(),
                        this.getActiveTab().collection.pluck('glazing_bar_type')
                    ).sort()
                },
                glazing_bar_width: {
                    type: 'dropdown',
                    source: app.settings.getGlazingBarWidths().map(function (item) {
                        return item.toString();
                    })
                },
                gasket_color: {
                    type: 'dropdown',
                    source: _.union(
                        app.settings.getGasketColors(),
                        this.getActiveTab().collection.pluck('gasket_color')
                    ).sort()
                },
                opening_direction: {
                    type: 'dropdown',
                    source: app.settings.getOpeningDirections()
                },
                pipedrive_id: {
                    readOnly: true
                },
                quote_date: {
                    type: 'date',
                    dateFormat: 'DD MMMM, YYYY',
                    correctFormat: true
                },
                quote_number: {
                    readOnly: true
                },
                subtotal_profit: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('price_usd', true)
                },
                subtotal_cost_discounted: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('price_usd')
                },
                original_cost: {
                    readOnly: project_settings && project_settings.get('pricing_mode') === 'estimates'
                },
                rough_opening: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('align_right')
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
                var column_obj = _.extend({}, {
                    data: this.getColumnData(column_name),
                    validator: this.getColumnValidator(column_name)
                }, this.getColumnExtraProperties(column_name));

                columns.push(column_obj);
            }, this);

            return columns;
        },
        //  Redefine some cell-specific properties. This is mostly used to
        //  prevent editing of some attributes that shouldn't be editable for
        //  a certain unit / accessory / project
        getActiveTabCellsSpecificOptions: function () {
            var self = this;

            return function (row, col) {
                var cell_properties = {};
                var item = this.instance.getSourceData().at(row);
                var property = self.getActiveTab().columns[col];

                if ( item && item instanceof app.Unit ) {
                    //  Gray out attrs that don't apply to the current unit
                    if ( item.isDoorOnlyAttribute(property) && !item.isDoorType() ) {
                        cell_properties.readOnly = true;
                        cell_properties.renderer = app.hot_renderers.disabledPropertyRenderer;
                    } else if ( item.isOperableOnlyAttribute(property) && !item.hasOperableSections() ) {
                        cell_properties.readOnly = true;
                        cell_properties.renderer = app.hot_renderers.disabledPropertyRenderer;
                    } else if ( item.isGlazingBarProperty(property) && !item.hasGlazingBars() ) {
                        cell_properties.readOnly = true;
                        cell_properties.renderer = app.hot_renderers.disabledPropertyRenderer;
                    }
                }

                return cell_properties;
            };
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
            var project_settings = app.settings.getProjectSettings();

            var custom_column_headers_hash = {
                width: 'Width, in',
                height: 'Height, in',
                drawing: 'Drawing',
                width_mm: 'Width, mm',
                height_mm: 'Height, mm',
                dimensions: 'Dimensions',
                rough_opening: 'Rough Opening',
                customer_image: 'Customer Img.',
                system: 'System',
                external_color: 'Color Ext.',
                internal_color: 'Color Int.',
                opening_direction: 'Opening Dir.',
                threshold: 'Threshold',
                glazing_bar_type: 'Muntin Type',
                u_value: 'U Value',
                move_item: 'Move',
                remove_item: ' ',
                original_cost: project_settings && project_settings.get('pricing_mode') === 'estimates' ?
                    'Orig. Cost (est.)' : 'Orig. Cost',
                original_currency: 'Orig. Curr.',
                conversion_rate: 'Conv. Rate',
                unit_cost: 'Unit Cost',
                subtotal_cost: 'Subt. Cost',
                supplier_discount: 'Suppl. Disc.',
                unit_cost_discounted: 'Unit Cost w/D',
                subtotal_cost_discounted: 'Subt. Cost w/D',
                unit_price: 'Unit Price',
                subtotal_price: 'Subt. Price',
                unit_price_discounted: 'Unit Price w/D',
                subtotal_price_discounted: 'Subt. Price w/D',
                total_square_feet: 'Total ft<sup>2</sup>',
                square_feet_price: 'Price / ft<sup>2</sup>',
                square_feet_price_discounted: 'Price / ft<sup>2</sup> w/D',
                subtotal_profit: 'Subt. Profit',
                quote_revision: 'Quote Rev.',
                quote_number: 'Quote #'
            };

            return custom_column_headers_hash[column_name];
        },
        updateTable: function (e) {
            var self = this;

            //  We don't want to update table on validation errors, we have
            //  a special function for that
            if ( e === 'invalid' ) {
                return;
            }

            if ( this.hot ) {
                clearTimeout(this.table_update_timeout);
                this.table_update_timeout = setTimeout(function () {
                    if ( !self.isDestroyed ) {
                        self.hot.loadData(self.getActiveTab().collection);
                    }
                }, 20);
            }

            this.appendPopovers();
        },
        getActiveTabColWidths: function () {
            var col_widths = {
                mark: 60,
                customer_image: 100,
                dimensions: 120,
                rough_opening: 120,
                description: 240,
                notes: 240,
                exceptions: 240,
                profile_name: 200,
                system: 200,
                external_color: 100,
                internal_color: 100,
                interior_handle: 160,
                exterior_handle: 160,
                hardware_type: 120,
                lock_mechanism: 120,
                glazing_bead: 100,
                gasket_color: 100,
                hinge_style: 280,
                opening_direction: 100,
                internal_sill: 100,
                external_sill: 100,
                glazing: 300,
                glazing_bar_type: 140,
                glazing_bar_width: 120,
                remove_item: 65,
                original_cost: 100,
                unit_cost: 100,
                subtotal_cost: 100,
                unit_cost_discounted: 100,
                subtotal_cost_discounted: 100,
                price_markup: 60,
                unit_price: 100,
                subtotal_price: 100,
                unit_price_discounted: 100,
                subtotal_price_discounted: 100,
                subtotal_profit: 100,
                square_feet_price_discounted: 100,
                extras_type: 100,
                pipedrive_id: 100,
                project_name: 240,
                client_name: 120,
                client_company_name: 160,
                client_phone: 180,
                client_email: 220,
                client_address: 300,
                project_address: 300,
                quote_date: 120
            };

            var widths_table = _.map(this.getActiveTab().columns, function (item) {
                return col_widths[item] ? col_widths[item] : 80;
            }, this);

            return widths_table;
        },
        onRender: function () {
            var is_visible = this.options.is_always_visible ||
                this.table_visibility === 'visible';

            if ( is_visible ) {
                var self = this;
                var dropdown_scroll_reset = false;

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
                        cells: self.getActiveTabCellsSpecificOptions(),
                        colHeaders: self.getActiveTabHeaders(),
                        rowHeaders: true,
                        rowHeights: function () {
                            return _.contains(self.getActiveTab().columns, 'drawing') ||
                                _.contains(self.getActiveTab().columns, 'customer_image') ? 52 : 25;
                        },
                        colWidths: self.getActiveTabColWidths(),
                        trimDropdown: false,
                        maxRows: function () {
                            return self.getActiveTab().collection.length;
                        },
                        fixedColumnsLeft: fixed_columns_count,
                        viewportRowRenderingOffset: 300,
                        viewportColumnRenderingOffset: 50
                    });
                }, 5);

                this.appendPopovers();

                clearInterval(this.dropdown_scroll_timer);
                this.dropdown_scroll_timer = setInterval(function () {
                    var editor = self.hot && self.hot.getActiveEditor();

                    if ( editor && editor.htContainer && !dropdown_scroll_reset ) {
                        dropdown_scroll_reset = true;
                        editor.htContainer.scrollIntoView(false);
                    } else {
                        dropdown_scroll_reset = false;
                    }
                }, 100);

                if ( this.total_prices_view ) {
                    this.total_prices_view.destroy();
                }

                this.total_prices_view = new app.UnitsTableTotalPricesView({
                    model: app.current_project,
                    units: this.collection,
                    extras: this.options.extras
                });

                this.ui.$total_prices_container.append(this.total_prices_view.render().el);
            }
        },
        onDestroy: function () {
            clearInterval(this.dropdown_scroll_timer);
            this.$el.off('show.bs.popover');
            this.$el.popover('destroy');

            if ( this.hot ) {
                this.hot.destroy();
            }

            if ( this.total_prices_view ) {
                this.total_prices_view.destroy();
            }
        }
    });
})();
