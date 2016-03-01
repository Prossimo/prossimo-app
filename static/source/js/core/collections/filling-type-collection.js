var app = app || {};

(function () {
    'use strict';

    app.FillingTypeCollection = Backbone.Collection.extend({
        model: app.FillingType,
        url: function () {
            return (this.options.api_base_path ? this.options.api_base_path : '') + '/fillingtypes';
        },
        reorder_url: function () {
            return (this.options.api_base_path ? this.options.api_base_path : '') + '/reorder_fillingtypes';
        },
        reorder_property_name: 'filling_types',
        parse: function (data) {
            return _.map(data.filling_types, function (filling_type) {
                return _.omit(filling_type, ['units']);
            });
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
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_type = new app.FillingType(null, { proxy: true });
            this.appendBaseTypes();
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
        }
    });
})();
