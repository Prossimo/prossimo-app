var app = app || {};

(function () {
    'use strict';

    app.MainSettingsView = Marionette.View.extend({
        tagName: 'div',
        className: 'screen settings-screen',
        template: app.templates['settings/main-settings-view'],
        ui: {
            $profiles_container: '.profiles-container',
            $filling_types_container: '.filling_types-container',
            $options_container: '.options-container'
        },
        events: {
            'click .nav-tabs a': 'onTabClick'
        },
        initialize: function () {
            this.tabs = {
                profiles: {
                    title: 'Profiles'
                },
                filling_types: {
                    title: 'Filling Types'
                },
                options: {
                    title: 'Options'
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
            } else if ( this.profiles_table_view ) {
                this.profiles_table_view.destroy();
            }

            if ( this.active_tab === 'filling_types' ) {
                this.filling_types_view = new app.FillingTypesView({
                    collection: app.settings.filling_types,
                    parent_view: this
                });

                this.ui.$filling_types_container.append(this.filling_types_view.render().el);
            } else if ( this.filling_types_table_view ) {
                this.filling_types_view.destroy();
            }

            if ( this.active_tab === 'options' ) {
                this.options_view = new app.OptionsView({
                    collection: app.settings.dictionaries,
                    parent_view: this
                });

                this.ui.$options_container.append(this.options_view.render().el);
            } else if ( this.options_view ) {
                this.options_view.destroy();
            }
        },
        templateContext: function () {
            return {
                tabs: _.each(this.tabs, function (item, key) {
                    item.is_active = key === this.active_tab;
                    return item;
                }, this)
            };
        },
        onBeforeDestroy: function () {
            if ( this.profiles_table_view ) {
                this.profiles_table_view.destroy();
            }

            if ( this.filling_types_view ) {
                this.filling_types_view.destroy();
            }

            if ( this.options_view ) {
                this.options_view.destroy();
            }
        }
    });
})();
