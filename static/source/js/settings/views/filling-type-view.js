var app = app || {};

(function () {
    'use strict';

    app.FillingTypeView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'filling-type',
        template: app.templates['settings/filling-type-view'],
        ui: {
            $table: 'table',
            $p: 'p'
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
        },
        onDestroy: function () {
            _.each(this.attribute_views, function (child_view) {
                child_view.view_instance.destroy();
            }, this);
        },
        getProfilesNamesList: function () {
            var profiles_ids = _.pluck(this.model.get('profiles'), 'id');
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
        serializeData: function () {
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
        }
    });
})();
