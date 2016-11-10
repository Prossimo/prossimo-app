var app = app || {};

$(function () {
    'use strict';

    app.App = new Marionette.Application();

    app.App.eventToPromise = function (obj, e) {
        var deferred = $.Deferred();

        obj.once(e, function () {
            deferred.resolve();
        });

        return deferred.promise();
    };

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
                main: '#main',
                sidebar: '#sidebar'
            }
        });
        // Show main nav
        this.regionManager.get('sidebar').show(new app.MainNavigationView());
        // Show default view
        this.regionManager.get('main').show(new app.NoProjectSelectedView());

        app.dialogs = new app.Dialogs();

        app.paste_image_helper = new app.PasteImageHelper();
        app.session.checkAuth();

        this.modules_options = {region: this.regionManager.get('main')};
        this.Settings = new app.SettingsModule(this.modules_options);

        this.eventToPromise(app.vent, 'auth:initial_login auth:no_backend').then(function () {
            /**
             * Start the hash change handling
             */
            if (!Backbone.History.started) {
                Backbone.history.start({pushState: true, hashChange: false});
            }

            return this.eventToPromise(app.vent, 'project_selector:fetch_current:stop');
        }.bind(this)).then(function () {
            /**
             * Modules initialization
             * It must be called once
             */
            this.quote = new app.Quote(this.modules_options);
            this.dashboard = new app.Dashboard(this.modules_options);
            this.units = new app.Units(this.modules_options);
            this.Drawing = new app.Drawing(this.modules_options);
            this.Supplier = new app.Supplier(this.modules_options);

            /**
             * It is necessary to reboot current route handler
             */
            this.listenTo(app.vent, 'project_selector:fetch_current:stop', function () {
                Backbone.history.loadUrl();
            });

            Backbone.history.loadUrl();
        }.bind(this));
    });

    app.App.start();
});
