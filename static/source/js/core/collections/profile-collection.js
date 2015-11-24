var app = app || {};

(function () {
    'use strict';

    app.ProfileCollection = Backbone.Collection.extend({
        model: app.Profile,
        //  This emulates Array.splice. From Handsontable docs example
        splice: function (index, how_many /* new_item_1, new_item_2, ... */) {
            var args = _.toArray(arguments).slice(2).concat({at: index});
            var removed = this.models.slice(index, index + how_many);

            this.remove(removed);
            this.add.apply(this, args);

            return removed;
        },
        initialize: function () {
            this.proxy_profile = new app.Profile(null, { proxy: true });
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
