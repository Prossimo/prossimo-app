import props from '../../../utils/decorators/props';
import stickableMixin from '../../../utils/decorators/stickableMixin';
import validatableMixin from '../../../utils/decorators/validatableMixin';
import BaseDialogView from './base-dialog-view';
import App from '../../../main';
import FileUploaderView from '../../file-uploader-view/file-uploader-view';
import Project from '../../../core/models/project';
import template from '../../../templates/dialogs/create-project-dialog-view.hbs';

const model = new Project();
const _schemaBindings = {};
const _ui = {};
Object.keys(model.schema).forEach((observe) => {
    const el = `[name=${observe}]`;
    _ui[`${observe}`] = el;
    _schemaBindings[el] = {
        observe,
        getVal($el) {
            return $el.val().trim();
        },
        setOptions: {
            validate: true,
        },
    };
});

@props({
    className: 'create-project-modal modal fade',
    options: {
        dialog_title: 'Create Project',
    },
    template,
    model,
    ui: {
        $form: '.modal-body form',
        $filesRegion: '.form-control-files',
        $createBtn: '.btn-save',
        ..._ui,
    },
    events: {
        'click @ui.$createBtn': 'createProject',
    },
    modelEvents: {
        validated: 'checkModelValidate',
    },
    templateContext() {
        return {
            dialog_title: this.options.dialog_title,
            schema: this.model.schema,
        };
    },
})
@stickableMixin
@validatableMixin
export default class extends BaseDialogView {
    createProject(e) {
        e.preventDefault();

        this.model.save(null, {
            success: (createdModel) => {
                this.$el.modal('hide');
                App.projects.create(createdModel);
            },
        });
    }

    bindings() {
        return {
            '.modal-title': {
                observe: 'project_name',
                onGet: val => `${this.options.dialog_title}${val ? `: ${val}` : ''}`,
            },
            ..._schemaBindings,
        };
    }

    onRender() {
        this.checkModelValidate(!!this.model.isValid());
        if (this.file_uploader) {
            this.file_uploader.destroy();
        }

        this.file_uploader = new FileUploaderView({
            maxLength: 10,
        });

        this.file_uploader.render()
            .$el.appendTo(this.ui.$filesRegion);

        this.listenTo(this.file_uploader.collection, 'all', () => {
            this.model.set('files', this.file_uploader.getUuidForAllFiles());
        });
    }

    checkModelValidate(isValid) {
        if (this.isModelValid === isValid) return;

        this.ui.$createBtn
            .prop('disabled', !isValid)
            .toggleClass('disabled', !isValid);

        this.isModelValid = isValid;
    }

    onBeforeDestroy() {
        if (this.file_uploader) {
            this.file_uploader.destroy();
        }
    }
}
