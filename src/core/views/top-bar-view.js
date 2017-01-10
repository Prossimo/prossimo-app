import Marionette from 'backbone.marionette';
import $ from 'jquery';
import App from '../../main';
import ProjectSelectorView from './project-selector-view';
import StatusPanelView from './status-panel-view';
import ProjectSettingsPanelView from './project-settings-panel-view';
import SpinnerView from './spinner-view';
import template from '../../templates/core/top-bar-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'top-bar',
    template: template,
    ui: {
        $container: '.top-bar-container',
        $project_selector_container: '.project-selector-container',
        $create_project_button: '.create-project-button',
        $status_panel_container: '.status-panel-container',
        $settings_toggle: '.project-settings-toggle',
        $spinner_container: '.spinner-container'
    },
    events: {
        'click @ui.$settings_toggle': 'onSettingsToggle',
        'click @ui.$create_project_button': 'onOpenProjectForm'
    },
    initialize: function () {
        this.project_selector_view = new ProjectSelectorView({collection: this.collection});
        this.status_panel_view = new StatusPanelView();
        this.project_settings_panel_view = new ProjectSettingsPanelView({
            model: App.settings.getProjectSettings()
        });
        this.spinner_view = new SpinnerView();

        $('#header').append(this.render().el);

        this.listenTo(App.vent, 'project_selector:fetch_current:stop', this.onCurrentProjectLoaded);
    },
    onSettingsToggle: function () {
        if (!this.isToggleDisabled()) {
            this.$el.toggleClass('is-project-settings-panel-open');
        }
    },
    onOpenProjectForm: function () {
        App.dialogs.showDialog('createProject');
    },
    onCurrentProjectLoaded: function () {
        if (!this.isToggleDisabled()) {
            this.ui.$settings_toggle.removeClass('disabled');
        }

        this.$el.removeClass('is-project-settings-panel-open');
    },
    isToggleDisabled: function () {
        return !App.settings.getProjectSettings();
    },
    templateContext: function () {
        return {
            is_settings_toggle_disabled: this.isToggleDisabled()
        };
    },
    onRender: function () {
        this.ui.$project_selector_container.append(this.project_selector_view.render().el);
        this.ui.$status_panel_container.append(this.status_panel_view.render().el);
        this.$el.append(this.project_settings_panel_view.render().el);
        this.ui.$spinner_container.append(this.spinner_view.render().el);
    }
});
