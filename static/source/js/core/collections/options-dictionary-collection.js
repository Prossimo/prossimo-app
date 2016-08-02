var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryCollection = Backbone.Collection.extend({
        model: app.OptionsDictionary,
        url: function () {
            return (this.options.api_base_path ? this.options.api_base_path : '') + '/dictionaries';
        },
        reorder_url: function () {
            return (this.options.api_base_path ? this.options.api_base_path : '') + '/reorder_dictionaries';
        },
        reorder_property_name: 'dictionaries',
        parse: function (data) {
            return data.dictionaries || data;

            // return _.map(data.dictionaries, function (dictionary) {
            //     var keys_to_omit = ['units'];

            //     return _.pick(dictionary, function (value, key) {
            //         return !_.isNull(value) && !_.contains(keys_to_omit, key);
            //     });
            // });
        },
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_dictionary = new app.OptionsDictionary(null, { proxy: true });
        },
        // getNameTitleTypeHash: function (names) {
        //     return this.proxy_dictionary.getNameTitleTypeHash(names);
        // },
        // getTitles: function (names) {
        //     return this.proxy_dictionary.getTitles(names);
        // },
        // getUnitTypes: function () {
        //     return this.proxy_dictionary.getUnitTypes();
        // }
    });
})();
