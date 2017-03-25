import BaseDialogView from './base-dialog-view';
import QuotesEditorTableView from './quotes-editor-table-view';
import template from '../../templates/dialogs/edit-quotes-dialog-view.hbs';

export default BaseDialogView.extend({
    className: 'edit-quotes-modal modal fade',
    template: template,
    events: {
        'click .js-add-new-quote': 'addNewQuote'
    },
    addNewQuote: function () {
        var make_default = this.collection.length === 0;
        var new_position = this.collection.length ? this.collection.getMaxPosition() + 1 : 0;

        this.collection.create({
            is_default: make_default,
            position: new_position
        });
    },
    templateContext: function () {
        return {
            dialog_title: 'Edit Quotes'
        };
    },
    regions: {
        tbody: {
            el: 'tbody',
            replaceElement: true
        }
    },
    onRender: function () {
        this.showChildView('tbody', new QuotesEditorTableView({
            collection: this.collection
        }));
    }
});
