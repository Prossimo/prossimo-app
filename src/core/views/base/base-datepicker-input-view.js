import _ from 'underscore';
import Marionette from 'backbone.marionette';
import template from '../../../templates/core/base/base-datepicker-input-view.hbs';

export default Marionette.View.extend({
    className: 'input-container',
    template: template,
    ui: {
        $edit: '.edit',
        $input: '.edit input',
        $value: '.value'
    },
    events: {
        'click @ui.$value': 'makeEditable',
        'blur @ui.$input': 'revertEditable'
    },
    makeEditable: function () {
        var is_disabled = this.options.is_disabled && _.isFunction(this.options.is_disabled) ?
            this.options.is_disabled() :
            this.options.is_disabled;

        if (!is_disabled) {
            this.$el.addClass('is-edited');
            this.ui.$input.trigger('focus').trigger('select');
        }
    },
    revertEditable: function () {
        this.$el.removeClass('is-edited').removeClass('has-error');
    },
    setValue: function () {
        var new_value = this.ui.$input.val().trim();

        this.model.persist(this.options.param, new_value);
    },
    //  TODO: we need to handle a case where is_disabled is a function
    enable: function () {
        this.options.is_disabled = false;
        this.render();
    },
    disable: function () {
        this.options.is_disabled = true;
        this.render();
    },
    templateContext: function () {
        var value = this.model.get(this.options.param);
        var placeholder = this.options.placeholder || '&nbsp;';
        var is_disabled = this.options.is_disabled && _.isFunction(this.options.is_disabled) ?
            this.options.is_disabled() :
            this.options.is_disabled;

        return {
            value: value,
            readable_value: (is_disabled && this.options.disabled_value) ?
                this.options.disabled_value :
                (value !== '' ? value : placeholder),
            show_placeholder: !value && placeholder,
            is_disabled: is_disabled
        };
    },
    onRender: function () {
        var self = this;

        this.ui.$input.datepicker({
            autoclose: true,
            format: 'd MM, yyyy',
            todayHighlight: true,
            zIndexOffset: 300
        })
            .on('changeDate', function () {
                self.setValue();
            })
            .on('hide', function () {
                self.ui.$input.trigger('blur');
            });
    },
    onBeforeDestroy: function () {
        this.ui.$input.datepicker('destroy');
    },
    initialize: function (options) {
        var default_options = {
            is_disabled: false,
            disabled_value: '',
            placeholder: ''
        };

        this.options = _.extend({}, default_options, options);

        this.listenTo(this.model, 'change:' + this.options.param, this.render);
    }
});
