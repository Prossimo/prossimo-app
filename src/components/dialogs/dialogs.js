import _ from 'underscore';
import Marionette from 'backbone.marionette';
import 'bootstrap/js/modal';

import LoginDialogView from './views/login-dialog-view';
import ItemsProfilesTableDialogView from './views/items-profiles-table-dialog-view';
import CreateProjectDialogView from './views/create-project-dialog-view';
import EditQuotesDialogView from './views/edit-quotes-dialog-view';
import ProjectExportDialogView from './views/project-export-dialog-view';

export default Marionette.Region.extend({
    el: '#dialogs',
    initialize() {
        this.registered_dialogs = {};

        //  TODO: register dialogs somewhere else? Probably at the highest
        //  possible view level (i.e. Screens)
        this.registerDialog({
            name: 'login',
            getView(view_options) {
                return new LoginDialogView(view_options);
            },
            modal_options: {
                backdrop: 'static',
                keyboard: false,
            },
        });

        this.registerDialog({
            name: 'items-profiles-table',
            getView(view_options) {
                return new ItemsProfilesTableDialogView(view_options);
            },
        });

        this.registerDialog({
            name: 'createProject',
            getView(view_options) {
                return new CreateProjectDialogView(view_options);
            },
        });

        this.registerDialog({
            name: 'edit-quotes',
            getView(view_options) {
                return new EditQuotesDialogView(view_options);
            },
        });

        this.registerDialog({
            name: 'project-export',
            getView(view_options) {
                return new ProjectExportDialogView(view_options);
            },
        });
    },
    registerDialog(options) {
        this.registered_dialogs[options.name] = options;
    },
    showDialog(dialog_name, dialog_view_options) {
        if (this.registered_dialogs[dialog_name]) {
            this.show(this.registered_dialogs[dialog_name].getView(dialog_view_options));

            //  FIXME: keyboard option does not work as intended, probably
            //  conflicts with hotkeys plugin we use
            if (this.currentView) {
                const default_modal_options = {
                    backdrop: true,
                    keyboard: true,
                    show: true,
                };
                const modal_options = _.extend({}, default_modal_options,
                    this.registered_dialogs[dialog_name].modal_options);

                this.currentView.dialog_name = dialog_name;
                this.currentView.$el.modal(modal_options);
            }
        }
    },
    onSwapOut(view) {
        if (view) {
            view.close();
        }
    },
    close() {
        if (this.currentView) {
            this.currentView.close();
        }
    },
});
