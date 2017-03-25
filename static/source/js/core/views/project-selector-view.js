import Marionette from 'backbone.marionette';
import $ from 'jquery';
import {globalChannel} from '../../utils/radio';
import App from '../../main';
import template from '../../templates/core/project-selector-view.hbs';

export default Marionette.View.extend({
        tagName: 'div',
        className: 'project-selector',
        template: template,
        ui: {
            $select: '.selectpicker'
        },
        events: {
            'change @ui.$select': 'onChange'

        },
        initialize: function () {
            this.listenTo(this.collection, 'all', this.render);
            this.listenTo(globalChannel, 'settings:fetch_data:stop', this.onInitialLogin);
            this.listenTo(globalChannel, 'auth:fetched_no_backend', this.onNoBackend);
        },
        //  This is called after we're done fetching profiles and filling types
        onInitialLogin: function () {
            this.fetchData();
        },
        fetchData: function () {
            this.fetchProjectList();
        },
        setNewProjectName: function (project) {
            this.ui.$select.find('option[value="' + project.id + '"]').text(project.get('project_name'));
            this.ui.$select.selectpicker('refresh');
        },
        fetchProjectList: function () {
            var self = this;

        globalChannel.trigger('project_selector:fetch_list:start');

            this.collection.fetch({
                remove: false,
                success: function () {
                    self.loadByHashOrLastProject();
                    globalChannel.trigger('project_selector:fetch_list:stop');
                },
                error: function () {
                    self.loadByHashOrLastProject();
                    globalChannel.trigger('project_selector:fetch_list:stop');
                },
                data: {
                    limit: 0
                }
            });
        },
        onNoBackend: function () {
            this.loadByHashOrLastProject();
        },
        onChange: function () {
            var  new_id =  this.ui.$select.val();

            this.setCurrentProject(new_id);
            this.storeLastProject(new_id);
        },

        //  On project change we check if project with this id was already
        //  fetched from the server (which means it already has units, files
        //  and accessories, otherwise it only has simple properties like name
        //  etc.). If it wasn't fetched, we want to fetch it first
        setCurrentProject: function (new_id) {
            var d = $.Deferred();
            var self = this;

        App.current_project = this.collection.get(new_id);

        if (!App.current_project) {
            return;
        }

        if (App.current_project.get('no_backend') === true) {
            App.session.set('no_backend', true);
        } else if (App.session.get('no_backend') === true) {
            App.session.set('no_backend', false);
        }

        if (App.current_project._wasFetched || App.session.get('no_backend')) {
            d.resolve('Project was already fetched');
        } else {
            globalChannel.trigger('project_selector:fetch_current:start');

            App.current_project.fetch({
                success: function () {
                    d.resolve('Fetched project');
                }
            });
        }

        $.when(d).done(function () {
            globalChannel.trigger('current_project_changed');
            App.current_project.trigger('set_active');

            self.stopListening(App.current_project);

            if (App.current_project._wasLoaded) {
                globalChannel.trigger('project_selector:fetch_current:stop');
            } else {
                self.listenToOnce(App.current_project, 'fully_loaded', function () {
                    globalChannel.trigger('project_selector:fetch_current:stop');
                }, self);
            }

                self.listenTo(App.current_project, 'change:project_name', self.setNewProjectName);
                self.render();
            });
        },
        storeLastProject: function (new_id) {
            // Save selected project into a localStorage
            if ( 'localStorage' in window && 'setItem' in window.localStorage ) {
                window.localStorage.setItem('app_currentProject', new_id);
            }
        },
        loadByHashOrLastProject: function () {
            var hash_parts = (window.location.hash) ? window.location.hash.substr(1).split('/') : false;
            var hash_project_id = hash_parts && hash_parts.length ? parseInt(hash_parts[0], 10) : false;

            //  If there is something in hash, load this project
            if ( hash_project_id ) {
                this.ui.$select.val(hash_project_id).trigger('change');// Get selected project from a localStorage
            } elseif ( 'localStorage' in window && 'getItem' in window.localStorage ) {
                var last_id = window.localStorage.getItem('app_currentProject');

                this.ui.$select.val(last_id).trigger('change');
            }
        },
        onRender: function () {
            this.ui.$select.selectpicker({

                size: 10
            });
        },
        templateContext: function () {
            return {
                no_backend: App.session.get('no_backend'),
                project_list: this.collection.map(function (item) {
                    return {
                        is_selected: App.current_project && item.id === App.current_project.id,
                        id: item.id,
                        project_name: item.get('project_name')
                    };
                }, this)
            };
        }
    });
