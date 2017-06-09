import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';

import User from './user';
import App from '../../main';
import { globalChannel } from '../../utils/radio';

//  Monkey-patch Backbone.Sync to include auth token with every request
//  TODO: is this a good place to store this function? What if we move it
//  to a separate file or something
const backboneSync = Backbone.sync;

Backbone.sync = function patchedBackboneSync(method, model, options) {
    const token = window.localStorage.getItem('authToken');
    const errorCallback = options.error;
    const sync_options = options;

    sync_options.error = function syncError(xhr, textStatus, errorThrown) {
        //  We just received an 401 Unauthorized response. This means our
        //  current token does not work any longer
        if (textStatus === 'error' && xhr.status === 401) {
            globalChannel.trigger('auth:error');
        }

        //  This is the same thing they do in the original Backbone.Sync
        if (errorCallback) {
            sync_options.textStatus = textStatus;
            sync_options.errorThrown = errorThrown;
            errorCallback.call(sync_options.context, xhr, textStatus, errorThrown);
        }
    };

    if (token) {
        sync_options.headers = {
            Authorization: `Bearer ${token}`,
        };
    }

    //  Call the original function
    backboneSync(method, model, sync_options);
};

export default Backbone.Model.extend({
    defaults: {
        no_backend: false,
        is_initial: true,
        is_logged_in: false,
        token_expired: false,
    },
    initialize() {
        const self = this;

        this.user = new User();

        this.listenTo(globalChannel, 'auth:error', this.onAuthError);
        this.listenTo(globalChannel, 'auth:logout', this.onAuthLogout);

        //  Check auth status each 15 minutes
        setInterval(() => {
            if (self.get('is_logged_in') === true && self.get('no_backend') === false) {
                self.checkAuth();
            }
        }, 1000 * 60 * 15);
    },
    updateSessionUser(user_data) {
        this.user.set(_.pick(user_data, _.keys(this.user.defaults)));
    },
    resetSessionUser() {
        this.user.reset();
    },
    onAuthError() {
        window.localStorage.removeItem('authToken');

        if (this.get('is_initial') === false) {
            this.set('token_expired', true);
        }

        App.dialogs.showDialog('login');
    },
    onAuthLogout() {
        App.dialogs.showDialog('login');
    },
    // Contact server to see if it thinks that user is logged in
    checkAuth(callback) {
        const self = this;
        const d = $.Deferred();

        this.fetch({
            url: `${App.settings.get('api_base_path')}/users/current`,
            success(model, response) {
                if (!response.error && response.user) {
                    self.updateSessionUser(response.user);
                    self.set({
                        is_logged_in: true,
                        token_expired: false,
                    });

                    if (self.get('is_initial') === true) {
                        self.set('is_initial', false);
                        globalChannel.trigger('auth:initial_login');
                    } else {
                        globalChannel.trigger('auth:login');
                    }
                } else {
                    self.set({ is_logged_in: false });
                }

                if (callback && 'success' in callback) {
                    callback.success(response);
                }

                d.resolve(model, response);
            },
            error(model, response) {
                self.set({ is_logged_in: false });

                //  Status === 0 means no connection
                if (response.status === 0 && self.get('is_initial') === true) {
                    self.set('no_backend', true);
                    globalChannel.trigger('auth:no_backend');
                }

                if (callback && 'error' in callback) {
                    callback.error(response);
                }

                d.resolve(model, response);
            },
        });

        d.done((model, response) => {
            if (callback && 'complete' in callback) {
                callback.complete(response);
            }
        });
    },
    postAuth(opts, callback) {
        const self = this;

        $.ajax({
            url: `${App.settings.get('api_base_path')}/login_check`,
            contentType: 'application/json',
            dataType: 'json',
            type: 'POST',
            data: JSON.stringify({
                _username: opts.username,
                _password: opts.password,
            }),
            success(response, textStatus, jqXHR) {
                if (!response.error && 'token' in response) {
                    if (opts.method === 'login') {
                        window.localStorage.setItem('authToken', response.token);
                        self.checkAuth(callback);
                    } else {
                        self.set({ is_logged_in: false });

                        if (callback && 'success' in callback) {
                            callback.success(response);
                        }
                    }
                } else if (callback && 'error' in callback) {
                    callback.error(response, jqXHR, textStatus);
                }
            },
            error(jqXHR, textStatus) {
                if (callback && 'error' in callback) {
                    callback.error(undefined, jqXHR, textStatus);
                }
            },
        }).complete((jqXHR, textStatus) => {
            if (callback && 'complete' in callback) {
                callback.complete(jqXHR, textStatus);
            }
        });
    },
    login(opts, callback) {
        this.postAuth(_.extend(opts, { method: 'login' }), callback);
    },
    logout() {
        window.localStorage.removeItem('authToken');
        this.set({ is_logged_in: false });
        this.resetSessionUser();
        globalChannel.trigger('auth:logout');
    },
});
