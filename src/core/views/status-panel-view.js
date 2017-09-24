import Marionette from 'backbone.marionette';

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
        this.listenTo(this.options.session, 'change:is_logged_in', this.render);
        this.listenTo(globalChannel, 'auth:no_backend', this.render);
    },
    onLogin(e) {
        e.preventDefault();
        this.options.dialogs.showDialog('login', {
            session: this.options.session,
        });
    },
    onLogout(e) {
        e.preventDefault();
        this.options.session.logout();
    },
    templateContext() {
        return {
            no_backend: this.options.session.get('no_backend'),
            is_logged_in: this.options.session.get('is_logged_in'),
            user: this.options.session.user.get('username'),
        };
    },
});
