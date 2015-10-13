var app = app || {};

(function () {
    'use strict';

    app.WindowCollection = Backbone.Collection.extend({
        model: app.Window
    });
})();
