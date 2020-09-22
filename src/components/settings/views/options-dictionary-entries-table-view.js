import Marionette from 'backbone.marionette';
import Sortable from 'sortablejs';

import UndoManager from '../../../utils/undomanager';
import OptionsDictionaryEntriesItemView from './options-dictionary-entries-item-view';
import OptionsDictionaryEntry from '../../../core/models/options-dictionary-entry';
import template from '../templates/options-dictionary-entries-table-view.hbs';

export default Marionette.CompositeView.extend({
    tagName: 'div',
    className: 'options-dictionary-entries-table',
    template,
    childView: OptionsDictionaryEntriesItemView,
    childViewContainer: '.entries-container',
    childViewOptions() {
        return {
            parent_view: this,
        };
    },
    ui: {
        $container: '.entries-container',
        $add_new_entry: '.js-add-new-entry',
        $undo: '.js-undo',
        $redo: '.js-redo',
    },
    events: {
        'click @ui.$add_new_entry': 'addNewEntry',
        'click @ui.$undo': 'onUndo',
        'click @ui.$redo': 'onRedo',
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
    addNewEntry(e) {
        const new_position = this.collection.length ? this.collection.getMaxPosition() + 1 : 0;
        const new_entry = new OptionsDictionaryEntry({
            position: new_position,
        });

        e.stopPropagation();
        this.collection.add(new_entry);
        this.ui.$add_new_entry.blur();
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
            entries_length: this.collection.length,
        };
    },
    initialize() {
        // disbale the sort
        this.collection.sort({ sort: false });
        this.undo_manager = new UndoManager({
            register: this.collection,
            track: true,
        });

        this.listenTo(this.collection, 'remove', this.onRemoveEntry);
    },
    onRender() {
        const self = this;

        this.sortable = new Sortable(this.ui.$container[0], {
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
        if (this.isRendered() && this.sortable) {
            this.sortable.destroy();
        }
    },
});
