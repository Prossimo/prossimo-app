import Backbone from 'backbone';

import App from '../../main';
import Project from '../models/project';

export default Backbone.Collection.extend({
    model: Project,
    url() {
        return `${App.settings.get('api_base_path')}/projects`;
    },
    parse(data) {
        return data.projects || data;
    },
    comparator(item) {
        return item.id;
    },
    initialize() {
        this.proxy_project = new Project(null, { proxy: true });
    },
    getNameTitleTypeHash(names) {
        return this.proxy_project.getNameTitleTypeHash(names);
    },
    getTitles(names) {
        return this.proxy_project.getTitles(names);
    },
});
