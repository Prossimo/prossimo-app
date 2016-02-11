var app = app || {};

(function () {
    'use strict';

    function getUserDefaults() {
        return {
            email: '',
            username: '',
            roles: []
        };
    }

    app.User = Backbone.Model.extend({
        defaults: getUserDefaults(),
        reset: function () {
            this.set(getUserDefaults());
        }
    });
})();
