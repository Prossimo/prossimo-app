var app = app || {};

(function () {
    'use strict';

    app.MainDocsImportView = Marionette.ItemView.extend({
        tagName: 'div',
        template: app.templates['docs-import/main-docs-import-view'],
        onRender: function () {
            var windows_table_view = new app.WindowsTableView({
                collection: app.current_project.windows
            });
            this.$el.append(windows_table_view.render().el);
        }
    });
})();
