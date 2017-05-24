import _ from 'underscore';
import Marionette from 'backbone.marionette';

import template from '../templates/quote-header-view.hbs';

export default Marionette.View.extend({
    template,
    templateContext() {
        return _.extend(this.serializeModel(this.model), {
            quote_number: this.options.quote.getNumber(),
            quote_name: this.options.quote.get('name'),
            quote_date: this.options.quote.get('date'),
            quote_revision_id: this.options.quote.get('revision'),
        });
    },
    initialize() {
        this.listenTo(this.model, 'all', this.render);
        this.listenTo(this.options.quote, 'all', this.render);
    },
});
