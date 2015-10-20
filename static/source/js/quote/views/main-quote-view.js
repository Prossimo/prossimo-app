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
