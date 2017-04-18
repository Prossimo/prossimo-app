import Marionette from 'backbone.marionette';
import Sortable from 'sortablejs';
import _ from 'underscore';

import QuotesEditorTableItemView from './quotes-editor-table-item-view';

const empty_view = Marionette.View.extend({
    tagName: 'tr',
    className: 'no-quotes-message',
    template: _.template('<td colspan="6">This Project has no Quotes yet. You can add a new one.</td>'),
});

export default Marionette.CollectionView.extend({
    tagName: 'tbody',
    childView: QuotesEditorTableItemView,
    emptyView: empty_view,
    onSort(event) {
        this.collection.setItemPosition(event.oldIndex, event.newIndex);
    },
    onRender() {
        const self = this;

        this.sortable = new Sortable(this.$el[0], {
            draggable: '.quotes-editor-table-item',
            handle: 'td.entry-drag',
            onSort(event) {
                self.onSort(event);
            },
        });
    },
    onBeforeDestroy() {
        this.sortable.destroy();
    },
});
