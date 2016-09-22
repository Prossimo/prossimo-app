var app = app || {};

(function () {
    'use strict';

    app.MainQuoteView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen quote-screen',
        template: app.templates['quote/main-quote-view'],
        ui: {
            $header_container: '.quote-header-container',
            $table_container: '.quote-table-container'
        },
        serializeData: function () {
            return {
                urlToDownloadPdf: app.settings.getPdfDownloadUrl('quote')
            };
        },
        onRender: function () {
            this.units_table_view = new app.UnitsTableView({
                collection: app.current_project.units,
                extras: app.current_project.extras,
                parent_view: this
            });

            this.quote_header_view = new app.QuoteHeaderView({
                model: app.current_project
            });

            this.quote_table_view = new app.QuoteTableView({
                project: app.current_project,
                collection: app.current_project.units,
                extras: app.current_project.extras,
                show_outside_units_view: true
            });

            this.$el.append(this.units_table_view.render().el);
            this.ui.$header_container.append(this.quote_header_view.render().el);
            this.ui.$table_container.append(this.quote_table_view.render().el);
        },
        onDestroy: function () {
            this.units_table_view.destroy();
            this.quote_header_view.destroy();
            this.quote_table_view.destroy();
        }
    });
})();
