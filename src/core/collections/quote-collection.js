import Backbone from 'backbone';

import Quote from '../models/quote';

export default Backbone.Collection.extend({
    model: Quote,
    reorder_property_name: 'quotes',
    url() {
        return `${this.data_store.get('api_base_path')}/projects/${this.options.project.get('id')}/quotes`;
    },
    reorder_url() {
        return `${this.data_store.get('api_base_path')
            }/projects/${this.options.project.get('id')}/reorder_quotes`;
    },
    initialize(models, options) {
        this.options = options || {};
        this.proxy_quote = new Quote(null, { proxy: true });
        this.data_store = this.options.data_store;

        this.listenTo(this.options.project, 'fully_loaded', this.validatePositions);
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
        return this.first();
    },
});
