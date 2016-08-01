/**
 * Created by devico on 28.07.16.
 */
var app = app || {};

(function () {
    'use strict';

    app.MainDashboardView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen units-table-screen',
        template: app.templates['dashboard/main-dashboard-view'],
        ui: {
            $wrapper: '.units-table-wrapper'
        },
        onRender: function () {
            this.units_table_view = new app.UnitsTableView({
                collection: app.current_project.units,
                extras: app.current_project.extras,
                parent_view: this,
                is_always_visible: true
            });

            this.ui.$wrapper.append(this.units_table_view.render().el);
        },
        onDestroy: function () {
            this.units_table_view.destroy();
        }
    });
})();
