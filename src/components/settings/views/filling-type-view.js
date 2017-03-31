import $ from 'jquery';
import _ from 'underscore';
import Marionette from 'backbone.marionette';
import App from '../../../main';
import BaseSelectView from '../../../core/views/base/base-select-view';
import BaseInputView from '../../../core/views/base/base-input-view';
import ProfileConnectionsTableView from './profile-connections-table-view';
import Dialogs from '../../../dialogs';
import template from '../templates/filling-type-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'filling-type',
    template: template,
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
    editProfiles: function () {
        (new Dialogs()).showDialog('items-profiles-table', {
            collection_title: 'Filling Types',
            active_item: this.model,
            collection: this.model.collection,
            profiles: App.settings.profiles,
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
    onChangePricingScheme: function () {
        if (this.profile_connections_table_view) {
            this.profile_connections_table_view.render();
        }
    },
    onRender: function () {
        _.each(this.attribute_views, function (child_view) {
            var $row = $('<tr class="filling-type-attribute-container" />');

            $row.append('<td><h4 class="title">' + child_view.title + '</h4></td>');
            $('<td />').appendTo($row).append(child_view.view_instance.render().el);
            this.ui.$table.append($row);

            //  TODO: pass this attribute on init instead of a function call
            if (this.is_disabled) {
                child_view.view_instance.disable();
            }
        }, this);

        this.ui.$profiles_container.append(this.profile_connections_table_view.render().el);
    },
    onBeforeDestroy: function () {
        _.each(this.attribute_views, function (child_view) {
            child_view.view_instance.destroy();
        }, this);


        if (this.profile_connections_table_view) {
            this.profile_connections_table_view.destroy();
        }
    },
    initialize: function () {
        this.attributes_to_render = this.model.getNameTitleTypeHash([
            'name', 'supplier_name', 'type', 'weight_per_area', 'pricing_scheme'
        ]);
        //  For base types we want to disable editing at all
        this.is_disabled = this.model.get('is_base_type') === true;

        //  TODO: maybe we should have something generic at the model level
        function getAttributeSourceData(model, attribute_name) {
            var data_array = [];

            if (attribute_name === 'type') {
                data_array = model.getBaseTypes();
            } else if (attribute_name === 'pricing_scheme') {
                data_array = model.getPossiblePricingSchemes();
            }

            return _.map(data_array, function (item) {
                return {
                    value: item.name || item,
                    title: item.title || item
                };
            });
        }

        this.attribute_views = _.map(this.attributes_to_render, function (attribute) {
            //  We use text inputs for most attributes except for "type"
            //  attribute where we want a selectbox
            var view = _.contains(['type', 'pricing_scheme'], attribute.name) ?
                new BaseSelectView({
                    model: this.model,
                    param: attribute.name,
                    values: getAttributeSourceData(this.model, attribute.name),
                    multiple: false
                }) :
                new BaseInputView({
                    model: this.model,
                    param: attribute.name,
                    input_type: 'text',
                    placeholder: attribute.name === 'name' ? 'New Filling Type' : ''
                });

            return {
                name: attribute.name,
                title: attribute.title,
                view_instance: view
            };
        }, this);

        this.profile_connections_table_view = new ProfileConnectionsTableView({
            collection: this.model.get('filling_type_profiles')
        });

        this.listenTo(this.model, 'change:pricing_scheme', this.onChangePricingScheme);
    }
});
