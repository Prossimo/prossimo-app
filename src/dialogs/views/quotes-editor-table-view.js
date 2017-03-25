import QuotesEditorTableItemView from './quotes-editor-table-item-view';
import Marionette from 'backbone.marionette';

export default Marionette.CollectionView.extend({
    tagName: 'tbody',
    childView: QuotesEditorTableItemView,
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
