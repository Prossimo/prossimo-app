var app = app || {};

(function () {
    'use strict';

    app.ProfileCollection = Backbone.Collection.extend({
        model: app.Profile,
        //  This emulates Array.splice. From Handsontable docs example
        splice: function (index, howMany) {
            var args = _.toArray(arguments).slice(2).concat({at: index});
            var removed = this.models.slice(index, index + howMany);

            this.remove(removed).add.apply(this, args);
            return removed;
        },
        initialize: function () {
            this.proxy_profile = new app.Profile();
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
