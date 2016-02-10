var app = app || {};

(function () {
    'use strict';

    //  Monkey-patch Backbone.Sync to include auth token with every request
    //  TODO: is this a good place to store this function? What if we move it
    //  to a separate file or something
    var backboneSync = Backbone.sync;

    Backbone.sync = function (method, model, options) {
        //  TODO: do we need conditional loading from localStorage? Do we need
        //  to use cookies as a fallback?
        var token = window.localStorage.getItem('authToken');

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
                app.vent.trigger('auth:error');
            }

            //  This is the same thing they do in the original Backbone.Sync
            // if ( options.errorCallback ) {
            if ( errorCallback ) {
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

            this.listenTo(app.vent, 'auth:error', this.onAuthError);
            this.listenTo(app.vent, 'auth:login', this.onAuthLogin);
            this.listenTo(app.vent, 'auth:logout', this.onAuthLogout);
        },
        updateSessionUser: function (user_data) {
            this.user.set(_.pick(user_data, _.keys(this.user.defaults)));
        },
        onAuthError: function () {
            console.log( 'just received an auth error event from vent' );

            window.localStorage.removeItem('authToken');
        },
        onAuthLogin: function () {
            console.log( 'just received an auth login event from vent' );
        },
        onAuthLogout: function () {
            console.log( 'just received an auth logout event from vent' );
        },
        // Contact server to see if it thinks that user is logged in
        checkAuth: function (callback) {
            var self = this;

            console.log( 'checkAuth' );

            this.fetch({
                url: app.settings.get('api_base_path') + '/users/current',
                // success: function (response, textStatus, jqXHR) {
                success: function (model, response) {
                    console.log( 'checkAuth success' );
                    console.log( 'model', model );
                    console.log( 'response', response );
                    // console.log( 'textStatus', textStatus );
                    // console.log( 'jqXHR', jqXHR );

                    if ( !response.error && response.user ) {
                        self.updateSessionUser(response.user);
                        self.set({ is_logged_in: true });
                    } else {
                        self.set({ is_logged_in: false });
                    }

                    if ( callback && 'success' in callback) {
                        callback.success(response);
                    }
                // }, error: function () {
                // }, error: function (response, jqXHR, textStatus) {
                }, error: function (model, response) {
                    console.log( 'checkAuth error' );
                    console.log( 'model', model );
                    console.log( 'response', response );
                    // console.log( 'textStatus', textStatus );
                    // console.log( 'jqXHR', jqXHR );

                    self.set({ is_logged_in: false });

                    if ( callback && 'error' in callback ) {
                        // callback.error(response, jqXHR, textStatus);
                        callback.error(response);
                    }
                }
            });
        },
        postAuth: function (opts, callback) {
            var self = this;

            $.ajax({
                // url: '/api/auth/' + opts.method,
                // url: '/api/auth/' + opts.method,
                url: app.settings.get('api_base_path') + '/login_check',
                contentType: 'application/json',
                dataType: 'json',
                type: 'POST',
                // beforeSend: function (xhr) {
                //     // Set the CSRF Token in the header for security
                //     var token = $('meta[name="csrf-token"]').attr('content');

                //     if ( token ) {
                //         xhr.setRequestHeader('X-CSRF-Token', token);
                //     }
                // },
                data: JSON.stringify({
                    _username: opts.username,
                    _password: opts.password
                }),
                success: function (response, textStatus, jqXHR) {
                    console.log( 'postAuth success' );
                    console.log( 'response', response );
                    console.log( 'textStatus', textStatus );
                    console.log( 'jqXHR', jqXHR );

                    //  TODO: save token to localstorage && call check auth
                    if ( !response.error && 'token' in response ) {
                        // if ( _.indexOf(['login', 'signup', 'signup-with-domain'], opts.method) !== -1 ) {

                        if ( opts.method === 'login' ) {
                            // if (  )
                            // self.checkAuth(function () {
                            //     console.log( 'succsess callback inside checkAuth' );
                            //     console.log( 'callback', callback );

                            //     if ( callback && 'success' in callback) {
                            //         callback.success(response);
                            //     }
                            // });

                            window.localStorage.setItem('authToken', response.token);

                            self.checkAuth(callback);

                            // self.updateSessionUser( response.user || {} );
                            // self.set({ is_logged_in: true });
                        } else {
                            self.set({ is_logged_in: false });

                            if ( callback && 'success' in callback) {
                                callback.success(response);
                            }
                        }

                    } else {
                        if ( callback && 'error' in callback ) {
                            callback.error(response, jqXHR, textStatus);
                        }
                    }
                },
                error: function (jqXHR, textStatus) {
                    console.log( 'postAuth error' );
                    // console.log( 'response', response );
                    console.log( 'textStatus', textStatus );
                    console.log( 'jqXHR', jqXHR );

                    if ( callback && 'error' in callback ) {
                        callback.error(undefined, jqXHR, textStatus);
                    }
                }
            }).complete(function (jqXHR, textStatus) {
                // console.log( 'postAuth complete' );
                // console.log( 'response', response );
                // console.log( 'textStatus', textStatus );
                // console.log( 'jqXHR', jqXHR );

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
