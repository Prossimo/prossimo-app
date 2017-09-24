import Marionette from 'backbone.marionette';
import $ from 'jquery';

import { globalChannel } from '../../utils/radio';
import ProjectSelectorView from './project-selector-view';
import StatusPanelView from './status-panel-view';
import ProjectSettingsPanelView from './project-settings-panel-view';
import QuoteSelectorView from './quote-selector-view';
import SpinnerView from './spinner-view';
import template from '../../templates/core/top-bar-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'top-bar',
    template,
    ui: {
        $container: '.top-bar-container',
        $project_selector_container: '.project-selector-container',
        $create_project_button: '.js-create-new-project',
        $status_panel_container: '.status-panel-container',
        $settings_toggle: '.project-settings-toggle',
        $spinner_container: '.spinner-container',
        $quote_selector_container: '.quote-selector-container',
        $main_nav_container: '.main-nav-container',
        $edit_quotes: '.js-edit-quotes',
    },
    events: {
        'click @ui.$settings_toggle': 'onSettingsToggle',
        'click @ui.$create_project_button': 'showCreateProjectDialog',
        'click @ui.$edit_quotes': 'showEditQuotesDialog',
    },
    initialize() {
        this.data_store = this.options.data_store;

        this.project_selector_view = new ProjectSelectorView({
            data_store: this.options.data_store,
            session: this.options.session,
            collection: this.data_store.projects,
        });
        this.quote_selector_view = new QuoteSelectorView({
            data_store: this.options.data_store,
        });
        this.status_panel_view = new StatusPanelView({
            session: this.options.session,
            dialogs: this.options.dialogs,
        });
        this.spinner_view = new SpinnerView();
        this.main_nav_view = this.options.main_nav_view;
        this.project_settings_panel_view = new ProjectSettingsPanelView({
            model: this.options.data_store.getProjectSettings(),
            data_store: this.options.data_store,
        });

        $('#header').append(this.render().el);

        this.listenTo(globalChannel, 'project_selector:fetch_current:stop', this.onCurrentProjectLoaded);
    },
    onSettingsToggle() {
        if (this.isProjectSelected()) {
            this.$el.toggleClass('is-project-settings-panel-open');
        }
    },
    showEditQuotesDialog() {
        if (this.isProjectSelected()) {
            this.options.dialogs.showDialog('edit-quotes', {
                collection: this.data_store.current_project.quotes,
            });
        }
    },
    showCreateProjectDialog() {
        this.options.dialogs.showDialog('createProject', {
            data_store: this.data_store,
        });
    },
    onCurrentProjectLoaded() {
        if (this.isProjectSelected()) {
            this.ui.$settings_toggle.removeClass('disabled');
            this.ui.$edit_quotes.removeClass('disabled');
        }

        this.$el.removeClass('is-project-settings-panel-open');
    },
    isProjectSelected() {
        return this.data_store.current_project !== undefined;
    },
    templateContext() {
        return {
            is_settings_toggle_disabled: !this.isProjectSelected(),
            is_edit_quotes_disabled: !this.isProjectSelected(),
        };
    },
    onRender() {
        this.ui.$project_selector_container.append(this.project_selector_view.render().el);
        this.ui.$quote_selector_container.append(this.quote_selector_view.render().el);
        this.ui.$status_panel_container.append(this.status_panel_view.render().el);
        this.ui.$spinner_container.append(this.spinner_view.render().el);
        this.ui.$main_nav_container.append(this.main_nav_view.render().el);
        this.$el.append(this.project_settings_panel_view.render().el);
    },
});
