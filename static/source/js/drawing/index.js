var app = app || {};

(function () {
    'use strict';

    var routers = {
        'drawing(/)': 'showMainView'
    };
    var Controller = Marionette.Object.extend({
        initialize: function () {
            this.region = this.options.region;
        },
        getRegion: function () {
            return this.region;
        },
        showMainView: function () {
            this.getRegion().show(new app.MainDrawingView());
        },
        onDestroy: function () {
            this.getRegion().reset();
        }
    });

    app.Drawing = Marionette.Object.extend({
        initialize: function () {
            this.controller = new Controller({
                region: this.options.region
            });
            app.router.processAppRoutes(this.controller, routers);
            // add tab in main navigation
            app.App.request('get:nav:tabs_collection').add({
                title: 'Drawing',
                path: 'drawing',
                icon_name: 'pencil',
                index: 3
            });
        }
    });
})();
