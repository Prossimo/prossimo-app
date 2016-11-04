var app = app || {};

(function () {
    'use strict';

    app.FillingTypeCollection = Backbone.Collection.extend({
        model: app.FillingType,
        reorder_property_name: 'filling_types',
        url: function () {
            return (this.options.api_base_path ? this.options.api_base_path : '') + '/fillingtypes';
        },
        reorder_url: function () {
            return (this.options.api_base_path ? this.options.api_base_path : '') + '/reorder_fillingtypes';
        },
        parse: function (data) {
            return data.filling_types || data;
        },
        getMaxPosition: function () {
            var filtered = _.map(this.filter(function (model) {
                return model.get('is_base_type') === false;
            }), function (model) {
                return model.get('position');
            });
            var max = _.max(filtered, null, this);

            return max > 0 ? max : 0;
        },
        comparator: function (item) {
            var no_positions_state_flag = item.collection.length > 0 && item.collection.getMaxPosition() === 0;
            var is_base_type_flag = item.get('is_base_type');

            return is_base_type_flag ? 9999 :
                (no_positions_state_flag ? item.id : item.get('position'));
        },
        getBaseTypes: function () {
            return this.proxy_type.getBaseTypes();
        },
        appendBaseTypes: function () {
            var base_types = [];

            _.each(this.getBaseTypes(), function (item) {
                base_types.push(new app.FillingType({
                    name: item.title,
                    type: item.name,
                    weight_per_area: item.weight_per_area,
                    is_base_type: true,
                    no_backend: true
                }));
            }, this);

            this.add(base_types, { silent: true });
        },
        getNameTitleTypeHash: function (names) {
            return this.proxy_type.getNameTitleTypeHash(names);
        },
        getTitles: function (names) {
            return this.proxy_type.getTitles(names);
        },
        getTypeTitle: function (name) {
            return this.findWhere({ name: name }).get('title') || this.proxy_type.getBaseTypeTitle(name);
        },
        //  TODO: why this works by cid?
        getFillingTypeById: function (cid) {
            return this.get(cid);
        },
        //  TODO: rename to `getByName`
        getFillingTypeByName: function (name) {
            return this.findWhere({ name: name });
        },
        getAvailableFillingTypes: function () {
            return this.models;
        },
        //  TODO: rename to `getNames` or smth similar
        getAvailableFillingTypeNames: function () {
            return this.models.map(function (item) {
                return item.get('name');
            });
        },
        getAvailableForProfile: function (profile_id) {
            return this.models.filter(function (item) {
                return item.isAvailableForProfile(profile_id);
            }, this);
        },
        getDefaultForProfile: function (profile_id) {
            var available_items = this.getAvailableForProfile(profile_id);

            var default_item = _.find(available_items, function (item) {
                return item.isDefaultForProfile(profile_id);
            });

            return default_item || undefined;
        },
        //  We go over all profiles and make sure we only have one default
        //  filling type per profile. If not, the first one wins.
        //  This is executed on collection load
        validatePerProfileDefaults: function () {
            var profiles = app.settings && app.settings.profiles;

            profiles.each(function (profile) {
                var profile_id = profile.id;
                var all_items = this.getAvailableForProfile(profile_id);
                var default_item = this.getDefaultForProfile(profile_id);
                var non_default_items = _.filter(all_items, function (item) {
                    return item !== default_item;
                }, this);

                //  Iterate over non default items and make sure they're
                //  set as non fefault. If all's fine, no requests are fired
                if ( all_items && default_item && non_default_items ) {
                    _.each(non_default_items, function (item) {
                        var item_profiles = item.get('profiles');
                        var connection = _.findWhere(item_profiles, { id: profile_id });

                        if ( connection.is_default === true ) {
                            connection.is_default = false;
                            item.persist('profiles', item_profiles);
                        }
                    }, this);
                }
            }, this);
        },
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_type = new app.FillingType(null, { proxy: true });
            this.appendBaseTypes();
        }
    });
})();
