var app = app || {};

window.ENTER_KEY = 13;

$(document).ready(function () {
    'use strict';

    //  Register a communication channel for all events in the app
    app.vent = {};
    _.extend(app.vent, Backbone.Events);

    //  Object to hold project-independent properties
    app.settings = new app.Settings();
    app.session = new app.Session();
    app.router = new app.AppRouter();

    app.projects = new app.ProjectCollection();
    app.project_selector = new app.ProjectSelectorView({ collection: app.projects });
    app.status_panel = new app.StatusPanelView();

    app.main_region = new Marionette.Region({ el: '#main' });
    app.dialogs = new app.Dialogs();

    app.main_navigation = new app.MainNavigationView({
        units_table: {
            title: 'Units',
            path: 'units',
            icon_name: 'th',
            onShow: function () {
                app.main_region.show(new app.MainUnitsTableView());
            }
        },
        docs_import: {
            title: 'Docs',
            path: 'docs',
            icon_name: 'file',
            onShow: function () {
                app.main_region.show(new app.MainDocsImportView());
            }
        },
        drawing: {
            title: 'Drawing',
            path: 'drawing',
            icon_name: 'pencil',
            onShow: function () {
                app.main_region.show(new app.MainDrawingView());
            }
        },
        quote: {
            title: 'Quote',
            path: 'quote',
            icon_name: 'shopping-cart',
            onShow: function () {
                app.main_region.show(new app.MainQuoteView());
            }
        },
        supplier_request: {
            title: 'Supplier',
            path: 'supplier',
            icon_name: 'send',
            onShow: function () {
                app.main_region.show(new app.MainSupplierRequestView());
            }
        },
        settings: {
            title: 'Settings',
            path: 'settings',
            icon_name: 'cog',
            onShow: function () {
                app.main_region.show(new app.MainSettingsView());
            }
        }
    });

    app.paste_image_helper = new app.PasteImageHelper();
    app.session.checkAuth();

    app.vent.on('auth:initial_login auth:no_backend', function () {
        Backbone.history.start({ pushState: true });

        if ( Backbone.history.fragment === '' ) {
            app.router.navigate('/units/', { trigger: true });
        }
    });
});
