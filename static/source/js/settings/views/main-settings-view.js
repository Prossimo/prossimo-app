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
            this.profiles_table_view = new app.ProfilesTableView({
                collection: app.settings.profiles,
                parent_view: this
            });

            this.ui.$profiles_table_container.append(this.profiles_table_view.render().el);
        },
        onDestroy: function () {
            this.profiles_table_view.destroy();
        }
    });
})();
