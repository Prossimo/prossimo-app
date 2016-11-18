import Marionette from 'backbone.marionette';
import App from '../../main';
import template from '../../templates/core/status-panel-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'status-panel',
    template: template,
    events: {
        'click .js-login': 'onLogin',
        'click .js-logout': 'onLogout'
    },
    initialize: function () {
        this.listenTo(App.session, 'change:is_logged_in', this.render);
        this.listenTo(App.vent, 'auth:no_backend', this.render);
    },
    onLogin: function (e) {
        e.preventDefault();
        App.dialogs.showDialog('login');
    },
    onLogout: function (e) {
        e.preventDefault();
        App.session.logout();
    },
    templateContext: function () {
        return {
            no_backend: App.session.get('no_backend'),
            is_logged_in: App.session.get('is_logged_in'),
            user: App.session.user.get('username')
        };
    }
});
