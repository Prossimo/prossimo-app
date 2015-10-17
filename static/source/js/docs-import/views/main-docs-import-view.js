var app = app || {};

(function () {
    'use strict';

    app.MainDocsImportView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen docs-import-screen',
        template: app.templates['docs-import/main-docs-import-view'],
        ui: {
            '$selection_area': '.docs-selection-area',
            '$iframe': 'iframe'
        },
        events: {
            'document-selected': 'onDocumentSelected'
        },
        updateFile: function () {
            var base_url = '/static/public/pdfjs/web/viewer.html';
            var file_url = this.active_document_url || '';
            var result_url = base_url;

            if ( file_url !== '' ) {
                result_url = base_url + '?file=' + file_url;
                this.ui.$iframe.attr('src', result_url);
            }
        },
        onDocumentSelected: function (e) {
            this.active_document_url = e.url;
            this.updateFile();
        },
        initialize: function () {
            this.active_document_url = '';
        },
        onRender: function () {
            var windows_table_view = new app.WindowsTableView({
                collection: app.current_project.windows
            });

            var document_selector_view = new app.DocumentSelectorView({
                model: app.current_project,
                active_document_url: this.active_document_url
            });

            this.$el.append(windows_table_view.render().el);
            this.ui.$selection_area.append(document_selector_view.render().el);

            this.updateFile();
        }
    });
})();
