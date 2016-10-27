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
        }
    });
})();
