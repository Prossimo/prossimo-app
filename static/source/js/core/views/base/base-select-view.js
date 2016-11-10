var app = app || {};

(function () {
    'use strict';

    app.BaseSelectView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'select-container',
        template: app.templates['core/base/base-select-view'],
        ui: {
            $select: 'select'
        },
        events: {
            'change @ui.$select': 'onChange'
        },
        onChange: function () {
            var new_value = this.ui.$select.val() || [];

            this.model.persist(this.options.param, new_value);
        },
        serializeData: function () {
            return {
                multiple: this.options.multiple,
                options: _.map(this.options.values, function (item) {
                    var value = item.value || item;
                    var is_selected = this.options.multiple ?
                        _.contains(this.model.get(this.options.param), value) :
                        this.model.get(this.options.param) === value;

                    return {
                        is_selected: is_selected,
                        value: value,
                        title: item.title || value
                    };
                }, this)
            };
        },
        //  TODO: make is_disabled a property, similar how it's done for
        //  base input view, update styles also
        enable: function () {
            this.ui.$select.prop('disabled', false);
            this.ui.$select.selectpicker('refresh');
        },
        disable: function () {
            this.ui.$select.prop('disabled', true);
            this.ui.$select.selectpicker('refresh');
        },
        initialize: function (options) {
            var default_options = {
                size: 'normal',
                multiple: false,
                values: []
            };

            this.options = _.extend({}, default_options, options);

            if ( !_.isArray(this.options.values) || !_.isObject(this.options.values) ) {
                throw new Error('Values should either be array or object');
            }
        },
        onRender: function () {
            this.ui.$select.selectpicker({
                style: this.options.size === 'small' ? 'btn-xs' : 'btn',
                width: 'fit'
            });
        },
        onDestroy: function () {
            this.ui.$select.selectpicker('destroy');
        }
    });
})();
