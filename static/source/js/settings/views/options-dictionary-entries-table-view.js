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
            $add_new_entry: '.js-add-new-entry'
        },
        events: {
            'click @ui.$add_new_entry': 'addNewEntry'
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
        },
        onDestroy: function () {
            this.ui.$container.sortable('destroy');
        }
    });
})();
