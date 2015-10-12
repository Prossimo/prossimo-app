var app = app || {};

(function () {
    'use strict';

    app.MainDocsImportView = Marionette.ItemView.extend({
        tagName: 'div',
        template: app.templates['docs-import/main-docs-import-view']
    });
})();
