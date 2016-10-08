var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryEntryCollection = Backbone.Collection.extend({
        model: app.OptionsDictionaryEntry,
        reorder_property_name: 'entries',
        url: function () {
            return app.settings.get('api_base_path') + '/dictionaries/' +
                this.options.dictionary.get('id') + '/entries';
        },
        reorder_url: function () {
            return app.settings.get('api_base_path') + '/dictionaries/' +
                this.options.dictionary.get('id') + '/reorder_entries';
        },
        parse: function (data) {
            //  We do this check to avoid confusion with native JS
            //  Array.prototype.etries() method
            return !_.isArray(data) && data.entries ? data.entries : data;
        },
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_entry = new app.OptionsDictionaryEntry(null, { proxy: true });

            //  When parent dictionary is fully loaded, we validate positions
            this.listenTo(this.options.dictionary, 'fully_loaded', this.validatePositions);
        },
        getNameTitleTypeHash: function (names) {
            return this.proxy_entry.getNameTitleTypeHash(names);
        },
        getTitles: function (names) {
            return this.proxy_entry.getTitles(names);
        },
        getAttributeType: function () {
            return this.proxy_entry.getAttributeType();
        }
    });
})();
