import Backbone from 'backbone';
import App from '../../main';
import Project from '../models/project';

export default Backbone.Collection.extend({
    model: Project,
    url: function () {
        return App.settings.get('api_base_path') + '/projects';
    },
    parse: function (data) {
        return data.projects || data;
    },
    comparator: function (item) {
        return item.id;
    },
    initialize: function () {
        this.proxy_project = new Project(null, {proxy: true});
    },
    getNameTitleTypeHash: function (names) {
        return this.proxy_project.getNameTitleTypeHash(names);
    },
    getTitles: function (names) {
        return this.proxy_project.getTitles(names);
    }
});
