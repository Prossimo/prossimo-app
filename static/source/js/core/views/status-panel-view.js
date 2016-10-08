var app = app || {};

(function () {
    'use strict';

    app.StatusPanelView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'status-panel',
        template: app.templates['core/status-panel-view'],
        events: {
            'click .js-login': 'onLogin',
            'click .js-logout': 'onLogout'
        },
        initialize: function () {
            this.listenTo(app.session, 'change:is_logged_in', this.render);
            this.listenTo(app.vent, 'auth:no_backend', this.render);
        },
        onLogin: function (e) {
            e.preventDefault();
            app.dialogs.showDialog('login');
        },
        onLogout: function (e) {
            e.preventDefault();
            app.session.logout();
        },
        serializeData: function () {
            return {
                no_backend: app.session.get('no_backend'),
                is_logged_in: app.session.get('is_logged_in'),
                user: app.session.user.get('username')
            };
        }
    });
})();
