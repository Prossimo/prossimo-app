var app = app || {};

(function () {
    'use strict';

    app.MainQuoteView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen quote-screen',
        template: app.templates['quote/main-quote-view'],
        ui: {
            '$table_container': '.quote-table-container'
        },
        initialize: function () {
            this.model = app.current_project;
            this.listenTo(this.model, 'all', this.render);
        },
        serializeData: function () {
            return _.extend(this.serializeModel(this.model), {
                quote_id: this.model.cid,
                quote_date: '5 September, 2015',
                quote_revision_id: '1'
            });
        },
        onRender: function () {
            var windows_table_view = new app.WindowsTableView({
                collection: app.current_project.windows
            });

            var quote_table_view = new app.QuoteTableView({
                collection: app.current_project.windows
            });

            this.$el.append(windows_table_view.render().el);
            this.ui.$table_container.append(quote_table_view.render().el);
        }
    });
})();
