var app = app || {};

$(function () {
    'use strict';

    // Fix bug with empty json response
    $.ajaxSetup({
        dataFilter: function (rawData, type) {
            if (rawData) {
                return rawData;
            }

            if (type === 'json') {
                return null;
            }
        }
    });

    app.App = new Marionette.Application();

    app.App.on('start', function () {
        //  Register a communication channel for all events in the app
        app.vent = {};
        _.extend(app.vent, Backbone.Events);

        //  Object to hold project-independent properties
        app.settings = new app.Settings();
        app.session = new app.Session();
        app.router = new app.AppRouter();

        app.projects = new app.ProjectCollection();
        app.top_bar_view = new app.TopBarView({ collection: app.projects });

        app.main_region = new Marionette.Region({ el: '#main' });
        app.dialogs = new app.Dialogs();

        app.main_navigation = new app.MainNavigationView({
            dashboard: {
                title: 'Dashboard',
                path: 'dashboard',
                icon_name: 'dashboard',
                onAttach: function () {
                    app.main_region.show(new app.MainDashboardView());
                }
            },
            units_table: {
                title: 'Units',
                path: 'units',
                icon_name: 'th',
                onAttach: function () {
                    app.main_region.show(new app.MainUnitsTableView());
                }
            },
            drawing: {
                title: 'Drawing',
                path: 'drawing',
                icon_name: 'pencil',
                onAttach: function () {
                    app.main_region.show(new app.MainDrawingView());
                }
            },
            quote: {
                title: 'Quote',
                path: 'quote',
                icon_name: 'shopping-cart',
                onAttach: function () {
                    app.main_region.show(new app.MainQuoteView());
                }
            },
            supplier_request: {
                title: 'Supplier',
                path: 'supplier',
                icon_name: 'send',
                onAttach: function () {
                    app.main_region.show(new app.MainSupplierRequestView());
                }
            },
            settings: {
                title: 'Settings',
                path: 'settings',
                icon_name: 'wrench',
                onAttach: function () {
                    app.main_region.show(new app.MainSettingsView());
                }
            }
        });

        app.paste_image_helper = new app.PasteImageHelper();
        app.session.checkAuth();

        app.vent.on('auth:initial_login auth:no_backend', function () {
            Backbone.history.start({ pushState: true });

            if ( Backbone.history.fragment === '' ) {
                app.router.navigate('/dashboard/', { trigger: true });
            }
        });
    });

    app.App.start();
});
