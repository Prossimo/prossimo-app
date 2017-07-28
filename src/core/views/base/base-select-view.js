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
    getOptionsList() {
        const options_list = {
            ungrouped: [],
            grouped: this.options.groups.map(origin_group => ({
                title: origin_group.title,
                entries: [],
            })),
        };

        this.options.values.forEach((item) => {
            const value = item.value || item;
            const is_selected = this.options.multiple ?
                _.contains(this.model.get(this.options.param), value) :
                this.model.get(this.options.param) === value;
            const origin_group = this.options.groups.length ? this.options.groups.find(group => _.contains(group.entries, value)) : null;
            let target_group = origin_group && options_list.grouped.find(group => group.title === origin_group.title);

            target_group = target_group ? target_group.entries : options_list.ungrouped;

            target_group.push({
                is_selected,
                value,
                title: item.title || value,
            });
        });

        options_list.grouped = options_list.grouped.filter(group => group.entries.length > 0);

        return options_list;
    },
    templateContext() {
        return {
            multiple: this.options.multiple,
            options: this.getOptionsList(),
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
            groups: [],
            custom_setter: false,
        };

        this.options = _.extend({}, default_options, options);

        if (!_.isArray(this.options.values) && !_.isObject(this.options.values)) {
            throw new Error('Values should either be array or object');
        }
    },
});
