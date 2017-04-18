import Marionette from 'backbone.marionette';
import _ from 'underscore';

import templateMain from '../templates/project-info/main.hbs';
import templateView from '../templates/project-info/view.hbs';
import templateEdit from '../templates/project-info/edit.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'project-total-prices',
    template: templateMain,
    viewTemplate: templateView,
    editTemplate: templateEdit,
    ui: {
        $content: '#project-info-content',
        $edit_button: '.toggle-edit-mode',
    },
    events: {
        'click @ui.$edit_button': 'toggleEditMode',
    },
    toggleEditMode() {
        if (this.editMode) {
            this.saveFormData();
        }

        this.editMode = !this.editMode;
        this.render();
    },
    enterMode() {
        if (this.editMode) {
            this.enterEditMode();
        } else {
            this.enterViewMode();
        }
    },
    enterViewMode() {
        this.ui.$content.html(this.viewTemplate(this.model.toJSON()));
    },
    enterEditMode() {
        this.ui.$content.html(this.editTemplate(this.model.toJSON()));
    },
    templateContext() {
        return _.extend({}, this.model.toJSON(), { editMode: this.editMode });
    },
    saveFormData() {
        const modelData = {};

        _.map(this.$el.find('.form-horizontal').serializeArray(), (item) => {
            modelData[item.name] = item.value;
        });

        this.model.persist(modelData, { wait: true, success: this.enterViewMode.bind(this) });
    },
    initialize() {
        this.editMode = false;
    },
    onRender() {
        this.enterMode();
    },
});
