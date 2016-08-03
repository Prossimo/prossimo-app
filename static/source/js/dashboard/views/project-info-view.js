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
        toggleEditMode: function() {
            var editMode = this.state.get('editMode');
            if(editMode) {
                this.saveFormData();
            }
            this.state.set('editMode', !editMode);
        },
        initialize: function() {
            this.state = new Backbone.Model();
            this.state.set('editMode', false);
            this.state.on('change:editMode', this.render);
        },
        enterMode: function() {
            if(this.state.get('editMode')) {
                this.enterEditMode();
            } else {
                this.enterViewMode();
            }
        },
        onRender: function() {
            this.enterMode();
        },
        enterViewMode: function() {
            this.ui.$content.html(this.viewTemplate(this.model.toJSON()));
        },
        enterEditMode: function() {
            this.ui.$content.html(this.editTemplate(this.model.toJSON()));
        },
        serializeData: function () {
            return $.extend({}, this.model.toJSON(), {state:this.state.toJSON()});
        },
        saveFormData: function () {
            var modelData = {};
            $.map(this.$el.find('.form-horizontal').serializeArray(), function(item){
                modelData[item.name] = item.value;
            });

            this.model.set(modelData);
        }
    });
})();
