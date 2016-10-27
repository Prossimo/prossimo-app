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
        app.top_bar_view = new app.TopBarView({collection: app.projects});

        this.regionManager = new Marionette.RegionManager({
            regions: {
                main: '#main'
            }
        });
        app.dialogs = new app.Dialogs();

        app.main_navigation = new app.MainNavigationView({
            dashboard: {
                title: 'Dashboard',
                path: 'dashboard',
                icon_name: 'dashboard'
            },
            units_table: {
                title: 'Units',
                path: 'units',
                icon_name: 'th'
            },
            drawing: {
                title: 'Drawing',
                path: 'drawing',
                icon_name: 'pencil'
            },
            quote: {
                title: 'Quote',
                path: 'quote',
                icon_name: 'shopping-cart'
            },
            supplier_request: {
                title: 'Supplier',
                path: 'supplier',
                icon_name: 'send'
            },
            settings: {
                title: 'Settings',
                path: 'settings',
                icon_name: 'wrench'
            }
        });

        app.paste_image_helper = new app.PasteImageHelper();
        app.session.checkAuth();

        this.modules_options = {region: this.regionManager.get('main')};
        this.Settings = new app.SettingsModule(this.modules_options);

        /**
         * It must be called once
         */
        this.listenToOnce(app.vent, 'project_selector:fetch_current:stop', function () {
            /**
             * Modules initialization
             */
            this.quote = new app.Quote(this.modules_options);
            this.dashboard = new app.Dashboard(this.modules_options);
            this.units = new app.Units(this.modules_options);
            this.Drawing = new app.Drawing(this.modules_options);
            this.Supplier = new app.Supplier(this.modules_options);

            /**
             * Start the hash change handling
             */
            if (!Backbone.History.started) {
                Backbone.history.start({pushState: true, hashChange: false});
            }

            /**
             * It is necessary to reboot current route handler
             */
            this.listenTo(app.vent, 'project_selector:fetch_current:stop', function () {
                Backbone.history.loadUrl();
            });
        });
    });

    app.App.start();
});
