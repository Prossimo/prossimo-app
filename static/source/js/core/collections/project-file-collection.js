var app = app || {};

(function () {
    'use strict';

    app.ProjectFileCollection = Backbone.Collection.extend({
        model: app.ProjectFile,
        url: function () {
            return app.settings.get('api_base_path') + '/files/';
        },
        getUuids: function () {
            return this.pluck('uuid');
        },
        initialize: function (models, options) {
            this.options = options || {};
        }
    });
})();
