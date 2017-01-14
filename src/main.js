import _ from 'underscore';
import Marionette from 'backbone.marionette';
import Backbone from 'backbone';
import Settings from './core/models/settings';
import Session from './core/models/session';
import Router from './router';
import ProjectCollection from './core/collections/project-collection';
import TopBarView from './core/views/top-bar-view';
import Dialogs from './dialogs';
import PasteImageHelper from './utils/paste-image';
import MainNavigationView from './core/views/main-navigation-view';
import MainDashboardView from './components/dashboard/views/main-dashboard-view';
import MainUnitsTableView from './components/units-table/views/main-units-table-view';
import MainDrawingView from './components/drawing/views/main-drawing-view';
import MainQuoteView from './components/quote/views/main-quote-view';
import MainSettingsView from './components/settings/views/main-settings-view';
import 'bootstrap';
import 'bootstrap-select';
import 'bootstrap-toggle';
import 'bootstrap-datepicker';
import 'backbone.marionette.keyshortcuts';

class Application extends Marionette.Application {
    onStart() {
        //  Register a communication channel for all events in the app
        this.vent = _.extend({}, Backbone.Events);

        //  Object to hold project-independent properties
        this.settings = new Settings();
        this.session = new Session();

        this.router = new Router();

        this.projects = new ProjectCollection();
        this.top_bar_view = new TopBarView({collection: this.projects});

        this.main_region = new Marionette.Region({el: '#main'});
        this.dialogs = new Dialogs();

        this.main_navigation = new MainNavigationView({
            dashboard: {
                title: 'Dashboard',
                path: 'dashboard',
                icon_name: 'dashboard',
                onAttach: () => {
                    this.main_region.show(new MainDashboardView());
                }
            },
            units_table: {
                title: 'Units',
                path: 'units',
                icon_name: 'th',
                onAttach: () => {
                    this.main_region.show(new MainUnitsTableView());
                }
            },
            drawing: {
                title: 'Drawing',
                path: 'drawing',
                icon_name: 'pencil',
                onAttach: () => {
                    this.main_region.show(new MainDrawingView());
                }
            },
            quote: {
                title: 'Quote',
                path: 'quote',
                icon_name: 'shopping-cart',
                onAttach: () => {
                    this.main_region.show(new MainQuoteView());
                }
            }/**,
             supplier_request: {
                title: 'Supplier',
                path: 'supplier',
                icon_name: 'send',
                onAttach: function () {
                    app.main_region.show(new app.MainSupplierRequestView());
                }
            }*/,
             settings: {
                title: 'Settings',
                path: 'settings',
                icon_name: 'wrench',
                onAttach: () => {
                    this.main_region.show(new MainSettingsView());
                }
            }
        });

        this.paste_image_helper = new PasteImageHelper();
        this.session.checkAuth();

        this.vent.on('auth:initial_login auth:no_backend', function () {
            Backbone.history.start({pushState: false});

            if (Backbone.history.fragment === '') {
                this.router.navigate('dashboard/', {trigger: true});
            }
        }.bind(this));
    }
}

const App = new Application();

document.addEventListener('DOMContentLoaded', () => {
    App.start();
});

export default App;
