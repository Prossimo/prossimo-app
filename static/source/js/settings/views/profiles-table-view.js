var app = app || {};

(function () {
    'use strict';

    //  See `core/views/units-table-view.js` for reference, it's similar
    //  and better commented, this file borrows a lot from there
    app.ProfilesTableView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'profiles-table',
        template: app.templates['settings/profiles-table-view'],
        ui: {
            '$hot_container': '.profiles-handsontable-container'
        },
        events: {
            'click .js-add-new-profile': 'addNewProfile',
            'click .js-remove-item': 'onRemoveItem',
            'click .js-move-item-up': 'onMoveItemUp',
            'click .js-move-item-down': 'onMoveItemDown'
        },
        initialize: function () {
            this.columns = [
                'name', 'unit_type', 'system', 'frame_width', 'mullion_width',
                'sash_frame_width', 'sash_frame_overlap', 'sash_mullion_overlap',
                'frame_corners', 'sash_corners', 'low_threshold', 'threshold_width',
                'frame_u_value', 'visible_frame_width_fixed', 'visible_frame_width_operable',
                'spacer_thermal_bridge_value', 'move_item', 'remove_item'
            ];

            this.listenTo(this.collection, 'all', this.updateTable);
            this.listenTo(this.options.parent_view, 'attach', this.updateTable);
        },
        addNewProfile: function (e) {
            var new_profile = new app.Profile();

            e.stopPropagation();
            this.collection.add(new_profile);
        },
        onRemoveItem: function (e) {
            var target_row = $(e.target).data('row');
            var target_object;

            if ( this.hot ) {
                target_object = this.hot.getData().at(target_row);
                target_object.destroy();
            }
        },
        onMoveItemUp: function (e) {
            var target_row = $(e.target).data('row');
            var target_object;

            if ( this.hot && $(e.target).hasClass('disabled') === false ) {
                target_object = this.hot.getData().at(target_row);
                this.hot.getData().moveItemUp(target_object);
            }
        },
        onMoveItemDown: function (e) {
            var target_row = $(e.target).data('row');
            var target_object;

            if ( this.hot && $(e.target).hasClass('disabled') === false ) {
                target_object = this.hot.getData().at(target_row);
                this.hot.getData().moveItemDown(target_object);
            }
        },
        getGetterFunction: function (profile_model, column_name) {
            var getter;

            var getters_hash = {
                visible_frame_width_fixed: function (model) {
                    return model.getVisibleFrameWidthFixed();
                },
                visible_frame_width_operable: function (model) {
                    return model.getVisibleFrameWidthOperable();
                }
            };

            if ( getters_hash[column_name] ) {
                getter = getters_hash[column_name];
            } else {
                getter = function (model, attr_name) {
                    return model.get(attr_name);
                };
            }

            return getter.apply(this, arguments);
        },
        getColumnData: function (column_name) {
            var self = this;
            var setter;

            setter = function (model, attr_name, val) {
                return model.persist(attr_name, val);
            };

            return function (profile_model, value) {
                if ( profile_model ) {
                    if ( _.isUndefined(value) ) {
                        return self.getGetterFunction(profile_model, column_name);
                    }

                    setter(profile_model, column_name, value);
                }
            };
        },
        getColumnExtraProperties: function (column_name) {
            var properties_obj = {};

            var names_title_type_hash = this.collection.getNameTitleTypeHash([column_name]);
            var original_type = names_title_type_hash.length &&
                names_title_type_hash[0].type || undefined;

            if ( original_type ) {
                if ( original_type === 'number' ) {
                    properties_obj.type = 'numeric';
                }
            }

            var format_hash = {
                frame_width: { format: '0,0[.]00' },
                mullion_width: { format: '0,0[.]00' },
                sash_frame_width: { format: '0,0[.]00' },
                sash_frame_overlap: { format: '0,0[.]00' },
                sash_mullion_overlap: { format: '0,0[.]00' },
                frame_u_value: { format: '0,0[.]00' },
                spacer_thermal_bridge_value: { format: '0,0[.]00' }
            };

            var properties_hash = {
                unit_type: {
                    type: 'dropdown',
                    source: this.collection.getUnitTypes()
                },
                low_threshold: {
                    renderer: app.hot_renderers.thresholdCheckboxRenderer
                },
                threshold_width: {
                    renderer: app.hot_renderers.thresholdWidthRenderer
                },
                move_item: {
                    readOnly: true,
                    renderer: app.hot_renderers.moveItemRenderer
                },
                remove_item: {
                    readOnly: true,
                    renderer: app.hot_renderers.removeItemRenderer
                },
                system: {
                    type: 'autocomplete',
                    source: app.settings.getSystems()
                },
                frame_corners: {
                    type: 'autocomplete',
                    source: app.settings.getFrameCornerTypes()
                },
                sash_corners: {
                    type: 'autocomplete',
                    source: app.settings.getSashCornerTypes()
                },
                visible_frame_width_fixed: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('fixed_minimal')
                },
                visible_frame_width_operable: {
                    readOnly: true,
                    renderer: app.hot_renderers.getFormattedRenderer('fixed_minimal')
                }
            };

            if ( format_hash[column_name] ) {
                properties_obj = _.extend(properties_obj, format_hash[column_name]);
            }

            if ( properties_hash[column_name] ) {
                properties_obj = _.extend(properties_obj, properties_hash[column_name]);
            }

            return properties_obj;
        },
        getColumnOptions: function () {
            var columns = [];

            _.each(this.columns, function (column_name) {
                var column_obj = _.extend({},
                    { data: this.getColumnData(column_name) },
                    this.getColumnExtraProperties(column_name)
                );

                columns.push(column_obj);
            }, this);

            return columns;
        },
        getColumnHeaders: function () {
            var headers = [];

            _.each(this.columns, function (column_name) {
                var custom_header = this.getCustomColumnHeader(column_name);
                var original_header = this.collection.getTitles([column_name]);
                var title = '';

                if ( custom_header ) {
                    title = custom_header;
                } else if ( original_header && original_header[0] ) {
                    title = original_header[0];
                } else {
                    title = column_name;
                }

                headers.push(title);
            }, this);

            return headers;
        },
        getCustomColumnHeader: function (column_name) {
            var custom_column_headers_hash = {
                visible_frame_width_fixed: 'Visible Frame Width Fixed',
                visible_frame_width_operable: 'Visible Frame Width Operable',
                move_item: 'Move',
                remove_item: ' '
            };

            return custom_column_headers_hash[column_name];
        },
        updateTable: function () {
            if ( this.hot ) {
                this.hot.render();
            } else {
                this.render();
            }
        },
        onRender: function () {
            var self = this;

            var fixed_columns = ['name', 'unit_type', 'system'];
            var active_tab_columns = this.columns;
            var fixed_columns_count = 0;

            _.each(fixed_columns, function (column) {
                if ( _.indexOf(active_tab_columns, column) !== -1 ) {
                    fixed_columns_count += 1;
                }
            });

            if ( this.collection.length ) {
                setTimeout(function () {
                    self.hot = new Handsontable(self.ui.$hot_container[0], {
                        data: self.collection,
                        columns: self.getColumnOptions(),
                        colHeaders: self.getColumnHeaders(),
                        rowHeaders: true,
                        trimDropdown: false,
                        maxRows: function () {
                            return self.collection.length;
                        },
                        fixedColumnsLeft: fixed_columns_count
                    });
                }, 50);
            }
        },
        onDestroy: function () {
            if ( this.hot ) {
                this.hot.destroy();
            }
        }
    });
})();
