import _ from 'underscore';
import Marionette from 'backbone.marionette';
import Backbone from 'backbone';

import Settings from './core/models/settings';
import Session from './core/models/session';
import Router from './router';
import ProjectCollection from './core/collections/project-collection';
import TopBarView from './core/views/top-bar-view';

class Application extends Marionette.Application {
    onStart() {
        //  Register a communication channel for all events in the app
        this.vent = _.extend({}, Backbone.Events);

        //  Object to hold project-independent properties
        this.settings = new Settings();
        this.session = new Session();

        this.router = new Router();

        this.projects = new ProjectCollection();
        this.top_bar_view = new TopBarView({ collection: this.projects });
        /**
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
         */
    }
}

const App = new Application();

document.addEventListener('DOMContentLoaded', () => {
    App.start();
});

export default App;
