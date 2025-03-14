import $ from 'jquery';
import _ from 'underscore';
import Marionette from 'backbone.marionette';

import App from '../../../main';
import { globalChannel } from '../../../utils/radio';
import ProfilesView from './profiles-view';
import FillingTypesView from './filling-types-view';
import OptionsView from './options-view';
import template from '../templates/main-settings-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'screen settings-screen',
    template,
    ui: {
        $profiles_container: '.profiles-container',
        $filling_types_container: '.filling_types-container',
        $options_container: '.options-container',
    },
    events: {
        'click .nav-tabs a': 'onTabClick',
    },
    getActiveTab() {
        return this.tabs[this.active_tab];
    },
    setActiveTab(tab_name) {
        if (_.contains(_.keys(this.tabs), tab_name)) {
            this.active_tab = tab_name;
        }
    },
    onTabClick(e) {
        const target = $(e.target).attr('href').replace('#', '');

        e.preventDefault();
        this.setActiveTab(target);
        this.render();
    },
    onRender() {
        if (this.active_tab === 'profiles') {
            this.profiles_view = new ProfilesView({
                collection: App.settings.profiles,
                parent_view: this,
            });

            this.ui.$profiles_container.append(this.profiles_view.render().el);
        } else if (this.profiles_view) {
            this.profiles_view.destroy();
        }

        if (this.active_tab === 'filling_types') {
            this.filling_types_view = new FillingTypesView({
                collection: App.settings.filling_types,
                parent_view: this,
            });

            this.ui.$filling_types_container.append(this.filling_types_view.render().el);
        } else if (this.filling_types_table_view) {
            this.filling_types_view.destroy();
        }

        if (this.active_tab === 'options') {
            this.options_view = new OptionsView({
                collection: App.settings.dictionaries,
                parent_view: this,
            });

            this.ui.$options_container.append(this.options_view.render().el);
        } else if (this.options_view) {
            this.options_view.destroy();
        }
    },
    templateContext() {
        return {
            tabs: _.mapObject(this.tabs, (item, key) => (
                _.extend({}, item, {
                    is_active: key === this.active_tab,
                })
            )),
        };
    },
    onBeforeDestroy() {
        if (this.profiles_view) {
            this.profiles_view.destroy();
        }

        if (this.filling_types_view) {
            this.filling_types_view.destroy();
        }

        if (this.options_view) {
            this.options_view.destroy();
        }
    },
    initialize() {
        this.tabs = {
            profiles: {
                title: 'Profiles',
            },
            filling_types: {
                title: 'Filling Types',
            },
            options: {
                title: 'Options',
            },
        };
        this.active_tab = 'profiles';

        this.listenTo(globalChannel, 'settings:fetch_data:stop', this.render);
    },
});
