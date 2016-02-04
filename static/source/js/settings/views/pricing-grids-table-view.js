var app = app || {};

(function () {
    'use strict';

    //  See `core/views/units-table-view.js` for reference, it's similar
    //  and better commented, this file borrows a lot from there
    app.PricingGridsTableView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'pricing-grids-table',
        template: app.templates['settings/pricing-grids-table-view'],
        ui: {
            $hot_container: '.pricing-grids-handsontable-container'
        },
        events: {
            // 'click .js-add-new-profile': 'addNewProfile',
            // 'click .js-remove-item': 'onRemoveItem',
            // 'click .js-move-item-up': 'onMoveItemUp',
            // 'click .js-move-item-down': 'onMoveItemDown'
        },
        initialize: function () {
            this.table_update_timeout = null;
            this.dropdown_scroll_timer = null;
            this.columns = [
                'title', 'area', 'width', 'height', 'price_per_square_meter'
            ];

            this.grid_mode = 'fixed';
            this.current_profile = app.settings.getProfileByNameOrNew('Default');

            // this.listenTo(this.collection, 'invalid', this.showValidationError);
            // this.listenTo(this.collection, 'all', this.updateTable);
            // this.listenTo(this.options.parent_view, 'attach', this.updateTable);
        },
        // addNewProfile: function (e) {
        //     var new_profile = new app.Profile();

        //     e.stopPropagation();
        //     this.collection.add(new_profile);
        // },
        // onRemoveItem: function (e) {
        //     var target_row = $(e.target).data('row');
        //     var target_object;

        //     if ( this.hot ) {
        //         target_object = this.hot.getSourceData().at(target_row);
        //         target_object.destroy();
        //     }
        // },
        // onMoveItemUp: function (e) {
        //     var target_row = $(e.target).data('row');
        //     var target_object;

        //     if ( this.hot && $(e.target).hasClass('disabled') === false ) {
        //         target_object = this.hot.getSourceData().at(target_row);
        //         this.hot.getSourceData().moveItemUp(target_object);
        //     }
        // },
        // onMoveItemDown: function (e) {
        //     var target_row = $(e.target).data('row');
        //     var target_object;

        //     if ( this.hot && $(e.target).hasClass('disabled') === false ) {
        //         target_object = this.hot.getSourceData().at(target_row);
        //         this.hot.getSourceData().moveItemDown(target_object);
        //     }
        // },
        getGetterFunction: function (profile_model, column_name) {
            var m = app.utils.math;
            var getter;

            var getters_hash = {
                area: function (model) {
                    return m.square_meters(model.width, model.height);
                }
            };

            if ( getters_hash[column_name] ) {
                getter = getters_hash[column_name];
            } else {
                getter = function (model, attr_name) {
                    // return model.get(attr_name);
                    return model[attr_name];
                };
            }

            return getter.apply(this, arguments);
        },
        getColumnData: function (column_name) {
            var self = this;
            var setter;

            setter = function (model, attr_name, val) {
                // return model.persist(attr_name, val);
                model[attr_name] = val;
                return model;
            };

            return function (profile_model, value) {
                // console.log( 'profile_model', profile_model );

                if ( profile_model ) {
                    if ( _.isUndefined(value) ) {
                        return self.getGetterFunction(profile_model, column_name);
                    }

                    setter(profile_model, column_name, value);
                }
            };
            // return column_name;
        },
        // showValidationError: function (model, error) {
        //     if ( this.hot ) {
        //         var hot = this.hot;
        //         var self = this;

        //         var row_index = model.collection.indexOf(model);
        //         var col_index = _.indexOf(this.columns, error.attribute_name);
        //         var target_cell = hot.getCell(row_index, col_index);
        //         var $target_cell = $(target_cell);

        //         $target_cell.popover({
        //             container: 'body',
        //             title: 'Validation Error',
        //             content: error.error_message,
        //             trigger: 'manual'
        //         });

        //         $target_cell.popover('show');

        //         setTimeout(function () {
        //             $target_cell.popover('destroy');
        //             hot.setCellMeta(row_index, col_index, 'valid', true);
        //             self.updateTable();
        //         }, 5000);
        //     }
        // },
        // getColumnValidator: function (column_name) {
        //     var validator;

        //     validator = function (value, callback) {
        //         var attributes_object = {};
        //         var model = this.instance.getSourceData().at(this.row);

        //         attributes_object[column_name] = value;

        //         if ( !model.validate || !model.validate(attributes_object, { validate: true }) ) {
        //             callback(true);
        //         } else {
        //             callback(false);
        //         }
        //     };

        //     return validator;
        // },
        getColumnExtraProperties: function (column_name) {
            var properties_obj = {};

            var properties_hash = {
                title: {
                    readOnly: true
                },
                area: {
                    readOnly: true,
                    type: 'numeric',
                    format: '0[.]00'
                },
                height: {
                    type: 'numeric',
                    format: '0[.]00'
                },
                width: {
                    type: 'numeric',
                    format: '0[.]00'
                },
                price_per_square_meter: {
                    type: 'numeric',
                    format: '0[.]00'
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
                    data: this.getColumnData(column_name)// ,
                    // validator: this.getColumnValidator(column_name)
                }, this.getColumnExtraProperties(column_name));

                columns.push(column_obj);
            }, this);

            return columns;
        },
        getColumnHeaders: function () {
            var headers = [];

            _.each(this.columns, function (column_name) {
                var custom_header = this.getCustomColumnHeader(column_name);
                var title = '';

                if ( custom_header ) {
                    title = custom_header;
                } else {
                    title = column_name;
                }

                headers.push(title);
            }, this);

            return headers;
        },
        getCustomColumnHeader: function (column_name) {
            var custom_column_headers_hash = {
                title: 'Tier',
                area: 'Area (m<sup>2</sup>)',
                width: 'Width (mm)',
                height: 'Height (mm)',
                price_per_square_meter: 'Price / m<sup>2</sup> (orig.curr.)'
            };

            return custom_column_headers_hash[column_name];
        },
        // updateTable: function (e) {
        //     var self = this;

        //     //  We don't want to update table on validation errors, we have
        //     //  a special function for that
        //     if ( e === 'invalid' ) {
        //         return;
        //     }

        //     if ( this.hot ) {
        //         clearTimeout(this.table_update_timeout);
        //         this.table_update_timeout = setTimeout(function () {
        //             self.hot.render();
        //         }, 20);
        //     } else {
        //         this.render();
        //     }
        // },
        onRender: function () {
            var self = this;
            // var dropdown_scroll_reset = false;

            // console.log( this.current_profile.getPricingGrids() );

            // var fixed_columns = ['name', 'unit_type', 'system'];
            // var active_tab_columns = this.columns;
            // var fixed_columns_count = 0;

            // _.each(fixed_columns, function (column) {
            //     if ( _.indexOf(active_tab_columns, column) !== -1 ) {
            //         fixed_columns_count += 1;
            //     }
            // });

            var dataObject = this.current_profile.getPricingGrids()[this.grid_mode];

            // if ( this.collection.length ) {
            //  We use setTimeout because we want to wait until flexbox
            //  sizes are calculated properly
            setTimeout(function () {
                if ( !self.hot ) {
                    self.hot = new Handsontable(self.ui.$hot_container[0], {
                        // data: self.collection,
                        columns: self.getColumnOptions(),
                        colHeaders: self.getColumnHeaders(),
                        data: dataObject,
                        // rowHeaders: true,
                        trimDropdown: false,
                        rowHeights: 25 // ,
                        // maxRows: function () {
                        //     return self.collection.length;
                        // }// ,
                        // fixedColumnsLeft: fixed_columns_count
                    });
                }
            }, 50);
            // }

            // clearInterval(this.dropdown_scroll_timer);
            // this.dropdown_scroll_timer = setInterval(function () {
            //     var editor = self.hot && self.hot.getActiveEditor();

            //     if ( editor && editor.htContainer && !dropdown_scroll_reset ) {
            //         dropdown_scroll_reset = true;
            //         editor.htContainer.scrollIntoView(false);
            //     } else {
            //         dropdown_scroll_reset = false;
            //     }
            // }, 100);
        },
        onDestroy: function () {
            clearInterval(this.dropdown_scroll_timer);

            if ( this.hot ) {
                this.hot.destroy();
            }
        }
    });
})();
