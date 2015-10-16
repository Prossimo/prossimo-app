var app = app || {};

(function () {
    'use strict';

    app.MainDocsImportView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen docs-import-screen',
        template: app.templates['docs-import/main-docs-import-view'],
        // events: {

        // },
        updateFile: function (name, url) {
            var base_url = '/static/public/pdfjs/web/viewer.html';
            // var file_name = name || '';
            var file_url = url || '';
            // var file_url = '/home/thevasya/Downloads/helloworld.pdf';
            var result_url = base_url;

            if ( file_url !== '' ) {
                result_url = base_url + '?file=' + file_url;
            }

            this.$iframe.attr('src', result_url);
        },
        initialize: function () {
            var self = this;
            this.$el.on('document-selected', function (e) {
                // console.log( e.filename, e.url );
                self.updateFile( e.filename, e.url );
            });
        },
        onRender: function () {
            var windows_table_view = new app.WindowsTableView({
                collection: app.current_project.windows
            });

            var document_selector_view = new app.DocumentSelectorView({
                model: app.current_project
            });

            this.$el.append(windows_table_view.render().el);

            //  TODO: move this to .ui.*
            this.$selection_area = this.$('.docs-selection-area');
            this.$iframe = this.$('iframe');

            this.$selection_area.append(document_selector_view.render().el);

            // this.updateFile();
        }
    });
})();
