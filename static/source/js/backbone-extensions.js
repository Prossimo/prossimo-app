var app = app || {};

(function () {
    'use strict';

    _.extend(Backbone.Model.prototype, {
        //  On successful first save (via POST) we want to get ID of a newly
        //  created DB entity and assign it to our model
        saveAndGetId: function (key, val, options) {
            options = options || {};

            function processResponse(status, model, response) {
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
            if ( app && app.session && app.session.get('no_backend') === true || this.get('no_backend') === true ) {
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
        getMaxPosition: function () {
            var max = _.max(this.pluck('position'), null, this);

            return max > 0 ? max : 0;
        },
        comparator: function (item) {
            //  Special case is when multiple units with `position` = 0 exist
            //  which means our project was created before sorting features
            //  were introduced, so units had no `position` set
            var no_positions_state_flag = item.collection.length > 0 && item.collection.getMaxPosition() === 0;

            return no_positions_state_flag ? item.id : item.get('position');
        },
        savePositions: function (new_order) {
            var reorder_url = this.reorder_url();
            var reorder_property_name = this.reorder_property_name;
            var data_to_sync = {};

            if ( !reorder_url ) {
                throw new Error( 'Unable to save positions: reorder_url is not set for collection', this );
            }

            if ( !reorder_property_name ) {
                throw new Error( 'Unable to save positions: reorder_property_name is not set for collection', this );
            }

            data_to_sync[reorder_property_name] = new_order;

            this.sync('reorder', this, {
                url: reorder_url,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data_to_sync)
            });
        },
        validatePositions: function () {
            var invalid_flag = false;
            var proper_order = [];

            for ( var i = 0; i < this.length; i++ ) {
                var current_model = this.models[i];

                if ( current_model.id && current_model.get('position') !== i ) {
                    invalid_flag = true;
                    current_model.set('position', i, { silent: true });
                }

                if ( current_model.id ) {
                    proper_order.push(current_model.id);
                }
            }

            if ( invalid_flag ) {
                this.trigger('sort');

                if ( proper_order.length ) {
                    this.savePositions(proper_order);
                }
            }
        },
        //  Item at index N is moved before item with index M
        //  - if N > M, all items from M to N - 1 are moved right by 1
        //  - if N < M, all items from N + 1 to M are moved left by 1
        setItemPosition: function (index, new_index) {
            this.models.splice(new_index, 0, this.models.splice(index, 1)[0]);
            this.models[new_index].trigger('move');
            this.validatePositions();
        },
        //  Item at index N is replaces with item from index M, item at index M
        //  is replaced with item at position N, all other items are unaffected
        swapItems: function (index1, index2) {
            this.models[index1] = this.models.splice(index2, 1, this.models[index1])[0];
            this.models[index1].trigger('swap');
            this.models[index2].trigger('swap');
            this.validatePositions();
        },
        moveItemUp: function (model) {
            var index = this.indexOf(model);

            if ( index > 0 ) {
                this.setItemPosition(index, index - 1);
            }
        },
        moveItemDown: function (model) {
            var index = this.indexOf(model);

            if ( index >= 0 && index < this.length - 1 ) {
                this.setItemPosition(index, index + 1);
            }
        }
    });
})();
