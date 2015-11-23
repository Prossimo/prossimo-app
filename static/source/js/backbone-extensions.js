var app = app || {};

(function () {
    'use strict';

    //  On successful first save (via POST) we want to get ID of a newly
    //  created DB entity and assign it to our model
    Backbone.Model.prototype.saveAndGetId = function (key, val, options) {
        options = options || {};

        function processResponse (status, model, response) {
            var location_string = response.getResponseHeader('Location');
            var pattern = /=(\d+)/;
            var match;
            var new_id;

            if ( parseInt(response.status, 10) === 201 && location_string ) {
                if ( pattern.test(location_string) ) {
                    match = pattern.exec(location_string);
                    new_id = match[1];
                }
            }

            if ( new_id ) {
                model.set({ id: new_id });
            }
        }

        if ( this.isNew() ) {
            options.success = function (model, response) {
                processResponse('success', model, response);
            };

            options.error = function (model, response) {
                processResponse('error', model, response);
            };
        }

        return Backbone.Model.prototype.save.call(this, key, val, options);
    };

    //  Don't save anything if we have special flag on `app`
    Backbone.Model.prototype.persist = function () {
        if ( app && app.no_backend ) {
            this.set.apply(this, arguments);
        } else {
            this.save.apply(this, arguments);
        }
    };
})();
