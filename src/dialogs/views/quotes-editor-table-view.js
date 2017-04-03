import Marionette from 'backbone.marionette';
import Sortable from 'sortablejs';

import QuotesEditorTableItemView from './quotes-editor-table-item-view';

export default Marionette.CollectionView.extend({
    tagName: 'tbody',
    childView: QuotesEditorTableItemView,
    onSort: function (event) {
        this.collection.setItemPosition(event.oldIndex, event.newIndex);
    },
    onRender: function () {
        var self = this;

        this.sortable = new Sortable(this.$el[0], {
            draggable: '.quotes-editor-table-item',
            handle: 'td.entry-drag',
            onSort: function (event) {
                self.onSort(event);
            }
        });
    },
    onBeforeDestroy: function () {
        this.sortable.destroy();
    }
});
