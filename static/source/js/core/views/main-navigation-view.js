var app = app || {};

(function () {
    'use strict';

    // Cached regex for stripping leading and trailing slashes.
    var rootStripper = /^\/+|\/+$/g;

    app.MainNavigationItemView = Marionette.ItemView.extend({
        tagName: 'li',
        template: app.templates['core/main-navigation-item-view'],
        className: function () {
            return this.model.get('key');
        },
        triggers: {
            'click a': 'nav:click'
        },
        modelEvents: {
            'change:selected': 'setActiveNavItem'
        },
        setActiveNavItem: function () {
            this.$el.toggleClass('active', !!this.model.get('selected'));
        },
        onRender: function () {
            this.setActiveNavItem();
        }
    });

    app.MainNavigationView = Marionette.CompositeView.extend({
        template: app.templates['core/main-navigation-view'],
        childViewContainer: 'ul',
        collection: new Backbone.Collection(null, {
            comparator: 'index'
        }),
        childView: app.MainNavigationItemView,
        childEvents: {
            'nav:click': function (childView) {
                this.navigate(childView.model);
            }
        },
        // unset all selected model
        unSelectAll: function () {
            this.collection.each(function (model) {
                model.unset('selected');
            });
        },
        setTitle: function (model) {
            document.title = 'Prossimo App: ' + model.get('title') +
                ' (current version: ' + $('meta[name="latest-commit-sha"]').attr('value') + ')';
        },
        navigate: function (model) {
            app.router.navigate(model.get('path') + '/', {trigger: true});
        },
        selectItem: function (selectModel) {
            this.unSelectAll();
            selectModel.set('selected', true);
        },
        initialize: function () {
            app.App.reqres.setHandler('get:nav:tabs_collection', function () {
                return this.collection;
            }.bind(this));

            this.listenTo(app.router, 'route', function () {
                var path = Backbone.history.getFragment().replace(rootStripper, '');
                var model = this.collection.findWhere({path: path});

                if (model) {
                    this.setTitle(model);
                    this.selectItem(model);
                }
            });
        }
    });
})();
