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
        }
    });
})();
