var app = app || {};

(function () {
    'use strict';

    app.BaseToggleView = Marionette.ItemView.extend({
        // tagName: 'div',
        tagName: 'label',
        className: 'toggle-container',
        template: app.templates['core/base/base-toggle-view'],
        ui: {
            $checkbox: 'input[type="checkbox"]'
        },
        initialize: function () {
            console.log( 'init toggle with options', this.options );
        },
        //  TODO: we want to have two modes: for equally important toggles
        //  (just two modes) and for on / off values
        serializeData: function () {
            return {
                equal_choices: true,
                on_text: 'Something',
                off_text: 'Anything',
                // label_text: 'Switcher for something / anything',
                size: 'small'
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
