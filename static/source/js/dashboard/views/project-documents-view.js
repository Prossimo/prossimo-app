import Marionette from 'backbone.marionette';
import App from '../../../main';
import template from '../templates/project-documents-view.hbs';

export default Marionette.View.extend({
        tagName: 'div',
        className: 'document-list',
        template: app.templates['dashboard/project-documents-view'],
        templateContext: function () {
            return {
                has_documents: this.collection.length,
                document_list: this.collection.map(function (item) {
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
});
