import _ from 'underscore';
import Marionette from 'backbone.marionette';

import template from '../../../templates/core/base/base-datepicker-input-view.hbs';

export default Marionette.View.extend({
    className: 'input-container',
    template,
    ui: {
        $edit: '.edit',
        $input: '.edit input',
        $value: '.value',
    },
    events: {
        'click @ui.$value': 'makeEditable',
        'blur @ui.$input': 'revertEditable',
    },
    makeEditable() {
        const is_disabled = this.options.is_disabled && _.isFunction(this.options.is_disabled) ?
            this.options.is_disabled() :
            this.options.is_disabled;

        if (!is_disabled) {
            this.$el.addClass('is-edited');
            this.ui.$input.trigger('focus').trigger('select');
        }
    },
    revertEditable() {
        this.$el.removeClass('is-edited').removeClass('has-error');
    },
    setValue() {
        const new_value = this.ui.$input.val().trim();

        this.model.persist(this.options.param, new_value);
    },
    //  TODO: we need to handle a case where is_disabled is a function
    enable() {
        this.options.is_disabled = false;
        this.render();
    },
    disable() {
        this.options.is_disabled = true;
        this.render();
    },
    templateContext() {
        const value = this.model.get(this.options.param);
        const placeholder = this.options.placeholder || '&nbsp;';
        const is_disabled = this.options.is_disabled && _.isFunction(this.options.is_disabled) ?
            this.options.is_disabled() :
            this.options.is_disabled;

        return {
            value,
            readable_value: (is_disabled && this.options.disabled_value) ?
                this.options.disabled_value :
                (value !== '' ? value : placeholder),
            show_placeholder: !value && placeholder,
            is_disabled,
        };
    },
    onRender() {
        const self = this;

        this.ui.$input.datepicker({
            autoclose: true,
            format: 'd MM, yyyy',
            todayHighlight: true,
            zIndexOffset: 300,
        })
        .on('changeDate', () => {
            self.setValue();
        })
        .on('hide', () => {
            self.ui.$input.trigger('blur');
        });
    },
    onBeforeDestroy() {
        this.ui.$input.datepicker('destroy');
    },
    initialize(options) {
        const default_options = {
            is_disabled: false,
            disabled_value: '',
            placeholder: '',
        };

        this.options = _.extend({}, default_options, options);

        this.listenTo(this.model, `change:${this.options.param}`, this.render);
    },
});
