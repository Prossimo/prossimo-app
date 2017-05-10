import App from '../../../main';
import BaseDialogView from './base-dialog-view';
import template from '../../../templates/dialogs/login-dialog-view.hbs';

export default BaseDialogView.extend({
    className: 'login-modal modal fade',
    template,
    ui: {
        $username_input: '#pa_username',
        $password_input: '#pa_password',
        $error_container: '.error-container',
        $button: 'button',
    },
    events: {
        'keypress input': 'confirmOnEnter',
        'submit form': 'onSubmit',
    },
    freezeUI() {
        this.$el.addClass('request-active');
        this.ui.$button.addClass('disabled').attr('disabled', true);
    },
    unfreezeUI() {
        this.$el.removeClass('request-active');
        this.ui.$button.removeClass('disabled').attr('disabled', false);
    },
    onSubmit(e) {
        e.preventDefault();
        this.attemptToLogin();
    },
    attemptToLogin() {
        const username = this.ui.$username_input.val().trim();
        const password = this.ui.$password_input.val();

        if (username && password) {
            this.startRequest(username, password);
        } else {
            this.toggleError('Username and password shouldn\'t be empty.');
        }
    },
    startRequest(username, password) {
        const self = this;

        this.freezeUI();

        App.session.login({
            username,
            password,
        }, {
            success(response) {
                self.processResponse(response);
            },
            error(response, jqXHR, textStatus) {
                self.processResponse(response, jqXHR, textStatus);
            },
        });
    },
    processResponse(response, jqXHR) {
        let error_message = 'Server error. Please try again or contact support';

        this.unfreezeUI();

        if (response && !response.error && response.user) {
            this.toggleError();
            this.ui.$username_input.val('');
            this.ui.$password_input.val('');
            this.close();
            return;
        }

        if (jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.message &&
            jqXHR.responseJSON.message === 'Bad credentials'
        ) {
            error_message = 'Bad credentials';
        } else if (response && response.error && response.statusText === 'Unauthorized') {
            error_message = 'Authorization error. Please try again or contact support';
        }

        this.toggleError(error_message);
    },
    toggleError(message) {
        if (!message) {
            this.$el.removeClass('has-error');
            this.ui.$error_container.empty();
        } else {
            this.$el.addClass('has-error');
            this.ui.$error_container.html(`<p>${message}</p>`);
        }
    },
    templateContext() {
        return {
            token_expired: App.session.get('token_expired'),
        };
    },
    onRender() {
        this.$el.find('.modal-header').remove();
        this.toggleError();
    },
});
