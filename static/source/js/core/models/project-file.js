var app = app || {};

(function () {
    'use strict';

    app.ProjectFile = Backbone.Model.extend({
        defaults: {
            name: '',
            type: '',
            url: ''
        }
    });
})();
