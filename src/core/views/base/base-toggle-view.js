import Marionette from 'backbone.marionette';
import $ from 'jquery';
import template from '../../../templates/core/base/base-toggle-view.hbs';

export default Marionette.View.extend({
    tagName: 'label',
    className: 'toggle-container',
    template: template,
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
        return this.options.values_list[0].is_current;
    },
    templateContext: function () {
        var equal_choices = this.options.possible_values_number === 2;

        return {
            equal_choices: equal_choices,
            is_checked: this.isChecked(),
            on_text: equal_choices ? this.options.values_list[0].title : 'On',
            off_text: equal_choices ? this.options.values_list[1].title : 'Off',
            label_text: this.options.label_text ? this.options.label_text : '',
            size: this.options.size ? this.options.size : 'small'
        };
    },
    onRender: function () {
        var self = this;

        setTimeout(function () {
            self.ui.$checkbox.bootstrapToggle();
        }, 5);
    }
});
