var app = app || {};

(function () {
    'use strict';

    //  README: some stuff is commented out due to this issue:
    //  https://bitbucket.org/prossimo/prossimo-app/issues/137
    //  This is a temporary change, we're going to re-evaluate this screen
    //  when we'll start integration with PDF-processing API
    app.MainDocsImportView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen docs-import-screen',
        template: app.templates['docs-import/main-docs-import-view'],
        ui: {
            $selection_area: '.docs-selection-area',
            $iframe: 'iframe',
            $document_list_container: '.document-list-container'
        },
        // events: {
        //     'document-selected': 'onDocumentSelected'
        // },
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
            this.listenTo(app.current_project, 'set_dependencies', this.render);
        },
        onRender: function () {
            // this.units_table_view = new app.UnitsTableView({
            //     collection: app.current_project.units,
            //     extras: app.current_project.extras,
            //     parent_view: this
            // });

            // this.document_selector_view = new app.DocumentSelectorView({
            //     model: app.current_project,
            //     active_document_url: this.active_document_url
            // });

            this.document_list_view = new app.DocumentListView({
                model: app.current_project
            });

            // this.$el.append(this.units_table_view.render().el);
            // this.ui.$selection_area.append(this.document_selector_view.render().el);
            this.ui.$document_list_container.append(this.document_list_view.render().el);

            // this.updateFile();
        },
        onDestroy: function () {
            // this.units_table_view.destroy();
            // this.document_selector_view.destroy();
            this.document_list_view.destroy();
        }
    });
})();
