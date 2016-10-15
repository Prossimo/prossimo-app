var app = app || {};

(function () {
    'use strict';

    var WARNING_ALERTS_TEMPLATE = '<div class="alert alert-warning" role="alert">' +
        'Warning !, your browser does not support Flash and HTML5: [</div>';

    app.FileUploaderView = Marionette.ItemView.extend({
        className: 'uploader-container',
        template: app.templates['dialogs/files-uploader-view'],

        options: {
            previewOpts: {
                width: 130,
                height: 160,
                showProgress: true,
                typeEl: 'span',
                prevClassUpload: 'uploader-file__preview-upload',
                prevClassError: 'uploader-file__preview-error',
                errorWrapper: 'uploader-file__preview-error-container',
                progressWrapper: 'uploader-file__preview-progress-container',
                prevClass: 'uploader-file__preview-item',
                prevTitleClass: 'uploader-file__preview-title',
                progressClass: 'uploader-file__preview-item_progress',
                progressLabelText: 'loading',
                deleteBtnText: 'delete',
                deleteBtnClass: 'uploader-file__preview-delete',
                errorLoadText: 'error loading'
            },
            fileUpload: {
                dataType: 'json',
                acceptFileTypes: /(\.|\/)(gif|jpe?g|png|pdf|docx?|rtf|xlsx?)$/i,
                maxFileSize: 99999000,
                minFileSize: 100,
                disableImageResize: /Android(?!.*Chrome)|Opera/.test(window.navigator.userAgent)
            },
            apiRouter: '/files/handlers',
            maxLength: false
        },

        ui: {
            previewContainer: '.uploader-file__preview-container',
            addBtn: '.add'
        },

        initialize: function () {
            if (!$.support.fileInput) {
                this.template = _.template(WARNING_ALERTS_TEMPLATE);
            }

            this.collection = this.options.collection || new app.ProjectFileCollection();

            this.listenTo(this.collection, 'update', function () {
                this.toggleAddBtn();
            });
        },

        onRender: function () {
            this.fUplad = this.$el.find('input[type="file"]').fileupload(_.extend({
                url: app.settings.get('api_base_path') + this.options.apiRouter,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + window.localStorage.getItem('authToken'));
                },
                previewCrop: true,
                autoUpload: true,
                previewMaxWidth: this.options.previewOpts.width,
                previewMaxHeight: this.options.previewOpts.height,
                processalways: this.processAlways.bind(this),
                send: this.send.bind(this),
                progress: this.progress.bind(this),
                done: this.done.bind(this),
                fail: this.fail.bind(this),
                always: this.always.bind(this)
            }, this.options.fileUpload || {}));

            this.fUplad.on('fileuploadadd', this.abortUpload.bind(this));
        },
        templateHelpers: function () {
            var isMultiple = true;

            if (this.options.maxLength == 1) {
                isMultiple = false;
            }

            return {
                isMultiple: isMultiple
            };
        },
        onDestroy: function () {
            this.fUplad.fileupload('xd');
        },
        send: function (e, data) {
            _.each(data.files, function (file) {
                if (this.options.previewOpts.prevClassUpload) {
                    file.previeContainer.addClass(this.options.previewOpts.prevClassUpload);
                }

                if (file.previeContainer.previeProgress) {
                    file.previeContainer
                        .addClass(this.options.previewOpts.progressClass);
                }
            }.bind(this));
        },
        processAlways: function (e, data) {
            _.each(data.files, function (file) {
                file.previeContainer = this.createEmptyPreview();

                if (file.preview && !file.error) {
                    file.previeContainer.prepend(file.preview);
                }

                if (file.error) {
                    this.fileUploadedError(file.previeContainer, file.error);
                }

                file.previeContainer
                    .prepend($('<span/>', {
                        class: this.options.previewOpts.prevTitleClass,
                        html: file.name
                    }))
                    .fadeIn();
            }.bind(this));
        },
        progress: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);

            _.each(data.files, function (file) {
                var $previeProgress = file.previeContainer.previeProgress;

                if ($previeProgress) {
                    $previeProgress.animate({width: progress + 'px'});
                }
            });
        },
        done: function (e, data) {
            var responseFiles = data.jqXHR.responseJSON.files || [];

            _.each(data.files, function (file, index) {

                var fileModel = this.collection.add(responseFiles[index]);

                if (!(fileModel || fileModel.cid)) {
                    return;
                }

                file.previeContainer.data('cid', fileModel.cid);

                var delBtn = $('<span>', {
                    class: this.options.previewOpts.deleteBtnClass,
                    html: this.options.previewOpts.deleteBtnText
                });

                delBtn
                    .on('click', function () {
                        this.deletePreview(file.previeContainer);
                        this.collection.remove(fileModel);
                    }.bind(this))
                    .appendTo(file.previeContainer);
            }.bind(this));

        },
        fail: function (e, data) {
            _.each(data.files, function (file) {
                if (file.previeContainer) {
                    this.fileUploadedError(file.previeContainer, file.error);
                }
            }.bind(this));
        },
        always: function (e, data) {
            _.each(data.files, function (file) {
                var $previeProgress = file.previeContainer.previeProgress;

                if (this.options.previewOpts.prevClassUpload) {
                    file.previeContainer.removeClass(this.options.previewOpts.prevClassUpload);
                }

                if ($previeProgress) {
                    file.previeContainer
                        .removeClass(this.options.previewOpts.progressClass);

                    $previeProgress
                        .closest('.' + this.options.previewOpts.progressWrapper)
                        .remove();
                }
            }.bind(this));
        },
        createEmptyPreview: function () {
            var options = this.options.previewOpts;

            var el = $('<' + options.typeEl + '/>', {
                class: options.prevClass,
                css: {display: 'none'},
                html: '<span class="' + options.progressWrapper + '"><span></span></span>'
            });

            el.appendTo(this.ui.previewContainer);

            if (options.showProgress) {
                var progressEL = $('<i>', {
                    class: 'ico-progress',
                    css: {width: '0px'}
                });

                progressEL.appendTo(el.find('.' + options.progressWrapper));

                if (options.progressLabelText) {
                    progressEL
                        .closest('.' + options.progressWrapper)
                        .find('span')
                        .text(options.progressLabelText);
                }

                el.previeProgress = progressEL;
            }

            return el;
        },
        abortUpload: function (e, data) {
            _.each(data.files, function (file) {
                if (this.options.maxLength) {
                    var indexInQueue = _.indexOf(data.originalFiles, file) + 1/**offset**/;

                    if (indexInQueue) {
                        var expectantCollectionlength = this.collection.length + indexInQueue;

                        if (expectantCollectionlength > this.options.maxLength) {
                            data.abort();
                        }
                    }
                }
            }.bind(this));
        },
        fileUploadedError: function (preview, error) {
            if (this.options.previewOpts.prevClassError) {
                preview.addClass(this.options.previewOpts.prevClassError);
            }

            preview.append($('<span/>', {
                class: this.options.previewOpts.errorWrapper,
                html: error || this.options.previewOpts.errorLoadText
            }));

            _.delay(this.deletePreview, 5000, preview);
        },
        toggleAddBtn: function () {
            if (this.options.maxLength && this.collection.length >= this.options.maxLength) {
                this.ui.addBtn.fadeOut(200);
            } else {
                this.ui.addBtn.fadeIn(200);
            }
        },
        deletePreview: function (preview) {
            preview.fadeOut(function () {
                $(this).remove();
            });
        }
    });
})();
