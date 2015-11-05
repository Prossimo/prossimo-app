var app = app || {};

(function () {
    'use strict';

    app.MainSettingsView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen settings-screen',
        template: app.templates['settings/main-settings-view'],
        ui: {
            '$profiles_table_container': '.profiles-table-container'
        },
        onRender: function () {
            var profiles_table_view = new app.ProfilesTableView({
                collection: app.current_project.profiles,
                parent_view: this
            });

            this.ui.$profiles_table_container.append(profiles_table_view.render().el);
        }
    });
})();
