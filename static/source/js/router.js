var app = app || {};

(function () {
    'use strict';

    app.AppRouter = Marionette.AppRouter.extend({
        routes: {
            '(/)': 'showHome'
        },
        showHome: function () {
            this.navigate('/dashboard/', {trigger: true});
        }
    });
})();
