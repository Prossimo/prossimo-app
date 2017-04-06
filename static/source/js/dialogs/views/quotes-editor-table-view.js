var app = app || {};

(function () {
    'use strict';

    var empty_view = Marionette.View.extend({
        tagName: 'tr',
        className: 'no-quotes-message',
        template: _.template('<td colspan="6">This Project has no Quotes yet. You can add a new one.</td>')
    });

    app.QuotesEditorTableView = Marionette.CollectionView.extend({
        tagName: 'tbody',
        childView: app.QuotesEditorTableItemView,
        emptyView: empty_view,
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
