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
            $project_info: '#project-info'
        },
        onRender: function () {
            this.totals_view = new app.ProjectTotalsView({
                model: app.current_project,
                // collection: app.current_project.units,
                // extras: app.current_project.extras,
                parent_view: this,
            });

            this.project_info_view = new app.ProjectInfoView({
                model: app.current_project
            })
            this.ui.$project_info.append(this.project_info_view.render().el);
            this.ui.$totals.append(this.totals_view.render().el);
        },
        onDestroy: function () {
            this.totals_view.destroy();
        }
    });
})();
