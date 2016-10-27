var app = app || {};

(function () {
    'use strict';

    var routers = {
        'units(/)': 'showMainView'
    };
    var Controller = Marionette.Object.extend({
        initialize: function () {
            this.region = this.options.region;
        },
        getRegion: function () {
            return this.region;
        },
        showMainView: function () {
            this.getRegion().show(new app.MainUnitsTableView());
        },
        onDestroy: function () {
            this.getRegion().reset();
        }
    });

    app.Units = Marionette.Object.extend({
        initialize: function () {
            this.controller = new Controller({
                region: this.options.region
            });
            app.router.processAppRoutes(this.controller, routers);
        }
    });
})();
