var app = app || {};

(function () {
    'use strict';

    app.MainNavigationView = Marionette.ItemView.extend({
        tagName: 'div',
        template: app.templates['core/main-navigation-view'],
        ui: {
            '$list': 'ul'
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
        initialize: function () {
            if ( this.options ) {
                _.forEach(this.options, function (item, key) {
                    if ( _.isFunction(item.showCallback) ) {
                        var self = this;

                        //  Execute callback on routing
                        app.router.addRoute(item.path + '(/)', function () {
                            item.showCallback.apply();
                            document.title = 'Prossimo App: ' + item.title +
                                ' (current version: ' + $('meta[name="latest-commit-sha"]').attr('value') + ')';
                            self.ui.$list.find('.' + key).addClass('active').siblings().removeClass('active');
                        });
                    }
                }, this);
            }

            $('#sidebar').append( this.render().el );
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
