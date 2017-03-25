import _ from 'underscore';
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
        var equal_choices = this.options.values_list.length === 2;
        var new_value;

        if (is_checked) {
            new_value = equal_choices ? this.options.values_list[0].value : true;
        } else {
            new_value = equal_choices ? this.options.values_list[1].value : false;
        }

        this.model.persist(this.options.property_name, new_value);
    },
    enable: function () {
        this.ui.$checkbox.bootstrapToggle('enable');
    },
    disable: function () {
        this.ui.$checkbox.bootstrapToggle('disable');
    }, isChecked: function () {
        return this.options.values_list[0].value === this.model.get(this.options.property_name);
    },
    templateContext: function () {
        var equal_choices = this.options.values_list.length === 2;

        return {
            equal_choices: equal_choices,
            is_checked: this.isChecked(),
            on_text: equal_choices ? this.options.values_list[0].title : 'On',
            off_text: equal_choices ? this.options.values_list[1].title : 'Off',
            label_text: this.options.label_text,
            size: this.options.size,
            is_disabled: this.options.is_disabled && _.isFunction(this.options.is_disabled) ?
                this.options.is_disabled() :
                this.options.is_disabled
        };
    },
    isToggleAttached: function () {
        return this.is_toggle_attached || false;
    },
    //  The timeout here is to fight the issue with toggle width not being
    //  correctly calculated. On subsequent re-rendering there's no timeout
    onRender: function () {
        var self = this;

        if (this.isToggleAttached()) {
            this.ui.$checkbox.bootstrapToggle();
        } else {
            setTimeout(function () {
                self.ui.$checkbox.bootstrapToggle();
                self.is_toggle_attached = true;
            }, 5);
        }
    },
    onBeforeDestroy: function () {
        this.ui.$checkbox.bootstrapToggle('destroy');
    },
    //  TODO: we have `property_name` here, but for other base views we
    //  call it `param`. Better make it same everywhere (attribute_name?)
    initialize: function (options) {
        var default_options = {
            is_disabled: false,
            placeholder: '',
            size: 'small',
            label_text: ''
        };

        this.options = _.extend({}, default_options, options);
    }
});
