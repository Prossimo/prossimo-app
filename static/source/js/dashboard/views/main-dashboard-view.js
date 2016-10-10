/**
 * Created by devico on 28.07.16.
 */
var app = app || {};

(function () {
    'use strict';

    app.MainDashboardView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen dashboard-screen',
        template: app.templates['dashboard/main-dashboard-view'],
        ui: {
            $totals: '#totals',
            $project_info: '#project-info',
            $documents: '#documents'
        },
        initialize: function () {
            this.project_info_view = new app.ProjectInfoView({
                model: app.current_project
            });

            this.totals_view = new app.ProjectTotalsView({
                model: app.current_project
            });

            this.documents_view = new app.ProjectDocumentsView({
                model: app.current_project
            });
        },
        onRender: function () {
            this.ui.$project_info.append(this.project_info_view.render().el);
            this.ui.$totals.append(this.totals_view.render().el);
            this.ui.$documents.append(this.documents_view.render().el);
        },
        onDestroy: function () {
            this.project_info_view.destroy();
            this.totals_view.destroy();
            this.documents_view.destroy();
        }
    });
})();
