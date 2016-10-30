var app = app || {};

(function () {
    'use strict';

    app.ProjectDocumentsView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'document-list',
        template: app.templates['dashboard/project-documents-view'],
        serializeData: function () {
            return {
                has_documents: app.current_project.files.length,
                document_list: app.current_project.files.map(function (item) {
                    return {
                        name: item.get('original_name'),
                        url: item.getDownloadUrl()
                    };
                }, this)
            };
        }
    });
})();
