import Marionette from 'backbone.marionette';

import template from '../templates/project-documents-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'document-list',
    template,
    templateContext() {
        return {
            has_documents: this.collection.length,
            document_list: this.collection.map(item => ({
                name: item.get('original_name'),
                url: item.getDownloadUrl(),
                gdocs_url: item.getGoogleDocsViewUrl(),
                size: item.getFileSize(),
            }), this),
        };
    },
});
