import props from '../../../utils/decorators/props';
import stickableMixin from '../../../utils/decorators/stickableMixin';
import BaseDialogView from './base-dialog-view';
import App from '../../../main';
import FileUploaderView from '../../file-uploader-view/file-uploader-view';
import Project from '../../../core/models/project';
import template from '../../../templates/dialogs/create-project-dialog-view.hbs';

@props({
    className: 'create-project-modal modal fade',
    options: {
        dialog_title: 'Create Project',
    },
    template,
    model: new Project(),
    ui: {
        $form: '.modal-body form',
        $filesRegion: '.form-control-files',
        $data_project_name: '.modal-body form input[name="project_name"]',
        $data_client_name: '.modal-body form input[name="client_name"]',
        $data_company: '.modal-body form input[name="company"]',
        $data_phone: '.modal-body form input[name="phone"]',
        $data_email: '.modal-body form input[name="email"]',
        $data_client_address: '.modal-body form input[name="client_address"]',
        $data_project_address: '.modal-body form input[name="project_address"]',
        $data_project_notes: '.modal-body form textarea[name="project_notes"]',
        $data_shipping_notes: '.modal-body form textarea[name="shipping_notes"]',
        $data_lead_time: '.modal-body form input[name="lead_time"]',
    },
    events: {
        'submit form': 'addNewProject',
    },
    templateContext() {
        return {
            dialog_title: this.options.dialog_title,
            schema: this.model.schema,
        };
    },
})
@stickableMixin
export default class extends BaseDialogView {
    addNewProject(e) {
        const newProject = new Project({
            project_name: this.ui.$data_project_name.val().trim(),
            client_name: this.ui.$data_client_name.val().trim(),
            client_company_name: this.ui.$data_company.val().trim(),
            client_phone: this.ui.$data_phone.val().trim(),
            client_email: this.ui.$data_email.val().trim(),
            client_address: this.ui.$data_client_address.val().trim(),
            project_address: this.ui.$data_project_address.val().trim(),
            project_notes: this.ui.$data_project_notes.val().trim(),
            shipping_notes: this.ui.$data_shipping_notes.val().trim(),
            lead_time: this.ui.$data_lead_time.val().trim(),
            files: this.file_uploader.getUuidForAllFiles(),
        });

        e.preventDefault();
        this.$el.modal('hide');
        App.projects.create(newProject);
    }
    bindings() {
        return {
            '@ui.$data_project_name': 'project_name',
            '.modal-title': {
                observe: 'project_name',
                onGet: val => `${this.options.dialog_title}${val ? `: ${val}` : ''}`,
            },
        };
    }
    onRender() {
        if (this.file_uploader) {
            this.file_uploader.destroy();
        }

        this.file_uploader = new FileUploaderView({
            maxLength: 10,
        });

        // setTimeout(() => {
        //     this.model.set('project_name', 'test project');
        // }, 4000);

        this.file_uploader.render()
            .$el.appendTo(this.ui.$filesRegion);
    }
    onBeforeDestroy() {
        if (this.file_uploader) {
            this.file_uploader.destroy();
        }
    }
}
