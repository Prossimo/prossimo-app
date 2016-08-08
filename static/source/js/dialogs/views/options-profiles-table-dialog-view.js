var app = app || {};

(function () {
    'use strict';

    app.OptionsProfilesTableDialogView = app.BaseDialogView.extend({
        className: 'options-profiles-table-modal modal fade',
        template: app.templates['dialogs/options-profiles-table-dialog-view'],
        ui: {
            $hot_container: '.handsontable-container'
        },
        //  TODO: optimize so per-entry values are persisted all at once
        onDataChange: function (changes_array) {
            var profiles = app.settings.profiles;
            var entries = this.options.active_entry.collection;

            _.each(changes_array, function (change) {
                var profile_index = change[0];
                var entry_index = change[1];
                var new_value = change[3];

                var profile = profiles.at(profile_index);
                var entry = entries.at(entry_index);
                var old_profiles_list;
                var new_profiles_list;

                if ( new_value === false || new_value === 'false' ) {
                    old_profiles_list = entry.get('profiles');
                    new_profiles_list = _.without(old_profiles_list, profile.id);
                    new_profiles_list.sort();
                } else if ( new_value === true || new_value === 'true' ) {
                    old_profiles_list = entry.get('profiles');
                    new_profiles_list = _.union(old_profiles_list, [profile.id]);
                    new_profiles_list.sort();
                }

                if ( old_profiles_list !== new_profiles_list ) {
                    entry.persist('profiles', new_profiles_list);
                }
            }, this);
        },
        createData: function () {
            var profiles = app.settings.profiles;
            var entries = this.options.active_entry.collection;

            return {
                rowHeaders: profiles.map(function (profile) {
                    return profile.get('name');
                }),
                colHeaders: entries.map(function (entry) {
                    return entry.get('name');
                }),
                data: profiles.map(function (profile) {
                    return entries.map(function (entry) {
                        return _.contains(entry.get('profiles') || [], profile.id);
                    });
                })
            };
        },
        serializeData: function () {
            var active_entry = this.options.active_entry;
            var active_dictionary = this.options.active_entry.collection.options.dictionary;

            return {
                option_name: active_entry.get('name'),
                dictionary_name: active_dictionary.get('name')
            };
        },
        onRender: function () {
            var self = this;
            var table_data = this.createData();

            if ( !self.hot ) {
                self.hot = new Handsontable(self.ui.$hot_container[0], {
                    data: table_data.data,
                    colHeaders: table_data.colHeaders,
                    rowHeaders: table_data.rowHeaders,
                    rowHeaderWidth: 200,
                    rowHeights: 25,
                    afterChange: function (change) {
                        self.onDataChange(change);
                    },
                    columns: _.map(table_data.colHeaders, function (item, index) {
                        return {
                            data: index,
                            type: 'checkbox'
                        };
                    })
                });
            }
        }
    });
})();
