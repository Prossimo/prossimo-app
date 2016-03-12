var app = app || {};

(function () {
    'use strict';

    //  Monkey-patch Backbone.Sync to include auth token with every request
    //  TODO: is this a good place to store this function? What if we move it
    //  to a separate file or something
    var backboneSync = Backbone.sync;

    Backbone.sync = function (method, model, options) {
        var token = window.localStorage.getItem('authToken');
        var errorCallback = options.error;

        options.error = function (xhr, textStatus, errorThrown) {
            //  We just received an 401 Unauthorized response. This means our
            //  current token does not work any longer
            if ( textStatus === 'error' && xhr.status === 401 ) {
                app.vent.trigger('auth:error');
            }

            //  This is the same thing they do in the original Backbone.Sync
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
            no_backend: false,
            is_initial: true,
            is_logged_in: false,
            token_expired: false
        },
        initialize: function () {
            var self = this;

            this.user = new app.User();

            this.listenTo(app.vent, 'auth:error', this.onAuthError);
            this.listenTo(app.vent, 'auth:logout', this.onAuthLogout);

            //  Check auth status each 15 minutes
            setInterval(function () {
                if ( self.get('is_logged_in') === true && self.get('no_backend') === false ) {
                    self.checkAuth();
                }
            }, 1000 * 60 * 15);
        },
        updateSessionUser: function (user_data) {
            this.user.set(_.pick(user_data, _.keys(this.user.defaults)));
        },
        resetSessionUser: function () {
            this.user.reset();
        },
        onAuthError: function () {
            window.localStorage.removeItem('authToken');

            if ( this.get('is_initial') === false ) {
                this.set('token_expired', true);
            }

            app.dialogs.showDialog('login');
        },
        onAuthLogout: function () {
            app.dialogs.showDialog('login');
        },
        // Contact server to see if it thinks that user is logged in
        checkAuth: function (callback) {
            var self = this;
            var d = $.Deferred();

            this.fetch({
                url: app.settings.get('api_base_path') + '/users/current',
                success: function (model, response) {
                    if ( !response.error && response.user ) {
                        self.updateSessionUser(response.user);
                        self.set({
                            is_logged_in: true,
                            token_expired: false
                        });

                        if ( self.get('is_initial') === true ) {
                            self.set('is_initial', false);
                            app.vent.trigger('auth:initial_login');
                        } else {
                            app.vent.trigger('auth:login');
                        }
                    } else {
                        self.set({ is_logged_in: false });
                    }

                    if ( callback && 'success' in callback) {
                        callback.success(response);
                    }

                    d.resolve(model, response);
                }, error: function (model, response) {
                    self.set({ is_logged_in: false });

                    //  Status === 0 means no connection
                    if ( response.status === 0 && self.get('is_initial') === true ) {
                        self.set('no_backend', true);
                        app.vent.trigger('auth:no_backend');
                    }

                    if ( callback && 'error' in callback ) {
                        callback.error(response);
                    }

                    d.resolve(model, response);
                }
            });

            d.done(function (model, response) {
                if ( callback && 'complete' in callback ) {
                    callback.complete(response);
                }
            });
        },
        postAuth: function (opts, callback) {
            var self = this;

            $.ajax({
                url: app.settings.get('api_base_path') + '/login_check',
                contentType: 'application/json',
                dataType: 'json',
                type: 'POST',
                data: JSON.stringify({
                    _username: opts.username,
                    _password: opts.password
                }),
                success: function (response, textStatus, jqXHR) {
                    if ( !response.error && 'token' in response ) {
                        if ( opts.method === 'login' ) {
                            window.localStorage.setItem('authToken', response.token);
                            self.checkAuth(callback);
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
        logout: function () {
            window.localStorage.removeItem('authToken');
            this.set({ is_logged_in: false });
            this.resetSessionUser();
            app.vent.trigger('auth:logout');
        }
    });
})();
