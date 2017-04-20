import Marionette from 'backbone.marionette';
import _ from 'underscore';
import $ from 'jquery';
import Handsontable from 'handsontable/dist/handsontable.full';

import { parseFormat, format } from '../../utils';
import { globalChannel } from '../../utils/radio';
import hotRenderers from '../../hot-renderers';
import App from '../../main';
import UndoManager from '../../utils/undomanager';
import Unit from '../models/unit';
import Accessory from '../models/accessory';
import UnitsTableTotalPricesView from '../../core/views/units-table-total-prices-view';
import template from '../../templates/core/units-table-view.hbs';

import {
    RULE_IS_OPTIONAL,
    RULE_DOOR_ONLY,
    RULE_OPERABLE_ONLY,
    RULE_GLAZING_BARS_ONLY,
    RULE_MULLIONS_ONLY,
    UNSET_VALUE,
    VALUE_ERROR_DOORS_ONLY,
    VALUE_ERROR_OPERABLE_ONLY,
    VALUE_ERROR_GLAZING_BARS_ONLY,
    VALUE_ERROR_MULLIONS_ONLY,
    VALUE_ERROR_NO_VARIANTS,
    VALUE_ERROR_NO_PROFILE,
    KEY_CTRL,
    KEY_Y,
    KEY_Z,
    KEY_N,
} from '../../constants';

function extractDictionaryName(name_string) {
    return name_string.replace(/ Quantity(.)*$/, '');
}

