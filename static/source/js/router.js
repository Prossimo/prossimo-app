var app = app || {};

(function () {
    'use strict';

    app.AppRouter = Backbone.Router.extend({
        routes: {},
        addRoute: function (route, callback) {
            this.route(route, route, callback);
        }
    });
})();
