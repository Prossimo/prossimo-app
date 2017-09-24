import Backbone from 'backbone';

import Project from '../models/project';

export default Backbone.Collection.extend({
    model: Project,
    url() {
        return `${this.options.api_base_path ? this.options.api_base_path : ''}/projects`;
    },
    parse(data) {
        return data.projects || data;
    },
    comparator(item) {
        return item.id;
    },
    initialize(models, options) {
        this.options = options || {};
        this.proxy_project = new Project(null, { proxy: true });

        this.data_store = this.options.data_store;
    },
    getNameTitleTypeHash(names) {
        return this.proxy_project.getNameTitleTypeHash(names);
    },
    getTitles(names) {
        return this.proxy_project.getTitles(names);
    },
});