export default Marionette.View.extend({
    tagName: 'div',
    className: 'units-table-container',
    template,
    ui: {
        $total_prices_container: '.units-table-total-prices-container',
        $hot_container: '.handsontable-container',
        $add_new_unit: '.js-add-new-unit',
        $add_new_accessory: '.js-add-new-accessory',
        $undo: '.js-undo',
        $redo: '.js-redo',
        $reset_unit_options: '.js-reset-unit-options',
        $remove: '.js-remove-selected-items',
        $clone: '.js-clone-selected-items',
    },
    events: {
        'click @ui.$add_new_unit': 'addNewUnit',
        'click @ui.$add_new_accessory': 'addNewAccessory',
        'click .nav-tabs a': 'onTabClick',
        'click .js-move-item-up': 'onMoveItemUp',
        'click .js-move-item-down': 'onMoveItemDown',
        'click @ui.$undo': 'onUndo',
        'click @ui.$redo': 'onRedo',
        'click @ui.$reset_unit_options': 'onResetUnitOptionsForSelected',
        'click @ui.$remove': 'onRemoveSelected',
        'click @ui.$clone': 'onCloneSelected',
    },
    keyShortcuts: {
        n: 'onNewUnitOrAccessory',
        'ctrl+z': 'onUndo',
        'command+z': 'onUndo',
        'ctrl+shift+z': 'onRedo',
        'command+shift+z': 'onRedo',
        'ctrl+y': 'onRedo',
        'command+y': 'onRedo',
    },
    initialize() {
        this.table_update_timeout = null;
        this.dropdown_scroll_timer = null;

        this.tabs = {
            specs: {
                title: 'Specs',
                collection: this.collection,
                columns: ['move_item', 'mark', 'quantity', 'width', 'height', 'drawing',
                    'customer_image', 'width_mm', 'height_mm', 'rough_opening', 'profile_id', 'description',
                    'notes', 'exceptions', 'system', 'opening_direction',
                    'threshold', 'glazing', 'glazing_bar_width', 'uw', 'u_value'],
            },
            unit_options: {
                title: 'Unit Options',
                collection: this.collection,
                columns: ['move_item', 'mark', 'quantity', 'width', 'height', 'drawing'],
                unit_options_columns: App.settings.dictionaries.getAvailableDictionaryNames(),
                unit_options_quantity_columns: (() => {
                    const columns = [];

                    App.settings.dictionaries.each((dictionary) => {
                        if (dictionary.hasQuantity()) {
                            const quantity_multiplier = dictionary.getQuantityMultiplier();
                            const name_suffix = `Quantity${quantity_multiplier ? ` / ${quantity_multiplier}` : ''}`;

                            columns.push(`${dictionary.get('name')} ${name_suffix}`);
                        }
                    });

                    return columns;
                })(),
            },
            prices: {
                title: 'Prices',
                collection: this.collection,
                columns: ['move_item', 'mark', 'quantity', 'width', 'height', 'drawing', 'width_mm', 'height_mm',
                    'original_cost_estimated', 'original_cost', 'original_cost_difference', 'original_currency',
                    'conversion_rate', 'unit_cost', 'subtotal_cost',
                    'supplier_discount', 'unit_cost_discounted', 'subtotal_cost_discounted', 'price_markup',
                    'unit_price', 'subtotal_price', 'discount', 'unit_price_discounted',
                    'subtotal_price_discounted', 'subtotal_profit', 'total_square_feet', 'square_feet_price',
                    'square_feet_price_discounted'],
            },
            extras: {
                title: 'Extras',
                collection: this.options.extras,
                columns: ['move_item', 'description', 'quantity', 'extras_type', 'original_cost',
                    'original_currency', 'conversion_rate', 'unit_cost', 'price_markup',
                    'unit_price', 'subtotal_cost', 'subtotal_price', 'subtotal_profit'],
            },
        };
        this.active_tab = 'specs';

        //  If we have no columns for Unit Options tab, don't show the tab
        if (!this.tabs.unit_options.unit_options_columns.length) {
            delete this.tabs.unit_options;
        } else {
            this.tabs.unit_options.columns = _.union(
                this.tabs.unit_options.columns,
                this.tabs.unit_options.unit_options_columns,
            );

            //  We insert quantity columns at specific positions (after
            //  the corresponding option column)
            if (this.tabs.unit_options.unit_options_quantity_columns.length) {
                _.each(this.tabs.unit_options.unit_options_quantity_columns, (qty_column_name) => {
                    const target_option_name = extractDictionaryName(qty_column_name);
                    const target_position = _.indexOf(this.tabs.unit_options.columns, target_option_name);

                    if (target_position !== -1) {
                        this.tabs.unit_options.columns.splice(target_position + 1, 0, qty_column_name);
                    }
                });
            }
        }

        this.undo_manager = new UndoManager({
            register: this.collection,
            track: true,
        });

        this.selected = [];

        this.listenTo(this.collection, 'all', this.updateTable);
        this.listenTo(this.options.extras, 'all', this.updateTable);
        this.listenTo(this.options.parent_view, 'attach', this.updateTable);

        this.listenTo(App.current_project.settings, 'change', this.render);

        this.listenTo(this.collection, 'invalid', this.showValidationError);
        this.listenTo(this.options.extras, 'invalid', this.showValidationError);

        this.listenTo(globalChannel, 'paste_image', this.onPasteImage);
    },
    appendPopovers() {
        this.$el.popover('destroy');
        $('.popover').remove();

        this.$el.popover({
            container: 'body',
            html: true,
            selector: '.customer-image, .drawing-preview',
            content() {
                return $(this).clone();
            },
            trigger: 'hover',
            delay: {
                show: 300,
            },
        });

        this.$el.off('show.bs.popover').on('show.bs.popover', () => {
            $('.popover').remove();
        });
    },
    getActiveTab() {
        return this.tabs[this.active_tab];
    },
    setActiveTab(tab_name) {
        let previous_collection;
        let active_collection;

        if (_.contains(_.keys(this.tabs), tab_name)) {
            previous_collection = this.getActiveTab().collection;
            this.active_tab = tab_name;
            active_collection = this.getActiveTab().collection;

            if (previous_collection !== active_collection) {
                this.undo_manager.manager.clear();
                this.undo_manager.manager.unregisterAll();
                this.undo_manager.manager.register(active_collection);
            }
        }
    },
    onTabClick(e) {
        const target = $(e.target).attr('href').replace('#', '');

        e.preventDefault();
        this.setActiveTab(target);
        this.render();
    },
    onUndo() {
        this.undo_manager.handler.undo();
        this.ui.$undo.blur();
    },
    onRedo() {
        this.undo_manager.handler.redo();
        this.ui.$redo.blur();
    },
    onResetUnitOptionsForSelected() {
        if (this.selected.length && this.hot) {
            for (let i = this.selected.length - 1; i >= 0; i -= 1) {
                this.hot.getSourceData().at(this.selected[i]).resetUnitOptionsToDefaults();
            }

            //  TODO: do we really need two calls just to unselect?
            this.selected = [];
            this.hot.selectCell(0, 0, 0, 0, false);
            this.hot.deselectCell();
        }
    },
    onRemoveSelected() {
        if (this.selected.length && this.hot) {
            for (let i = this.selected.length - 1; i >= 0; i -= 1) {
                this.hot.getSourceData().at(this.selected[i]).destroy();
            }

            //  TODO: do we really need two calls just to unselect?
            this.selected = [];
            this.hot.selectCell(0, 0, 0, 0, false);
            this.hot.deselectCell();
        }
    },
    onCloneSelected() {
        if (this.selected.length === 1 && this.hot) {
            const selectedData = this.hot.getSourceData().at(this.selected[0]);

            if (!selectedData.hasOnlyDefaultAttributes()) {
                selectedData.duplicate();
            }
        }
    },
    addNewUnit() {
        const new_position = this.collection.length ? this.collection.getMaxPosition() + 1 : 0;
        const new_unit = new Unit({
            position: new_position,
        });

        this.collection.add(new_unit);
        this.ui.$add_new_unit.blur();
    },
    addNewAccessory() {
        const new_position = this.options.extras.length ? this.options.extras.getMaxPosition() + 1 : 0;
        const new_accessory = new Accessory({
            position: new_position,
        });

        this.options.extras.add(new_accessory);
        this.ui.$add_new_accessory.blur();
    },
    onNewUnitOrAccessory(e) {
        const active_tab = this.getActiveTab();

        if (active_tab.collection === this.collection) {
            this.addNewUnit(e);
        } else if (active_tab.collection === this.options.extras) {
            this.addNewAccessory(e);
        }
    },
    templateContext() {
        return {
            active_tab: this.active_tab,
            tabs: _.mapObject(this.tabs, (item, key) => (
                _.extend({}, item, {
                    is_active: key === this.active_tab,
                })
            )),
            mode: this.getActiveTab().title === 'Extras' ? 'extras' : 'units',
        };
    },
    onMoveItemUp(e) {
        const target_row = $(e.target).data('row');
        let target_object;

        if (this.hot && $(e.target).hasClass('disabled') === false) {
            target_object = this.hot.getSourceData().at(target_row);
            this.hot.getSourceData().moveItemUp(target_object);
        }
    },
    onMoveItemDown(e) {
        const target_row = $(e.target).data('row');
        let target_object;

        if (this.hot && $(e.target).hasClass('disabled') === false) {
            target_object = this.hot.getSourceData().at(target_row);
            this.hot.getSourceData().moveItemDown(target_object);
        }
    },
    onPasteImage(data) {
        if (this.hot) {
            //  Selected cells are returned in the format:
            //  [starting_cell_column_num, starting_cell_row_num,
            //   ending_cell_column_num, ending_cell_row_num]
            const selected_cells = this.hot.getSelected();

            //  Paste to each selected sell.
            if (selected_cells && selected_cells.length) {
                for (let x = selected_cells[0]; x <= selected_cells[2]; x += 1) {
                    for (let y = selected_cells[1]; y <= selected_cells[3]; y += 1) {
                        this.hot.setDataAtCell(x, y, data);
                    }
                }
            }
        }
    },
    getGetterFunction(unit_model, column_name) {
        const project_settings = App.settings.getProjectSettings();
        let getter;

        //  We use toFixed a lot here because often we want to copy numbers
        //  from the table, and we only need them to have 2 decimal places
        const getters_hash = {
            height(model) {
                return model.getTrapezoidHeight();
            },
            width_mm(model) {
                return model.getWidthMM().toFixed(2);
            },
            height_mm(model) {
                const height = model.getTrapezoidHeightMM();

                return _.isArray(height) ? _.invoke(height, 'toFixed', 2) : height.toFixed(2);
            },
            dimensions(model) {
                return format.dimensions(model.get('width'), model.get('height'), null,
                    project_settings.get('inches_display_mode') || null);
            },
            unit_cost(model) {
                return model.getUnitCost().toFixed(2);
            },
            unit_cost_discounted(model) {
                return model.getUnitCostDiscounted().toFixed(2);
            },
            drawing(model) {
                return model.getPreview({
                    width: 600,
                    height: 600,
                    mode: 'base64',
                    position: 'outside',
                    hingeIndicatorMode: project_settings && project_settings.get('hinge_indicator_mode'),
                });
            },
            subtotal_cost(model) {
                return model.getSubtotalCost().toFixed(2);
            },
            unit_price(model) {
                return model.getUnitPrice().toFixed(2);
            },
            subtotal_price(model) {
                return model.getSubtotalPrice().toFixed(2);
            },
            u_value(model) {
                return model.getUValue();
            },
            unit_price_discounted(model) {
                return model.getUnitPriceDiscounted().toFixed(2);
            },
            subtotal_price_discounted(model) {
                return model.getSubtotalPriceDiscounted().toFixed(2);
            },
            subtotal_cost_discounted(model) {
                return model.getSubtotalCostDiscounted().toFixed(2);
            },
            subtotal_profit(model) {
                return model.getSubtotalProfit().toFixed(2);
            },
            system(model) {
                return model.profile.get('system');
            },
            threshold(model) {
                return model.profile.getThresholdType();
            },
            total_square_feet(model) {
                return model.getTotalSquareFeet().toFixed(2);
            },
            square_feet_price(model) {
                return model.getSquareFeetPrice().toFixed(2);
            },
            square_feet_price_discounted(model) {
                return model.getSquareFeetPriceDiscounted().toFixed(2);
            },
            original_cost_estimated(model) {
                return model.getEstimatedUnitCost().total.toFixed(2);
            },
            original_cost_difference(model) {
                return model.getEstimatedUnitCost().real_cost.difference.toFixed(2);
            },
            rough_opening(model) {
                return format.dimensions(model.getRoughOpeningWidth(), model.getRoughOpeningHeight(), null,
                    project_settings.get('inches_display_mode') || null);
            },
        };

        if (getters_hash[column_name]) {
            getter = getters_hash[column_name];
        } else if (
            this.active_tab === 'unit_options' &&
            _.contains(this.getActiveTab().unit_options_columns, column_name)
        ) {
            //  TODO: deal with multiple values per dictionary somehow
            getter = (model, attr_name) => {
                const target_dictionary_id = App.settings.dictionaries.getDictionaryIdByName(attr_name);
                const current_options = target_dictionary_id ?
                    model.getCurrentUnitOptionsByDictionaryId(target_dictionary_id) : [];

                return current_options.length ? current_options[0].entry.get('name') : UNSET_VALUE;
            };
        } else if (
            this.active_tab === 'unit_options' &&
            _.contains(this.getActiveTab().unit_options_quantity_columns, column_name)
        ) {
            getter = (model, attr_name) => {
                const target_dictionary_name = extractDictionaryName(attr_name);
                const target_dictionary_id = App.settings.dictionaries.getDictionaryIdByName(target_dictionary_name);
                const current_options = target_dictionary_id ?
                    model.getCurrentUnitOptionsByDictionaryId(target_dictionary_id) : [];

                return current_options.length ? current_options[0].quantity : UNSET_VALUE;
            };
        } else {
            getter = (model, attr_name) => model.get(attr_name);
        }

        return getter(unit_model, column_name);
    },
    getSetterParser(column_name, ...args) {
        let parser;

        const parsers_hash = {
            discount(attr_name, val) {
                return parseFormat.percent(val);
            },
            supplier_discount(attr_name, val) {
                return parseFormat.percent(val);
            },
            width(attr_name, val) {
                return parseFormat.dimensions(val, 'width');
            },
            height(attr_name, val) {
                return parseFormat.dimensions(val, 'height');
            },
            glazing_bar_width(attr_name, val) {
                return parseFloat(val);
            },
            //  Try to find profile by id first, then try by name
            profile_id(attr_name, val) {
                let profile_id = null;
                const profile_by_id =
                    (parseInt(val, 10).toString() === val || parseInt(val, 10) === val) &&
                    App.settings && App.settings.profiles.getProfileByIdOrDummy(parseInt(val, 10));
                const profile_id_by_name = App.settings && App.settings.profiles.getProfileIdByName(val);

                if (profile_by_id && profile_by_id.get('is_dummy') !== true) {
                    profile_id = profile_by_id.get('id');
                } else if (profile_id_by_name) {
                    profile_id = profile_id_by_name;
                }

                return profile_id;
            },
        };

        if (parsers_hash[column_name]) {
            parser = parsers_hash[column_name];
        } else {
            parser = (attr_name, val) => val;
        }

        return parser(column_name, ...args);
    },
    getSetterFunction(unit_model, column_name, ...args) {
        const self = this;
        let setter;

        const setters_hash = {
            width(model, attr_name, val) {
                return model.updateDimension(attr_name, self.getSetterParser(column_name, val));
            },
            height(model, attr_name, val) {
                return model.updateDimension(attr_name, self.getSetterParser(column_name, val));
            },
        };

        if (setters_hash[column_name]) {
            setter = setters_hash[column_name];
        } else if (
            this.active_tab === 'unit_options' &&
            _.contains(this.getActiveTab().unit_options_columns, column_name)
        ) {
            setter = (model, attr_name, val) => {
                const target_dictionary_id = App.settings.dictionaries.getDictionaryIdByName(attr_name);

                if (!target_dictionary_id) {
                    return false;
                }

                const target_entry_id = App.settings.dictionaries.getDictionaryEntryIdByName(
                    target_dictionary_id,
                    val,
                );

                if (target_entry_id) {
                    return model.persistOption(target_dictionary_id, target_entry_id);
                }

                return model.persistOption(target_dictionary_id, false);
            };
        } else if (
            this.active_tab === 'unit_options' &&
            _.contains(this.getActiveTab().unit_options_quantity_columns, column_name)
        ) {
            setter = (model, attr_name, val) => {
                const target_dictionary_name = extractDictionaryName(attr_name);
                const target_dictionary_id = App.settings.dictionaries.getDictionaryIdByName(target_dictionary_name);

                if (!target_dictionary_id) {
                    return false;
                }

                const target_option = model.get('unit_options').getByDictionaryId(target_dictionary_id);
                const target_entry_id = target_option && target_option.get('dictionary_entry_id');

                if (!target_entry_id) {
                    return false;
                }

                return model.persistOption(target_dictionary_id, target_entry_id, parseFloat(val));
            };
        } else {
            setter = (model, attr_name, val) => model.persist(attr_name, self.getSetterParser(column_name, val));
        }

        return setter(unit_model, column_name, ...args);
    },
    getColumnData(column_name) {
        const self = this;

        return function columnData(unit_model, value) {
            if (!unit_model) {
                return false;
            }

            if (_.isUndefined(value)) {
                return self.getGetterFunction(unit_model, column_name);
            }

            return self.getSetterFunction(unit_model, column_name, value);
        };
    },
    showValidationError(model, error) {
        if (this.hot && model.collection === this.getActiveTab().collection) {
            const hot = this.hot;
            const self = this;

            const row_index = model.collection.indexOf(model);
            const col_index = _.indexOf(this.getActiveTab().columns, error.attribute_name);
            const target_cell = hot.getCell(row_index, col_index);
            const $target_cell = $(target_cell);

            $target_cell.popover({
                container: 'body',
                title: 'Validation Error',
                content: error.error_message,
                trigger: 'manual',
            });

            $target_cell.popover('show');

            setTimeout(() => {
                $target_cell.popover('destroy');
                hot.setCellMeta(row_index, col_index, 'valid', true);
                self.updateTable();
            }, 5000);
        }
    },
    getColumnValidator(column_name) {
        const self = this;
        const validator = function columnValidator(value, callback) {
            const attributes_object = {};
            const model = this.instance.getSourceData().at(this.row);

            attributes_object[column_name] = self.getSetterParser(column_name, value, model);

            if (!model.validate || !model.validate(attributes_object, { validate: true })) {
                callback(true);
            } else {
                callback(false);
            }
        };

        return validator;
    },
    getColumnExtraProperties(column_name) {
        const project_settings = App.settings.getProjectSettings();
        const names_title_type_hash = this.getActiveTab().collection.getNameTitleTypeHash([column_name]);
        const original_type = (names_title_type_hash.length && names_title_type_hash[0].type) || undefined;

        let properties_obj = {};

        if (original_type) {
            if (original_type === 'number') {
                properties_obj.type = 'numeric';
            }
        }

        const format_hash = {
            quantity: { format: '0,0[.]00' },
            original_cost: { format: '0,0[.]00' },
            conversion_rate: { format: '0[.]00000' },
            price_markup: { format: '0,0[.]00[0]00' },
            uw: { format: '0[.]00' },
        };

        const properties_hash = {
            width: {
                renderer: hotRenderers.getFormattedRenderer('dimension', null,
                    project_settings.get('inches_display_mode') || null),
            },
            height: {
                renderer: hotRenderers.getFormattedRenderer('dimension_heights', null,
                    project_settings.get('inches_display_mode') || null),
            },
            width_mm: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('fixed_minimal'),
            },
            height_mm: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('fixed_heights'),
            },
            dimensions: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('align_right'),
            },
            unit_cost: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('price_usd'),
            },
            unit_cost_discounted: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('price_usd'),
            },
            subtotal_cost: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('price_usd'),
            },
            unit_price: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('price_usd'),
            },
            subtotal_price: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('price_usd'),
            },
            unit_price_discounted: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('price_usd'),
            },
            subtotal_price_discounted: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('price_usd'),
            },
            drawing: {
                readOnly: true,
                renderer: hotRenderers.drawingPreviewRenderer,
            },
            u_value: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('fixed', 3),
            },
            system: { readOnly: true },
            threshold: { readOnly: true },
            mark: {
                width: 100,
            },
            customer_image: {
                renderer: hotRenderers.customerImageRenderer,
            },
            extras_type: {
                type: 'dropdown',
                source: this.options.extras.getExtrasTypes(),
            },
            discount: {
                renderer: hotRenderers.getFormattedRenderer('percent'),
            },
            supplier_discount: {
                renderer: hotRenderers.getFormattedRenderer('percent'),
            },
            profile_id: {
                type: 'dropdown',
                source: App.settings.profiles.getAvailableProfileNames(),
                renderer: hotRenderers.unitProfileRenderer,
            },
            total_square_feet: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('fixed_minimal'),
            },
            square_feet_price: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('price_usd'),
            },
            square_feet_price_discounted: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('price_usd'),
            },
            move_item: {
                readOnly: true,
                renderer: hotRenderers.moveItemRenderer,
            },
            glazing_bar_width: {
                type: 'dropdown',
                source: this.collection.getGlazingBarWidths().map(item => item.toString()),
            },
            opening_direction: {
                type: 'dropdown',
                source: this.collection.getOpeningDirections(),
            },
            subtotal_profit: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('price_usd', true),
            },
            subtotal_cost_discounted: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('price_usd'),
            },
            original_cost_estimated: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('fixed_minimal'),
            },
            original_cost_difference: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('percent_difference', 0),
            },
            rough_opening: {
                readOnly: true,
                renderer: hotRenderers.getFormattedRenderer('align_right'),
            },
        };

        if (format_hash[column_name]) {
            properties_obj = _.extend(properties_obj, format_hash[column_name]);
        }

        if (properties_hash[column_name]) {
            properties_obj = _.extend(properties_obj, properties_hash[column_name]);
        }

        return properties_obj;
    },
    //  Returns column data in a HoT-specific format, for each column we
    //  prepare the following:
    //  - data function, a combination of getter and setter
    //  - validation function (wrapper around model validation)
    //  - various extra properties, depending on colulmn name or type
    getActiveTabColumnOptions() {
        const columns = [];

        _.each(this.getActiveTab().columns, (column_name) => {
            const column_obj = _.extend({}, {
                data: this.getColumnData(column_name),
                validator: this.getColumnValidator(column_name),
            }, this.getColumnExtraProperties(column_name));

            columns.push(column_obj);
        });

        return columns;
    },
    //  Redefine some cell-specific properties. This is mostly used to
    //  prevent editing of some attributes that shouldn't be editable for
    //  a certain unit / accessory
    getActiveTabCellsSpecificOptions() {
        const self = this;

        return function cellSpecificOptions(row, col) {
            const cell_properties = {};
            const item = this.instance.getSourceData().at(row);
            const property = self.getActiveTab().columns[col];
            let profile_id;
            let options;
            let message;

            if (item && item instanceof Unit) {
                if (item.isOperableOnlyAttribute(property) && !item.hasOperableSections()) {
                    cell_properties.readOnly = true;
                    cell_properties.renderer = hotRenderers.getDisabledPropertyRenderer(VALUE_ERROR_OPERABLE_ONLY);
                } else if (item.isGlazingBarProperty(property) && !item.hasGlazingBars()) {
                    cell_properties.readOnly = true;
                    cell_properties.renderer = hotRenderers.getDisabledPropertyRenderer(VALUE_ERROR_GLAZING_BARS_ONLY);
                } else if (property === 'glazing') {
                    profile_id = item.profile && item.profile.id;
                    options = [];
                    message = UNSET_VALUE;

                    if (profile_id) {
                        options = App.settings.filling_types.getAvailableForProfile(profile_id);
                    }

                    if (options.length) {
                        cell_properties.type = 'dropdown';
                        cell_properties.filter = false;
                        cell_properties.strict = true;

                        cell_properties.source = _.map(options, option => option.get('name'));
                    //  When we have no options, disable editing
                    } else {
                        message = profile_id ? VALUE_ERROR_NO_VARIANTS : VALUE_ERROR_NO_PROFILE;

                        cell_properties.readOnly = true;
                        cell_properties.renderer = hotRenderers.getDisabledPropertyRenderer(message);
                    }
                } else if (
                    self.active_tab === 'unit_options' &&
                    _.contains(self.getActiveTab().unit_options_columns, property)
                ) {
                    const dictionary_id = App.settings.dictionaries.getDictionaryIdByName(property);
                    let rules_and_restrictions = [];
                    let is_restricted = false;
                    let is_optional = false;

                    profile_id = item.profile && item.profile.id;
                    options = [];
                    message = UNSET_VALUE;

                    if (profile_id && dictionary_id) {
                        options = App.settings.dictionaries.getAvailableOptions(dictionary_id, profile_id, true);
                    }

                    if (dictionary_id) {
                        rules_and_restrictions = App.settings.dictionaries.get(dictionary_id)
                            .get('rules_and_restrictions');
                    }

                    //  We don't necessarily have something to do for each
                    //  rule in the list, we're only interested in those
                    //  where we have to disable cell editing
                    _.each(rules_and_restrictions, (rule) => {
                        const restriction_applies = item.checkIfRestrictionApplies(rule);

                        if (rule === RULE_IS_OPTIONAL) {
                            is_optional = true;
                        } else if (restriction_applies && rule === RULE_DOOR_ONLY) {
                            is_restricted = true;
                            message = VALUE_ERROR_DOORS_ONLY;
                        } else if (restriction_applies && rule === RULE_OPERABLE_ONLY) {
                            is_restricted = true;
                            message = VALUE_ERROR_OPERABLE_ONLY;
                        } else if (restriction_applies && rule === RULE_GLAZING_BARS_ONLY) {
                            is_restricted = true;
                            message = VALUE_ERROR_GLAZING_BARS_ONLY;
                        } else if (restriction_applies && rule === RULE_MULLIONS_ONLY) {
                            is_restricted = true;
                            message = VALUE_ERROR_MULLIONS_ONLY;
                        }
                    }, this);

                    //  If restrictions apply, disable editing
                    if (is_restricted) {
                        cell_properties.readOnly = true;
                        cell_properties.renderer = hotRenderers.getDisabledPropertyRenderer(message);
                    //  If no restrictions apply, show options
                    } else if (options.length) {
                        cell_properties.type = 'dropdown';
                        cell_properties.filter = false;
                        cell_properties.strict = true;

                        cell_properties.source = _.map(options, option => option.get('name'));

                        if (is_optional) {
                            cell_properties.source.unshift(UNSET_VALUE);
                        }
                    //  When we have no options, disable editing
                    } else {
                        message = profile_id ? VALUE_ERROR_NO_VARIANTS : VALUE_ERROR_NO_PROFILE;

                        cell_properties.readOnly = true;
                        cell_properties.renderer = hotRenderers.getDisabledPropertyRenderer(message);
                    }
                } else if (
                    self.active_tab === 'unit_options' &&
                    _.contains(self.getActiveTab().unit_options_quantity_columns, property)
                ) {
                    //  We want to know what properties the column to the
                    //  left has. And if it's set read-only for whatever
                    //  reasons, we want this column to also be read-only
                    const left_column_properties =
                        self.getActiveTabCellsSpecificOptions().bind(this)(row, col - 1);
                    const cell_value = this.instance.getDataAtCell(row, col);

                    cell_properties.type = 'numeric';

                    if (left_column_properties.readOnly) {
                        cell_properties.readOnly = true;
                        cell_properties.renderer = left_column_properties.renderer;
                    } else if (cell_value === UNSET_VALUE) {
                        cell_properties.readOnly = true;
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
    getActiveTabHeaders() {
        const headers = [];
        const active_tab = this.getActiveTab();

        _.each(active_tab.columns, (column_name) => {
            const custom_header = this.getCustomColumnHeader(column_name);
            const original_header = active_tab.collection.getTitles([column_name]);
            let title = '';

            if (custom_header) {
                title = custom_header;
            } else if (original_header && original_header[0]) {
                title = original_header[0];
            } else if (
                active_tab.unit_options_quantity_columns &&
                _.contains(active_tab.unit_options_quantity_columns, column_name)
            ) {
                const pattern = /(\s\/\s\w+)$/i;
                const name_suffix = pattern.test(column_name) ? pattern.exec(column_name)[0] : '';

                title = `Option Qty${name_suffix}`;
            } else {
                title = column_name;
            }

            headers.push(title);
        });

        return headers;
    },
    getCustomColumnHeader(column_name) {
        const custom_column_headers_hash = {
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
            original_cost_estimated: 'Orig. Cost (est.)',
            original_cost: 'Orig. Cost',
            original_cost_difference: 'Est./Real Cost Diff.',
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
        };

        return custom_column_headers_hash[column_name];
    },
    updateTable(e) {
        const self = this;

        //  We don't want to update table on validation errors, we have
        //  a special function for that
        if (e === 'invalid') {
            return;
        }

        if (this.hot) {
            clearTimeout(this.table_update_timeout);
            this.table_update_timeout = setTimeout(() => {
                if (!self.isDestroyed()) {
                    self.hot.loadData(self.getActiveTab().collection);
                }
            }, 20);
        }

        this.appendPopovers();
    },
    getActiveTabColWidths() {
        let col_widths = {
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
            original_cost_estimated: 120,
            original_cost: 100,
            original_cost_difference: 120,
            unit_cost: 100,
            subtotal_cost: 100,
            unit_cost_discounted: 100,
            subtotal_cost_discounted: 100,
            price_markup: 80,
            unit_price: 100,
            subtotal_price: 100,
            unit_price_discounted: 100,
            subtotal_price_discounted: 100,
            subtotal_profit: 100,
            square_feet_price_discounted: 100,
            extras_type: 100,
        };

        //  Custom widths for some Unit Options columns
        let unit_options_col_widths = {
            'Interior Handle': 160,
            'Exterior Handle': 200,
            'Internal Sill': 100,
            'External Sill': 100,
            'External Color': 100,
            'Internal Color': 100,
            'Hardware Type': 120,
            'Lock Mechanism': 120,
            'Glazing Bead': 100,
            'Gasket Color': 100,
            'Hinge Style': 280,
            Hinges: 280,
            Hardware: 100,
        };

        //  Calculate optimal width for Unit Options columns
        unit_options_col_widths = this.tabs.unit_options ? _.object(
              _.union(
                this.tabs.unit_options.unit_options_columns,
                this.tabs.unit_options.unit_options_quantity_columns,
            ),
            _.map(_.union(
                this.tabs.unit_options.unit_options_columns,
                this.tabs.unit_options.unit_options_quantity_columns,
            ), (column_name) => {
                const calculated_length =
                    _.contains(this.tabs.unit_options.unit_options_quantity_columns, column_name) ?
                    140 :
                    30 + (column_name.length * 7);

                return unit_options_col_widths[column_name] ?
                    unit_options_col_widths[column_name] : calculated_length;
            }, this),
        ) : {};

        col_widths = _.extend({}, col_widths, unit_options_col_widths);

        const widths_table = _.map(this.getActiveTab().columns, item => (col_widths[item] ? col_widths[item] : 90), this);

        return widths_table;
    },
    onRender() {
        const self = this;

        //  We have to duplicate keydown event handling here because of the
        //  way copyPaste plugin for HoT works. It intercepts focus once
        //  you press ctrl key (meta key), so keydown handler in our view
        //  (via backbone.marionette.keyshortcuts plugin) does not fire
        function onBeforeKeyDown(event, onlyCtrlKeys) {
            const isCtrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;
            const selection = (self.hot && self.hot.getSelected()) || false;
            let isFullRowSelected = false;

            if (selection.length) {
                isFullRowSelected = selection[3] === selection[3] - selection[1];
            }

            if (isCtrlDown && event.keyCode === KEY_CTRL && isFullRowSelected) {
                event.stopImmediatePropagation();
                return;
            }

            //  Ctrl + Y || Ctrl + Shift + Z
            if (isCtrlDown && (event.keyCode === KEY_Y || (event.shiftKey && event.keyCode === KEY_Z))) {
                self.onRedo();
            //  Ctrl + Z
            } else if (isCtrlDown && event.keyCode === KEY_Z) {
                self.onUndo();
            //  N
            } else if (!onlyCtrlKeys && !isCtrlDown && event.keyCode === KEY_N) {
                self.onNewUnitOrAccessory(event);
                event.preventDefault();
                event.stopPropagation();
            }
        }

        let dropdown_scroll_reset = false;

        const fixed_columns = ['mark', 'quantity', 'width', 'height', 'drawing'];
        const active_tab_columns = self.getActiveTab().columns;
        let fixed_columns_count = 0;

        _.each(fixed_columns, (column) => {
            if (_.indexOf(active_tab_columns, column) !== -1) {
                fixed_columns_count += 1;
            }
        });

        //  We use defer because we want to wait until flexbox
        //  sizes are calculated properly
        _.defer(() => {
            self.hot = new Handsontable(self.ui.$hot_container[0], {
                data: self.getActiveTab().collection,
                columns: self.getActiveTabColumnOptions(),
                cells: self.getActiveTabCellsSpecificOptions(),
                colHeaders: self.getActiveTabHeaders(),
                rowHeaders: true,
                rowHeights() {
                    return _.contains(self.getActiveTab().columns, 'drawing') ||
                        _.contains(self.getActiveTab().columns, 'customer_image') ? 52 : 25;
                },
                colWidths: self.getActiveTabColWidths(),
                trimDropdown: false,
                maxRows() {
                    return self.getActiveTab().collection.length;
                },
                fixedColumnsLeft: fixed_columns_count,
                stretchH: 'all',
                viewportRowRenderingOffset: 300,
                viewportColumnRenderingOffset: 50,
                enterMoves: { row: 1, col: 0 },
                beforeKeyDown(e) {
                    onBeforeKeyDown(e, true);
                },
                afterSelection(startRow, startColumn, endRow, endColumn) {
                    self.selected = [];

                    if (startColumn === 0 && endColumn === this.countCols() - 1) {
                        self.ui.$remove.removeClass('disabled');
                        self.ui.$reset_unit_options.removeClass('disabled');

                        if (startRow === endRow) {
                            self.selected = [startRow];
                            const selectedData = self.hot.getSourceData().at(startRow);

                            if (selectedData.hasOnlyDefaultAttributes()) {
                                self.ui.$clone.addClass('disabled');
                            } else {
                                self.ui.$clone.removeClass('disabled');
                            }
                        } else {
                            let start = startRow;
                            let end = endRow;

                            if (startRow > endRow) {
                                start = endRow;
                                end = startRow;
                            }

                            for (let i = start; i <= end; i += 1) {
                                self.selected.push(i);
                            }

                            self.ui.$clone.addClass('disabled');
                        }
                    } else {
                        self.ui.$reset_unit_options.addClass('disabled');
                        self.ui.$remove.addClass('disabled');
                        self.ui.$clone.addClass('disabled');
                    }
                },
                afterDeselect() {
                    if (self.selected.length) {
                        this.selectCell(
                            self.selected[0],
                            0,
                            self.selected[self.selected.length - 1],
                            this.countCols() - 1, false,
                        );
                    }
                },
            });
        });

        this.appendPopovers();

        clearInterval(this.dropdown_scroll_timer);
        this.dropdown_scroll_timer = setInterval(() => {
            const editor = self.hot && self.hot.getActiveEditor();

            if (editor && editor.htContainer && !dropdown_scroll_reset) {
                dropdown_scroll_reset = true;
                editor.htContainer.scrollIntoView(false);
            } else {
                dropdown_scroll_reset = false;
            }
        }, 100);

        if (this.total_prices_view) {
            this.total_prices_view.destroy();
        }

        this.total_prices_view = new UnitsTableTotalPricesView({
            model: App.current_quote,
            units: this.collection,
            extras: this.options.extras,
        });

        this.ui.$total_prices_container.append(this.total_prices_view.render().el);

        this.undo_manager.registerButton('undo', this.ui.$undo);
        this.undo_manager.registerButton('redo', this.ui.$redo);

        $(window).off('keydown').on('keydown', (e) => {
            if (!e.isDuplicate && $(e.target).hasClass('copyPaste')) {
                onBeforeKeyDown(e);
            }
        });
    },
    onBeforeDestroy() {
        clearInterval(this.dropdown_scroll_timer);
        this.$el.off('show.bs.popover');
        this.$el.popover('destroy');

        if (this.hot) {
            this.hot.destroy();
        }

        if (this.total_prices_view) {
            this.total_prices_view.destroy();
        }

        $(window).off('keydown');
    },
});
