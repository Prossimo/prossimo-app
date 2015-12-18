var app = app || {};

(function () {
    'use strict';

    app.FillingTypeCollection = Backbone.Collection.extend({
        model: app.FillingType,
        url: function () {
            return (this.options.api_base_path ? this.options.api_base_path : '') + '/fillingtypes';
        },
        parse: function (data) {
            return _.map(data.filling_types, function (filling_type) {
                return _.omit(filling_type, ['units']);
            });
        },
        comparator: function (item) {
            return item.id;
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
                    is_base_type: true
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
