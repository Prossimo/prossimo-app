import _ from 'underscore';
import Marionette from 'backbone.marionette';
import LoginDialogView from './dialogs/views/login-dialog-view';
import ItemsProfilesTableDialogView from './dialogs/views/items-profiles-table-dialog-view';
import CreateProjectDialogView from './dialogs/views/create-project-dialog-view';
import 'bootstrap/js/modal';

export default Marionette.Region.extend({
    el: '#dialogs',
    initialize: function () {
        this.registered_dialogs = {};

        //  TODO: register dialogs somewhere else? Probably at the highest
        //  possible view level (i.e. Screens)
        this.registerDialog({
            name: 'login',
            getView: function (view_options) {
                return new LoginDialogView(view_options);
            },
            modal_options: {
                backdrop: 'static',
                keyboard: false
            }
        });

        this.registerDialog({
            name: 'items-profiles-table',
            getView: function (view_options) {
                return new ItemsProfilesTableDialogView(view_options);
            }
        });

        this.registerDialog({
            name: 'createProject',
            getView: function (view_options) {
                return new CreateProjectDialogView(view_options);
            }
        });
    },
    registerDialog: function (options) {
        this.registered_dialogs[options.name] = options;
    },
    showDialog: function (dialog_name, dialog_view_options) {
        if (this.registered_dialogs[dialog_name]) {
            this.show(this.registered_dialogs[dialog_name].getView(dialog_view_options));

            //  FIXME: keyboard option does not work as intended, probably
            //  conflicts with hotkeys plugin we use
            if (this.currentView) {
                var default_modal_options = {
                    backdrop: true,
                    keyboard: true,
                    show: true
                };
                var modal_options = _.extend({}, default_modal_options,
                    this.registered_dialogs[dialog_name].modal_options);

                this.currentView.$el.modal(modal_options);
            }
        }
    },
    onSwapOut: function (view) {
        if (view) {
            view.$el.modal('hide');
        }
    }
});
