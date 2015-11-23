var app = app || {};

(function () {
    'use strict';

    app.ProjectSelectorView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'project-selector',
        template: app.templates['core/project-selector-view'],
        ui: {
            '$select': '.selectpicker'
        },
        events: {
            'change @ui.$select': 'onChange'
        },
        initialize: function () {
            $('#header').append( this.render().el );
            this.collection.fetch({remove: false});
            this.listenTo(this.collection, 'all', this.render);
        },
        onChange: function () {
            var new_id = this.ui.$select.val();
            // console.log( 'project selector onchange', this.ui.$select.val() );
            this.setCurrentProject(new_id);
        },
        setCurrentProject: function (new_id) {
            console.log( 'set current project', new_id );
            app.current_project = this.collection.get(new_id);
            app.vent.trigger('current_project_changed');
        },
        onRender: function () {
            // console.log( 'project selector render' );
            // console.log( this.collection );
            this.ui.$select.selectpicker({
                style: 'btn-xs'
            });
        },
        serializeData: function () {
            return {
                project_list: this.collection.map(function (item) {
                    return {
                        is_selected: app.current_project && item.id === app.current_project.id,
                        id: item.id,
                        project_name: item.get('project_name')
                    };
                }, this)
            };
        }
    });
})();
