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
            $create_project_button: '.js-create-new-project',
            $status_panel_container: '.status-panel-container',
            $spinner_container: '.spinner-container',
            $project_settings_container: '.project-settings-container',
            $quote_selector_container: '.quote-selector-container',
            $main_nav_container: '.main-nav-container',
            $edit_quotes: '.js-edit-quotes'
        },
        events: {
            'click @ui.$create_project_button': 'showCreateProjectDialog',
            'click @ui.$edit_quotes': 'showEditQuotesDialog'
        },
        initialize: function () {
            this.project_selector_view = new app.ProjectSelectorView({ collection: this.collection });
            this.quote_selector_view = new app.QuoteSelectorView();
            this.status_panel_view = new app.StatusPanelView();
            this.spinner_view = new app.SpinnerView();
            this.main_nav_view = this.options.main_nav_view;
            this.project_settings_panel_view = new app.ProjectSettingsPanelView({
                model: app.settings.getProjectSettings()
            });

            $('#header').append( this.render().el );

            this.listenTo(app.vent, 'project_selector:fetch_current:stop', this.onCurrentProjectLoaded);
        },
        showEditQuotesDialog: function () {
            if ( this.isProjectSelected() ) {
                app.dialogs.showDialog('edit-quotes', {
                    collection: app.current_project.quotes
                });
            }
        },
        showCreateProjectDialog: function () {
            app.dialogs.showDialog('createProject');
        },
        onCurrentProjectLoaded: function () {
            if ( this.isProjectSelected() ) {
                this.ui.$edit_quotes.removeClass('disabled');
            }

            this.$el.removeClass('is-project-settings-panel-open');
        },
        isProjectSelected: function () {
            return app.current_project !== undefined;
        },
        templateContext: function () {
            return {
                is_edit_quotes_disabled: !this.isProjectSelected()
            };
        },
        onRender: function () {
            this.ui.$project_selector_container.append(this.project_selector_view.render().el);
            this.ui.$quote_selector_container.append(this.quote_selector_view.render().el);
            this.ui.$status_panel_container.append(this.status_panel_view.render().el);
            this.ui.$spinner_container.append(this.spinner_view.render().el);
            this.ui.$project_settings_container.append(this.project_settings_panel_view.render().el);
            this.ui.$main_nav_container.append(this.main_nav_view.render().el);
        }
    });
})();
