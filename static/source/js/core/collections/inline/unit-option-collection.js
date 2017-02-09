var app = app || {};

(function () {
    'use strict';

    app.UnitOptionCollection = Backbone.Collection.extend({
        model: app.UnitOption,
        //  We sort items not by dictionary id, but by the order of
        //  dictionaries in their respective collection
        comparator: function (item) {
            var corresponding_dictionary = app.settings && app.settings.dictionaries &&
                app.settings.dictionaries.get(item.get('dictionary_id'));

            return corresponding_dictionary ? corresponding_dictionary.get('position') : Infinity;
        },
        getByDictionaryId: function (dictionary_id) {
            return this.findWhere({ dictionary_id: dictionary_id });
        }
    });
})();
