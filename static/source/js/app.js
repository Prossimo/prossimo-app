var app = app || {};

$(document).ready(function () {
    'use strict';

    app.current_project = new app.Project();

    app.main_region = new Marionette.Region({
        el: '#main'
    });

    app.main_docs_import_view = new app.MainDocsImportView();
    app.main_quote_view = new app.MainQuoteView();

    app.main_navigation = new app.MainNavigationView({
        docs_import: {
            title: 'Docs',
            icon_name: 'file',
            showCallback: function () {
                app.main_region.show(app.main_docs_import_view, { preventDestroy: true });
            }
        },
        quote: {
            title: 'Quote',
            icon_name: 'shopping-cart',
            showCallback: function () {
                app.main_region.show(app.main_quote_view, { preventDestroy: true });
            }
        },
    });

    //  TODO: use marionette region?
    $('#sidebar').append( app.main_navigation.render().el );
    $('#sidebar').find('.docs_import').trigger('click');
});
