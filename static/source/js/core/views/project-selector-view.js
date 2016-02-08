var app = app || {};

(function () {
    'use strict';

    app.ProjectSelectorView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'project-selector',
        template: app.templates['core/project-selector-view'],
        ui: {
            $select: '.selectpicker'
        },
        events: {
            'change @ui.$select': 'onChange',
            'click .js-add-new-local-project': 'onAddNewLocalProject'
        },
        initialize: function () {
            var self = this;

            this.no_backend = false;
            this.listenTo(this.collection, 'all', this.render);

            $('#header').append( this.render().el );

            this.collection.fetch({
                remove: false,
                success: function () {
                    self.getLastProject();
                },
                error: function () {
                    self.no_backend = true;
                    self.getLastProject();
                },
                data: {
                    limit: 0
                }
            });
        },
        onChange: function () {
            var new_id = this.ui.$select.val();

            this.setCurrentProject(new_id);
            this.setLastProject(new_id);
        },
        onAddNewLocalProject: function () {
            var new_id = this.collection.length + 1;

            this.collection.add({
                id: new_id,
                project_name: 'Local Project #' + new_id,
                no_backend: true
            });
        },
        setCurrentProject: function (new_id) {
            app.current_project = this.collection.get(new_id);

            if ( app.current_project.get('no_backend') === true ) {
                app.no_backend = true;
            } else {
                delete app.no_backend;
            }

            app.vent.trigger('current_project_changed');
        },
        setLastProject: function (new_id) {
            // Save selected project into a localStorage
            if ( 'localStorage' in window && 'setItem' in window.localStorage ) {
                window.localStorage.setItem('app_currentProject', new_id);
            }
        },
        getLastProject: function () {
            // Get selected project from a localStorage
            if ( 'localStorage' in window && 'getItem' in window.localStorage ) {
                var last_id = window.localStorage.getItem('app_currentProject');

                if ( last_id ) {
                    this.ui.$select.val(last_id).trigger('change');
                }
            }
        },
        onRender: function () {
            this.ui.$select.selectpicker({
                style: 'btn-xs',
                size: 10
            });
        },
        serializeData: function () {
            return {
                no_backend: this.no_backend,
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
