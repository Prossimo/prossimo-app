import _ from 'underscore';
import Handsontable from 'handsontable/dist/handsontable.full';

import hotRenderers from '../../hot-renderers';
import BaseDialogView from './base-dialog-view';
import template from '../../templates/dialogs/items-profiles-table-dialog-view.hbs';

const DEFAULT_COLUMN_TITLE = 'Default Variant';
const DEFAULT_COLUMN_SINGLE_ITEM_TITLE = 'Is Default';
const AVAILABLE_COLUMN_SINGLE_ITEM_TITLE = 'Is Available';
const UNSET_VALUE = '--';

export default BaseDialogView.extend({
    className: 'items-profiles-table-modal modal fade',
    template,
    ui: {
        $hot_container: '.handsontable-container',
        $select: 'select',
    },
    events: {
        'shown.bs.modal': 'onModalShown',
        'change @ui.$select': 'onSelectChange',
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
        _.each(changes_array, (change) => {
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
            if (column_index === 0 && this.options.active_item === 'all') {
                //  Set item `new_item` to be default for this profile,
                //  and make sure item `old_item` is not default anymore
                const new_item = this.options.collection.findWhere({ name: new_value });
                const old_item = this.options.collection.findWhere({ name: old_value });

                this.options.collection.setItemAsDefaultForProfile(profile.id, new_item, old_item);
            } else if (column_index === 0) {
                const item = this.options.active_item;

                if (new_value === true) {
                    this.options.collection.setItemAsDefaultForProfile(profile.id, item);
                } else {
                    item.setProfileAvailability(profile.id, true, false);
                }

                this.updateTable();
            //  This means we changed availability for some profile/item
            } else {
                const item_index = column_index - 1;
                const item = this.options.active_item === 'all' ?
                    this.options.items_filtered[item_index] :
                    this.options.active_item;

                this.options.collection.setItemAvailabilityForProfile(profile.id, item, new_value);

                if (this.options.active_item === 'all') {
                    this.updateDefaultVariantsForProfile(profile_index);
                } else {
                    this.updateTable();
                }
            }
        });
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
        return this.options.profiles.map(profile => (
            this.options.active_item === 'all' ?
                [this.getDefaultItemName(profile.id)]
                .concat(
                    _.map(this.options.items_filtered, item => _.contains(item.getIdsOfProfilesWhereIsAvailable() || [], profile.id)),
                ) :
            [
                _.contains(this.options.active_item.getIdsOfProfilesWhereIsDefault() || [], profile.id),
                _.contains(this.options.active_item.getIdsOfProfilesWhereIsAvailable() || [], profile.id),
            ]
        ));
    },
    getHeaders() {
        return {
            rowHeaders: this.options.profiles.map(profile => profile.get('name')),
            colHeaders: this.options.active_item === 'all' ?
                [DEFAULT_COLUMN_TITLE].concat(
                    this.options.items_filtered.map(item => item.get('name')),
                ) :
                [DEFAULT_COLUMN_SINGLE_ITEM_TITLE, AVAILABLE_COLUMN_SINGLE_ITEM_TITLE],
        };
    },
    //  A cell should only contain a dropdown if it is a "Default Variant", and
    //  we're in the "All items" mode, otherwise it should be a checkbox
    getColumnOptions() {
        const column_options = [];

        _.each(this.getHeaders().colHeaders, (column_title, index) => {
            const is_default_all_mode = column_title === DEFAULT_COLUMN_TITLE;

            const column_obj = _.extend({}, {
                data: index,
                type: is_default_all_mode ? 'dropdown' : 'checkbox',
            });

            column_options.push(column_obj);
        }, this);

        return column_options;
    },
    getCellOptions() {
        const self = this;

        return (row, col) => {
            const cell_properties = {};

            //  If it's the left ('Default Value') column, in "All items" mode
            if (col === 0 && self.options.active_item === 'all') {
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
    onSelectChange() {
        let new_value = this.ui.$select.val() || 'all';

        if (new_value !== 'all') {
            new_value = this.options.items_filtered.find(item => item.id === parseInt(new_value, 10));
        }

        this.options.active_item = new_value || 'all';
        this.$el.toggleClass('is-wide', this.options.active_item === 'all');
        this.updateTable();
    },
    templateContext() {
        return {
            is_wide: this.options.active_item === 'all',
            collection_title: this.options.collection_title,
            possible_items: this.options.items_filtered.map(item => ({
                name: item.get('name'),
                id: item.id,
                is_selected: this.options.active_item !== 'all' && this.options.active_item.id === item.id,
                is_initial: this.options.active_item.id === item.id,
            })),
        };
    },
    updateTable() {
        if (this.hot) {
            const headers = this.getHeaders();

            this.hot.updateSettings({
                data: this.getData(),
                colHeaders: headers.colHeaders,
                columns: this.getColumnOptions(),
                cells: this.getCellOptions(),
            });
            this.hot.render();
        }
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
                    stretchH: 'all',
                });
            });
        }

        this.ui.$select.selectpicker({
            style: 'btn',
            width: 'fit',
        });
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
        this.options.initial_item = this.options.active_item;

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
