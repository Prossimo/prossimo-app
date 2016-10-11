var app = app || {};

(function () {
    'use strict';

    app.ProjectFile = Backbone.Model.extend({
        defaults: {
            name: '',
            uuid: '',
            type: '',
            url: ''
        },
        parse: function (data) {
            var file_data = data && data.file ? data.file : data;

            if ( app.settings && file_data.url && file_data.url[0] === '/' ) {
                file_data.url = app.settings.get('api_base_path') + file_data.url.replace(/^(\/api)+/g, '');
            }

            return file_data;
        },
        initialize: function (attributes, options) {
            this.options = options || {};
        }
    });
})();
