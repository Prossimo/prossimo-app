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
        $edit_button: '.toggle-edit-mode'
    },
    events: {
        'click @ui.$edit_button': 'toggleEditMode'
    },
    toggleEditMode: function () {
        if (this.editMode) {
            this.saveFormData();
        }

        this.editMode = !this.editMode;
        this.render();
    },
    enterMode: function () {
        if (this.editMode) {
            this.enterEditMode();
        } else {
            this.enterViewMode();
        }
    },
    enterViewMode: function () {
        this.ui.$content.find('.date').datepicker('destroy');
        this.ui.$content.html(this.viewTemplate(this.model.toJSON()));
    },
    enterEditMode: function () {
        this.ui.$content.html(this.editTemplate(this.model.toJSON()));
        this.ui.$content.find('.date').datepicker({
            format: 'd MM, yyyy'
        });
    },
    templateContext: function () {
        return _.extend({}, this.model.toJSON(), {editMode: this.editMode});
    },
    saveFormData: function () {
        var modelData = {};

        _.map(this.$el.find('.form-horizontal').serializeArray(), function (item) {
            modelData[item.name] = item.value;
        });

        this.model.persist(modelData, {wait: true, success: this.enterViewMode.bind(this)});
    },
    initialize: function () {
        this.editMode = false;
    },
    onRender: function () {
        this.enterMode();
    },
    onBeforeDestroy: function () {
        this.ui.$content.find('.date').datepicker('destroy');
    }
});
