var app = app || {};

(function () {
    'use strict';

    app.EditQuotesDialogView = app.BaseDialogView.extend({
        className: 'edit-quotes-modal modal fade',
        template: app.templates['dialogs/edit-quotes-dialog-view'],
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
            this.showChildView('tbody', new app.QuotesEditorTableView({
                collection: this.collection
            }));
        }
    });
})();
