var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryEntryCollection = Backbone.Collection.extend({
        model: app.OptionsDictionaryEntry,
        url: function () {
            return app.settings.get('api_base_path') + '/dictionaries/' +
                this.options.dictionary.get('id') + '/entries';
        },
        reorder_url: function () {
            return app.settings.get('api_base_path') + '/dictionaries/' +
                this.options.dictionary.get('id') + '/reorder_entries';
        },
        reorder_property_name: 'entries',
        parse: function (data) {
            return data.entries || data;

            // return _.map(data.dictionaries, function (dictionary) {
            //     var keys_to_omit = ['units'];

            //     return _.pick(dictionary, function (value, key) {
            //         return !_.isNull(value) && !_.contains(keys_to_omit, key);
            //     });
            // });
        },
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_entry = new app.OptionsDictionaryEntry(null, { proxy: true });

            //  When parent dictionary is fully loaded, we validate positions
            this.listenTo(this.options.dictionary, 'fully_loaded', this.validatePositions);
        }// ,
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
