var app = app || {};

$(document).ready(function () {
    'use strict';

    app.router = new app.AppRouter();

    //  Register a communication channel for all events in the app
    app.vent = {};
    _.extend(app.vent, Backbone.Events);

    app.current_project = new app.Project();

    app.main_region = new Marionette.Region({
        el: '#main'
    });

    app.main_docs_import_view = new app.MainDocsImportView();
    app.main_drawing_view = new app.MainDrawingWindowsView();
    app.main_quote_view = new app.MainQuoteView();

    app.main_navigation = new app.MainNavigationView({
        docs_import: {
            title: 'Docs',
            path: 'docs',
            icon_name: 'file',
            showCallback: function () {
                app.main_region.show(app.main_docs_import_view, { preventDestroy: true });
            }
        },
        drawing_windows: {
            title: 'Drawing',
            path: 'drawing',
            icon_name: 'pencil',
            showCallback: function () {
                app.main_region.show(app.main_drawing_view, { preventDestroy: true });
            }
        },
        quote: {
            title: 'Quote',
            path: 'quote',
            icon_name: 'shopping-cart',
            showCallback: function () {
                app.main_region.show(app.main_quote_view, { preventDestroy: true });
            }
        },
    });

    Backbone.history.start({ pushState: true });

    if ( Backbone.history.fragment === '' ) {
        app.router.navigate('/docs/', { trigger: true });
    }
});
