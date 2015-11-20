var app = app || {};

(function () {
    'use strict';

    app.ProjectCollection = Backbone.Collection.extend({
        model: app.Project,
        url: 'http://127.0.0.1:8000/api/projects',
        parse: function (data) {
            return data.projects;
        }
    });
})();
