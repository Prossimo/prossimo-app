import _ from 'underscore';
import Handsontable from 'handsontable/dist/handsontable.full';

import hotRenderers from '../../hot-renderers';
import BaseDialogView from './base-dialog-view';
import template from '../../templates/dialogs/items-profiles-table-dialog-view.hbs';

const DEFAULT_COLUMN_TITLE = 'Default Variant';
const UNSET_VALUE = '--';

export default BaseDialogView.extend({
    className: 'items-profiles-table-modal modal fade',
    template,
    ui: {
        $hot_container: '.handsontable-container',
    },
    events: {
        'shown.bs.modal': 'onModalShown',
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
    onDataChange(changes_array) {
        _.each(changes_array, function (change) {
            const profile_index = change[0];
            const column_index = change[1];
            const old_value = change[2];
            let new_value = change[3];
            const profile = this.options.profiles.at(profile_index);

            if (old_value === new_value) {
                return;
            }

            //  Fix HoT issue with booleans cast to strings on copy/paste
            if (new_value === 'true') {
                new_value = true;
            } else if (new_value === 'false') {
                new_value = false;
            }

            //  This means we changed a default value for some profile
            if (column_index === 0) {
                //  Set item `new_item` to be default for this profile,
                //  and make sure item `old_item` is not default anymore
                const new_item = this.options.collection.findWhere({ name: new_value });
                const old_item = this.options.collection.findWhere({ name: old_value });

                this.options.collection.setItemAsDefaultForProfile(profile.id, new_item, old_item);
            //  This means we changed availability for some profile/item
            } else {
                const item_index = column_index - 1;
                const item = this.options.items_filtered[item_index];

                this.options.collection.setItemAvailabilityForProfile(profile.id, item, new_value);
                this.updateDefaultVariantsForProfile(profile_index);
            }
        }, this);
    },
    //  This function only updates the list of default variants here, it
    //  doesn't do any changes to models
    updateDefaultVariantsForProfile(profile_index) {
        const old_possible_defaults = this.hot.getCellMeta(profile_index, 0).source || [];
        const new_possible_defaults = this.getAvailableItemNames(
            this.options.profiles.at(profile_index).id,
        );
        const old_value = this.hot.getDataAtCell(profile_index, 0);

        if (old_possible_defaults !== new_possible_defaults) {
            this.hot.setCellMeta(profile_index, 0, 'source', new_possible_defaults);

            //  If old default value became unavailable
            if (_.contains(new_possible_defaults, old_value) === false) {
                this.hot.setDataAtCell(profile_index, 0, UNSET_VALUE);
            }

            //  Make cell editable or not, depending on whether it has any
            //  variants. We compare to 1, because our unset value
            //  variant ('--') also counts
            if (new_possible_defaults.length === 1) {
                this.hot.setCellMetaObject(profile_index, 0, {
                    readOnly: true,
                    renderer: hotRenderers.getDisabledPropertyRenderer('(No Variants)'),
                });
            } else if (old_possible_defaults.length === 1 && new_possible_defaults.length > 1) {
                this.hot.setCellMetaObject(profile_index, 0, {
                    readOnly: false,
                    renderer: Handsontable.renderers.AutocompleteRenderer,
                });
            }

            this.hot.render();
        }
    },
    getDefaultItemName(profile_id) {
        const default_item = this.options.collection.getDefaultForProfile(profile_id);

        return default_item ? default_item.get('name') : UNSET_VALUE;
    },
    //  Since we apply filter_condition here, it is possible that we filter
    //  out some item that is set as default for this profile. We want to
    //  offer this item in selection nevertheless. Also, we put default
    //  item to the top spot in the dropdown
    getAvailableItemNames(profile_id) {
        let possible_items = this.options.collection.getAvailableForProfile(profile_id);
        const default_item = this.options.collection.getDefaultForProfile(profile_id);

        if (this.options.filter_condition !== false) {
            possible_items = _.filter(possible_items, this.options.filter_condition);
        }

        if (default_item) {
            possible_items = _.union([default_item], possible_items);
        }

        return [UNSET_VALUE].concat(_.map(possible_items, available_item => available_item.get('name')));
    },
    getData() {
        return this.options.profiles.map(function (profile) {
            return [this.getDefaultItemName(profile.id)].concat(
                _.map(this.options.items_filtered, item => _.contains(item.getIdsOfProfilesWhereIsAvailable() || [], profile.id)),
            );
        }, this);
    },
    getHeaders() {
        return {
            rowHeaders: this.options.profiles.map(profile => profile.get('name')),
            colHeaders: [DEFAULT_COLUMN_TITLE].concat(
                _.map(this.options.items_filtered, item => item.get('name')),
            ),
        };
    },
    getColumnOptions() {
        const column_options = [];

        _.each(this.getHeaders().colHeaders, (column_title, index) => {
            const is_default_column = column_title === DEFAULT_COLUMN_TITLE;

            const column_obj = _.extend({}, {
                data: index,
                type: is_default_column ? 'dropdown' : 'checkbox',
            });

            column_options.push(column_obj);
        }, this);

        return column_options;
    },
    getCellOptions() {
        const self = this;

        return function (row, col) {
            const cell_properties = {};

            //  If it's the left ('Default Value') column
            if (col === 0) {
                const available_names = self.getAvailableItemNames(
                    self.options.profiles.at(row).id,
                );

                //  If there are some available options (we compare to 1
                //  because unset value variant also counts)
                if (available_names.length > 1) {
                    cell_properties.readOnly = false;
                    cell_properties.renderer = Handsontable.renderers.AutocompleteRenderer;
                    cell_properties.source = available_names;
                } else {
                    cell_properties.readOnly = true;
                    cell_properties.renderer = hotRenderers.getDisabledPropertyRenderer('(No Variants)');
                }
            }

            return cell_properties;
        };
    },
    templateContext() {
        return {
            item_name: this.options.active_item.get('name'),
            collection_title: this.options.collection_title,
        };
    },
    onRender() {
        const self = this;
        const headers = this.getHeaders();

        if (!self.hot) {
            _.defer(() => {
                self.hot = new Handsontable(self.ui.$hot_container[0], {
                    data: self.getData(),
                    colHeaders: headers.colHeaders,
                    rowHeaders: headers.rowHeaders,
                    rowHeaderWidth: 200,
                    rowHeights: 25,
                    maxRows() {
                        return self.options.profiles.length;
                    },
                    afterChange(change) {
                        self.onDataChange(change);
                    },
                    columns: self.getColumnOptions(),
                    cells: self.getCellOptions(),
                });
            });
        }
    },
    onModalShown() {
        if (this.hot) {
            this.hot.render();
        }
    },
    onBeforeDestroy() {
        if (this.hot) {
            this.hot.destroy();
        }
    },
    initialize(options) {
        const default_options = {
            active_item: undefined,
            collection: undefined,
            profiles: undefined,
            items_filtered: [],
            filter_condition: false,
            collection_title: '',
        };

        this.options = _.extend(default_options, options);

        if (!this.options.active_item || !this.options.collection || !this.options.profiles) {
            throw new Error('Items to profiles dialog was not initialized correctly, check input options');
        }

        if (!this.options.items_filtered.length && this.options.filter_condition !== false) {
            if (!_.isFunction(this.options.filter_condition)) {
                throw new Error('filter_condition should be a function');
            }

            this.options.items_filtered = this.options.collection.filter(this.options.filter_condition);
        }
    },
});
