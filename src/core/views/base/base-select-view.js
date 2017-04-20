import _ from 'underscore';
import Marionette from 'backbone.marionette';

import template from '../../../templates/core/base/base-select-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'select-container',
    template,
    ui: {
        $select: 'select',
    },
    events: {
        'change @ui.$select': 'onChange',
    },
    onChange() {
        const new_value = this.ui.$select.val() || [];

        if (this.options.custom_setter && _.isFunction(this.options.custom_setter)) {
            this.options.custom_setter(new_value);
        } else {
            this.model.persist(this.options.param, new_value);
        }
    },
    templateContext() {
        return {
            multiple: this.options.multiple,
            options: _.map(this.options.values, function (item) {
                const value = item.value || item;
                const is_selected = this.options.multiple ?
                    _.contains(this.model.get(this.options.param), value) :
                    this.model.get(this.options.param) === value;

                return {
                    is_selected,
                    value,
                    title: item.title || value,
                };
            }, this),
        };
    },
    //  TODO: make is_disabled a property, similar how it's done for
    //  base input view, update styles also
    enable() {
        this.ui.$select.prop('disabled', false);
        this.ui.$select.selectpicker('refresh');
    },
    disable() {
        this.ui.$select.prop('disabled', true);
        this.ui.$select.selectpicker('refresh');
    },
    onRender() {
        this.ui.$select.selectpicker({
            style: this.options.size === 'small' ? 'btn-xs' : 'btn',
            width: 'fit',
        });
    },
    onBeforeDestroy() {
        this.ui.$select.selectpicker('destroy');
    },
    initialize(options) {
        const default_options = {
            size: 'normal',
            multiple: false,
            values: [],
            custom_setter: false,
        };

        this.options = _.extend({}, default_options, options);

        if (!_.isArray(this.options.values) || !_.isObject(this.options.values)) {
            throw new Error('Values should either be array or object');
        }
    },
});
