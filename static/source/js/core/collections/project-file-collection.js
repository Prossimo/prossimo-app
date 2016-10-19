var app = app || {};

(function () {
    'use strict';

    app.ProjectFileCollection = Backbone.Collection.extend({
        model: app.ProjectFile,
        url: '/api/files/',
        initialize: function (models, options) {
            this.options = options || {};
        }
    });
})();
