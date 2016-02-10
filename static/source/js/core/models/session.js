var app = app || {};

(function () {
    'use strict';

    //  Monkey-patch Backbone.Sync to include auth token with every request
    var backboneSync = Backbone.sync;

    Backbone.sync = function (method, model, options) {
        //  TODO: do we need conditional loading from localStorage? Do we need
        //  to use cookies as a fallback?
        // var token = window.localStorage.getItem('authToken');
        var token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXUyJ9.eyJleHAiOjE0NTUwODQ1NDAsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOiIxNDU0OTk4MTQwIn0.c-Ioa0o2af4ssiHEFAFYDEkiDjj8aJB_RP-aWUNVPTzPBeB8wIHwM7PENj0A0fOVrtmIrLNKALfB874esP61lHeJ5i0fXPsmEFWceNxo9Ps9lHF7ioKAAaPVECUtNGPPJmt-R6_AOOr6re4Zlp_W-I7jyMJINZedX_lMs5C7p4JWH2oevsE_FlNv7c76NQjVxcdE9fsiihx0nDhYokeQoaTG0YiDfZRZydhLNbklM_RQHbTgPFznxe4BnwHRP6FsF_FSFWWLGEoId9ri99aitHdO4Jwqw9iCjAccSNw5KGdMfRWoWAwIm0m22uT3lZkYzU8EQpVvXcDPruiHDZhIGaQ4uZpSbhoBWZa3YdSC0uQCiq78YOU6o7YestkKNagxmaxzGDk4tNWWSHyenjb9FsQAzLMuGe3FroJtjzOiGtiqwToPFpPYs4_z1eQ_9byV-7EVGwgPSheK6F9Ie7ePh5tgExy4mildoMoNgARnCSGPWL97BF73h2k9Pd5h0jpO4xgZxV7JAVVk0J_TDVJrzg_4tr_NktS47RoNMvGNy2UlTr3CR6SF18QUETBkY8SdAKZwNVYqSCSN0XMaFKd_2AOBd5_S06BDkfwxZ9ZoHV2IdrNU9pOCqBJv2ZTs_3KpqICddBuw2Bqx_xwrj1-cKazrznYXAZN6WAYQmSQ9q2M';
        token = '123';

        var errorCallback = options.error;

        //  TODO: check if we still correctly call error callback from
        //  project-selector-view.js
        options.error = function (xhr, textStatus, errorThrown) {
            // console.log( 'error' );
            // console.log( 'xhr', xhr );
            // console.log( 'textStatus', textStatus );
            // console.log( 'errorThrown', errorThrown );

            //  We just received an 401 Unauthorized response
            if ( textStatus === 'error' && xhr.status === 401 ) {
                app.vent.trigger('auth-error');
            }

            //  This is the same thing they do in the original Backbone.Sync
            if ( options.errorCallback ) {
                options.textStatus = textStatus;
                options.errorThrown = errorThrown;
                errorCallback.call(options.context, xhr, textStatus, errorThrown);
            }
        };

        if ( token ) {
            options.headers = {
                Authorization: 'Bearer ' + token
            };
        }

        //  Call the original function
        backboneSync(method, model, options);
    };

    app.Session = Backbone.Model.extend({
        defaults: {
            is_logged_in: false
        },
        initialize: function () {
            this.user = new app.User();

            this.listenTo(app.vent, 'auth-error', this.onAuthError);
        },
        updateSessionUser: function (user_data) {
            this.user.set(_.pick(user_data, _.keys(this.user.defaults)));
        },
        onAuthError: function () {
            console.log( 'just received an auth error from vent' );

            window.localStorage.removeItem('authToken');
        },
        // Contact server to see if it thinks that user is still logged in.
        checkAuth: function () {
            var self = this;

            this.fetch({
                url: app.settings.get('api_base_path') + '/login_check',
                success: function (model, response) {
                    if ( !response.error && response.user ) {
                        self.updateSessionUser(response.user);
                        self.set({ is_logged_in: true });
                    } else {
                        self.set({ is_logged_in: false });
                    }
                }, error: function () {
                    self.set({ is_logged_in: false });
                }
            });
        },
        postAuth: function (opts, callback) {
            var self = this;

            $.ajax({
                url: '/api/auth/' + opts.method,
                contentType: 'application/json',
                dataType: 'json',
                type: 'POST',
                beforeSend: function (xhr) {
                    // Set the CSRF Token in the header for security
                    var token = $('meta[name="csrf-token"]').attr('content');

                    if ( token ) {
                        xhr.setRequestHeader('X-CSRF-Token', token);
                    }
                },
                data: JSON.stringify(_.omit(opts, 'method')),
                success: function (response, textStatus, jqXHR) {
                    if ( !response.error ) {
                        if ( _.indexOf(['login', 'signup', 'signup-with-domain'], opts.method) !== -1 ) {
                            self.updateSessionUser( response.user || {} );
                            self.set({ is_logged_in: true });
                        } else {
                            self.set({ is_logged_in: false });
                        }

                        if ( callback && 'success' in callback) {
                            callback.success(response);
                        }
                    } else {
                        if ( callback && 'error' in callback ) {
                            callback.error(response, jqXHR, textStatus);
                        }
                    }
                },
                error: function (jqXHR, textStatus) {
                    if ( callback && 'error' in callback ) {
                        callback.error(undefined, jqXHR, textStatus);
                    }
                }
            }).complete(function (jqXHR, textStatus) {
                if ( callback && 'complete' in callback ) {
                    callback.complete(jqXHR, textStatus);
                }
            });
        },
        login: function (opts, callback) {
            this.postAuth(_.extend(opts, { method: 'login' }), callback);
        },
        //  TODO: we simply want to clear token storage and reset session user
        logout: function (opts, callback) {
            this.postAuth(_.extend(opts, { method: 'logout' }), callback);
        }// ,
    });
})();
