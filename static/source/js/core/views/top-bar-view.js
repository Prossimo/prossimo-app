var app = app || {};

(function () {
    'use strict';

    app.TopBarView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'top-bar',
        template: app.templates['core/top-bar-view'],
        ui: {
            $container: '.top-bar-container',
            $project_selector_container: '.project-selector-container',
            $status_panel_container: '.status-panel-container',
            $settings_toggle: '.project-settings-toggle',
            $spinner_container: '.spinner-container'
        },
        events: {
            'click @ui.$settings_toggle': 'onSettingsToggle'
        },
        initialize: function () {
            this.project_selector_view = new app.ProjectSelectorView({ collection: this.collection });
            this.status_panel_view = new app.StatusPanelView();
            this.project_settings_panel_view = new app.ProjectSettingsPanelView({
                model: app.settings.getProjectSettings()
            });
            this.spinner_view = new app.SpinnerView();

            $('#header').append( this.render().el );

            this.listenTo(app.vent, 'project_selector:fetch_current:stop', this.onCurrentProjectLoaded);
        },
        onSettingsToggle: function () {
            if ( !this.isToggleDisabled() ) {
                this.$el.toggleClass('is-project-settings-panel-open');
            }
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
        serializeData: function () {
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
})();
