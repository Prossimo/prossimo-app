import _ from 'underscore';
import $ from 'jquery';
import Backbone from 'backbone';
import clone from 'clone';

import App from '../main';

const oldModelSave = Backbone.Model.prototype.save;
const sync = Backbone.sync;

//  This is a workaround for $.ajax triggering "parseerror" with successful
//  CREATE calls to our API, since such calls return empty body which is
//  not expected by a JSON parser
$.ajaxSetup({
    dataFilter(rawData, type) {
        if (!rawData && type === 'json') {
            return null;
        }

        return rawData;
    },
});

_.extend(Backbone.Model.prototype, {
    //  On successful first save (via POST) we want to get ID of a newly
    //  created DB entity and assign this ID to our model
    save(key, val, options) {
        let current_options = clone(options) || {};

        //  Mostly to play nice with undo manager
        if (key === null || (typeof key === 'object' && val)) {
            current_options = val;
        }

        function processResponse(model, response) {
            const location_string = response.getResponseHeader('Location');
            const pattern = /(\d+)$/;
            let match;
            let new_id;

            if (parseInt(response.status, 10) === 201 && location_string) {
                if (pattern.test(location_string)) {
                    match = pattern.exec(location_string);
                    new_id = match[1];
                }
            }

            if (new_id) {
                model.set({ id: parseInt(new_id, 10) });
            }
        }

        if (this.isNew()) {
            const successCallback = current_options.success;

            current_options.success = function saveSuccessCallback(model, response, backboneOptions) {
                let success_response = response;

                if (success_response === null) {
                    success_response = backboneOptions && backboneOptions.xhr;
                }

                processResponse(model, success_response);

                if (successCallback) {
                    successCallback.call(backboneOptions.context, model, success_response, backboneOptions);
                }
            };
        }

        return oldModelSave.call(this, key, val, current_options);
    },
    //  Don't save anything if we have special flag on `app` or an attribute
    persist(...args) {
        if ((App && App.session && App.session.get('no_backend') === true) || this.get('no_backend') === true) {
            return this.set(...args);
        }

        return this.save(...args);
    },
    //  TODO: test that cloned item doesn't share any objects with the
    //  source item by reference
    duplicate(options) {
        if (this.isNew() && this.hasOnlyDefaultAttributes()) {
            throw new Error('Item could not be cloned: it has only default attributes, create a new one instead');
        }

        //  TODO: rework this so model name is obtained from model
        //  attributes, not via options
        const default_options = {
            model_name: '',
            fetch_after_saving: false,
            attributes_to_omit: [],
            extra_attributes: {},
        };
        const current_options = _.extend({}, default_options, clone(options));

        function getClonedItemName(name, name_attr, collection) {
            const default_name = current_options.model_name ? `New ${current_options.model_name}` : 'New';
            let old_name = name ? name.replace(/\s*\(copy#(\d+)\)/, '') : default_name;
            const possible_names = _.filter(collection.pluck(name_attr), value => value.indexOf(old_name) !== -1, this);
            const pattern = /(.*\S)\s*(\(copy#(\d+)\))/;
            let new_name = `${old_name} (copy#1)`;
            let max_index = 0;

            _.each(possible_names, (item) => {
                if (pattern.test(item)) {
                    const match = pattern.exec(item);
                    const current_index = parseInt(match[3], 10);

                    old_name = match[1];
                    max_index = current_index > max_index ? current_index : max_index;
                }
            }, this);

            if (max_index > 0) {
                new_name = `${old_name} (copy#${max_index + 1})`;
            }

            return new_name;
        }

        if (this.collection) {
            const name_attr = this.getNameAttribute();
            let cloned_attributes = _.omit(this.toJSON(), _.union(current_options.attributes_to_omit, ['id']));

            cloned_attributes[name_attr] = getClonedItemName(this.get(name_attr), name_attr, this.collection);
            cloned_attributes = _.extend({}, cloned_attributes, current_options.extra_attributes);

            const new_object = this.collection.add(clone(cloned_attributes), { parse: true });
            let persist_options = {
                validate: true,
                parse: true,
                wait: true,
            };

            if (current_options.fetch_after_saving) {
                persist_options = _.extend({}, persist_options, {
                    success() {
                        new_object.fetch();
                    },
                });
            }

            new_object.persist({}, persist_options);
        } else {
            throw new Error('Item could not be cloned: it does not belong to any collection');
        }
    },
    // Ghost attributes are regular Backbone attributes with placeholder values that will be replaced with real
    // values when those become available. Use ghost attributes to avoid async calls and waiting for backend response:
    // First, add a ghost attribute and specify its placeholder value.
    // Then, each time you derive data from that attribute and that data needs to be rewritten when real attribute
    // value arrives, add a rewriter function.
    // Accumulated functions will be called in order when the real value arrives and the attribute stops being a ghost.
    /**
     * Ghost attribute metadata container.
     */
    _ghosts: {},
    /**
     * Adds a Backbone attribute and marks it as a ghost.
     *
     * @param {string} attr - Attribute name
     * @param {*} value - Attribute placeholder value
     */
    addGhostAttribute(attr, value) {
        this.set(attr, value);
        this._ghosts[attr] = {
            rewriters: [],
        };

        this.once(`change:${attr}`, this.deghostify.bind(this, attr));
    },
    /**
     * Adds a rewriter function to the list of rewriters for the ghost attribute.
     *
     * @param {string} attr - Ghost attribute name
     * @param {Backbone.Model~ghostRewriter} rewriter - Function to handle rewriting of ghost-derived data
     */
    addGhostRewriter(attr, rewriter) {
        if (!this.isGhost(attr)) { return; }

        this._ghosts[attr].rewriters.push(rewriter);
    },
    /**
     * Rewriter function runs when a ghost attribute is assigned its real value.
     *
     * @callback Backbone.Model~ghostRewriter
     * @param {*} value - Newly arrived real attribute value
     */
    /**
     * Determines whether a given Backbone attribute is (still) a ghost.
     *
     * @param {string} attr - Attribute name
     */
    isGhost(attr) {
        return !!this._ghosts[attr];
    },
    /**
     * Removes ghost metadata for an attribute and runs associated rewriters.
     *
     * @param {string} attr - Attribute name
     */
    deghostify(attr) {
        if (!this.isGhost(attr)) { return; }

        const newValue = this.get(attr);

        this._ghosts[attr].rewriters.forEach(rewriter => rewriter(newValue));

        delete this._ghosts[attr];

        return newValue;
    },
});

_.extend(Backbone.Collection.prototype, {
    //  This emulates Array.splice. From Handsontable docs example
    splice(index, how_many, ...new_items) {
        const removed = this.models.slice(index, index + how_many);

        this.remove(removed);
        this.add(...new_items);

        return removed;
    },
    getMaxPosition() {
        const max = _.max(this.pluck('position'), null, this);

        return max > 0 ? max : 0;
    },
    comparator(item) {
        //  Special case is when multiple units with `position` = 0 exist
        //  which means our project was created before sorting features
        //  were introduced, so units had no `position` set
        const no_positions_state_flag = item.collection.length > 0 && item.collection.getMaxPosition() === 0;

        return no_positions_state_flag ? item.id : item.get('position');
    },
    savePositions(new_order) {
        const reorder_url = this.reorder_url();
        const reorder_property_name = this.reorder_property_name;
        const data_to_sync = {};

        if (!reorder_url) {
            throw new Error('Unable to save positions: reorder_url is not set for collection', this);
        }

        if (!reorder_property_name) {
            throw new Error('Unable to save positions: reorder_property_name is not set for collection', this);
        }

        data_to_sync[reorder_property_name] = new_order;

        this.sync('reorder', this, {
            url: reorder_url,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data_to_sync),
        });
    },
    validatePositions() {
        let invalid_flag = false;
        const proper_order = [];

        for (let i = 0; i < this.length; i += 1) {
            const current_model = this.models[i];

            if (current_model.id && current_model.get('position') !== i) {
                invalid_flag = true;
                current_model.set('position', i, { silent: true });
            }

            if (current_model.id) {
                proper_order.push(current_model.id);
            }
        }

        if (invalid_flag) {
            this.trigger('sort');

            if (proper_order.length && App.session && App.session.get('no_backend') !== true) {
                this.savePositions(proper_order);
            }
        }
    },
    //  Item at index N is moved before item with index M
    //  - if N > M, all items from M to N - 1 are moved right by 1
    //  - if N < M, all items from N + 1 to M are moved left by 1
    setItemPosition(index, new_index) {
        this.models.splice(new_index, 0, this.models.splice(index, 1)[0]);
        this.models[new_index].trigger('move');
        this.validatePositions();
    },
    //  Item at index N is replaces with item from index M, item at index M
    //  is replaced with item at position N, all other items are unaffected
    swapItems(index1, index2) {
        this.models[index1] = this.models.splice(index2, 1, this.models[index1])[0];
        this.models[index1].trigger('swap');
        this.models[index2].trigger('swap');
        this.validatePositions();
    },
    moveItemUp(model) {
        const index = this.indexOf(model);

        if (index > 0) {
            this.setItemPosition(index, index - 1);
        }
    },
    moveItemDown(model) {
        const index = this.indexOf(model);

        if (index >= 0 && index < this.length - 1) {
            this.setItemPosition(index, index + 1);
        }
    },
});

//  When a new request is fired and an old request is still in progress,
//  the old one would be stopped
//  Source: https://github.com/amccloud/backbone-safesync
Backbone.sync = function safeSync(method, model, options) {
    const synced_model = model;
    const lastXHR = synced_model._lastXHR && synced_model._lastXHR[method];

    if ((lastXHR && lastXHR.readyState !== 4) && (options && options.safe !== false)) {
        lastXHR.abort('stale');
    }

    if (!synced_model._lastXHR) {
        synced_model._lastXHR = {};
    }

    const resp = sync(method, synced_model, options);
    synced_model._lastXHR[method] = resp;

    return resp;
};
