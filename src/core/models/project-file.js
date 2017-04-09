import Backbone from 'backbone';

import Schema from '../../schema';
import utils from '../../utils';

//  We just keep this as a reference, we don't really use it for this model
const FILE_PROPERTIES = [
    { name: 'original_name', title: 'Original File Name', type: 'string' },
    { name: 'uuid', title: 'UUID', type: 'string' },
    { name: 'content_type', title: 'Content Type', type: 'string' },
    { name: 'size', title: 'File Size', type: 'number' },
    { name: 'has_thumbnail', title: 'Has Thumbnail', type: 'boolean' },
    { name: 'thumbnail_height', title: 'Thumbnail Height', type: 'number' },
    { name: 'thumbnail_width', title: 'Thumbnail Width', type: 'number' },
    { name: 'created_at', title: 'Created', type: 'string' },
    { name: 'updated_at', title: 'Updated', type: 'string' },
];

export default Backbone.Model.extend({
    idAttribute: 'uuid',
    schema: Schema.createSchema(FILE_PROPERTIES),
    //  We don't really want to save anything for this model
    save() {
        return false;
    },
    parse(data) {
        const file_data = data && data.file ? data.file : data;

        return Schema.parseAccordingToSchema(file_data, this.schema);
    },
    getDownloadUrl(make_absolute) {
        let prefix = '';
        const pattern = /^http/i;

        if (make_absolute === true && !pattern.test(this.url())) {
            prefix = `http://${window.location.host}`;
        }

        return `${prefix + this.url()}/download`;
    },
    getThumbnailUrl() {
        return this.get('has_thumbnail') ? `${this.url()}/thumbnail` : undefined;
    },
    getGoogleDocsViewUrl() {
        const prefix = 'https://docs.google.com/viewer?url=';

        return prefix + this.getDownloadUrl(true);
    },
    getFileSize() {
        return utils.format.fileSize(this.get('size'));
    },
    initialize(attributes, options) {
        this.options = options || {};
    },
});
