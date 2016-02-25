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
        onChangeValueClick: function (e) {
            var $button = $(e.target);
            var target_param = $button.closest('li').data('param');
            var target_value = $button.data('value');

            this.model.set(target_param, target_value);
            this.render();
        },
        getParamsSourceData: function () {
            var params_obj = {};

            //  TODO: iterate over ui_settings_list actually
            // var ui_settings_list = this.model.getUISettingsList();
            var name_title_type_hash = this.model.getNameTitleTypeHash();

            var params_data_hash = {
                inches_display_mode: this.model.getInchesDisplayModes(),
                pricing_mode: this.model.getPricingModes()
            };

            //  TODO: depending on length of a values_list for a given item,
            //  we should decide how we want to represent it (either a switch
            //  or a dropdown select)
            _.each(params_data_hash, function (item, key) {
                params_obj[key] = {
                    title: name_title_type_hash[key].title,
                    value: this.model.get(key),
                    values_list: _.map(item, function (value) {
                        return {
                            is_active: this.model.get(key) === value.name,
                            name: value.name,
                            title: value.title
                        };
                    }, this)
                };
            }, this);

            return params_obj;
        },
        serializeData: function () {
            return {
                params: this.getParamsSourceData()
            };
        },
        onRender: function () {
            // console.log( 'rendered' );

            var $demo_toggle = $('<input type="checkbox" />').appendTo(this.$el);
            // <input id="toggle-one" checked type="checkbox">
            $demo_toggle.bootstrapToggle();
        }
    });
})();
