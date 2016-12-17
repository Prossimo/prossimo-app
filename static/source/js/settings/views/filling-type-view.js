var app = app || {};

(function () {
    'use strict';

    app.FillingTypeView = Marionette.View.extend({
        tagName: 'div',
        className: 'filling-type',
        template: app.templates['settings/filling-type-view'],
        ui: {
            $table: '.filling-type-attributes',
            $edit_profiles: '.js-edit-fillingtype-profiles',
            $clone: '.js-clone-filling-type',
            $remove: '.js-remove-filling-type',
            $profiles_container: '.profile-availability'
        },
        events: {
            'click @ui.$edit_profiles': 'editProfiles',
            'click @ui.$clone': 'cloneItem',
            'click @ui.$remove': 'removeItem'
        },
        getProfilesNamesList: function () {
            var profiles_ids = _.pluck(this.model.get('filling_type_profiles'), 'profile_id');
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
        editProfiles: function () {
            app.dialogs.showDialog('items-profiles-table', {
                collection_title: 'Filling Types',
                active_item: this.model,
                collection: this.model.collection,
                profiles: app.settings.profiles,
                filter_condition: function (item) {
                    return item.get('name') && !item.hasOnlyDefaultAttributes() && item.get('is_base_type') !== true;
                }
            });
        },
        removeItem: function () {
            this.model.destroy();
        },
        cloneItem: function () {
            this.model.duplicate();
        },
        onRender: function () {
            _.each(this.attribute_views, function (child_view) {
                var $row = $('<tr class="filling-type-attribute-container" />');

                $row.append('<td><h4 class="title">' + child_view.title + '</h4></td>');
                $('<td />').appendTo($row).append(child_view.view_instance.render().el);
                this.ui.$table.append($row);

                //  TODO: pass this attribute on init instead of a function call
                if ( this.is_disabled ) {
                    child_view.view_instance.disable();
                }
            }, this);

            this.ui.$profiles_container.append(this.profile_connections_table_view.render().el);
        },
        onBeforeDestroy: function () {
            _.each(this.attribute_views, function (child_view) {
                child_view.view_instance.destroy();
            }, this);

            if ( this.profile_connections_table_view ) {
                this.profile_connections_table_view.destroy();
            }
        },
        templateContext: function () {
            var profiles = this.getProfilesNamesList();

            return {
                profiles_string: profiles.length ? profiles.join(', ') : '--'
            };
        },
        initialize: function () {
            this.attributes_to_render = this.model.getNameTitleTypeHash([
                'name', 'supplier_name', 'type', 'weight_per_area'
            ]);
            //  For base types we want to disable editing at all
            this.is_disabled = this.model.get('is_base_type') === true;

            this.attribute_views = _.map(this.attributes_to_render, function (attribute) {
                //  We use text inputs for most attributes except for "type"
                //  attribute where we want a selectbox
                var view = attribute.name === 'type' ?
                    new app.BaseSelectView({
                        model: this.model,
                        param: 'type',
                        values: _.map(this.model.getBaseTypes(), function (item) {
                            return {
                                value: item.name,
                                title: item.title
                            };
                        }),
                        multiple: false
                    }) :
                    new app.BaseInputView({
                        model: this.model,
                        param: attribute.name,
                        input_type: 'text',
                        placeholder: attribute.name === 'name' ? 'New Filling Type' : ''
                    });

                return {
                    title: attribute.title,
                    view_instance: view
                };
            }, this);

            this.profile_connections_table_view = new app.ProfileConnectionsTableView({
                collection: this.model.profiles
            });

            this.listenTo(this.model, 'change:filling_type_profiles change:name', function () {
                this.render();

                _.each(this.attribute_views, function (child_view) {
                    child_view.view_instance.delegateEvents();
                });
            });
        }
    });
})();
