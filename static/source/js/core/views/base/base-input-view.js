//  ------------------------------------------------------------------------
//  This view contains base functions and properties used by different
//  inputs. Each input extends this view in its own way
//  ------------------------------------------------------------------------

var ENTER_KEY = 13;
var ESC_KEY = 27;

var app = app || {};

(function () {
    'use strict';

    app.BaseInputView = Marionette.ItemView.extend({
        className: 'input-container',
        template: app.templates['core/base/base-input-view'],
        ui: {
            $edit: '.edit',
            $input: '.edit input',
            $value: '.value',
            $revert: '.js-revert-editable'
        },
        events: {
            'click @ui.$value': 'makeEditable',
            'blur @ui.$input': 'stopEditing',
            'keypress @ui.$input': 'confirmOnEnter',
            'keydown @ui.$input': 'cancelOnEscape',
            'click @ui.$revert': 'revertEditable'
        },
        makeEditable: function () {
            this.ui.$container.addClass('is-edited');
            this.ui.$input.trigger('focus').trigger('select');
        },
        revertEditable: function () {
            this.ui.$container.removeClass('is-edited').removeClass('has-error');
            this.ui.$input.val(this.serializeData().value);
            this.hideErrorMessage();
        },
        showErrorMessage: function (message) {
            this.ui.$container.addClass('has-error');
            this.ui.$edit.attr('data-content', message);
            this.ui.$edit.popover('show');
        },
        hideErrorMessage: function () {
            this.ui.$container.removeClass('has-error');
            this.ui.$edit.attr('data-content', '');
            this.ui.$edit.popover('hide');
        },
        stopEditing: function () {
            var new_value = this.ui.$input.val().trim();
            var new_value_parsed;

            if ( !this.ui.$container.hasClass('is-edited') ) {
                return;
            }

            if ( new_value !== '' && new_value !== this.serializeData().value ) {
                new_value_parsed = _.isFunction(this.model.getAttributeType) &&
                    this.model.getAttributeType(this.options.param) === 'number' && !isNaN(new_value) ?
                    parseFloat(new_value) : new_value;

                var validation_successful = this.model.persist(this.options.param, new_value_parsed, {validate: true});

                //  If validation failed, `validation_successful` will be false
                //  and validationError will contain hash of ivalid attributes.
                //  If it doesn't have current param among invalid attributes,
                //  we suppose that everything's normal
                if ( !validation_successful && this.model.validationError &&
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
        confirmOnEnter: function (e) {
            if ( e.which === ENTER_KEY ) {
                this.stopEditing();
            }
        },
        cancelOnEscape: function (e) {
            if ( e.which === ESC_KEY ) {
                this.revertEditable();
            }
        },
        appendPopover: function () {
            this.ui.$edit.popover('destroy');

            this.ui.$edit.popover({
                trigger: 'manual'
            });
        },
        //  TODO: only allow input types that are derived from text (like email
        //  or number), but no checkbox or radio, we should have special base
        //  views for them
        initialize: function () {
            this.listenTo(this.model, 'change:' + this.options.param, this.render);
        },
        //  TODO: we could pass a formatter function to format a readable value
        serializeData: function () {
            var value = this.model.get(this.options.param);
            var placeholder = this.options.placeholder || '';

            return {
                input_type: this.options.input_type || 'text',
                value: value,
                readable_value: value || placeholder,
                show_placeholder: !value && placeholder
            };
        },
        onRender: function () {
            this.ui.$container = this.$el;
            this.appendPopover();
        },
        onDestroy: function () {
            this.ui.$edit.popover('destroy');
        }
    });
})();
