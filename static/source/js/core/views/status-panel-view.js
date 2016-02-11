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
            $('#header').append( this.render().el );

            this.listenTo(app.session, 'change:is_logged_in', this.render);
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
                is_logged_in: app.session.get('is_logged_in'),
                user: app.session.user.get('username')
            };
        }
    });
})();
