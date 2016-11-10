var app = app || {};

(function () {
    'use strict';

    var DEFAULT_COLUMN_TITLE = 'Default Variant';
    var UNSET_VALUE = '--';

    app.ItemsProfilesTableDialogView = app.BaseDialogView.extend({
        className: 'items-profiles-table-modal modal fade',
        template: app.templates['dialogs/items-profiles-table-dialog-view'],
        ui: {
            $hot_container: '.handsontable-container'
        },
        //  We have two strategies here.
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
        onDataChange: function (changes_array) {
            _.each(changes_array, function (change) {
                var profile_index = change[0];
                var column_index = change[1];
                var old_value = change[2];
                var new_value = change[3];
                var profile = this.options.profiles.at(profile_index);

                if ( old_value === new_value ) {
                    return;
                }

                //  This means we changed a default value for some profile
                if ( column_index === 0 ) {
                    //  Set item `new_item` to be default for this profile,
                    //  and make sure item `old_item` is not default anymore
                    var new_item = this.options.collection.findWhere({ name: new_value });
                    var old_item = this.options.collection.findWhere({ name: old_value });

                    this.options.collection.setItemAsDefaultForProfile(profile.id, new_item, old_item);
                //  This means we changed availability for some profile/item
                } else {
                    var item_index = column_index - 1;
                    var item = this.options.items_filtered[item_index];

                    this.options.collection.setItemAvailabilityForProfile(profile.id, item, new_value);
                    this.updateDefaultVariantsForProfile(profile_index);
                }
            }, this);
        },
        //  This function only updates the list of default variants here, it
        //  doesn't do any changes to models
        updateDefaultVariantsForProfile: function (profile_index) {
            var old_possible_defaults = this.hot.getCellMeta(profile_index, 0).source || [];
            var new_possible_defaults = this.getAvailableItemNames(
                this.options.profiles.at(profile_index).id
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
        getDefaultItemName: function (profile_id) {
            var default_item = this.options.collection.getDefaultForProfile(profile_id);

            return default_item ? default_item.get('name') : UNSET_VALUE;
        },
        //  Since we apply filter_condition here, it is possible that we filter
        //  out some item that is set as default for this profile. We want to
        //  offer this item in selection nevertheless. Also, we put default
        //  item to the top spot in the dropdown
        getAvailableItemNames: function (profile_id) {
            var possible_items = this.options.collection.getAvailableForProfile(profile_id);
            var default_item = this.options.collection.getDefaultForProfile(profile_id);

            if (this.options.filter_condition !== false) {
                possible_items = _.filter(possible_items, this.options.filter_condition);
            }

            if (default_item) {
                possible_items = _.union([default_item], possible_items);
            }

            return [UNSET_VALUE].concat(_.map(possible_items, function (available_item) {
                return available_item.get('name');
            }));
        },
        getData: function () {
            return this.options.profiles.map(function (profile) {
                return [this.getDefaultItemName(profile.id)].concat(
                    _.map(this.options.items_filtered, function (item) {
                        return _.contains(_.pluck(item.get('profiles'), 'id') || [], profile.id);
                    })
                );
            }, this);
        },
        getHeaders: function () {
            return {
                rowHeaders: this.options.profiles.map(function (profile) {
                    return profile.get('name');
                }),
                colHeaders: [DEFAULT_COLUMN_TITLE].concat(
                    _.map(this.options.items_filtered, function (item) {
                        return item.get('name');
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
                    var available_names = self.getAvailableItemNames(
                        self.options.profiles.at(row).id
                    );

                    //  If there are some available options (we compare to 1
                    //  because unset value variant also counts)
                    if ( available_names.length > 1 ) {
                        cell_properties.readOnly = false;
                        cell_properties.renderer = Handsontable.renderers.AutocompleteRenderer;
                        cell_properties.source = available_names;
                    } else {
                        cell_properties.readOnly = true;
                        cell_properties.renderer = app.hot_renderers.getDisabledPropertyRenderer('(No Variants)');
                    }
                }

                return cell_properties;
            };
        },
        serializeData: function () {
            return {
                item_name: this.options.active_item.get('name'),
                collection_title: this.options.collection_title
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
                    maxRows: function () {
                        return self.options.profiles.length;
                    },
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
        initialize: function (options) {
            var default_options = {
                active_item: undefined,
                collection: undefined,
                profiles: undefined,
                items_filtered: [],
                filter_condition: false,
                collection_title: ''
            };

            this.options = _.extend(default_options, options);

            if ( !this.options.active_item || !this.options.collection || !this.options.profiles ) {
                throw new Error('Items to profiles dialog was not initialized correctly, check input options');
            }

            if ( !this.options.items_filtered.length && this.options.filter_condition !== false ) {
                if ( !_.isFunction(this.options.filter_condition) ) {
                    throw new Error('filter_condition should be a function');
                }

                this.options.items_filtered = this.options.collection.filter(this.options.filter_condition);
            }
        }
    });
})();
