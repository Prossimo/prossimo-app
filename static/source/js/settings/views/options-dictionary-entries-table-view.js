var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryEntriesTableView = Marionette.CompositeView.extend({
        tagName: 'div',
        className: 'options-dictionary-entries-table',
        template: app.templates['settings/options-dictionary-entries-table-view'],
        childView: app.OptionsDictionaryEntriesItemView,
        childViewContainer: 'tbody',
        childViewOptions: function () {
            return {
                parent_view: this
            };
        },
        ui: {
            $container: 'tbody',
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
            var new_entry = new app.OptionsDictionaryEntry({
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
            if ( !this.collection.length ) {
                this.render();
            }
        },
        serializeData: function () {
            return {
                entries_length: this.collection.length
            };
        },
        initialize: function () {
            this.undo_manager = new app.UndoManager({
                register: this.collection,
                track: true
            });

            this.listenTo(this.collection, 'remove', this.onRemoveEntry);
        },
        onRender: function () {
            var self = this;

            this.ui.$container.sortable({
                handle: 'td.entry-drag',
                draggable: 'tr',
                onSort: function (event) {
                    self.onSort(event);
                }
            });

            this.undo_manager.registerButton('undo', this.ui.$undo);
            this.undo_manager.registerButton('redo', this.ui.$redo);
        },
        onDestroy: function () {
            if ( this._isRendered ) {
                this.ui.$container.sortable('destroy');
            }
        }
    });
})();
