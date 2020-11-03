import _ from 'underscore';
import Marionette from 'backbone.marionette';
import Sortable from 'sortablejs';

import BaseSelectView from '../../../core/views/base/base-select-view';
import BaseInputView from '../../../core/views/base/base-input-view';
import BaseToggleView from '../../../core/views/base/base-toggle-view';
import OptionsDictionaryEntriesTableView from './options-dictionary-entries-table-view';
import template from '../templates/options-dictionary-view.hbs';

import {
    RULE_TITLES,
    RULE_GROUPS,
    PRICING_SCHEME_TITLES,
    PRICING_SCHEME_GROUPS,
} from '../../../constants';
import OptionsDictionaryEntry from '../../../core/models/options-dictionary-entry';
import UndoManager from '../../../utils/undomanager';


export default Marionette.View.extend({
    tagName: 'div',
    className: 'options-dictionary',
    template,
    ui: {
        $name_container: '.dictionary-name',
        $rules_and_restrictions_container: '.dictionary-restrictions',
        $pricing_scheme_container: '.dictionary-pricing-scheme',
        $is_hidden_switch_container: '.dictionary-is-hidden',
        $entries_container: '.entry-table-container .entries-container',
        $remove: '.js-remove-dictionary',
        $add_new_entry: '.js-add-new-entry',
        $undo: '.js-undo',
        $redo: '.js-redo',
    },
    keyShortcuts: {
        n: 'addNewEntry',
        'ctrl+z': 'onUndo',
        'command+z': 'onUndo',
        'ctrl+shift+z': 'onRedo',
        'command+shift+z': 'onRedo',
        'ctrl+y': 'onRedo',
        'command+y': 'onRedo',
    },
    events: {
        'click @ui.$remove': 'onRemove',
        'click @ui.$add_new_entry': 'addNewEntry',
        'click @ui.$undo': 'onUndo',
        'click @ui.$redo': 'onRedo',
    },
    entries_table_view: null,
    undo_manager: null,
    onRemove() {
        this.model.destroy();
    },
    onChangeName() {
        if (this.should_make_everything_editable !== this.shouldMakeEverythingEditable()) {
            this.should_make_everything_editable = this.shouldMakeEverythingEditable();
            this.renderElements();
        }
    },
    onChangePricingScheme() {
        if (this.entries_table_view) {
            this.entries_table_view.render();
        }
    },
    shouldMakeEverythingEditable() {
        return !this.model.hasOnlyDefaultAttributes();
    },
    renderElements() {
        if (this.should_make_everything_editable) {
            this.ui.$entries_container.empty().append(this.entries_table_view.render().el);
            // this.rules_and_restrictions_view.enable();
        } else {
            this.ui.$entries_container.empty().append(
                '<p>Please set dictionary name before adding option variants.</p>',
            );
            this.rules_and_restrictions_view.disable();
        }
    },
    onRender() {

        this.ui.$name_container.append(this.name_input_view.render().el);
        this.ui.$rules_and_restrictions_container.append(this.rules_and_restrictions_view.render().el);
        this.ui.$pricing_scheme_container.append(this.pricing_scheme_view.render().el);
        this.ui.$is_hidden_switch_container.append(this.hidden_switch_view.render().el);

        this.renderElements();

        // We need to use the Sortable to manage the re-ordering
        this.sortable = new Sortable(this.ui.$entries_container[0], {
            handle: 'td.entry-drag',
            draggable: '.options-dictionary-entries-item',
            onSort(event) {
                self.onSort(event);
            },
        });

        this.undo_manager.registerButton('undo', this.ui.$undo);
        this.undo_manager.registerButton('redo', this.ui.$redo);
    },
    onBeforeDestroy() {
        if (this.name_input_view) {
            this.name_input_view.destroy();
        }

        if (this.rules_and_restrictions_view) {
            this.rules_and_restrictions_view.destroy();
        }

        if (this.pricing_scheme_view) {
            this.pricing_scheme_view.destroy();
        }

        if (this.hidden_switch_view) {
            this.hidden_switch_view.destroy();
        }

        if (this.entries_table_view) {
            this.entries_table_view.destroy();
        }

        if (this.isRendered() && this.sortable) {
            this.sortable.destroy();
        }
    },
    initialize() {
        this.should_make_everything_editable = this.shouldMakeEverythingEditable();

        this.name_input_view = new BaseInputView({
            model: this.model,
            param: 'name',
            input_type: 'text',
            placeholder: 'New Dictionary',
        });

        this.rules_and_restrictions_view = new BaseSelectView({
            model: this.model,
            param: 'rules_and_restrictions',
            values: this.model.getPossibleRulesAndRestrictions()
                .map(value => ({
                    value,
                    title: RULE_TITLES[value] || value,
                })),
            groups: RULE_GROUPS,
            multiple: true,
        });

        this.pricing_scheme_view = new BaseSelectView({
            model: this.model,
            param: 'pricing_scheme',
            values: this.model.getPossiblePricingSchemes()
                .map(value => ({
                    value,
                    title: PRICING_SCHEME_TITLES[value] || value,
                })),
            groups: PRICING_SCHEME_GROUPS,
            multiple: false,
        });

        this.hidden_switch_view = new BaseToggleView({
            model: this.model,
            property_name: 'is_hidden',
            current_value: this.model.get('is_hidden'),
            values_list: _.map([
                { value: true, title: 'Yes' },
                { value: false, title: 'No' },
            ], (item) => {
                const is_current = item.value === this.model.get('is_hidden');

                return _.extend({}, item, { is_current });
            }, this),
        });

        this.entries_table_view = new OptionsDictionaryEntriesTableView({
            collection: this.model.entries,
            sort: false,
        });

        this.undo_manager = new UndoManager({
            register: this.collection,
            track: true,
        });

        this.listenTo(this.model, 'change:name', this.onChangeName);
        this.listenTo(this.model, 'change:pricing_scheme', this.onChangePricingScheme);
        this.listenTo(this.collection, 'remove', this.onRemoveEntry);
    },
    addNewEntry(e) {
        const collection = this.entries_table_view.collection;
        const new_position = collection.length ? collection.getMaxPosition() + 1 : 0;
        const new_entry = new OptionsDictionaryEntry({
            position: new_position,
        });

        e.stopPropagation();
        collection.add(new_entry);
        this.ui.$add_new_entry.blur();
    },
    onUndo() {
        this.undo_manager.handler.undo();
        this.ui.$undo.blur();
    },
    onRedo() {
        this.undo_manager.handler.redo();
        this.ui.$redo.blur();
    },
    onSort(event) {
        this.collection.setItemPosition(event.oldIndex, event.newIndex);
    },
    onRemoveEntry() {
        if (!this.collection.length) {
            this.render();
        }
    },
    templateContext() {
        return {
            entries_length: this.model.collection.length,
        };
    },
});
