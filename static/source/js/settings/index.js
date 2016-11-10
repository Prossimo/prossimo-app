var app = app || {};

(function () {
    'use strict';

    var routers = {
        'settings(/)': 'showMainView'
    };
    var Controller = Marionette.Object.extend({
        initialize: function () {
            this.region = this.options.region;
        },
        getRegion: function () {
            return this.region;
        },
        showMainView: function () {
            this.getRegion().show(new app.MainSettingsView());
        },
        onDestroy: function () {
            this.getRegion().reset();
        }
    });

    app.SettingsModule = Marionette.Object.extend({
        initialize: function () {
            this.controller = new Controller({
                region: this.options.region
            });
            app.router.processAppRoutes(this.controller, routers);
            // add tab in main navigation
            app.App.request('get:nav:tabs_collection').add({
                title: 'Settings',
                path: 'settings',
                icon_name: 'wrench',
                index: 999
            });
        }
    });
})();
