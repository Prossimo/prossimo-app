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
            this.listenTo(this.options.dictionary, 'fully_loaded', this.validateDefaultEntries);
        },
        getNameTitleTypeHash: function (names) {
            return this.proxy_entry.getNameTitleTypeHash(names);
        },
        getTitles: function (names) {
            return this.proxy_entry.getTitles(names);
        },
        getAttributeType: function () {
            return this.proxy_entry.getAttributeType();
        },
        getEntriesAvailableForProfile: function (profile_id) {
            return this.models.filter(function (entry) {
                return entry.isAvailableForProfile(profile_id);
            }, this);
        },
        getDefaultEntryForProfile: function (profile_id) {
            var available_entries = this.getEntriesAvailableForProfile(profile_id);

            var default_entry = _.find(available_entries, function (entry) {
                return entry.isDefaultForProfile(profile_id);
            });

            return default_entry || undefined;
        },
        //  We go over all profiles and make sure we only have one default
        //  entry per profile per each dictionary. If not, the first one wins
        validateDefaultEntries: function () {
            var profiles = app.settings && app.settings.profiles;

            profiles.each(function (profile) {
                var profile_id = profile.id;
                var all_entries = this.getEntriesAvailableForProfile(profile_id);
                var default_entry = this.getDefaultEntryForProfile(profile_id);
                var non_default_entries = _.filter(all_entries, function (entry) {
                    return entry !== default_entry;
                }, this);

                //  Iterate over non default entries and make sure they're
                //  set as non fefault. If all's fine, no requests are fired
                if ( all_entries && default_entry && non_default_entries ) {
                    _.each(non_default_entries, function (entry) {
                        var entry_profiles = entry.get('profiles');
                        var connection = _.findWhere(entry_profiles, { id: profile_id });

                        if ( connection.is_default === true ) {
                            connection.is_default = false;
                            entry.persist('profiles', entry_profiles);
                        }
                    }, this);
                }
            }, this);
        }
    });
})();
