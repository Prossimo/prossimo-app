var app = app || {};

(function () {
    'use strict';

    //  Window properties used for a drawing part
    app.WindowDrawing = Backbone.Model.extend({
        defaults: {
            width: 0,
            height: 0
        }
    });
})();
