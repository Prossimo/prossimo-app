import Backbone from 'backbone';

import App from '../../main';
import Quote from '../models/quote';

export default Backbone.Collection.extend({
    model: Quote,
    reorder_property_name: 'quotes',
    url() {
        return `${App.settings.get('api_base_path')}/projects/${this.options.project.get('id')}/quotes`;
    },
    reorder_url() {
        return `${App.settings.get('api_base_path')
            }/projects/${this.options.project.get('id')}/reorder_quotes`;
    },
    parse(data) {
        return data.quotes || data;
    },
    getNameTitleTypeHash(names) {
        return this.proxy_quote.getNameTitleTypeHash(names);
    },
    getTitles(names) {
        return this.proxy_quote.getTitles(names);
    },
    getDefaultQuote() {
        return this.findWhere({ is_default: true });
    },
    initialize(models, options) {
        this.options = options || {};
        this.proxy_quote = new Quote(null, { proxy: true });

        this.listenTo(this.options.project, 'fully_loaded', this.validatePositions);
    },
});
