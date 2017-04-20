import Marionette from 'backbone.marionette';
import Backbone from 'backbone';
import 'bootstrap';
import 'bootstrap-select';
import 'bootstrap-toggle';
import 'bootstrap-datepicker';
import 'backbone.marionette.keyshortcuts';

import { getGlobalChannelName } from './utils/radio';
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
import MainSupplierRequestView from './components/supplier-request/views/main-supplier-request-view';

class Application extends Marionette.Application {
    constructor(options = {}) {
        super(Object.assign({
            //  Register a communication channel for all events in the app
            channelName: getGlobalChannelName(),
        }, options));
    }

    initialize() {
        //  Object to hold project-independent properties
        this.settings = new Settings();
        this.session = new Session();
    }

    onStart() {
        this.getChannel().trigger('app:start');

        this.router = new Router();
        this.projects = new ProjectCollection();
        this.main_region = new Marionette.Region({ el: '#main' });
        this.dialogs = new Dialogs();

        this.top_bar_view = new TopBarView({
            collection: this.projects,
            main_nav_view: new MainNavigationView({
                dashboard: {
                    title: 'Dashboard',
                    path: 'dashboard',
                    icon_name: 'dashboard',
                    onAttach: () => {
                        this.main_region.show(new MainDashboardView());
                    },
                },
                units_table: {
                    title: 'Units',
                    path: 'units',
                    icon_name: 'th',
                    onAttach: () => {
                        this.main_region.show(new MainUnitsTableView());
                    },
                },
                drawing: {
                    title: 'Drawing',
                    path: 'drawing',
                    icon_name: 'pencil',
                    onAttach: () => {
                        this.main_region.show(new MainDrawingView());
                    },
                },
                quote: {
                    title: 'Quote',
                    path: 'quote',
                    icon_name: 'shopping-cart',
                    onAttach: () => {
                        this.main_region.show(new MainQuoteView());
                    },
                },
                supplier_request: {
                    title: 'Supplier',
                    path: 'supplier',
                    icon_name: 'send',
                    onAttach: () => {
                        this.main_region.show(new MainSupplierRequestView());
                    },
                },
                settings: {
                    title: 'Settings',
                    path: 'settings',
                    icon_name: 'wrench',
                    onAttach: () => {
                        this.main_region.show(new MainSettingsView());
                    },
                },
            }),
        });

        this.paste_image_helper = new PasteImageHelper();
        this.session.checkAuth();

        this.getChannel().on('auth:initial_login auth:no_backend', () => {
            Backbone.history.start({ pushState: true });

            if (Backbone.history.fragment === '') {
                this.router.navigate('/dashboard/', { trigger: true });
            }
        });
    }
}

const App = new Application();

document.addEventListener('DOMContentLoaded', () => {
    App.start();
});

export default App;
