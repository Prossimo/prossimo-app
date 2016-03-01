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
            console.log( 'getmaxposition', this );
            var max = _.max(this.pluck('position'), null, this);

            console.log( 'collection length', this.length );
            console.log( this.pluck('position') );
            console.log( 'collection max', max );

            return max > 0 ? max : 0;
        },
        // setNewItemPosition: function (model, collection, options) {
        //     console.log( 'setNewItemPosition' );

        //     console.log( 'model', model );
        //     console.log( 'collection', collection );
        //     console.log( 'options', options );

        //     model.set('position', collection.length ? collection.getMaxPosition() + 1 : 0);
        // },
        // comparator: function (item) {
        //     //  Special case is when multiple units with `position` = 0 exist
        //     //  which means our project was created before sorting features
        //     //  were introduced, so units had no `position` set
        //     var no_positions_state_flag = this.length > 0 && this.getMaxPosition() === 0;

        //     return no_positions_state_flag ? item.id : item.get('position');
        // },
        savePositions: function (new_order) {
            var reorder_url = this.reorder_url();
            var property_name = this.property_name;
            var data_to_sync = {};

            if ( !reorder_url ) {
                throw new Error( 'Unable to save positions: reorder_url is not set for collection', this );
            }

            if ( !property_name ) {
                throw new Error( 'Unable to save positions: property_name is not set for collection', this );
            }

            data_to_sync[property_name] = new_order;

            console.log( 'saving positions', new_order );

            this.sync('reorder', this, {
                url: reorder_url,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data_to_sync)
            });
        },
        //  TODO: how to deal with the existing order of units in projects? It
        //  could be messy after we roll out this feature initially
        validatePositions: function () {
            console.log( 'validate positions for collection', this );
            var invalid_flag = false;
            var proper_order = [];

            this.each(function (item) {
                console.log( 'id', item.id );
                console.log( 'position', item.get('position') );
            }, this);

            // var no_positions_state_flag = this.length > 0 && this.getMaxPosition() === 0;

            // console.log( 'no_positions_state_flag', no_positions_state_flag );

            //  TODO: what to do with items that has no id yet? In which cases
            //  this could possibly happen?
            for ( var i = 0; i < this.length; i++ ) {
                var current_model = this.models[i];

                if ( current_model.get('position') !== i ) {
                    console.log( 'model ' + current_model.id + ' position is ' + current_model.get('position') +
                        ' while it should be ' + i );
                    invalid_flag = true;
                    current_model.set('position', i, { silent: true });
                }

                proper_order.push(current_model.id);
            }

            // proper_order.push(current_model.id);

            console.log( 'invalid flag', invalid_flag );

            if ( invalid_flag ) {
                console.log( 'positions were invalid, force new order', proper_order );
                this.trigger('sort');
                this.savePositions(proper_order);
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
