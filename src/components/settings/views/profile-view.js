import _ from 'underscore';
import $ from 'jquery';
import Marionette from 'backbone.marionette';

import App from '../../../main';
import PricingGridsEditorView from './pricing-grids-editor-view';
import EquationParamsView from './equation-params-view';
import BaseSelectView from '../../../core/views/base/base-select-view';
import BaseToggleView from '../../../core/views/base/base-toggle-view';
import BaseInputView from '../../../core/views/base/base-input-view';
import template from '../templates/profile-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'profile',
    template: template,
    ui: {
        $table_general: '.attributes-group-general .profile-attributes',
        $table_dimensions: '.attributes-group-dimensions .profile-attributes',
        $table_pricing: '.attributes-group-pricing .profile-attributes',
        $table_threshold: '.attributes-group-threshold .profile-attributes',
        $table_performance: '.attributes-group-performance .profile-attributes',
        $clone: '.js-clone-profile',
        $remove: '.js-remove-profile'
    },
    events: {
        'click @ui.$clone': 'cloneItem',
        'click @ui.$remove': 'removeItem'
    },
    removeItem: function () {
        this.model.destroy();
    },
    cloneItem: function () {
        this.model.duplicate();
    },
    onRender: function () {
        _.each(this.attributes_views, function (views_group, key) {
            var $container = this.ui['$table_' + key];

            _.each(views_group, function (child_view) {
                var $row = $('<tr class="profile-attribute-container" />');

                $row.append('<td><h4 class="title">' + child_view.title + '</h4></td>');
                $('<td class="' + child_view.name + '" />').appendTo($row).append(child_view.view_instance.render().el);
                $container.append($row);
            }, this);
        }, this);

        this.renderPricingEditor();
    },
    renderPricingEditor: function () {
        if (this.pricing_grids_view) {
            this.pricing_grids_view.destroy();
        }

        if (this.equation_params_view) {
            this.equation_params_view.destroy();
        }

        var pricing_data = this.model.getPricingData();

        if (pricing_data.pricing_grids) {
            this.pricing_grids_view = new PricingGridsEditorView({
                grids: this.model.get('pricing_grids'),
                parent_view: this,
                value_column_title: 'Price / m<sup>2</sup>'
            });
            this.ui.$table_pricing.after(this.pricing_grids_view.render().el);
        }

        if (pricing_data.pricing_equation_params) {
            this.equation_params_view = new EquationParamsView({
                collection: this.model.get('pricing_equation_params')
            });
            this.ui.$table_pricing.after(this.equation_params_view.render().el);
        }
    },
    renderCustomDimensionAttributes: function () {
        var target_views = _.filter(this.attributes_views.dimensions, function (child_view) {
            return _.contains(['visible_frame_width_fixed', 'visible_frame_width_operable'], child_view.name);
        }, this);

        _.each(target_views, function (view) {
            view.view_instance.render();
        });
    },
    renderThresholdAttributes: function () {
        _.each(this.attributes_views.threshold, function (view) {
            view.view_instance.render();
            view.view_instance.undelegateEvents();
            view.view_instance.delegateEvents();
        }, this);
    },
    renderThresholdWidth: function () {
        var target_views = _.filter(this.attributes_views.threshold, function (child_view) {
            return _.contains(['threshold_width'], child_view.name);
        }, this);

        _.each(target_views, function (view) {
            view.view_instance.render();
            view.view_instance.undelegateEvents();
            view.view_instance.delegateEvents();
        }, this);
    },
    onBeforeDestroy: function () {
        _.each(this.attributes_views, function (views_group) {
            _.each(views_group, function (child_view) {
                if (child_view.view_instance) {
                    child_view.view_instance.destroy();
                }
            }, this);
        }, this);

        if (this.pricing_grids_view) {
            this.pricing_grids_view.destroy();
        }

        if (this.equation_params_view) {
            this.equation_params_view.destroy();
        }
    },
    initialize: function () {
        this.attributes = {
            general: [
                'name', 'unit_type', 'system', 'supplier_system', 'frame_corners', 'sash_corners'
            ],
            dimensions: [
                'weight_per_length', 'frame_width', 'mullion_width', 'sash_frame_width', 'sash_frame_overlap',
                'sash_mullion_overlap', 'clear_width_deduction', 'visible_frame_width_fixed',
                'visible_frame_width_operable'
            ],
            pricing: [
                'pricing_scheme'
            ],
            threshold: [
                'low_threshold', 'threshold_width'
            ],
            performance: [
                'frame_u_value', 'spacer_thermal_bridge_value'
            ]
        };

        //  These are not real profile model attributes, but some
        //  derivative values
        var custom_attributes = {
            visible_frame_width_fixed: {
                title: 'Visible Frame Width Fixed',
                value: function () {
                    return this.model.getVisibleFrameWidthFixed();
                }.bind(this)
            },
            visible_frame_width_operable: {
                title: 'Visible Frame Width Operable',
                value: function () {
                    return this.model.getVisibleFrameWidthOperable();
                }.bind(this)
            }
        };

        //  TODO: maybe we should have something generic at the model level
        function getAttributeSourceData(model, attribute_name) {
            var data_array = [];

            if (attribute_name === 'unit_type') {
                data_array = model.getUnitTypes();
            } else if (attribute_name === 'sash_corners') {
                data_array = App.settings.getSashCornerTypes();
            } else if (attribute_name === 'frame_corners') {
                data_array = App.settings.getFrameCornerTypes();
            } else if (attribute_name === 'pricing_scheme') {
                data_array = model.getPossiblePricingSchemes();
            }

            return _.map(data_array, function (item) {
                return {
                    value: item,
                    title: item
                };
            });
        }

        this.attributes_views = _.mapObject(this.attributes, function (attributes_array) {
            return _.map(attributes_array, function (attribute) {
                var attr_data = {
                    name: '',
                    title: '',
                    type: '',
                    value: '',
                    is_custom: false
                };
                var view = null;

                if (_.contains(_.keys(custom_attributes), attribute)) {
                    attr_data.name = attribute;
                    attr_data.title = custom_attributes[attribute].title;
                    attr_data.value = custom_attributes[attribute].value;
                    attr_data.is_custom = true;
                } else {
                    var hash_data = this.model.getNameTitleTypeHash([attribute])[0];

                    attr_data.name = hash_data.name;
                    attr_data.title = hash_data.title;
                    attr_data.type = hash_data.type;
                    attr_data.value = this.model.get(attribute);
                }

                //  Select appropriate view. For custom attributes it's
                //  just a generic view with no functionality
                if (attr_data.is_custom) {
                    view = new Marionette.View({
                        tagName: 'p',
                        template: false,
                        onRender: function () {
                            this.$el.html(attr_data.value());
                        }
                    });
                    //  We use text inputs for most attributes except for some
                    //  where we want a selectbox
                } else if (
                    _.contains(['unit_type', 'sash_corners', 'frame_corners', 'pricing_scheme'], attr_data.name)
                ) {
                    view = new BaseSelectView({
                        model: this.model,
                        param: attr_data.name,
                        values: getAttributeSourceData(this.model, attr_data.name),
                        custom_setter: attr_data.name === 'unit_type' ? function (new_value) {
                            return this.model.setUnitType(new_value);
                        } : false,
                        multiple: false
                    });
                    //  And for some values where we want a toggle
                } else if (attr_data.name === 'low_threshold') {
                    view = new BaseToggleView({
                        model: this.model,
                        title: attr_data.title,
                        property_name: attr_data.name,
                        current_value: this.model.get(attr_data.name),
                        values_list: _.map([
                            {value: true, title: 'Yes'},
                            {value: false, title: 'No'}
                        ], function (item) {
                            var is_current = item.value === this.model.get(attr_data.name);

                            return _.extend({}, item, {is_current: is_current});
                        }, this),
                        is_disabled: function () {
                            return !this.model.isThresholdEditable();
                        }.bind(this)
                    });
                    //  And here we just want to make this attribute disabled
                    //  under certain conditions
                } else if (attr_data.name === 'threshold_width') {
                    view = new BaseInputView({
                        model: this.model,
                        param: attr_data.name,
                        input_type: 'text',
                        placeholder: '',
                        disabled_value: '--',
                        is_disabled: function () {
                            return !this.model.isThresholdPossible() || !this.model.get('low_threshold');
                        }.bind(this)
                    });
                    //  Rest attributes use simple input view
                } else {
                    view = new BaseInputView({
                        model: this.model,
                        param: attr_data.name,
                        input_type: 'text',
                        placeholder: attr_data.name === 'name' ? 'New Profile' : ''
                    });
                }

                return {
                    name: attr_data.name,
                    title: attr_data.title,
                    value: attr_data.value,
                    view_instance: view
                };
            }, this);
        }, this);

        //  If one of the attributes from `dimensions` group changes,
        //  we want to re-render custom dimensions attributes
        this.listenTo(this.model, _.map(this.attributes.dimensions, function (attr_name) {
            return 'change:' + attr_name;
        }).join(' '), function () {
            this.renderCustomDimensionAttributes();
        });

        //  When unit type is changed, it's time to re-render threshold-
        //  related attributes
        this.listenTo(this.model, 'change:unit_type', function () {
            this.renderThresholdAttributes();
        });

        //  When low_threshold is changed, it's time to re-render
        //  threshold_width attribute
        this.listenTo(this.model, 'change:low_threshold', function () {
            this.renderThresholdWidth();
        });

        //  When pricing_scheme is changed, it's time to show proper editor
        this.listenTo(this.model, 'change:pricing_scheme', function () {
            this.renderPricingEditor();
        });
    }
});
