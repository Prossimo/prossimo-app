var app = app || {};

(function () {
    'use strict';

    app.QuotesEditorTableView = Marionette.CollectionView.extend({
        tagName: 'tbody',
        childView: app.QuotesEditorTableItemView,
        onSort: function (event) {
            this.collection.setItemPosition(event.oldIndex, event.newIndex);
        },
        onRender: function () {
            var self = this;

            this.$el.sortable({
                draggable: '.quotes-editor-table-item',
                handle: 'td.entry-drag',
                onSort: function (event) {
                    self.onSort(event);
                }
            });
        },
        onBeforeDestroy: function () {
            this.$el.sortable('destroy');
        }
    });
})();
