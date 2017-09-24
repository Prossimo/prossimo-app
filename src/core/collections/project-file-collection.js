import Backbone from 'backbone';

import ProjectFile from '../models/project-file';

export default Backbone.Collection.extend({
    model: ProjectFile,
    url() {
        return `${this.data_store.get('api_base_path')}/files`;
    },
    getUuids() {
        return this.pluck('uuid');
    },
    initialize(models, options) {
        this.options = options || {};
        this.data_store = this.options.data_store;
    },
});
