var app = app || {};

(function () {
    'use strict';

    app.ProjectFileCollection = Backbone.Collection.extend({
        model: app.ProjectFile
    });
})();
