import Marionette from 'backbone.marionette';
import UndoManager from '../../../utils/undomanager';
import OptionsDictionaryEntriesItemView from './options-dictionary-entries-item-view';
import OptionsDictionaryEntry from '../../../core/models/options-dictionary-entry';
import template from '../templates/settings/options-dictionary-entries-table-view.hbs';
import Sortable from 'sortablejs';

export default Marionette.CompositeView.extend({
    tagName: 'div',
    className: 'options-dictionary-entries-table',
    template: template,
    childView: OptionsDictionaryEntriesItemView,
    childViewContainer: '.entries-container',
    childViewOptions: function () {
        return {
            parent_view: this
        };
    },
    ui: {
        $container: '.entries-container',
        $add_new_entry: '.js-add-new-entry',
        $undo: '.js-undo',
        $redo: '.js-redo'
    },
    events: {
        'click @ui.$add_new_entry': 'addNewEntry',
        'click @ui.$undo': 'onUndo',
        'click @ui.$redo': 'onRedo'
    },
    keyShortcuts: {
        n: 'addNewEntry',
        'ctrl+z': 'onUndo',
        'command+z': 'onUndo',
        'ctrl+shift+z': 'onRedo',
        'command+shift+z': 'onRedo',
        'ctrl+y': 'onRedo',
        'command+y': 'onRedo'
    },
    addNewEntry: function (e) {
        var new_position = this.collection.length ? this.collection.getMaxPosition() + 1 : 0;
        var new_entry = new OptionsDictionaryEntry({
            position: new_position
        });

        e.stopPropagation();
        this.collection.add(new_entry);
        this.ui.$add_new_entry.blur();
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
    onSort: function (event) {
        this.collection.setItemPosition(event.oldIndex, event.newIndex);
    },
    onRemoveEntry: function () {
        if (!this.collection.length) {
            this.render();
        }
    },
    templateContext: function () {
        return {
            entries_length: this.collection.length
        };
    },
    initialize: function () {
        this.undo_manager = new UndoManager({
            register: this.collection,
            track: true
        });

        this.listenTo(this.collection, 'remove', this.onRemoveEntry);
    },
    onRender: function () {
        var self = this;

        this.sortable = new Sortable(this.ui.$container[0], {
            handle: 'td.entry-drag',
            draggable: '.options-dictionary-entries-item',
            onSort: function (event) {
                self.onSort(event);
            }
        });

        this.undo_manager.registerButton('undo', this.ui.$undo);
        this.undo_manager.registerButton('redo', this.ui.$redo);
    },
    onBeforeDestroy: function () {
        if (this.isRendered() && this.sortable) {
            this.sortable.destroy();
        }
    }
});
