var app = app || {};

(function () {
    'use strict';

    app.BaseDialogView = Marionette.ItemView.extend({
        className: 'modal fade',
        template: app.templates['dialogs/base-dialog-view'],
        events: {
            'submit form': 'returnFalse'
        },
        close: function () {
            if ( this.$el.modal ) {
                this.$el.modal('hide');
            }
        },
        returnFalse: function () {
            return false;
        }
    });
})();
