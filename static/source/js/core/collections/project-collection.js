var app = app || {};

(function () {
    'use strict';

    app.ProjectCollection = Backbone.Collection.extend({
        model: app.Project,
        url: function () {
            return app.settings.get('api_base_path') + '/projects';
        },
        parse: function (data) {
            console.log( 'parsing projects data', data );
            return data.projects;
        }
    });
})();
