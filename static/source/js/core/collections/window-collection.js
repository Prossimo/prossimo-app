var app = app || {};

(function () {
    'use strict';

    app.WindowCollection = Backbone.Collection.extend({
        model: app.Window,
        //  This emulates Array.splice. From Handsontable docs example
        splice: function (index, howMany) {
            var args = _.toArray(arguments).slice(2).concat({at: index});
            var removed = this.models.slice(index, index + howMany);

            this.remove(removed).add.apply(this, args);
            return removed;
        }
    });
})();
