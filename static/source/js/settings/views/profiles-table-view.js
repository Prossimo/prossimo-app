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
            $hot_container: '.profiles-handsontable-container',
            $add_new_profile: '.js-add-new-profile',
            $undo: '.js-undo',
            $redo: '.js-redo',
            $remove: '.js-remove-selected-items',
            $clone: '.js-clone-selected-items'
        },
        events: {
            'click @ui.$add_new_profile': 'addNewProfile',
            'click .js-move-item-up': 'onMoveItemUp',
            'click .js-move-item-down': 'onMoveItemDown',
            'click @ui.$undo': 'onUndo',
            'click @ui.$redo': 'onRedo',
            'click @ui.$remove': 'onRemoveSelected',
            'click @ui.$clone': 'onCloneSelected'
        },
        keyShortcuts: {
            n: 'addNewProfile',
            'ctrl+z': 'onUndo',
            'command+z': 'onUndo',
            'ctrl+shift+z': 'onRedo',
            'command+shift+z': 'onRedo',
            'ctrl+y': 'onRedo',
            'command+y': 'onRedo'
        },
        initialize: function () {
            this.table_update_timeout = null;
            this.dropdown_scroll_timer = null;
            this.columns = [
                'move_item', 'name', 'unit_type', 'system', 'supplier_system', 'weight_per_length', 'frame_width',
                'mullion_width', 'sash_frame_width', 'sash_frame_overlap', 'sash_mullion_overlap',
                'frame_corners', 'sash_corners', 'low_threshold', 'threshold_width',
                'frame_u_value', 'visible_frame_width_fixed', 'visible_frame_width_operable',
                'spacer_thermal_bridge_value', 'clear_width_deduction'
            ];

            this.undo_manager = new app.UndoManager({
                register: this.collection,
                track: true
            });

            this.listenTo(this.collection, 'invalid', this.showValidationError);
            this.listenTo(this.collection, 'all', this.updateTable);
            this.listenTo(this.options.parent_view, 'attach', this.updateTable);
        },
        addNewProfile: function (e) {
            var new_position = this.collection.length ? this.collection.getMaxPosition() + 1 : 0;
            var new_profile = new app.Profile({
                position: new_position
            });

            e.stopPropagation();
            this.collection.add(new_profile);
            this.ui.$add_new_profile.blur();
        },
        onUndo: function () {
            this.undo_manager.handler.undo();
            this.ui.$undo.blur();
        },
        onRedo: function () {
            this.undo_manager.handler.redo();
            this.ui.$redo.blur();
        },
        onRemoveSelected: function () {
            if ( this.selected.length && this.hot ) {
                for (var i = this.selected.length - 1; i >= 0; i--) {
                    this.hot.getSourceData().at(this.selected[i]).destroy();
                }

                this.selected = [];
                this.hot.selectCell(0, 0, 0, 0, false);
                this.hot.deselectCell();
            }
        },
        onCloneSelected: function () {
            if ( this.selected.length === 1 && this.hot ) {
                var selectedData = this.hot.getSourceData().at(this.selected[0]);

                if (!selectedData.hasOnlyDefaultAttributes()) {
                    selectedData.duplicate();
                }
            }
        },
        onMoveItemUp: function (e) {
            var target_row = $(e.target).data('row');
            var target_object;

            if ( this.hot && $(e.target).hasClass('disabled') === false ) {
                target_object = this.hot.getSourceData().at(target_row);
                this.hot.getSourceData().moveItemUp(target_object);
            }
        },
        onMoveItemDown: function (e) {
            var target_row = $(e.target).data('row');
            var target_object;

            if ( this.hot && $(e.target).hasClass('disabled') === false ) {
                target_object = this.hot.getSourceData().at(target_row);
                this.hot.getSourceData().moveItemDown(target_object);
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
        showValidationError: function (model, error) {
            if ( this.hot ) {
                var hot = this.hot;
                var self = this;

                var row_index = model.collection.indexOf(model);
                var col_index = _.indexOf(this.columns, error.attribute_name);
                var target_cell = hot.getCell(row_index, col_index);
                var $target_cell = $(target_cell);

                $target_cell.popover({
                    container: 'body',
                    title: 'Validation Error',
                    content: error.error_message,
                    trigger: 'manual'
                });

                $target_cell.popover('show');

                setTimeout(function () {
                    $target_cell.popover('destroy');
                    hot.setCellMeta(row_index, col_index, 'valid', true);
                    self.updateTable();
                }, 5000);
            }
        },
        getColumnValidator: function (column_name) {
            var validator;

            validator = function (value, callback) {
                var attributes_object = {};
                var model = this.instance.getSourceData().at(this.row);

                attributes_object[column_name] = value;

                if ( !model.validate || !model.validate(attributes_object, { validate: true }) ) {
                    callback(true);
                } else {
                    callback(false);
                }
            };

            return validator;
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
                spacer_thermal_bridge_value: { format: '0,0[.]00' },
                weight_per_length: { format: '0,0[.]000' },
                clear_width_deduction: { format: '0,0[.]00' }
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
                system: {
                    type: 'dropdown',
                    source: _.union(
                        app.settings.getSystems(),
                        app.settings.profiles.pluck('system')
                    ).sort()
                },
                supplier_system: {
                    type: 'dropdown',
                    source: _.union(
                        app.settings.getSupplierSystems(),
                        app.settings.profiles.pluck('supplier_system')
                    ).sort()
                },
                frame_corners: {
                    type: 'dropdown',
                    source: _.union(
                        app.settings.getFrameCornerTypes(),
                        app.settings.profiles.pluck('frame_corners')
                    ).sort()
                },
                sash_corners: {
                    type: 'dropdown',
                    source: _.union(
                        app.settings.getSashCornerTypes(),
                        app.settings.profiles.pluck('sash_corners')
                    ).sort()
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
                var column_obj = _.extend({}, {
                    data: this.getColumnData(column_name),
                    validator: this.getColumnValidator(column_name)
                }, this.getColumnExtraProperties(column_name));

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
                move_item: 'Move'
            };

            return custom_column_headers_hash[column_name];
        },
        updateTable: function (e) {
            var self = this;

            //  We don't want to update table on validation errors, we have
            //  a special function for that
            if ( e === 'invalid' ) {
                return;
            }

            if ( this.hot ) {
                clearTimeout(this.table_update_timeout);
                this.table_update_timeout = setTimeout(function () {
                    self.hot.loadData(self.collection);
                }, 20);
            } else {
                this.render();
            }
        },
        onRender: function () {
            var self = this;
            var dropdown_scroll_reset = false;

            var fixed_columns = ['name', 'unit_type', 'system'];
            var active_tab_columns = this.columns;
            var fixed_columns_count = 0;

            _.each(fixed_columns, function (column) {
                if ( _.indexOf(active_tab_columns, column) !== -1 ) {
                    fixed_columns_count += 1;
                }
            });

            //  We have to duplicate keydown event handling here because of the
            //  way copyPaste plugin for HoT works. It intercepts focus once
            //  you press ctrl key (meta key), so keydown handler in our view
            //  (via backbone.marionette.keyshortcuts plugin) does not fire
            function onBeforeKeyDown(event, onlyCtrlKeys) {
                var isCtrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;
                var selection = (self.hot && self.hot.getSelected()) || false;
                var isFullRowSelected = false;

                if (selection.length) {
                    isFullRowSelected = selection[3] === selection[3] - selection[1];
                }

                //  document.body has at least 17 listeners onkeydown.
                //  hitting ctrl on selection causes app stuck and app crash
                if (isCtrlDown && event.keyCode === 17 && isFullRowSelected) {
                    event.stopImmediatePropagation();
                    return;
                }

                //  Ctrl + Y || Ctrl + Shift + Z
                if ( isCtrlDown && (event.keyCode === 89 || (event.shiftKey && event.keyCode === 90 )) ) {
                    self.onRedo();
                //  Ctrl + Z
                } else if ( isCtrlDown && event.keyCode === 90 ) {
                    self.onUndo();
                } else if ( !onlyCtrlKeys && !isCtrlDown && event.keyCode === 78 ) {
                    self.addNewProfile(event);
                    event.preventDefault();
                    event.stopPropagation();
                }
            }

            if ( this.collection.length ) {
                //  We use setTimeout because we want to wait until flexbox
                //  sizes are calculated properly
                setTimeout(function () {
                    if ( !self.hot ) {
                        self.hot = new Handsontable(self.ui.$hot_container[0], {
                            data: self.collection,
                            columns: self.getColumnOptions(),
                            colHeaders: self.getColumnHeaders(),
                            rowHeaders: true,
                            trimDropdown: false,
                            rowHeights: 25,
                            maxRows: function () {
                                return self.collection.length;
                            },
                            fixedColumnsLeft: fixed_columns_count,
                            enterMoves: { row: 1, col: 0 },
                            beforeKeyDown: function (e) {
                                onBeforeKeyDown(e, true);
                            },
                            afterSelection: function (startRow, startColumn, endRow, endColumn) {
                                self.selected = [];

                                if ( startColumn === 0 && endColumn === this.countCols() - 1 ) {
                                    self.ui.$remove.removeClass('disabled');

                                    if ( startRow === endRow ) {
                                        self.selected = [startRow];
                                        var selectedData = self.hot.getSourceData().at(startRow);

                                        if (selectedData.hasOnlyDefaultAttributes()) {
                                            self.ui.$clone.addClass('disabled');
                                        } else {
                                            self.ui.$clone.removeClass('disabled');
                                        }
                                    } else {
                                        var start = startRow;
                                        var end = endRow;

                                        if ( startRow > endRow ) {
                                            start = endRow;
                                            end = startRow;
                                        }

                                        for (var i = start; i <= end; i++) {
                                            self.selected.push(i);
                                        }

                                        self.ui.$clone.addClass('disabled');
                                    }
                                } else {
                                    self.ui.$remove.addClass('disabled');
                                    self.ui.$clone.addClass('disabled');
                                }
                            },
                            afterDeselect: function () {
                                if ( self.selected.length ) {
                                    this.selectCell(
                                        self.selected[0],
                                        0,
                                        self.selected[self.selected.length - 1],
                                        this.countCols() - 1,
                                        false
                                    );
                                }
                            }
                        });
                    }
                }, 50);
            }

            clearInterval(this.dropdown_scroll_timer);
            this.dropdown_scroll_timer = setInterval(function () {
                var editor = self.hot && self.hot.getActiveEditor();

                if ( editor && editor.htContainer && !dropdown_scroll_reset ) {
                    dropdown_scroll_reset = true;
                    editor.htContainer.scrollIntoView(false);
                } else {
                    dropdown_scroll_reset = false;
                }
            }, 100);

            this.undo_manager.registerButton('undo', this.ui.$undo);
            this.undo_manager.registerButton('redo', this.ui.$redo);

            $(window).off('keydown').on('keydown', function (e) {
                if ( !e.isDuplicate && $(e.target).hasClass('copyPaste') ) {
                    onBeforeKeyDown(e);
                }
            });
        },
        onDestroy: function () {
            clearInterval(this.dropdown_scroll_timer);

            if ( this.hot ) {
                this.hot.destroy();
            }

            $(window).off('keydown');
        }
    });
})();
