var app = app || {};

(function () {
    'use strict';

    app.TopBarView = Marionette.View.extend({
        tagName: 'div',
        className: 'top-bar',
        template: app.templates['core/top-bar-view'],
        ui: {
            $container: '.top-bar-container',
            $project_selector_container: '.project-selector-container',
            $create_project_button: '.create-project-button',
            $status_panel_container: '.status-panel-container',
            $settings_toggle: '.project-settings-toggle',
            $spinner_container: '.spinner-container',
            $main_nav_container: '.main-nav-container'
        },
        events: {
            'click @ui.$settings_toggle': 'onSettingsToggle',
            'click @ui.$create_project_button': 'onOpenProjectForm'
        },
        initialize: function () {
            this.project_selector_view = new app.ProjectSelectorView({ collection: this.collection });
            this.status_panel_view = new app.StatusPanelView();
            this.project_settings_panel_view = new app.ProjectSettingsPanelView({
                model: app.settings.getProjectSettings()
            });
            this.spinner_view = new app.SpinnerView();
            this.main_nav_view = this.options.main_nav_view;

            $('#header').append( this.render().el );

            this.listenTo(app.vent, 'project_selector:fetch_current:stop', this.onCurrentProjectLoaded);
        },
        onSettingsToggle: function () {
            if ( !this.isToggleDisabled() ) {
                this.$el.toggleClass('is-project-settings-panel-open');
            }
        },
        onOpenProjectForm: function () {
            app.dialogs.showDialog('createProject');
        },
        onCurrentProjectLoaded: function () {
            if ( !this.isToggleDisabled() ) {
                this.ui.$settings_toggle.removeClass('disabled');
            }

            this.$el.removeClass('is-project-settings-panel-open');
        },
        isToggleDisabled: function () {
            return !app.settings.getProjectSettings();
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
            this.ui.$main_nav_container.append(this.main_nav_view.render().el);
        }
    });
})();
