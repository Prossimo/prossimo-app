import Marionette from 'backbone.marionette';
import $ from 'jquery';
import {globalChannel} from '../../utils/radio';
import App from '../../main';
import ProjectSelectorView from './project-selector-view';
import StatusPanelView from './status-panel-view';
import ProjectSettingsPanelView from './project-settings-panel-view';
import QuoteSelectorView from './quote-selector-view';
import SpinnerView from './spinner-view';
import Dialogs from '../../dialogs';
import template from '../../templates/core/top-bar-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'top-bar',
    template: template,
    ui: {
        $container: '.top-bar-container',
        $project_selector_container: '.project-selector-container',
        $create_project_button: '.js-create-new-project',
        $status_panel_container: '.status-panel-container',
        $settings_toggle: '.project-settings-toggle',
        $spinner_container: '.spinner-container',
        $quote_selector_container: '.quote-selector-container',
        $main_nav_container: '.main-nav-container',
        $edit_quotes: '.js-edit-quotes'
    },
    events: {
        'click @ui.$settings_toggle': 'onSettingsToggle',
        'click @ui.$create_project_button': 'showCreateProjectDialog',
        'click @ui.$edit_quotes': 'showEditQuotesDialog'
    },
    initialize: function () {
        this.project_selector_view = new ProjectSelectorView({collection: this.collection});
        this.quote_selector_view = new QuoteSelectorView();
        this.status_panel_view = new StatusPanelView();
        this.spinner_view = new SpinnerView();
        this.main_nav_view = this.options.main_nav_view;
        this.project_settings_panel_view = new ProjectSettingsPanelView({
            model: App.settings.getProjectSettings()
        });

        $('#header').append(this.render().el);

        this.listenTo(globalChannel, 'project_selector:fetch_current:stop', this.onCurrentProjectLoaded);
    },
    onSettingsToggle: function () {
        if (this.isProjectSelected()) {
            this.$el.toggleClass('is-project-settings-panel-open');
        }
    },
    showEditQuotesDialog: function () {
        if (this.isProjectSelected()) {
            (new Dialogs()).showDialog('edit-quotes', {
                collection: App.current_project.quotes
            });
        }
    },
    showCreateProjectDialog: function () {
        App.dialogs.showDialog('createProject');
    },
    onCurrentProjectLoaded: function () {
        if (this.isProjectSelected()) {
            this.ui.$settings_toggle.removeClass('disabled');
            this.ui.$edit_quotes.removeClass('disabled');
        }

        this.$el.removeClass('is-project-settings-panel-open');
    },
    isProjectSelected: function () {
        return App.current_project !== undefined;
    },
    templateContext: function () {
        return {
            is_settings_toggle_disabled: !this.isProjectSelected(),
            is_edit_quotes_disabled: !this.isProjectSelected()
        };
    },
    onRender: function () {
        this.ui.$project_selector_container.append(this.project_selector_view.render().el);
        this.ui.$quote_selector_container.append(this.quote_selector_view.render().el);
        this.ui.$status_panel_container.append(this.status_panel_view.render().el);
        this.ui.$spinner_container.append(this.spinner_view.render().el);
        this.ui.$main_nav_container.append(this.main_nav_view.render().el);
        this.$el.append(this.project_settings_panel_view.render().el);
    }
});
