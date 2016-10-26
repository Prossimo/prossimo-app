var app = app || {};

/**
 * Add toggle UI element
 * It uses Bootstrap Toggle http://www.bootstraptoggle.com/
 *
 * @constructor
 * @class BaseToggleView
 * @extends {Marionette.ItemView}
 * @return {BaseToggleView} A BaseToggleView instance
 * @param {object} options
 */

/**
 * @example
 * var model = new Backbone.Model({inches_display_mode: 'feet_and_inches'});
 * var toggle = new app.BaseToggleView({
 *       model: model,
 *       property_name: 'inches_display_mode',
 *       current_value: 'feet_and_inches',
 *       size: small,
 *       width: '100',
 *       height: '75'
 *       values_list: [
 *           {
 *               is_current: true,
 *               value: 'feet_and_inches',
 *               title: 'Feet + Inches'
 *           },
 *           {
 *               is_current: false,
 *               value: 'inches_only',
 *               title: 'Inches Only'
 *           }
 *       ],
 *       possible_values_number: 2
 *   });
 * this.$el.append(toggle.render().el);
 * // or
 * this.getRegion('cont').show(toggle);
 */

(function () {
    'use strict';

    app.BaseToggleView = Marionette.ItemView.extend({
        tagName: 'label',
        className: 'toggle-container',
        template: app.templates['core/base/base-toggle-view'],
        events: {
            'change @ui.$checkbox': 'onChange'
        },
        ui: {
            $checkbox: 'input[type="checkbox"]'
        },
        onChange: function (e) {
            var is_checked = $(e.currentTarget).is(':checked');
            var equal_choices = this.options.possible_values_number === 2;
            var new_value;

            if (is_checked) {
                new_value = equal_choices ? this.options.values_list[0].value : true;
            } else {
                new_value = equal_choices ? this.options.values_list[1].value : false;
            }

            this.model.set(this.options.property_name, new_value);
        },
        isChecked: function () {
            if (this.options.current_value && this.options.values_list.length) {
                // we need to find the active element
                var values_list_item = _.findWhere(this.options.values_list, {value: this.options.current_value});
                return this.options.values_list[0] === values_list_item;
            }

            return !!this.options.values_list[0].is_current;
        },
        serializeData: function () {
            var equal_choices = this.options.possible_values_number === 2;

            return {
                equal_choices: equal_choices,
                is_checked: this.isChecked(),
                on_text: equal_choices ? this.options.values_list[0].title : 'On',
                off_text: equal_choices ? this.options.values_list[1].title : 'Off',
                label_text: this.options.label_text ? this.options.label_text : '',
                size: this.options.size ? this.options.size : 'small',
                width: this.options.width ? this.options.width : null,
                height: this.options.height ? this.options.height : null
            };
        },
        onRender: function () {
            this.ui.$checkbox.bootstrapToggle();
        }
    });
})();
