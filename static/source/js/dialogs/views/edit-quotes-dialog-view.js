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
            var new_quote = new app.Quote();

            this.collection.add(new_quote);
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
        },
        initialize: function (options) {
            var default_options = {

            };

            this.options = _.extend({}, default_options, options);

            //  TODO: get rid of this
            this.collection = new app.QuoteCollection([
                {
                    is_default: true,
                    name: 'Default Quote',
                    revision: 12
                },
                {
                    is_default: false,
                    name: 'Alternative Quote',
                    revision: 1
                }
            ], {
                project: app.current_project
            });
        }
    });
})();
