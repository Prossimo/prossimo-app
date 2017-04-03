import _ from 'underscore';
import $ from 'jquery';
import Marionette from 'backbone.marionette';
import 'blueimp-file-upload/js/jquery.fileupload';
import 'blueimp-file-upload/js/jquery.fileupload-process';
import 'blueimp-file-upload/js/jquery.fileupload-image';
import 'blueimp-file-upload/js/jquery.fileupload-audio';
import 'blueimp-file-upload/js/jquery.fileupload-video';
import 'blueimp-file-upload/js/jquery.fileupload-validate';

import App from '../../main';
import ProjectFileCollection from '../../core/collections/project-file-collection';
import template from './files-uploader-view.hbs';

const WARNING_ALERTS_TEMPLATE = '<div class="alert alert-warning" role="alert">' +
    'Warning: you are not able to attach any files because your browser does not support file upload.</div>';

export default Marionette.View.extend({
    className: 'uploader-container',
    template: template,

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
            deleteBtnNoPreviewClass: 'uploader-file__preview-delete glyphicon glyphicon-remove',
            errorLoadText: 'error loading'
        },
        fileUpload: {
            dataType: 'json',
            acceptFileTypes: /(\.|\/)(gif|jpe?g|png|pdf|docx?|rtf|xlsx?)$/i,
            maxFileSize: 99999000,
            minFileSize: 100,
            disableImageResize: /Android(?!.*Chrome)|Opera/.test(window.navigator.userAgent)
        },
        showPreview: true,
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

        this.collection = this.options.collection || new ProjectFileCollection();

        this.listenTo(this.collection, 'update', function () {
            this.toggleAddBtn();
        });
    },

    onRender: function () {
        this.fUplad = this.$el.find('input[type="file"]').fileupload(_.extend({
            // url: 'http://dev.prossimo.us/api/api' + this.options.apiRouter,
            url: App.settings.get('api_base_path') + this.options.apiRouter,
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
    templateContext: function () {
        var isMultiple = true;

        if (this.options.maxLength === 1) {
            isMultiple = false;
        }

        return {
            isMultiple: isMultiple,
            isShowPreview: this.options.showPreview
        };
    },
    onBeforeDestroy: function () {
        this.fUplad.fileupload('xd');
    },
    getUuidForAllFiles: function () {
        return this.collection.pluck('uuid') || [];
    },
    send: function (e, data) {
        _.each(data.files, function (file) {
            if (this.options.previewOpts.prevClassUpload) {
                file.previewContainer.addClass(this.options.previewOpts.prevClassUpload);
            }

            if (file.previewContainer.previewProgress) {
                file.previewContainer
                    .addClass(this.options.previewOpts.progressClass);
            }
        }.bind(this));
    },
    processAlways: function (e, data) {
        _.each(data.files, function (file) {
            file.previewContainer = this.createEmptyPreview();

            if (file.preview && !file.error && this.options.showPreview) {
                file.previewContainer.prepend(file.preview);
            }

            if (file.error) {
                this.fileUploadedError(file.previewContainer, file.error);
            }

            file.previewContainer
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
            var $previewProgress = file.previewContainer.previewProgress;

            if ($previewProgress) {
                $previewProgress.animate({width: progress + 'px'});
            }
        });
    },
    done: function (e, data) {
        //  The endpoint we use only accepts and returns a single file
        var responseFiles = [data.jqXHR.responseJSON.file] || [];

        //  So when we iterate over files here we actually assume there is
        //  only one file for each request
        _.each(data.files, function (file, index) {
            var fileModel = this.collection.add(responseFiles[index]);

            if (!(fileModel || fileModel.cid)) {
                return;
            }

            file.previewContainer.data('cid', fileModel.cid);

            var delBtnOptions = function () {
                if (this.options.showPreview) {
                    return {
                        class: this.options.previewOpts.deleteBtnClass,
                        html: this.options.previewOpts.deleteBtnText
                    };
                }

                return {
                    class: this.options.previewOpts.deleteBtnNoPreviewClass
                };
            }.bind(this);

            var delBtn = $('<span>', delBtnOptions());

            delBtn
                .on('click', function () {
                    this.deletePreview(file.previewContainer);
                    fileModel.destroy();
                }.bind(this))
                .appendTo(file.previewContainer);
        }.bind(this));
    },
    fail: function (e, data) {
        _.each(data.files, function (file) {
            if (file.previewContainer) {
                this.fileUploadedError(file.previewContainer, file.error);
            }
        }.bind(this));
    },
    always: function (e, data) {
        _.each(data.files, function (file) {
            var $previewProgress = file.previewContainer.previewProgress;

            if (this.options.previewOpts.prevClassUpload) {
                file.previewContainer.removeClass(this.options.previewOpts.prevClassUpload);
            }

            if ($previewProgress) {
                file.previewContainer
                    .removeClass(this.options.previewOpts.progressClass);

                $previewProgress
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

            if (options.progressLabelText && !this.options.showPreview) {
                progressEL
                    .closest('.' + options.progressWrapper)
                    .find('span')
                    .text(options.progressLabelText);
            }

            el.previewProgress = progressEL;
        }

        return el;
    },
    abortUpload: function (e, data) {
        _.each(data.files, function (file) {
            if (this.options.maxLength) {
                var indexInQueue = _.indexOf(data.originalFiles, file) + 1;

                if (indexInQueue) {
                    var expectedCollectionLength = this.collection.length + indexInQueue;

                    if (expectedCollectionLength > this.options.maxLength) {
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
