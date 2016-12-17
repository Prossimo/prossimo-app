var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryEntriesItemView = Marionette.View.extend({
        tagName: 'div',
        className: 'options-dictionary-entries-item',
        template: app.templates['settings/options-dictionary-entries-item-view'],
        ui: {
            $name_container: '.entry-name',
            $supplier_name_container: '.entry-supplier-name',
            $profiles_list_container: '.entry-profiles p',
            $edit_profiles: '.js-edit-entry-profiles',
            $clone: '.js-clone-entry',
            $remove: '.js-remove-entry',
            $expand: '.js-expand-entry',
            $expand_container: '.profile-availability'
        },
        events: {
            'click @ui.$edit_profiles': 'editProfiles',
            'click @ui.$clone': 'cloneEntry',
            'click @ui.$remove': 'removeEntry',
            'click @ui.$expand': 'expandEntry'
        },
        editProfiles: function () {
            app.dialogs.showDialog('items-profiles-table', {
                collection_title: this.model.collection.options.dictionary.get('name'),
                active_item: this.model,
                collection: this.model.collection,
                profiles: app.settings.profiles,
                filter_condition: function (item) {
                    return item.get('name') && !item.hasOnlyDefaultAttributes();
                }
            });
        },
        getProfilesNamesList: function () {
            var profiles_ids = _.pluck(this.model.get('dictionary_entry_profiles'), 'profile_id');
            var profiles_names_list = [];

            if ( profiles_ids && profiles_ids.length ) {
                if ( app.settings ) {
                    profiles_names_list = app.settings.getProfileNamesByIds(profiles_ids.sort());
                } else {
                    profiles_names_list = profiles_ids.sort();
                }
            }

            return profiles_names_list;
        },
        removeEntry: function () {
            this.model.destroy();
        },
        cloneEntry: function () {
            this.model.duplicate();
        },
        expandEntry: function () {
            this.is_expanded = !this.is_expanded;

            this.ui.$expand_container.toggleClass('is-shown', this.is_expanded);
        },
        templateContext: function () {
            var profiles = this.getProfilesNamesList();

            return {
                is_expanded: this.is_expanded,
                name: this.model.get('name'),
                supplier_name: this.model.get('supplier_name'),
                profiles: profiles,
                profiles_string: profiles.length ? profiles.join(', ') : '--'
            };
        },
        onRender: function () {
            var profiles = this.templateContext().profiles;

            this.ui.$name_container.empty().append(this.name_input_view.render().el);
            this.ui.$supplier_name_container.empty().append(this.supplier_name_input_view.render().el);

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

            if ( this.model.hasOnlyDefaultAttributes() ) {
                this.$el.addClass('is-new');
            } else {
                this.$el.removeClass('is-new');
            }

            this.ui.$expand_container.append(this.profile_connections_table_view.render().el);
        },
        onBeforeDestroy: function () {
            if ( this.name_input_view ) {
                this.name_input_view.destroy();
            }

            if ( this.profile_connections_table_view ) {
                this.profile_connections_table_view.destroy();
            }

            if ( this.supplier_name_input_view ) {
                this.supplier_name_input_view.destroy();
            }

            this.ui.$profiles_list_container.off();
            this.ui.$profiles_list_container.tooltip('destroy');
        },
        initialize: function () {
            this.is_expanded = false;

            this.name_input_view = new app.BaseInputView({
                model: this.model,
                param: 'name',
                input_type: 'text',
                placeholder: 'New Entry'
            });

            this.supplier_name_input_view = new app.BaseInputView({
                model: this.model,
                param: 'supplier_name',
                input_type: 'text',
                placeholder: ''
            });

            this.profile_connections_table_view = new app.ProfileConnectionsTableView({
                collection: this.model.profiles
            });

            this.listenTo(this.model, 'change:dictionary_entry_profiles change:name change:supplier_name', function () {
                this.render();
                this.name_input_view.delegateEvents();
                this.supplier_name_input_view.delegateEvents();
            });
        }
    });
})();
