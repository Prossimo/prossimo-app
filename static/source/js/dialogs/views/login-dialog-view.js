/* global ENTER_KEY */
var app = app || {};

(function () {
    'use strict';

    //  TODO: user shouldn't be able to close this dialog unless they're
    //  logged in successhully
    app.LoginDialogView = app.BaseDialogView.extend({
        className: 'login-modal modal fade',
        template: app.templates['dialogs/login-dialog-view'],
        ui: {
            $username_input: '#pa_username',
            $password_input: '#pa_password',
            $error_container: '.error-container',
            $button: 'button'
        },
        // TODO: try to extend events from base form
        events: {
            'click button': 'attemptToLogin',
            'keypress input': 'confirmOnEnter',
            'submit form': 'returnFalse'
        },
        freezeUI: function () {
            this.$el.addClass('request-active');
            this.ui.$button.addClass('disabled').attr('disabled', true);
        },
        unfreezeUI: function () {
            this.$el.removeClass('request-active');
            this.ui.$button.removeClass('disabled').attr('disabled', false);
        },
        confirmOnEnter: function (e) {
            if ( e.which === ENTER_KEY ) {
                this.attemptToLogin();
            }
        },
        attemptToLogin: function () {
            console.log( 'attempt to login' );

            var username = this.ui.$username_input.val().trim();
            var password = this.ui.$password_input.val().trim();

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
                    console.log( 'post-auth success callback' );
                    self.processResponse(response);
                },
                // error: function (response, jqXHR, textStatus) {
                error: function (response) {
                    console.log( 'post-auth error callback' );
                    // self.processResponse(response, jqXHR, textStatus);
                    self.processResponse(response);
                }
            });
        },
        // processResponse: function (response, jqXHR, textStatus) {
        processResponse: function (response) {
            var error_message = 'Server error. Please try again or contact support';

            console.log( 'processResponse' );

            console.log( 'response', response );
            // console.log( 'jqXHR', jqXHR );
            // console.log( 'textStatus', textStatus );

            this.unfreezeUI();

            if ( response && !response.error && response.user ) {
                this.toggleError();
                this.ui.$username_input.val('');
                this.ui.$password_input.val('');
                this.close();
                return;
            }

            // if ( textStatus === 'error' && jqXHR.responseJSON && jqXHR.responseJSON.message ) {
            //     error_message = jqXHR.responseJSON.message;
            // }

            if ( response.error && response.statusText === 'Unauthorized' ) {
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
        onRender: function () {
            this.toggleError();
        }
    });
})();
