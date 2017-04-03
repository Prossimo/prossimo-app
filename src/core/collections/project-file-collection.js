import Backbone from 'backbone';

import App from '../../main';
import ProjectFile from '../models/project-file';

export default Backbone.Collection.extend({
    model: ProjectFile,
    url: function () {
        return App.settings.get('api_base_path') + '/files';
    },
    getUuids: function () {
        return this.pluck('uuid');
    },
    initialize: function (models, options) {
        this.options = options || {};
    }
});
