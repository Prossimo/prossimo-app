var app = app || {};

(function () {
    'use strict';

    app.LoginDialogView = app.BaseDialogView.extend({
        className: 'login-modal modal fade',
        template: app.templates['dialogs/login-dialog-view'],
        ui: {
            $username_input: '#pa_username',
            $password_input: '#pa_password',
            $error_container: '.error-container',
            $button: 'button'
        },
        events: {
            'keypress input': 'confirmOnEnter',
            'submit form': 'onSubmit'
        },
        freezeUI: function () {
            this.$el.addClass('request-active');
            this.ui.$button.addClass('disabled').attr('disabled', true);
        },
        unfreezeUI: function () {
            this.$el.removeClass('request-active');
            this.ui.$button.removeClass('disabled').attr('disabled', false);
        },
        onSubmit: function (e) {
            e.preventDefault();
            this.attemptToLogin();
        },
        attemptToLogin: function () {
            var username = this.ui.$username_input.val().trim();
            var password = this.ui.$password_input.val();

            if ( username && password ) {
                this.startRequest(username, password);
            } else {
                this.toggleError('Email and password shouldn\'t be empty.');
            }
        },
        startRequest: function (username, password) {
            var self = this;

            this.freezeUI();

            app.session.login({
                username: username,
                password: password
            }, {
                success: function (response) {
                    self.processResponse(response);
                },
                error: function (response, jqXHR, textStatus) {
                    self.processResponse(response, jqXHR, textStatus);
                }
            });
        },
        processResponse: function (response, jqXHR) {
            var error_message = 'Server error. Please try again or contact support';

            this.unfreezeUI();

            if ( response && !response.error && response.user ) {
                this.toggleError();
                this.ui.$username_input.val('');
                this.ui.$password_input.val('');
                this.close();
                return;
            }

            if ( jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.message &&
                jqXHR.responseJSON.message === 'Bad credentials'
            ) {
                error_message = 'Bad credentials';
            } else if ( response && response.error && response.statusText === 'Unauthorized' ) {
                error_message = 'Authorization error. Please try again or contact support';
            }

            this.toggleError(error_message);
        },
        toggleError: function (message) {
            if ( !message ) {
                this.$el.removeClass('has-error');
                this.ui.$error_container.empty();
            } else {
                this.$el.addClass('has-error');
                this.ui.$error_container.html('<p>' + message + '</p>');
            }
        },
        serializeData: function () {
            return {
                token_expired: app.session.get('token_expired')
            };
        },
        onRender: function () {
            this.$el.find('.modal-header').remove();
            this.toggleError();
        }
    });
})();
