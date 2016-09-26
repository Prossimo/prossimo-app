var app = app || {};

(function () {
    'use strict';

    var UNSET_VALUE = '--';

    app.UnitsTableView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'units-table-container',
        template: app.templates['core/units-table-view'],
        ui: {
            $total_prices_container: '.units-table-total-prices-container',
            $hot_container: '.handsontable-container',
            $add_new_unit: '.js-add-new-unit',
            $add_new_accessory: '.js-add-new-accessory',
            $undo: '.js-undo',
            $redo: '.js-redo',
            $remove: '.js-remove-selected-items',
            $clone: '.js-clone-selected-items'
        },
        events: {
            'click .units-table-title': 'toggleTableVisibility',
            'click @ui.$add_new_unit': 'addNewUnit',
            'click @ui.$add_new_accessory': 'addNewAccessory',
            'click .nav-tabs a': 'onTabClick',
            'click .js-move-item-up': 'onMoveItemUp',
            'click .js-move-item-down': 'onMoveItemDown',
            'click @ui.$undo': 'onUndo',
            'click @ui.$redo': 'onRedo',
            'click @ui.$remove': 'onRemoveSelected',
            'click @ui.$clone': 'onCloneSelected'
        },
        keyShortcuts: {
            n: 'onNewUnitOrAccessory',
            'ctrl+z': 'onUndo',
            'command+z': 'onUndo',
            'ctrl+shift+z': 'onRedo',
            'command+shift+z': 'onRedo',
            'ctrl+y': 'onRedo',
            'command+y': 'onRedo'
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
                    columns: ['move_item', 'mark', 'quantity', 'width', 'height', 'drawing',
                        'customer_image', 'width_mm', 'height_mm', 'rough_opening', 'description',
                        'notes', 'exceptions', 'profile_id', 'system', 'opening_direction', 'threshold',
                        'glazing', 'glazing_bar_width', 'uw', 'u_value']
                },
                unit_options: {
                    title: 'Unit Options',
                    collection: this.collection,
                    columns: ['move_item', 'mark', 'quantity', 'width', 'height', 'drawing'],
                    unit_options_columns: app.settings.getAvailableDictionaryNames()
                },
                prices: {
                    title: 'Prices',
                    collection: this.collection,
                    columns: ['move_item', 'mark', 'quantity', 'width', 'height', 'drawing', 'width_mm', 'height_mm',
                        'original_cost', 'original_currency', 'conversion_rate', 'unit_cost', 'subtotal_cost',
                        'supplier_discount', 'unit_cost_discounted', 'subtotal_cost_discounted', 'price_markup',
                        'unit_price', 'subtotal_price', 'discount', 'unit_price_discounted',
                        'subtotal_price_discounted', 'subtotal_profit', 'total_square_feet', 'square_feet_price',
                        'square_feet_price_discounted']
                },
                extras: {
                    title: 'Extras',
                    collection: this.options.extras,
                    columns: ['move_item', 'description', 'quantity', 'extras_type', 'original_cost',
                        'original_currency', 'conversion_rate', 'unit_cost', 'price_markup',
                        'unit_price', 'subtotal_cost', 'subtotal_price', 'subtotal_profit']
                }
            };
            this.active_tab = 'specs';

            //  If we have no columns for Unit Options tab, don't show the tab
            if ( !this.tabs.unit_options.unit_options_columns.length ) {
                delete this.tabs.unit_options;
            } else {
                this.tabs.unit_options.columns = _.union(
                    this.tabs.unit_options.columns,
                    this.tabs.unit_options.unit_options_columns
                );
            }

            this.undo_manager = new app.UndoManager({
                register: this.collection,
                track: true
            });

            this.selected = [];

            this.listenTo(this.collection, 'all', this.updateTable);
            this.listenTo(this.options.extras, 'all', this.updateTable);
            this.listenTo(this.options.parent_view, 'attach', this.updateTable);

            this.listenTo(app.current_project.settings, 'change', this.render);

            this.listenTo(this.collection, 'invalid', this.showValidationError);
            this.listenTo(this.options.extras, 'invalid', this.showValidationError);

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
            var previous_collection;
            var active_collection;

            if ( _.contains(_.keys(this.tabs), tab_name) ) {
                previous_collection = this.getActiveTab().collection;
                this.active_tab = tab_name;
                active_collection = this.getActiveTab().collection;

                if ( previous_collection !== active_collection ) {
                    this.undo_manager.manager.clear();
                    this.undo_manager.manager.unregisterAll();
                    this.undo_manager.manager.register(active_collection);
                }
            }
        },
        onTabClick: function (e) {
            var target = $(e.target).attr('href').replace('#', '');

            e.preventDefault();
            this.setActiveTab(target);
            this.render();
        },
        onUndo: function () {
            this.undo_manager.handler.undo();
            this.ui.$undo.blur();
        },
        onRedo: function () {
            this.undo_manager.handler.redo();
            this.ui.$redo.blur();
        },
        onRemoveSelected: function () {
            if ( this.selected.length && this.hot ) {
                for (var i = this.selected.length - 1; i >= 0; i--) {
                    this.hot.getSourceData().at(this.selected[i]).destroy();
                }

                this.selected = [];
                this.hot.selectCell(0, 0, 0, 0, false);
                this.hot.deselectCell();
            }
        },
        onCloneSelected: function () {
            if ( this.selected.length === 1 && this.hot ) {
                var selectedData = this.hot.getSourceData().at(this.selected[0]);

                if (!selectedData.hasOnlyDefaultAttributes()) {
                    selectedData.duplicate();
                }
            }
        },
        toggleTableVisibility: function () {
            if ( !this.options.is_always_visible ) {
                this.table_visibility = this.table_visibility === 'hidden' ? 'visible' : 'hidden';
                this.render();
            }
        },
        addNewUnit: function () {
            var new_position = this.collection.length ? this.collection.getMaxPosition() + 1 : 0;
            var new_unit = new app.Unit({
                position: new_position
            });

            this.collection.add(new_unit);
            this.ui.$add_new_unit.blur();
        },
        addNewAccessory: function () {
            var new_position = this.options.extras.length ? this.options.extras.getMaxPosition() + 1 : 0;
            var new_accessory = new app.Accessory({
                position: new_position
            });

            this.options.extras.add(new_accessory);
            this.ui.$add_new_accessory.blur();
        },
        onNewUnitOrAccessory: function (e) {
            var active_tab = this.getActiveTab();

            if ( this.table_visibility === 'visible' && active_tab.collection === this.collection ) {
                this.addNewUnit(e);
            } else if ( this.table_visibility === 'visible' && active_tab.collection === this.options.extras ) {
                this.addNewAccessory(e);
            }
        },
        serializeData: function () {
            return {
                tabs: _.each(this.tabs, function (item, key) {
                    item.is_active = key === this.active_tab;
                    return item;
                }, this),
                mode: this.getActiveTab().title === 'Extras' ? 'extras' : 'units',
                table_visibility: this.table_visibility,
                is_always_visible: this.options.is_always_visible
            };
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
                height: function (model) {
                    return model.getTrapezoidHeight();
                },
                width_mm: function (model) {
                    return model.getWidthMM();
                },
                height_mm: function (model) {
                    return model.getTrapezoidHeightMM();
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
                        position: 'outside',
                        hingeIndicatorMode: project_settings && project_settings.get('hinge_indicator_mode')
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
            } else if (
                this.active_tab === 'unit_options' &&
                _.contains(this.getActiveTab().unit_options_columns, column_name)
            ) {
                //  TODO: deal with multiple values per dictionary somehow
                getter = function (model, attr_name) {
                    var target_dictionary_id = app.settings.getDictionaryIdByName(attr_name);
                    var current_options = target_dictionary_id ?
                        model.getCurrentUnitOptionsByDictionaryId(target_dictionary_id) : [];

                    return current_options.length ? current_options[0].get('name') : UNSET_VALUE;
                };
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
                },
                //  Try to find profile by id first, then try by name
                profile_id: function (attr_name, val) {
                    var profile_id = null;
                    var profile_by_id =
                        ( parseInt(val).toString() === val || parseInt(val) === val ) &&
                        app.settings && app.settings.getProfileByIdOrDummy(parseInt(val));
                    var profile_id_by_name = app.settings && app.settings.getProfileIdByName(val);

                    if ( profile_by_id && profile_by_id.get('is_dummy') !== true ) {
                        profile_id = profile_by_id.get('id');
                    } else if ( profile_id_by_name ) {
                        profile_id = profile_id_by_name;
                    }

                    return profile_id;
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

            var setters_hash = {
                width: function (model, attr_name, val) {
                    return model.updateDimension(attr_name, self.getSetterParser(column_name, val));
                },
                height: function (model, attr_name, val) {
                    return model.updateDimension(attr_name, self.getSetterParser(column_name, val));
                }
            };

            if ( setters_hash[column_name] ) {
                setter = setters_hash[column_name];
            } else if (
                this.active_tab === 'unit_options' &&
                _.contains(this.getActiveTab().unit_options_columns, column_name)
            ) {
                setter = function (model, attr_name, val) {
                    var target_dictionary_id = app.settings.getDictionaryIdByName(attr_name);

                    if ( target_dictionary_id ) {
                        var target_entry_id = app.settings.getDictionaryEntryIdByName(target_dictionary_id, val);

                        if ( target_entry_id ) {
                            return model.persistOption(target_dictionary_id, target_entry_id);
                        } else if ( val === UNSET_VALUE ) {
                            return model.persistOption(target_dictionary_id, false);
                        }
                    }
                };
            } else {
                setter = function (model, attr_name, val) {
                    return model.persist(attr_name, self.getSetterParser(column_name, val));
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

                attributes_object[column_name] = self.getSetterParser(column_name, value, model);

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
                    renderer: app.hot_renderers.getFormattedRenderer('dimension_heights', null,
                        project_settings.get('inches_display_mode') || null)
                },
                width_mm: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('fixed_minimal')
                },
                height_mm: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('fixed_heights')
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
                profile_id: {
                    type: 'dropdown',
                    source: app.settings.getAvailableProfileNames(),
                    renderer: app.hot_renderers.unitProfileRenderer
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
                glazing: {
                    type: 'dropdown',
                    source: app.settings.getAvailableFillingTypeNames()
                },
                glazing_bar_width: {
                    type: 'dropdown',
                    source: app.settings.getGlazingBarWidths().map(function (item) {
                        return item.toString();
                    })
                },
                opening_direction: {
                    type: 'dropdown',
                    source: app.settings.getOpeningDirections()
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

            return properties_obj;
        },
        //  Returns column data in a HoT-specific format, for each column we
        //  prepare the following:
        //  - data function, a combination of getter and setter
        //  - validation function (wrapper around model validation)
        //  - various extra properties, depending on colulmn name or type
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
        //  a certain unit / accessory
        getActiveTabCellsSpecificOptions: function () {
            var self = this;

            return function (row, col) {
                var cell_properties = {};
                var item = this.instance.getSourceData().at(row);
                var property = self.getActiveTab().columns[col];

                if ( item && item instanceof app.Unit ) {
                    if ( item.isOperableOnlyAttribute(property) && !item.hasOperableSections() ) {
                        cell_properties.readOnly = true;
                        cell_properties.renderer = app.hot_renderers.getDisabledPropertyRenderer('(Operable Only)');
                    } else if ( item.isGlazingBarProperty(property) && !item.hasGlazingBars() ) {
                        cell_properties.readOnly = true;
                        cell_properties.renderer = app.hot_renderers.getDisabledPropertyRenderer('(Has no Bars)');
                    } else if (
                        self.active_tab === 'unit_options' &&
                        _.contains(self.getActiveTab().unit_options_columns, property)
                    ) {
                        var profile_id = item.profile && item.profile.id;
                        var dictionary_id = app.settings.getDictionaryIdByName(property);
                        var options = [];
                        var rules_and_restrictions = [];
                        var is_restricted = false;
                        var is_optional = false;
                        var message = UNSET_VALUE;

                        if ( profile_id && dictionary_id ) {
                            options = app.settings.getAvailableOptions(dictionary_id, profile_id);
                        }

                        if ( dictionary_id ) {
                            rules_and_restrictions = app.settings.dictionaries.get(dictionary_id)
                                .get('rules_and_restrictions');
                        }

                        //  We don't necessarily have something to do for each
                        //  rule in the list, we're only interested in those
                        //  where we have to disable cell editing
                        _.each(rules_and_restrictions, function (rule) {
                            var restriction_applies = item.checkIfRestrictionApplies(rule);

                            if ( rule === 'IS_OPTIONAL' ) {
                                is_optional = true;
                            } else if ( restriction_applies && rule === 'DOOR_ONLY' ) {
                                is_restricted = true;
                                message = '(Doors Only)';
                            } else if ( restriction_applies && rule === 'OPERABLE_ONLY' ) {
                                is_restricted = true;
                                message = '(Operable Only)';
                            } else if ( restriction_applies && rule === 'GLAZING_BARS_ONLY' ) {
                                is_restricted = true;
                                message = '(Has no Bars)';
                            }
                        }, this);

                        //  If restrictions apply, disable editing
                        if ( is_restricted ) {
                            cell_properties.readOnly = true;
                            cell_properties.renderer = app.hot_renderers.getDisabledPropertyRenderer(message);
                        //  If no restrictions apply, show options
                        } else if ( options.length ) {
                            cell_properties.type = 'dropdown';
                            cell_properties.filter = false;
                            cell_properties.strict = true;

                            cell_properties.source = _.map(options, function (option) {
                                return option.get('name');
                            });

                            if ( is_optional ) {
                                cell_properties.source.unshift(UNSET_VALUE);
                            }
                        //  When we have no options, disable editing
                        } else {
                            message = profile_id ? '(No Variants)' : '(No Profile)';

                            cell_properties.readOnly = true;
                            cell_properties.renderer = app.hot_renderers.getDisabledPropertyRenderer(message);
                        }
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
                opening_direction: 'Opening Dir.',
                threshold: 'Threshold',
                glazing_bar_width: 'Muntin Width',
                u_value: 'U Value',
                move_item: 'Move',
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
                subtotal_profit: 'Subt. Profit'
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
                move_item: 55,
                mark: 60,
                customer_image: 100,
                dimensions: 120,
                rough_opening: 140,
                description: 240,
                notes: 240,
                exceptions: 240,
                profile_id: 200,
                system: 200,
                opening_direction: 110,
                glazing: 300,
                glazing_bar_width: 100,
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
                extras_type: 100
            };

            //  Custom widths for some Unit Options columns
            var unit_options_col_widths = {
                'Interior Handle': 160,
                'Exterior Handle': 160,
                'Internal Sill': 100,
                'External Sill': 100,
                'External Color': 100,
                'Internal Color': 100,
                'Hardware Type': 120,
                'Lock Mechanism': 120,
                'Glazing Bead': 100,
                'Gasket Color': 100,
                'Hinge Style': 280
            };

            //  Calculate optimal width for Unit Options columns
            unit_options_col_widths = _.object(
                app.settings.getAvailableDictionaryNames(),
                _.map(app.settings.getAvailableDictionaryNames(), function (dictionary_name) {
                    var calculated_length = 30 + dictionary_name.length * 7;

                    return unit_options_col_widths[dictionary_name] ?
                        unit_options_col_widths[dictionary_name] : calculated_length;
                }, this ));

            col_widths = _.extend({}, col_widths, unit_options_col_widths);

            var widths_table = _.map(this.getActiveTab().columns, function (item) {
                return col_widths[item] ? col_widths[item] : 80;
            }, this);

            return widths_table;
        },
        onRender: function () {
            var is_visible = this.options.is_always_visible ||
                this.table_visibility === 'visible';
            var self = this;

            //  We have to duplicate keydown event handling here because of the
            //  way copyPaste plugin for HoT works. It intercepts focus once
            //  you press ctrl key (meta key), so keydown handler in our view
            //  (via backbone.marionette.keyshortcuts plugin) does not fire
            function onBeforeKeyDown(event, onlyCtrlKeys) {
                var isCtrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;
                var selection = (self.hot && self.hot.getSelected()) || false;
                var isFullRowSelected = false;

                if (selection.length) {
                    isFullRowSelected = selection[3] === selection[3] - selection[1];
                }

                if (isCtrlDown && event.keyCode === 17 && isFullRowSelected) {
                    event.stopImmediatePropagation();
                    return;
                }

                //  Ctrl + Y || Ctrl + Shift + Z
                if ( isCtrlDown && (event.keyCode === 89 || (event.shiftKey && event.keyCode === 90 )) ) {
                    self.onRedo();
                //  Ctrl + Z
                } else if ( isCtrlDown && event.keyCode === 90 ) {
                    self.onUndo();
                } else if ( !onlyCtrlKeys && !isCtrlDown && event.keyCode === 78 ) {
                    self.onNewUnitOrAccessory(event);
                    event.preventDefault();
                    event.stopPropagation();
                }
            }

            if ( is_visible ) {
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
                        viewportColumnRenderingOffset: 50,
                        enterMoves: { row: 1, col: 0 },
                        beforeKeyDown: function (e) {
                            onBeforeKeyDown(e, true);
                        },
                        afterSelection: function (startRow, startColumn, endRow, endColumn) {
                            self.selected = [];

                            if ( startColumn === 0 && endColumn === this.countCols() - 1 ) {
                                self.ui.$remove.removeClass('disabled');

                                if ( startRow === endRow ) {
                                    self.selected = [startRow];
                                    var selectedData = self.hot.getSourceData().at(startRow);

                                    if (selectedData.hasOnlyDefaultAttributes()) {
                                        self.ui.$clone.addClass('disabled');
                                    } else {
                                        self.ui.$clone.removeClass('disabled');
                                    }
                                } else {
                                    var start = startRow;
                                    var end = endRow;

                                    if ( startRow > endRow ) {
                                        start = endRow;
                                        end = startRow;
                                    }

                                    for (var i = start; i <= end; i++) {
                                        self.selected.push(i);
                                    }

                                    self.ui.$clone.addClass('disabled');
                                }
                            } else {
                                self.ui.$remove.addClass('disabled');
                                self.ui.$clone.addClass('disabled');
                            }
                        },
                        afterDeselect: function () {
                            if ( self.selected.length ) {
                                this.selectCell(
                                    self.selected[0],
                                    0,
                                    self.selected[self.selected.length - 1],
                                    this.countCols() - 1, false
                                );
                            }
                        }
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

                this.undo_manager.registerButton('undo', this.ui.$undo);
                this.undo_manager.registerButton('redo', this.ui.$redo);

                $(window).off('keydown').on('keydown', function (e) {
                    if ( !e.isDuplicate && $(e.target).hasClass('copyPaste') ) {
                        onBeforeKeyDown(e);
                    }
                });
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

            $(window).off('keydown');
        }
    });
})();
