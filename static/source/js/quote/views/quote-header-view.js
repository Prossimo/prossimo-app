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
                quote_id: this.model.cid,
                quote_date: '5 September, 2015',
                quote_revision_id: '1'
            });
        }
    });
})();
