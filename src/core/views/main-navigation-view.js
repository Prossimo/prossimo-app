import Marionette from 'backbone.marionette';
import $ from 'jquery';
import _ from 'underscore';

import App from '../../main';
import { globalChannel } from '../../utils/radio';
import NoProjectSelectedView from '../../core/views/no-project-selected-view';
import template from '../../templates/core/main-navigation-view.hbs';
import templateItem from '../../templates/core/main-navigation-item-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    template,
    ui: {
        $list: 'ul',
    },
    events: {
        'click .main-nav a': 'onNavigationClick',
    },
    onNavigationClick(e) {
        const $event_target = $(e.currentTarget);
        const nav_target = $event_target.attr('href');

        e.preventDefault();
        App.router.navigate(nav_target, { trigger: true });
    },
    setTitle(title_part) {
        document.title = `${$('meta[name="app-title"]').attr('value')}: ${title_part
            } (current version: ${$('meta[name="latest-version"]').attr('value')})`;
    },
    setActiveNavItem(key) {
        this.ui.$list.find(`.${key}`).addClass('active').siblings().removeClass('active');
    },
    setActivePath(path) {
        this.active_path = path;
    },
    reloadActiveScreen() {
        if (this.active_path && _.isFunction(this.router_callbacks[this.active_path])) {
            this.router_callbacks[this.active_path].call();
        }
    },
    initialize() {
        this.router_callbacks = {};

        if (this.options) {
            _.forEach(this.options, function (item, key) {
                if (_.isFunction(item.onAttach)) {
                    const self = this;

                    this.router_callbacks[item.path] = function () {
                        if (App.current_quote || item.path === 'settings') {
                            item.onAttach.call();
                        } else {
                            App.main_region.show(new NoProjectSelectedView());
                        }

                        self.setActivePath(item.path);
                        self.setTitle(item.title);
                        self.setActiveNavItem(key);
                    };

                    //  Execute callback on routing
                    App.router.addRoute(`${item.path}(/)`, () => {
                        if (_.isFunction(self.router_callbacks[item.path])) {
                            self.router_callbacks[item.path].call();
                        }
                    });
                }
            }, this);
        }

        $('#main-nav-container').append(this.render().el);

        this.listenTo(globalChannel, 'quote_selector:load_current:stop', this.reloadActiveScreen);
    },
    onRender() {
        //  Append each navigation item
        if (this.options) {
            _.forEach(this.options, function (item, key) {
                item.class_name = key;
                const item_tpl = templateItem(item);
                const $item = $(item_tpl);

                this.ui.$list.append($item);
            }, this);
        }
    },
});
