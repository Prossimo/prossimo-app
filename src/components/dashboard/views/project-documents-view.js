import Marionette from 'backbone.marionette';
import App from '../../../main';
import template from '../templates/project-documents-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'document-list',
    template: template,
    templateContext: function () {
        return {
            has_documents: App.current_project.files.length,
            document_list: App.current_project.files.map(function (item) {
                return {
                    name: item.get('original_name'),
                    url: item.getDownloadUrl(),
                    gdocs_url: item.getGoogleDocsViewUrl(),
                    size: item.getFileSize()
                };
            }, this)
        };
    }
});
