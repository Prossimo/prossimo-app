var app = app || {};

(function () {
    'use strict';

    app.Dialogs = Marionette.Region.extend({
        el: '#dialogs',
        initialize: function () {
            this.registered_dialogs = {};

            this.login_dialog = new app.LoginDialogView();
            this.registerDialog('login', this.login_dialog);
        },
        //  TODO: We should receive some options on register, like options we
        //  pass to modal.js or something else
        registerDialog: function (dialog_name, dialog_view) {
            this.registered_dialogs[dialog_name] = dialog_view;
        },
        showDialog: function (dialog_name) {
            if ( this.registered_dialogs[dialog_name] ) {
                //  TODO: do we actually want prevent destroy? maybe creating
                //  them each time would be better? Like in navigation
                this.show(this.registered_dialogs[dialog_name], {
                    preventDestroy: true,
                    forceShow: true
                });

                //  TODO: we only want to set keyboard and show options like
                //  this for login modal, all other possible modals shoulm't
                //  have them (but we only have login modal currently)
                if ( this.currentView ) {
                    this.currentView.$el.modal({
                        backdrop: 'static',
                        keyboard: false,
                        show: true
                    });
                }
            }
        },
        onSwapOut: function (view) {
            view.$el.modal('hide');
        }
    });
})();
