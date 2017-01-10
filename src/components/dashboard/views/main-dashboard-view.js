import Marionette from 'backbone.marionette';
import App from '../../../main';
import ProjectInfoView from './project-info-view';
import ProjectTotalsView from './project-totals-view';
import ProjectDocumentsView from './project-documents-view';
import template from '../templates/main-dashboard-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'screen dashboard-screen',
    template: template,
    ui: {
        $totals: '#totals',
        $project_info: '#project-info',
        $documents: '#documents'
    },
    initialize: function () {
        let currentProject = App.current_project;
        this.project_info_view = new ProjectInfoView({
            model: currentProject
        });

        this.totals_view = new ProjectTotalsView({
            model: currentProject
        });

        this.documents_view = new ProjectDocumentsView({
            model: currentProject
        });
    },
    onRender: function () {
        this.ui.$project_info.append(this.project_info_view.render().el);
        this.ui.$totals.append(this.totals_view.render().el);
        this.ui.$documents.append(this.documents_view.render().el);
    },
    onBeforeDestroy: function () {
        this.project_info_view.destroy();
        this.totals_view.destroy();
        this.documents_view.destroy();
    }
});
