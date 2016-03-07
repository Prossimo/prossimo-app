var app = app || {};

(function () {
    'use strict';

    app.BaseToggleView = Marionette.ItemView.extend({
        tagName: 'label',
        className: 'toggle-container',
        template: app.templates['core/base/base-toggle-view'],
        events: {
            'change @ui.$checkbox': 'onChange'
        },
        ui: {
            $checkbox: 'input[type="checkbox"]'
        },
        // initialize: function () {
        //     console.log( 'init toggle with options', this.options );
        // },
        onChange: function (e) {
            var is_checked = $(e.currentTarget).is(':checked');
            var equal_choices = this.options.possible_values_number === 2;
            var new_value;

            // console.log( e );
            // console.log( is_checked );

            if ( is_checked ) {
                new_value = equal_choices ? this.options.values_list[0].name : true;
            } else {
                new_value = equal_choices ? this.options.values_list[1].name : false;
            }

            this.model.set(this.options.property_name, new_value);
        },
        isChecked: function () {
            // console.log( 'is checked', this.options.current_value === this.options.values_list[0].is_current );
            // return this.options.current_value === this.options.values_list[0].is_current;
            return this.options.values_list[0].is_current;
        },
        serializeData: function () {
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
})();
