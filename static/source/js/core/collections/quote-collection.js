var app = app || {};

(function () {
    'use strict';

    app.QuoteCollection = Backbone.Collection.extend({
        model: app.Quote,
        //  TODO: is it needed?
        // reorder_property_name: 'quotes',
        url: function () {
            return app.settings.get('api_base_path') +
                '/projects/' + this.options.project.get('id') + '/quotes';
        },
        // reorder_url: function () {
        //     return app.settings.get('api_base_path') +
        //         '/projects/' + this.options.project.get('id') + '/reorder_quotes';
        // },
        parse: function (data) {
            return data.quotes || data;
        },
        comparator: function (item) {
            return item.id;
        },
        getNameTitleTypeHash: function (names) {
            return this.proxy_quote.getNameTitleTypeHash(names);
        },
        getTitles: function (names) {
            return this.proxy_quote.getTitles(names);
        },
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_quote = new app.Quote(null, { proxy: true });
        }
    });
})();
