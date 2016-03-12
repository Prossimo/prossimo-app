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
            this.listenTo(this.collection, 'all', this.render);
            this.listenTo(app.vent, 'settings:fetched_data', this.onInitialLogin);
            this.listenTo(app.vent, 'auth:no_backend', this.onNoBackend);
        },
        //  This is called after we're done fetching profiles and filling types
        onInitialLogin: function () {
            this.fetchData();
        },
        fetchData: function () {
            this.fetchProjectList();
        },
        fetchProjectList: function () {
            var self = this;

            this.collection.fetch({
                remove: false,
                success: function () {
                    self.loadLastProject();
                },
                error: function () {
                    self.loadLastProject();
                },
                data: {
                    limit: 0
                }
            });
        },
        onNoBackend: function () {
            this.loadLastProject();
        },
        onChange: function () {
            var new_id = this.ui.$select.val();

            this.setCurrentProject(new_id);
            this.storeLastProject(new_id);
        },
        onAddNewLocalProject: function () {
            var new_id = this.collection.length + 1;

            this.collection.add({
                id: new_id,
                project_name: 'Local Project #' + new_id,
                no_backend: true
            });
        },
        //  On project change we check if project with this id was already
        //  fetched from the server (which means it already has units, files
        //  and accessories, otherwise it only has simple properties like name
        //  etc.). If it wasn't fetched, we want to fetch it first
        setCurrentProject: function (new_id) {
            var d = $.Deferred();

            app.current_project = this.collection.get(new_id);

            if ( !app.current_project ) {
                return;
            }

            if ( app.current_project._wasFetched ) {
                d.resolve('Project was already fetched');
            } else {
                app.current_project.fetch({
                    success: function () {
                        d.resolve('Fetched project');
                    }
                });
            }

            $.when(d).done(function () {
                if ( app.current_project.get('no_backend') === true ) {
                    app.session.set('no_backend', true);
                } else if ( app.session.get('no_backend') === true ) {
                    app.session.set('no_backend', false);
                    this.render();
                }

                app.vent.trigger('current_project_changed');
                app.current_project.trigger('set_active');
            });
        },
        storeLastProject: function (new_id) {
            // Save selected project into a localStorage
            if ( 'localStorage' in window && 'setItem' in window.localStorage ) {
                window.localStorage.setItem('app_currentProject', new_id);
            }
        },
        loadLastProject: function () {
            // Get selected project from a localStorage
            if ( 'localStorage' in window && 'getItem' in window.localStorage ) {
                var last_id = window.localStorage.getItem('app_currentProject');

                this.ui.$select.val(last_id).trigger('change');
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
                no_backend: app.session.get('no_backend'),
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
