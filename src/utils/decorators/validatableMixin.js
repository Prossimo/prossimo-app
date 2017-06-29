import $ from 'jquery';
import Validation from 'backbone.validation';
import mixin from '../mixinDecoratorFactory';

export function markAsError($el) {
    $el
        .parent()
        .addClass('has-error')
        .removeClass('has-success');
}

export function markAsSuccess($el) {
    $el
        .parent()
        .addClass('has-success')
        .removeClass('has-error');
}

export function addAlert($el, attr, error) {
    const $formGroup = $el.closest('.form-group');
    const $formGroupParent = $formGroup.parent();
    let $helpBlock = $formGroupParent.find(`.alert[data-field=${attr}]`);

    if ($helpBlock.length > 0) {
        $helpBlock.html(error);
    } else {
        $helpBlock = $('<div>', {
            class: 'alert alert-danger',
            html: error,
            role: 'alert',
            'data-field': attr,
        }).fadeIn();
    }

    $formGroup.before($helpBlock);
}

export function removeAlert($el, attr) {
    const $formGroup = $el.closest('.form-group');
    const $formGroupParent = $formGroup.parent();
    const $helpBlock = $formGroupParent.find(`.alert[data-field=${attr}]`);

    $helpBlock.fadeOut(() => {
        $helpBlock.remove();
    });
}

// Mixin for validation Backbone plugin
export default mixin({
    initialize() {
        Validation.bind(this, {
            forceUpdate: true,
            valid: (view, attr) => {
                this._fieldSuccess(attr);
            },
            invalid: (view, attr, error) => {
                this._fieldError(attr, error);
            },
        });
    },
    onDestroy() {
        Validation.unbind(this);
    },
    _fieldError(attr, error) {
        const $el = this.ui[attr];

        markAsError($el);
        addAlert($el, attr, error);
    },
    _fieldSuccess(attr) {
        const $el = this.ui[attr];

        removeAlert($el, attr);
        markAsSuccess($el);
    },
});
