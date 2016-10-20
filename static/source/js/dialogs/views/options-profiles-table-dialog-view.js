var app = app || {};

(function () {
    'use strict';

    var DEFAULT_COLUMN_TITLE = 'Default Variant';
    var UNSET_VALUE = '--';

    app.OptionsProfilesTableDialogView = app.BaseDialogView.extend({
        className: 'options-profiles-table-modal modal fade',
        template: app.templates['dialogs/options-profiles-table-dialog-view'],
        ui: {
            $hot_container: '.handsontable-container'
        },
        //  We have two stragies here.
        //  1. If we set or unset some option as a default for some profile,
        //  we only want to do the corresponding REST API call, and don't want
        //  to do any additional updates to our table.
        //  2. If we make a change to a per-profile availability (i.e. we
        //  toggle some checkbox), we need to:
        //  - update our table, so this option becomes available in the
        //  `Default Value` dropdown (or the opposite, if we uncheck)
        //  - if the unchecked value was set as default, we need to clear it,
        //  so there's no default option for this profile
        //  - make the corresponding REST API call to update option to profile
        //  availability
        //  TODO: optimize so per-entry values are persisted all at once
        //  (not inside `each` iterator)
        /* eslint-disable max-nested-callbacks */
        onDataChange: function (changes_array) {
            _.each(changes_array, function (change) {
                var profile_index = change[0];
                var column_index = change[1];
                var old_value = change[2];
                var new_value = change[3];
                var profile = this.profiles.at(profile_index);

                if ( old_value === new_value ) {
                    return;
                }

                //  This means we changed a default value for some profile
                if ( column_index === 0 ) {
                    this.setOptionAsDefault(profile.id, new_value, old_value);
                } else {
                    var entry_index = column_index - 1;
                    var entry = this.entries_filtered[entry_index];
                    var old_profiles_list = entry.get('profiles');
                    var new_profiles_list;
                    var profile_to_remove;
                    var profile_to_add;

                    //  Now make this list of profiles unique
                    old_profiles_list = _.uniq(old_profiles_list, function (item) { return item.id; });

                    if ( new_value === false || new_value === 'false' ) {
                        profile_to_remove = _.findWhere(old_profiles_list, { id: profile.id });
                        new_profiles_list = _.without(old_profiles_list, profile_to_remove);
                        new_profiles_list.sort(function (a, b) { return a.id - b.id; });
                    } else if ( new_value === true || new_value === 'true' ) {
                        profile_to_add = {
                            id: profile.id,
                            is_default: false
                        };
                        new_profiles_list = _.union(old_profiles_list, [profile_to_add]);
                        new_profiles_list.sort(function (a, b) { return a.id - b.id; });
                    }

                    if ( old_profiles_list !== new_profiles_list ) {
                        entry.persist('profiles', new_profiles_list);
                        this.updateDefaultVariantsForProfile(profile_index);
                    }
                }
            }, this);
        },
        /* eslint-enable max-nested-callbacks */
        updateDefaultVariantsForProfile: function (profile_index) {
            var old_possible_defaults = this.hot.getCellMeta(profile_index, 0).source || [];
            var new_possible_defaults = this.getAvailableOptionsNames(
                this.active_dictionary.id,
                this.profiles.at(profile_index).id
            );
            var old_value = this.hot.getDataAtCell(profile_index, 0);

            if ( old_possible_defaults !== new_possible_defaults ) {
                this.hot.setCellMeta(profile_index, 0, 'source', new_possible_defaults);

                //  If old default value became unavailable
                if ( _.contains(new_possible_defaults, old_value) === false ) {
                    this.hot.setDataAtCell(profile_index, 0, UNSET_VALUE);
                }

                //  Make cell editable or not, depending on whether it has any
                //  variants. We compare to 1, because our unset value
                //  variant ('--') also counts
                if ( new_possible_defaults.length === 1 ) {
                    this.hot.setCellMetaObject(profile_index, 0, {
                        readOnly: true,
                        renderer: app.hot_renderers.getDisabledPropertyRenderer('(No Variants)')
                    });
                } else if ( old_possible_defaults.length === 1 && new_possible_defaults.length > 1 ) {
                    this.hot.setCellMetaObject(profile_index, 0, {
                        readOnly: false,
                        renderer: Handsontable.renderers.AutocompleteRenderer
                    });
                }

                this.hot.render();
            }
        },
        setOptionAsDefault: function (profile_id, new_option_name, old_option_name) {
            var new_entry = _.find(this.entries_filtered, function (entry) {
                return entry.get('name') === new_option_name;
            });
            var old_entry = _.find(this.entries_filtered, function (entry) {
                return entry.get('name') === old_option_name;
            });
            var old_entry_profiles;
            var profile_to_unset;
            var new_entry_profiles;
            var profile_to_set;

            //  If we unset
            if ( new_option_name === UNSET_VALUE && old_entry ) {
                old_entry_profiles = old_entry.get('profiles');
                profile_to_unset = _.findWhere(old_entry_profiles, { id: profile_id });

                if ( profile_to_unset && profile_to_unset.is_default === true ) {
                    profile_to_unset.is_default = false;
                    old_entry.persist('profiles', old_entry_profiles);
                }
            } else if ( new_option_name !== UNSET_VALUE && new_entry ) {
                new_entry_profiles = new_entry.get('profiles');
                profile_to_set = _.findWhere(new_entry_profiles, { id: profile_id });

                if ( profile_to_set && profile_to_set.is_default === false ) {
                    profile_to_set.is_default = true;
                    new_entry.persist('profiles', new_entry_profiles);
                }

                //  If we're also about to unset profile from some option
                if ( old_entry ) {
                    old_entry_profiles = old_entry.get('profiles');
                    profile_to_unset = _.findWhere(old_entry_profiles, { id: profile_id });

                    //  The important difference here is that we don't persist
                    //  to server, just set it locally
                    if ( profile_to_unset && profile_to_unset.is_default === true ) {
                        profile_to_unset.is_default = false;
                        old_entry.persist('profiles', old_entry_profiles);
                    }
                }
            }
        },
        getDefaultOptionName: function (dictionary_id, profile_id) {
            var default_option = app.settings.getDefaultOption(dictionary_id, profile_id);

            return default_option ? default_option.get('name') : UNSET_VALUE;
        },
        getAvailableOptionsNames: function (dictionary_id, profile_id) {
            var possible_options = app.settings.getAvailableOptions(dictionary_id, profile_id);

            return [UNSET_VALUE].concat(_.map(possible_options, function (available_option) {
                return available_option.get('name');
            }));
        },
        getData: function () {
            return this.profiles.map(function (profile) {
                return [this.getDefaultOptionName(this.active_dictionary.id, profile.id)].concat(
                    _.map(this.entries_filtered, function (entry) {
                        return _.contains(_.pluck(entry.get('profiles'), 'id') || [], profile.id);
                    })
                );
            }, this);
        },
        getHeaders: function () {
            return {
                rowHeaders: this.profiles.map(function (profile) {
                    return profile.get('name');
                }),
                colHeaders: [DEFAULT_COLUMN_TITLE].concat(
                    _.map(this.entries_filtered, function (entry) {
                        return entry.get('name');
                    })
                )
            };
        },
        getColumnOptions: function () {
            var column_options = [];

            _.each(this.getHeaders().colHeaders, function (column_title, index) {
                var is_default_column = column_title === DEFAULT_COLUMN_TITLE;

                var column_obj = _.extend({}, {
                    data: index,
                    type: is_default_column ? 'dropdown' : 'checkbox'
                });

                column_options.push(column_obj);
            }, this);

            return column_options;
        },
        getCellOptions: function () {
            var self = this;

            return function (row, col) {
                var cell_properties = {};

                //  If it's the left ('Default Value') column
                if ( col === 0 ) {
                    var available_options = self.getAvailableOptionsNames(
                        self.active_dictionary.id,
                        self.profiles.at(row).id
                    );

                    //  If there are some available options (we compare to 1
                    //  because unset value variant also counts)
                    if ( available_options.length > 1 ) {
                        cell_properties.readOnly = false;
                        cell_properties.renderer = Handsontable.renderers.AutocompleteRenderer;
                        cell_properties.source = available_options;
                    } else {
                        cell_properties.readOnly = true;
                        cell_properties.renderer = app.hot_renderers.getDisabledPropertyRenderer('(No Variants)');
                    }
                }

                return cell_properties;
            };
        },
        templateContext: function () {
            return {
                option_name: this.active_entry.get('name'),
                dictionary_name: this.active_dictionary.get('name')
            };
        },
        onRender: function () {
            var self = this;
            var headers = this.getHeaders();

            //  TODO: load only after the modal is created?
            if ( !self.hot ) {
                self.hot = new Handsontable(self.ui.$hot_container[0], {
                    data: self.getData(),
                    colHeaders: headers.colHeaders,
                    rowHeaders: headers.rowHeaders,
                    rowHeaderWidth: 200,
                    rowHeights: 25,
                    afterChange: function (change) {
                        self.onDataChange(change);
                    },
                    columns: this.getColumnOptions(),
                    cells: this.getCellOptions()
                });
            }
        },
        onDestroy: function () {
            if ( this.hot ) {
                this.hot.destroy();
            }
        },
        initialize: function () {
            this.active_entry = this.options.active_entry;
            this.active_dictionary = this.options.active_entry.collection.options.dictionary;
            this.profiles = app.settings.profiles;
            this.entries_filtered = this.options.active_entry.collection.filter(function (entry) {
                return entry.get('name') && !entry.hasOnlyDefaultAttributes();
            });
        }
    });
})();
