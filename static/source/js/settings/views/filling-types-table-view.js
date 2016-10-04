var app = app || {};

(function () {
    'use strict';

    //  See `core/views/units-table-view.js` for reference, it's similar
    //  and better commented, this file borrows a lot from there
    app.FillingTypesTableView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'filling-types-table',
        template: app.templates['settings/filling-types-table-view'],
        ui: {
            $hot_container: '.filling-types-handsontable-container',
            $add_new_type: '.js-add-new-filling-type',
            $undo: '.js-undo',
            $redo: '.js-redo',
            $remove: '.js-remove-selected-items',
            $clone: '.js-clone-selected-items'
        },
        events: {
            'click @ui.$add_new_type': 'addNewFillingType',
            'click .js-move-item-up': 'onMoveItemUp',
            'click .js-move-item-down': 'onMoveItemDown',
            'click @ui.$undo': 'onUndo',
            'click @ui.$redo': 'onRedo',
            'click @ui.$remove': 'onRemoveSelected',
            'click @ui.$clone': 'onCloneSelected'
        },
        keyShortcuts: {
            n: 'addNewFillingType',
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
                'move_item', 'name', 'supplier_name', 'type', 'weight_per_area'
            ];

            this.undo_manager = new app.UndoManager({
                register: this.collection,
                track: true
            });

            this.listenTo(this.collection, 'invalid', this.showValidationError);
            this.listenTo(this.collection, 'all', this.updateTable);
            this.listenTo(this.options.parent_view, 'attach', this.updateTable);
        },
        addNewFillingType: function (e) {
            var new_position = this.collection.length ? this.collection.getMaxPosition() + 1 : 0;
            var new_type = new app.FillingType({
                position: new_position
            });

            e.stopPropagation();
            this.collection.add(new_type);
            this.ui.$add_new_type.blur();
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
        getColumnData: function (column_name) {
            var getter;
            var setter;

            getter = function (model, attr_name) {
                return model.get(attr_name);
            };

            setter = function (model, attr_name, val) {
                return model.persist(attr_name, val);
            };

            return function (filling_type_model, value) {
                if ( filling_type_model ) {
                    if ( _.isUndefined(value) ) {
                        return getter(filling_type_model, column_name);
                    }

                    setter(filling_type_model, column_name, value);
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
                weight_per_area: { format: '0,0[.]000' }
            };

            var properties_hash = {
                type: {
                    type: 'dropdown',
                    source: _.map(this.collection.getBaseTypes(), function (item) {
                        return item.name;
                    }, this)
                },
                move_item: {
                    readOnly: true,
                    renderer: app.hot_renderers.moveItemRenderer
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
        //  Redefine some cell-specific properties. This is mostly used to
        //  prevent editing of some attributes that shouldn't be editable for
        //  a certain filling type
        getCellsSpecificOptions: function () {
            var self = this;

            return function (row, col) {
                var cell_properties = {};
                var item = this.instance.getSourceData().at(row);
                var property = self.columns[col];

                if ( item && item instanceof app.FillingType ) {
                    //  Gray out all attrs for base types
                    if ( item.get('is_base_type') ) {
                        cell_properties.readOnly = true;

                        if ( _.contains(['name', 'type'], property) === false ) {
                            cell_properties.renderer = app.hot_renderers.getDisabledPropertyRenderer();
                        }
                    }
                }

                return cell_properties;
            };
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
                    self.addNewFillingType(event);
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
                            cells: self.getCellsSpecificOptions(),
                            colHeaders: self.getColumnHeaders(),
                            rowHeaders: true,
                            rowHeights: 25,
                            trimDropdown: false,
                            maxRows: function () {
                                return self.collection.length;
                            },
                            enterMoves: { row: 1, col: 0 },
                            beforeKeyDown: function (e) {
                                onBeforeKeyDown(e, true);
                            },
                            afterSelection: function (startRow, startColumn, endRow, endColumn) {
                                self.selected = [];

                                if ( startColumn === 0 && endColumn === this.countCols() - 1 ) {
                                    if ( startRow === endRow ) {
                                        self.selected = [startRow];
                                        var selectedData = self.hot.getSourceData().at(startRow);

                                        if (selectedData.get('is_base_type')) {
                                            self.ui.$remove.addClass('disabled');
                                            self.selected = [];
                                        } else {
                                            self.ui.$remove.removeClass('disabled');
                                        }

                                        if (selectedData.hasOnlyDefaultAttributes() ||
                                            selectedData.get('is_base_type')
                                        ) {
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
                                            if (self.hot.getSourceData().at(i).get('is_base_type')) {
                                                self.selected = [];
                                                self.ui.$remove.addClass('disabled');
                                                return;
                                            }

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
