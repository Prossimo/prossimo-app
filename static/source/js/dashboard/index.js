var app = app || {};

(function () {
    'use strict';

    var routers = {
        'dashboard(/)': 'showMainView'
    };
    var Controller = Marionette.Object.extend({
        initialize: function () {
            this.region = this.options.region;
        },
        getRegion: function () {
            return this.region;
        },
        showMainView: function () {
            this.getRegion().show(new app.MainDashboardView());
        },
        onDestroy: function () {
            this.getRegion().reset();
        }
    });

    app.Dashboard = Marionette.Object.extend({
        initialize: function () {
            this.controller = new Controller({
                region: this.options.region
            });
            app.router.processAppRoutes(this.controller, routers);
            // add tab in main navigation
            app.App.request('get:nav:tabs_collection').add({
                title: 'Dashboard',
                path: 'dashboard',
                icon_name: 'dashboard',
                index: 1
            });
        }
    });
})();
