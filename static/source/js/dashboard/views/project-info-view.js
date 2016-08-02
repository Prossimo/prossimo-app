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
            this.state.set('editMode', !this.state.get('editMode'));
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
            console.log(this.ui)
            this.ui.$content.html(this.viewTemplate(this.model.toJSON()));
        },
        enterEditMode: function() {
            this.ui.$content.html(this.editTemplate(this.model.toJSON()));
        }
        // serializeData: function () {
        //     console.log(this.model.toJSON())
        // }
    });
})();
