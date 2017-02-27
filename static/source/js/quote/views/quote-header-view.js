var app = app || {};

(function () {
    'use strict';

    app.QuoteHeaderView = Marionette.View.extend({
        template: app.templates['quote/quote-header-view'],
        templateContext: function () {
            return _.extend(this.serializeModel(this.model), {
                quote_number: this.model.getQuoteNumber(),
                quote_date: this.model.get('date'),
                quote_revision_id: this.model.get('revision')
            });
        },
        initialize: function () {
            this.listenTo(this.model, 'all', this.render);
        }
    });
})();
