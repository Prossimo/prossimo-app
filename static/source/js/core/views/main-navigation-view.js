var app = app || {};

(function () {
    'use strict';

    app.MainNavigationView = Marionette.ItemView.extend({
        tagName: 'div',
        template: app.templates['core/main-navigation-view'],
        ui: {
            $list: 'ul'
        },
        events: {
            'click .sidebar-nav a': 'onNavigationClick'
        },
        onNavigationClick: function (e) {
            var $event_target = $(e.currentTarget);
            var nav_target = $event_target.attr('href');

            e.preventDefault();
            app.router.navigate(nav_target, { trigger: true });
        },
        setTitle: function (title_part) {
            document.title = 'Prossimo App: ' + title_part +
                ' (current version: ' + $('meta[name="latest-commit-sha"]').attr('value') + ')';
        },
        setActiveNavItem: function (key) {
            this.ui.$list.find('.' + key).addClass('active').siblings().removeClass('active');
        },
        setActivePath: function (path) {
            this.active_path = path;
        },
        reloadActiveScreen: function () {
            if ( this.active_path && _.isFunction(this.router_callbacks[this.active_path]) ) {
                this.router_callbacks[this.active_path].call();
            }
        },
        initialize: function () {
            this.router_callbacks = {};

            if ( this.options ) {
                _.forEach(this.options, function (item, key) {
                    if ( _.isFunction(item.onShow) ) {
                        var self = this;

                        this.router_callbacks[item.path] = function () {
                            if ( app.current_project || item.path === 'settings' ) {
                                item.onShow.call();
                            } else {
                                app.main_region.show(new app.NoProjectSelectedView());
                            }

                            self.setActivePath(item.path);
                            self.setTitle(item.title);
                            self.setActiveNavItem(key);
                        };

                        //  Execute callback on routing
                        app.router.addRoute(item.path + '(/)', function () {
                            if ( _.isFunction(self.router_callbacks[item.path]) ) {
                                self.router_callbacks[item.path].call();
                            }
                        });
                    }
                }, this);
            }

            $('#sidebar').append( this.render().el );

            this.listenTo(app.vent, 'project_selector:fetch_current:stop', this.reloadActiveScreen);
        },
        onRender: function () {
            //  Append each navigation item
            if ( this.options ) {
                _.forEach(this.options, function (item, key) {
                    item.class_name = key;
                    var item_tpl = app.templates['core/main-navigation-item-view'](item);
                    var $item = $(item_tpl);

                    this.ui.$list.append($item);
                }, this);
            }
        }
    });
})();
