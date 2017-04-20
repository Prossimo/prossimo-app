import Backbone from 'backbone';

import App from '../../main';
import ProjectFile from '../models/project-file';

export default Backbone.Collection.extend({
    model: ProjectFile,
    url() {
        return `${App.settings.get('api_base_path')}/files`;
    },
    getUuids() {
        return this.pluck('uuid');
    },
    initialize(models, options) {
        this.options = options || {};
    },
});
