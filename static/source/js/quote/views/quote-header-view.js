import _ from 'underscore';
import Marionette from 'backbone.marionette';
import template from '../templates/quote/quote-header-view.hbs';

export default Marionette.View.extend({
    template: template,
    templateContext: function () {
        return _.extend(this.serializeModel(this.model), {
            quote_number: this.options.quote.getQuoteNumber(),
            quote_date: this.options.quote.get('date'),
            quote_revision_id: this.options.quote.get('revision')
        });
    },
    initialize: function () {
        this.listenTo(this.model, 'all', this.render);
        this.listenTo(this.options.quote, 'all', this.render);
    }
});
