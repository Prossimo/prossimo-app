var app = app || {};

(function () {
    'use strict';

    app.MainDashboardView = Marionette.View.extend({
        tagName: 'div',
        className: 'screen dashboard-screen',
        template: app.templates['dashboard/main-dashboard-view'],
        ui: {
            $totals: '#totals',
            $project_info: '#project-info',
            $documents: '#documents',
            $quote_info: '#quote-info',
            $export: '#project-export'
        },
        initialize: function () {
            this.project_info_view = new app.ProjectInfoView({
                model: app.current_project
            });

            this.totals_view = new app.QuoteTotalsView({
                model: app.current_quote
            });

            this.quote_info_view = new app.QuoteInfoView({
                model: app.current_quote
            });

            this.documents_view = new app.ProjectDocumentsView({
                collection: app.current_project.files
            });

            this.export_view = new app.ProjectExportView({
                model: app.current_project,
                quote: app.current_quote
            });
        },
        onRender: function () {
            this.ui.$project_info.append(this.project_info_view.render().el);
            this.ui.$totals.append(this.totals_view.render().el);
            this.ui.$quote_info.append(this.quote_info_view.render().el);
            this.ui.$documents.append(this.documents_view.render().el);
            this.ui.$export.append(this.export_view.render().el);
        },
        onBeforeDestroy: function () {
            this.project_info_view.destroy();
            this.totals_view.destroy();
            this.quote_info_view.destroy();
            this.documents_view.destroy();
            this.export_view.destroy();
        }
    });
})();
