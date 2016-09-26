var app = app || {};

(function () {
    'use strict';

    app.CreateProjectDialogView = app.BaseDialogView.extend({
        className: 'create-project-modal modal fade',
        template: app.templates['dialogs/create-project-dialog-view'],
        ui: {
            $form: '.modal-body form',
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
            e.preventDefault();

            var newProject = new app.Project();

            newProject.set({
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
                shipping_notes: this.ui.$data_shipping_notes.val().trim()

            });

            this.$el.modal('hide');

            newProject.on('sync', function () {
                app.top_bar_view.project_selector_view.fetchProjectList();
            });

            app.projects.create(newProject, {wait: true});
        },
        onRender: function () {
            if (!this.$el.find('.modal-header').find('h4').length) {
                this.$el.find('.modal-header').append('<h4></h4>');
            }

            this.$el.find('.modal-header').find('h4').text('Create project');

            this.ui.$form.find('.date').datepicker({
                format: 'd MM, yyyy'
            });
        }
    });
})();
