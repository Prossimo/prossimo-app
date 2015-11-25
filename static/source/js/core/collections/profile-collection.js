var app = app || {};

(function () {
    'use strict';

    app.ProfileCollection = Backbone.Collection.extend({
        model: app.Profile,
        url: function () {
            return (this.options.api_base_path ? this.options.api_base_path : '') + '/profiles';
        },
        parse: function (data) {
            return _.map(data.profiles, function (profile) {
                return _.omit(profile, ['units']);
            });
        },
        //  This emulates Array.splice. From Handsontable docs example
        splice: function (index, how_many /* new_item_1, new_item_2, ... */) {
            var args = _.toArray(arguments).slice(2).concat({at: index});
            var removed = this.models.slice(index, index + how_many);

            this.remove(removed);
            this.add.apply(this, args);

            return removed;
        },
        initialize: function (options) {
            this.options = options || {};
            this.proxy_profile = new app.Profile(null, { proxy: true });
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
        },
        getNameTitleTypeHash: function (names) {
            return this.proxy_profile.getNameTitleTypeHash(names);
        },
        getTitles: function (names) {
            return this.proxy_profile.getTitles(names);
        },
        getUnitTypes: function () {
            return this.proxy_profile.getUnitTypes();
        }
    });
})();
