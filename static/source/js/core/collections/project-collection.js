var app = app || {};

(function () {
    'use strict';

    app.ProjectCollection = Backbone.Collection.extend({
        model: app.Project,
        url: function () {
            return app.settings.get('api_base_path') + '/projects';
        },
        parse: function (data) {
            return _.map(data.projects, function (project) {
                var keys_to_omit = ['sync_datetime'];

                return _.pick(project, function (value, key) {
                    return !_.isNull(value) && !_.contains(keys_to_omit, key);
                });
            });
        },
        comparator: function (item) {
            return item.id;
        },
        initialize: function () {
            this.proxy_project = new app.Project(null, { proxy: true });
        },
        getNameTitleTypeHash: function (names) {
            return this.proxy_project.getNameTitleTypeHash(names);
        },
        getTitles: function (names) {
            return this.proxy_project.getTitles(names);
        }
    });
})();
