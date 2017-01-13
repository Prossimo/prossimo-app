import _ from 'underscore';
import Marionette from 'backbone.marionette';
import template from '../templates/quote-header-view.hbs';

export default Marionette.View.extend({
    template: template,
    initialize: function () {
        this.listenTo(this.model, 'all', this.render);
    },
    templateContext: function () {
        return _.extend(this.serializeModel(this.model), {
            quote_number: this.model.getQuoteNumber(),
            quote_date: this.model.get('quote_date'),
            quote_revision_id: this.model.get('quote_revision')
        });
    }
});
