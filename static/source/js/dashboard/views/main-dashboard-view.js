import Marionette from 'backbone.marionette';
import App from '../../../main';
import Dialogs from '../../../dialogs';
import ProjectInfoView from './project-info-view';
import ProjectDocumentsView from './project-documents-view';
import template from '../templates/main-dashboard-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'screen dashboard-screen',
    template: template,
    ui: {
        $totals: '#totals',
        $project_info: '#project-info',
        $documents: '#documents',
        $quote_info: '#quote-info',
        $export_button: '.js-toggle-export-dialog'
    },
    events: {
        'click @ui.$export_button': 'showProjectExportDialog'
    },
    showProjectExportDialog: function () {
        let currentProject = App.current_project;
        let currentQuote = App.current_quote;
        (new Dialogs()).showDialog('project-export', {
            model: currentProject,
            quote: currentQuote
        });
    },
    onRender: function () {
        this.ui.$project_info.append(this.project_info_view.render().el);
        this.ui.$totals.append(this.totals_view.render().el);
        this.ui.$quote_info.append(this.quote_info_view.render().el);
        this.ui.$documents.append(this.documents_view.render().el);
    },
    onBeforeDestroy: function () {
        this.project_info_view.destroy();
        this.totals_view.destroy();
        this.quote_info_view.destroy();
        this.documents_view.destroy();
    },
    initialize: function () {
        let currentProject = App.current_project;
        let currentQuote = App.current_quote;

        this.project_info_view = new ProjectInfoView({
            model: currentProject
        });

        this.totals_view = new QuoteTotalsView({
            model: currentQuote
        });

        this.quote_info_view = new QuoteInfoView({
            model: currentQuote
        });

        this.documents_view = new ProjectDocumentsView({
            collection: currentProject.files
        });

    }
});

