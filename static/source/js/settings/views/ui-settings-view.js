var app = app || {};

(function () {
    'use strict';

    app.UISettingsView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'ui-settings',
        template: app.templates['settings/ui-settings-view'],
        events: {
            'click .js-change-value': 'onChangeValueClick'
        },
        //  TODO: reload on project change?
        initialize: function () {
            var params = this.serializeData().params;

            this.toggles = {};

            //  TODO: we probably want to treat other numbers as well!
            _.each(params, function (param_options, key) {
                if ( param_options.possible_values_number === 2 ) {
                    this.toggles[key] = new app.BaseToggleView(param_options);
                }
            }, this);
        },
        onChangeValueClick: function (e) {
            var $button = $(e.target);
            var target_param = $button.closest('li').data('param');
            var target_value = $button.data('value');

            this.model.set(target_param, target_value);
            this.render();
        },
        getParamsSourceData: function () {
            var params_obj = {};

            if ( this.model ) {
                var name_title_type_hash = this.model.getNameTitleTypeHash();

                //  TODO: move this mapping to project-settings model
                var params_data_hash = {
                    inches_display_mode: this.model.getInchesDisplayModes(),
                    pricing_mode: this.model.getPricingModes()
                };

                _.each(params_data_hash, function (item, key) {
                    params_obj[key] = {
                        model: this.model,
                        title: _.findWhere(name_title_type_hash, key).title,
                        property_name: key,
                        current_value: this.model.get(key),
                        values_list: _.map(item, function (value) {
                            return {
                                is_current: this.model.get(key) === value.name,
                                name: value.name,
                                title: value.title
                            };
                        }, this),
                        possible_values_number: item.length
                    };
                }, this);
            }

            return params_obj;
        },
        serializeData: function () {
            return {
                is_model_set: this.model,
                params: this.getParamsSourceData()
            };
        },
        onRender: function () {
            var params = this.serializeData().params;

            _.each(params, function (param_options, key) {
                if ( param_options.possible_values_number === 2 ) {
                    this.$el.find('li[data-param="' + key + '"] .value').append(this.toggles[key].render().el);
                }
            }, this);
        }
    });
})();
