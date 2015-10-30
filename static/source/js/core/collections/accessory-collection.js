var app = app || {};

(function () {
    'use strict';

    app.AccessoryCollection = Backbone.Collection.extend({
        model: app.Accessory,
        //  This emulates Array.splice. From Handsontable docs example
        splice: function (index, howMany) {
            var args = _.toArray(arguments).slice(2).concat({at: index});
            var removed = this.models.slice(index, index + howMany);

            this.remove(removed).add.apply(this, args);
            return removed;
        },
        initialize: function () {
            this.proxy_accessory = new app.Accessory();
        },
        getNameTitleHash: function (names) {
            return _.clone(this.proxy_accessory.getNameTitleHash(names));
        },
        getTitles: function (names) {
            return _.clone(this.proxy_accessory.getTitles(names));
        }
    });
})();
