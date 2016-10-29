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
            // add tab in main navigation
            app.App.request('get:nav:tabs_collection').add({
                title: 'Units',
                path: 'units',
                icon_name: 'th',
                index: 2
            });
        }
    });
})();
