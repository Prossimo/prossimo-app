import BaseDialogView from './base-dialog-view';
import App from '../../main';
import FileUploaderView from '../../components/file-uploader-view';
import Project from '../../core/models/project';
import template from '../../templates/dialogs/create-project-dialog-view.hbs';

export default BaseDialogView.extend({
    className: 'create-project-modal modal fade',
    template: template,
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
        $data_quote_revision: '.modal-body form input[name="quote_revision"]',
        $data_quote_date: '.modal-body form input[name="quote_date"]',
        $data_project_notes: '.modal-body form textarea[name="project_notes"]',
        $data_shipping_notes: '.modal-body form textarea[name="shipping_notes"]'
    },
    events: {
        'submit form': 'addNewProject'
    },
    addNewProject: function (e) {
        var newProject = new Project({
            project_name: this.ui.$data_project_name.val().trim(),
            client_name: this.ui.$data_client_name.val().trim(),
            client_company_name: this.ui.$data_company.val().trim(),
            client_phone: this.ui.$data_phone.val().trim(),
            client_email: this.ui.$data_email.val().trim(),
            client_address: this.ui.$data_client_address.val().trim(),
            project_address: this.ui.$data_project_address.val().trim(),
            quote_revision: this.ui.$data_quote_revision.val().trim(),
            quote_date: this.ui.$data_quote_date.val().trim(),
            project_notes: this.ui.$data_project_notes.val().trim(),
            shipping_notes: this.ui.$data_shipping_notes.val().trim(),
            files: this.file_uploader.getUuidForAllFiles()
        });

        e.preventDefault();
        this.$el.modal('hide');
        App.projects.create(newProject);
    },
    onRender: function () {
        if (!this.$el.find('.modal-header').find('h4').length) {
            this.$el.find('.modal-header').append('<h4></h4>');
        }

        if (this.file_uploader) {
            this.file_uploader.destroy();
        }

        this.file_uploader = new FileUploaderView({
            maxLength: 10
        });

        this.file_uploader.render()
            .$el.appendTo(this.ui.$filesRegion);

        this.$el.find('.modal-header').find('h4').text('Create project');

        this.ui.$form.find('.date').datepicker({
            format: 'd MM, yyyy'
        });
    },
    onBeforeDestroy: function () {
        if (this.file_uploader) {
            this.file_uploader.destroy();
        }
    }
});
