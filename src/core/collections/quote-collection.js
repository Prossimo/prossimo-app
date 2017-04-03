import App from '../../main';
import Backbone from 'backbone';

import Quote from '../models/quote';

export default Backbone.Collection.extend({
    model: Quote,
    reorder_property_name: 'quotes',
    url: function () {
        return App.settings.get('api_base_path') +
            '/projects/' + this.options.project.get('id') + '/quotes';
    },
    reorder_url: function () {
        return App.settings.get('api_base_path') +
            '/projects/' + this.options.project.get('id') + '/reorder_quotes';
    },
    parse: function (data) {
        return data.quotes || data;
    },
    getNameTitleTypeHash: function (names) {
        return this.proxy_quote.getNameTitleTypeHash(names);
    },
    getTitles: function (names) {
        return this.proxy_quote.getTitles(names);
    },
    getDefaultQuote: function () {
        return this.findWhere({is_default: true});
    },
    initialize: function (models, options) {
        this.options = options || {};
        this.proxy_quote = new Quote(null, {proxy: true});

        this.listenTo(this.options.project, 'fully_loaded', this.validatePositions);
    }
});
