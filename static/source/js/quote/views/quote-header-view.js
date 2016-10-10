var app = app || {};

(function () {
    'use strict';

    app.QuoteHeaderView = Marionette.ItemView.extend({
        template: app.templates['quote/quote-header-view'],
        initialize: function () {
            this.listenTo(this.model, 'all', this.render);
        },
        serializeData: function () {
            return _.extend(this.serializeModel(this.model), {
                quote_number: this.model.getQuoteNumber(),
                quote_date: this.model.get('quote_date'),
                quote_revision_id: this.model.get('quote_revision')
            });
        }
    });
})();
