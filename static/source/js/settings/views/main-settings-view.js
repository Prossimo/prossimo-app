var app = app || {};

(function () {
    'use strict';

    app.MainSettingsView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen settings-screen',
        template: app.templates['settings/main-settings-view'],
        ui: {
            $profiles_container: '.profiles-container',
            $ui_settings_container: '.ui_settings-container',
            $filling_types_container: '.filling_types-container'
        },
        events: {
            'click .nav-tabs a': 'onTabClick'
        },
        initialize: function () {
            this.tabs = {
                profiles: {
                    title: 'Profiles'
                },
                ui_settings: {
                    title: 'UI Settings'
                },
                filling_types: {
                    title: 'Filling Types'
                }
            };
            this.active_tab = 'profiles';
        },
        getActiveTab: function () {
            return this.tabs[this.active_tab];
        },
        setActiveTab: function (tab_name) {
            if ( _.contains(_.keys(this.tabs), tab_name) ) {
                this.active_tab = tab_name;
            }
        },
        onTabClick: function (e) {
            var target = $(e.target).attr('href').replace('#', '');

            e.preventDefault();
            this.setActiveTab(target);
            this.render();
        },
        onRender: function () {
            if ( this.active_tab === 'profiles' ) {
                this.profiles_table_view = new app.ProfilesTableView({
                    collection: app.settings.profiles,
                    parent_view: this
                });

                this.ui.$profiles_container.append(this.profiles_table_view.render().el);
            }

            if ( this.active_tab === 'ui_settings' ) {
                this.ui_settings_view = new app.UISettingsView({
                    model: app.settings,
                    parent_view: this
                });

                this.ui.$ui_settings_container.append(this.ui_settings_view.render().el);
            }

            if ( this.active_tab === 'filling_types' ) {
                this.filling_types_table_view = new app.FillingTypesTableView({
                    collection: app.settings.filling_types,
                    parent_view: this
                });

                this.ui.$filling_types_container.append(this.filling_types_table_view.render().el);
            }
        },
        serializeData: function () {
            return {
                tabs: _.each(this.tabs, function (item, key) {
                    item.is_active = key === this.active_tab;
                    return item;
                }, this)
            };
        },
        onDestroy: function () {
            if ( this.profiles_table_view ) {
                this.profiles_table_view.destroy();
            }

            if ( this.ui_settings_view ) {
                this.ui_settings_view.destroy();
            }

            if ( this.filling_types_table_view ) {
                this.filling_types_table_view.destroy();
            }
        }
    });
})();
