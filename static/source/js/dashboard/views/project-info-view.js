/**
 * Created by devico on 01.08.16.
 */
var app = app || {};

(function () {
    'use strict';

    app.ProjectInfoView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'project-total-prices',
        template: app.templates['dashboard/project-info/main'],
        viewTemplate: app.templates['dashboard/project-info/view'],
        editTemplate: app.templates['dashboard/project-info/edit'],
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
        serializeData: function () {
            return _.extend({}, this.model.toJSON(), {editMode: this.editMode});
        },
        saveFormData: function () {
            var modelData = {};

            _.map(this.$el.find('.form-horizontal').serializeArray(), function (item) {
                modelData[item.name] = item.value;
            });

            this.model.persist(modelData, { wait: true, success: this.enterViewMode.bind(this) });
        },
        initialize: function () {
            this.editMode = false;
        },
        onRender: function () {
            this.enterMode();
        },
        onDestroy: function () {
            this.ui.$content.find('.date').datepicker('destroy');
        }
    });
})();
