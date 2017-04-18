import Marionette from 'backbone.marionette';

import App from '../../main';
import { globalChannel } from '../../utils/radio';
import template from '../../templates/core/status-panel-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'status-panel',
    template,
    events: {
        'click .js-login': 'onLogin',
        'click .js-logout': 'onLogout',
    },
    initialize() {
        this.listenTo(App.session, 'change:is_logged_in', this.render);
        this.listenTo(globalChannel, 'auth:no_backend', this.render);
    },
    onLogin(e) {
        e.preventDefault();
        App.dialogs.showDialog('login');
    },
    onLogout(e) {
        e.preventDefault();
        App.session.logout();
    },
    templateContext() {
        return {
            no_backend: App.session.get('no_backend'),
            is_logged_in: App.session.get('is_logged_in'),
            user: App.session.user.get('username'),
        };
    },
});
