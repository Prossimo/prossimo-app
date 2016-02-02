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
            $hot_container: '.filling-types-handsontable-container'
        },
        events: {
            'click .js-add-new-filling-type': 'addNewFillingType',
            'click .js-remove-item': 'onRemoveItem',
            'click .js-move-item-up': 'onMoveItemUp',
            'click .js-move-item-down': 'onMoveItemDown'
        },
        initialize: function () {
            this.table_update_timeout = null;
            this.dropdown_scroll_timer = null;
            this.columns = [
                'name', 'supplier_name', 'type', 'move_item', 'remove_item'
            ];

            this.listenTo(this.collection, 'invalid', this.showValidationError);
            this.listenTo(this.collection, 'all', this.updateTable);
            this.listenTo(this.options.parent_view, 'attach', this.updateTable);
        },
        addNewFillingType: function (e) {
            var new_type = new app.FillingType();

            e.stopPropagation();
            this.collection.add(new_type);
        },
        onRemoveItem: function (e) {
            var target_row = $(e.target).data('row');
            var target_object;

            if ( this.hot ) {
                target_object = this.hot.getSourceData().at(target_row);

                if ( !target_object.get('is_base_type') ) {
                    target_object.destroy();
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

            var properties_hash = {
                name: {
                    renderer: app.hot_renderers.fillingTypeRenderer
                },
                supplier_name: {
                    renderer: app.hot_renderers.fillingTypeRenderer
                },
                type: {
                    type: 'dropdown',
                    renderer: app.hot_renderers.fillingTypeDropdownRenderer,
                    source: _.map(this.collection.getBaseTypes(), function (item) {
                        return item.name;
                    }, this)
                },
                move_item: {
                    readOnly: true,
                    renderer: app.hot_renderers.moveItemRenderer
                },
                remove_item: {
                    readOnly: true,
                    renderer: app.hot_renderers.removeItemRenderer
                }
            };

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
                move_item: 'Move',
                remove_item: ' '
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
                    self.hot.render();
                }, 20);
            } else {
                this.render();
            }
        },
        onRender: function () {
            var self = this;
            var dropdown_scroll_reset = false;

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
                            maxRows: function () {
                                return self.collection.length;
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
        },
        onDestroy: function () {
            clearInterval(this.dropdown_scroll_timer);

            if ( this.hot ) {
                this.hot.destroy();
            }
        }
    });
})();
