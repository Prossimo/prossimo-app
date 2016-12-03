var app = app || {};

(function () {
    'use strict';

    //  We just keep this as a reference, we don't really use it for this model
    var FILE_PROPERTIES = [
        { name: 'original_name', title: 'Original File Name', type: 'string' },
        { name: 'uuid', title: 'UUID', type: 'string' },
        { name: 'content_type', title: 'Content Type', type: 'string' },
        { name: 'size', title: 'File Size', type: 'number' },
        { name: 'has_thumbnail', title: 'Has Thumbnail', type: 'boolean' },
        { name: 'thumbnail_height', title: 'Thumbnail Height', type: 'number' },
        { name: 'thumbnail_width', title: 'Thumbnail Width', type: 'number' },
        { name: 'created_at', title: 'Created', type: 'string' },
        { name: 'updated_at', title: 'Updated', type: 'string' }
    ];

    app.ProjectFile = Backbone.Model.extend({
        idAttribute: 'uuid',
        schema: app.schema.createSchema(FILE_PROPERTIES),
        //  We don't really want to save anything for this model
        save: function () {
            return false;
        },
        parse: function (data) {
            var file_data = data && data.file ? data.file : data;

            return app.schema.parseAccordingToSchema(file_data, this.schema);
        },
        getDownloadUrl: function (make_absolute) {
            var prefix = '';
            var pattern = /^http/i;

            if ( make_absolute === true && !pattern.test(this.url()) ) {
                prefix = 'http://' + window.location.host;
            }

            return prefix + this.url() + '/download';
        },
        getThumbnailUrl: function () {
            return this.get('has_thumbnail') ? this.url() + '/thumbnail' : undefined;
        },
        getGoogleDocsViewUrl: function () {
            var prefix = 'https://docs.google.com/viewer?url=';

            return prefix + this.getDownloadUrl(true);
        },
        getFileSize: function () {
            return app.utils.format.fileSize(this.get('size'));
        },
        initialize: function (attributes, options) {
            this.options = options || {};
        }
    });
})();
