import _ from 'underscore';
import Marionette from 'backbone.marionette';

import template from '../../../templates/core/base/base-input-view.hbs';

//  ------------------------------------------------------------------------
//  This view contains base functions and properties used by different
//  inputs. Each input extends this view in its own way
//  ------------------------------------------------------------------------

const ENTER_KEY = 13;
const ESC_KEY = 27;

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
        'blur @ui.$input': 'stopEditing',
        'keypress @ui.$input': 'confirmOnEnter',
        'keydown @ui.$input': 'cancelOnEscape',
        'click .js-revert-editable': 'revertEditable',
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
        this.ui.$input.val(this.templateContext().value);
        this.hideErrorMessage();
    },
    showErrorMessage(message) {
        const html = `<p>${message}</p>` +
            '<button class="btn btn-xs btn-primary js-revert-editable">' +
            '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>' +
            '<span>Undo</span>' +
            '</button>';

        this.$el.addClass('has-error');
        this.ui.$edit.attr('data-content', html);
        this.ui.$edit.popover('show');
    },
    hideErrorMessage() {
        this.$el.removeClass('has-error');
        this.ui.$edit.attr('data-content', '');
        this.ui.$edit.popover('hide');
    },
    stopEditing() {
        const new_value = this.ui.$input.val().trim();
        let new_value_parsed;

        if (
            !this.$el.hasClass('is-edited') ||
            this.$el.hasClass('has-error')
        ) {
            return;
        }

        if (new_value !== this.templateContext().value) {
            new_value_parsed = _.isFunction(this.model.getAttributeType) &&
                this.model.getAttributeType(this.options.param) === 'number' && !isNaN(new_value) ?
                parseFloat(new_value) : new_value;

            const validation_successful = this.model.persist(this.options.param, new_value_parsed, { validate: true });

            //  If validation failed, `validation_successful` will be false
            //  and validationError will contain hash of ivalid attributes.
            //  If it doesn't have current param among invalid attributes,
            //  we suppose that everything's normal
            if (
                !validation_successful && this.model.validationError &&
                this.model.validationError.attribute_name === this.options.param
            ) {
                this.showErrorMessage(this.model.validationError.error_message);
            } else {
                this.revertEditable();
            }
        } else {
            this.revertEditable();
        }
    },
    confirmOnEnter(e) {
        if (e.which === ENTER_KEY) {
            this.stopEditing();
        }
    },
    cancelOnEscape(e) {
        if (e.which === ESC_KEY) {
            this.revertEditable();
        }
    },
    appendPopover() {
        this.ui.$edit.popover('destroy');

        this.ui.$edit.popover({
            trigger: 'manual',
            title: 'Validation Error',
            html: true,
        });
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
        let readable_value = value !== '' ? value : placeholder;

        if (is_disabled && this.options.disabled_value) {
            readable_value = this.options.disabled_value;
        }

        return {
            input_type: this.options.input_type || 'text',
            value,
            readable_value,
            show_placeholder: !value && placeholder,
            is_disabled,
        };
    },
    onRender() {
        this.appendPopover();
    },
    onBeforeDestroy() {
        this.ui.$edit.popover('destroy');
    },
    //  TODO: we could pass a formatter function to format readable value,
    //  see getFormattedRenderer from hot-renderers for example
    initialize(options) {
        const default_options = {
            input_type: 'text',
            is_disabled: false,
            disabled_value: '',
            placeholder: '',
            formatter: false,
        };

        this.options = _.extend({}, default_options, options);

        //  TODO: we could use input type number here, but the problem is
        //  it has some serious issues in firefox
        if (this.options.input_type && !_.contains(['text'], this.options.input_type)) {
            throw new Error(`Input type ${this.options.input_type} is not allowed`);
        }

        this.listenTo(this.model, `change:${this.options.param}`, this.render);
    },
});
