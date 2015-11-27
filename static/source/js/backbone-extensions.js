var app = app || {};

(function () {
    'use strict';

    _.extend(Backbone.Model.prototype, {
        //  On successful first save (via POST) we want to get ID of a newly
        //  created DB entity and assign it to our model
        saveAndGetId: function (key, val, options) {
            options = options || {};

            function processResponse (status, model, response) {
                var location_string = response.getResponseHeader('Location');
                var pattern = /(\d+)$/;
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
        },
        //  Don't save anything if we have special flag on `app` or an attribute
        persist: function () {
            if ( app && app.no_backend || this.get('no_backend') === true ) {
                this.set.apply(this, arguments);
            } else {
                this.save.apply(this, arguments);
            }
        }
    });

    _.extend(Backbone.Collection.prototype, {
        //  This emulates Array.splice. From Handsontable docs example
        splice: function (index, how_many /* new_item_1, new_item_2, ... */) {
            var args = _.toArray(arguments).slice(2).concat({at: index});
            var removed = this.models.slice(index, index + how_many);

            this.remove(removed);
            this.add.apply(this, args);

            return removed;
        },
        swapItems: function (index1, index2) {
            this.models[index1] = this.models.splice(index2, 1, this.models[index1])[0];
            this.trigger('swap');
        },
        moveItemUp: function (model) {
            var index = this.indexOf(model);

            if ( index > 0 ) {
                this.swapItems(index, index - 1);
            }
        },
        moveItemDown: function (model) {
            var index = this.indexOf(model);

            if ( index >= 0 && index < this.length - 1 ) {
                this.swapItems(index, index + 1);
            }
        }
    });

})();
