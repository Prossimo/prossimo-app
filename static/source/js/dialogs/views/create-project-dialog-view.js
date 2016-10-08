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
            'submit form': 'addNewProject',
            'click #labelupload': 'saveFile'
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
        saveFile: function () {
            var token = window.localStorage.getItem('authToken');

            $('#fileupload').fileupload({
                url: app.settings.get('api_base_path') + '/files/handlers',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Accept', 'application/json');
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                },
                dataType: 'json',
                autoUpload: false,
                acceptFileTypes: /(\.|\/)(gif|jpe?g|png|pdf|docx?|rtf|xlsx?)$/i,
                maxFileSize: 99999000,
                disableImageResize: /Android(?!.*Chrome)|Opera/
                        .test(window.navigator.userAgent),
                previewMaxWidth: 100,
                previewMaxHeight: 100,
                previewCrop: true
            }).on('fileuploadadd', function (e, data) {
                data.context = $('<button/>').text('Upload')
                .appendTo('#files')
                .click(function () {
                    data.submit();
                });

                data.context = $('<div/>').appendTo('#files');

                $.each(data.files, function (index, file) {
                    var node = $('<p/>')
                        .append($('<span/>').text(file.name));

                    if (!index) {
                        var node = $('<p/>')
                            .append($('<span/>').text(file.name));
                    }

                    node.appendTo(data.context);
                });
            }).on('fileuploadprocessalways', function (e, data) {
                var index = data.index;
                var file = data.files[index];
                var node = $(data.context.children()[index]);

                if (file.preview) {
                    node
                        .prepend('<br>')
                        .prepend(file.preview);
                }

                if (file.error) {
                    node
                        .append('<br>')
                        .append($('<span class="text-danger"/>').text(file.error));
                }

                if (index + 1 === data.files.length) {
                    data.context.find('button')
                        .text('Upload')
                        .prop('disabled', !!data.files.error);
                }
            }).on('fileuploadprogressall', function (e, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);

                $('#progress .progress-bar').css(
                        'width',
                        progress + '%'
                );
            }).on('fileuploaddone', function (e, data) {
                console.log(data);
                $.each(data.result.files, function (index, file) {
                    if (file.url) {
                        var link = $('<a>')
                                .attr('target', '_blank')
                                .prop('href', file.url);

                        $(data.context.children()[index])
                                .wrap(link);
                    } else if (file.error) {
                        var error = $('<span class="text-danger"/>').text(file.error);

                        $(data.context.children()[index])
                                .append('<br>')
                                .append(error);
                    }
                });
            }).on('fileuploadfail', function (e, data) {
                console.log(data);
                $.each(data.files, function (index) {
                    var error = $('<span class="text-danger"/>').text('File upload failed.');

                    $(data.context.children()[index])
                            .append('<br>')
                            .append(error);
                });
            }).prop('disabled', !$.support.fileInput)
                    .parent().addClass($.support.fileInput ? undefined : 'disabled');

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
