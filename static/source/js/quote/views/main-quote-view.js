var app = app || {};

(function () {
    'use strict';

    app.MainQuoteView = Marionette.LayoutView.extend({
        tagName: 'div',
        className: 'screen quote-screen',
        template: app.templates['quote/main-quote-view'],
        regions: {
            $header_container: '.quote-header-container',
            $table_container: '.quote-table-container',
            $units_table_region: '.units-table-region'
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

            this.getRegion('$units_table_region').show(this.units_table_view);
            this.getRegion('$header_container').show(this.quote_header_view);
            this.getRegion('$table_container').show(this.quote_table_view);
        }
    });
})();
