var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryEntriesItemView = Marionette.ItemView.extend({
        tagName: 'tr',
        className: 'options-dictionary-entries-item',
        template: app.templates['settings/options-dictionary-entries-item-view'],
        ui: {
            $name_container: '.entry-name',
            $profiles_list_container: '.entry-profiles p'
        },
        events: {
            'click .js-edit-entry-profiles': 'editProfiles',
            'click .js-remove-entry': 'removeEntry'
        },
        editProfiles: function () {
            app.dialogs.showDialog('options-profiles-table', {
                active_entry: this.model
            });
        },
        getProfilesNamesList: function () {
            var profiles = this.model.get('profiles');
            var profiles_names_list = [];

            if ( profiles && profiles.length ) {
                if ( app.settings ) {
                    profiles_names_list = app.settings.getProfileNamesByIds(profiles.sort());
                } else {
                    profiles_names_list = profiles.sort();
                }
            }

            return profiles_names_list;
        },
        removeEntry: function () {
            this.model.destroy();
        },
        serializeData: function () {
            var profiles = this.getProfilesNamesList();

            return {
                name: this.model.get('name'),
                profiles: profiles,
                profiles_string: profiles.length ? profiles.join(', ') : '--'
            };
        },
        initialize: function () {
            this.name_input_view = new app.BaseInputView({
                model: this.model,
                param: 'name',
                input_type: 'text'
            });

            this.listenTo(this.model, 'change:profiles', function () {
                this.render();
                this.name_input_view.delegateEvents();
            });
        },
        onRender: function () {
            var profiles = this.serializeData().profiles;

            this.ui.$name_container.empty().append(this.name_input_view.render().el);

            this.ui.$profiles_list_container.on('mouseenter', function () {
                var $this = $(this);

                if ( profiles && this.offsetWidth < this.scrollWidth ) {
                    $this.tooltip({
                        title: _.map(profiles, function (item) {
                            return '<p>' + item + '</p>';
                        }),
                        html: true,
                        trigger: 'manual'
                    });
                    $this.tooltip('show');
                }
            });
            this.ui.$profiles_list_container.on('mouseleave', function () {
                $(this).tooltip('hide').tooltip('destroy');
            });
        },
        onDestroy: function () {
            if ( this.name_input_view ) {
                this.name_input_view.destroy();
            }

            this.ui.$profiles_list_container.off();
            this.ui.$profiles_list_container.tooltip('destroy');
        }
    });
})();
