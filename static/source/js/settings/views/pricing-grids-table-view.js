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
            $hot_container: '.pricing-grids-handsontable-container',
            $select: '.selectpicker'
        },
        events: {
            'change @ui.$select': 'onSelectProfile',
            'click .nav-tabs a': 'onTabClick'
        },
        initialize: function () {
            this.table_update_timeout = null;
            this.dropdown_scroll_timer = null;
            this.columns = [
                'title', 'area', 'width', 'height', 'price_per_square_meter'
            ];
            this.current_profile = undefined;

            this.tabs = {
                fixed: {
                    title: 'Fixed'
                },
                operable: {
                    title: 'Operable'
                }
            };
            this.active_tab = 'fixed';

            // this.listenTo(this.collection, 'invalid', this.showValidationError);
            // this.listenTo(this.collection, 'all', this.updateTable);
            // this.listenTo(this.options.parent_view, 'attach', this.updateTable);
        },
        serializeData: function () {
            return {
                profile_list: this.collection.map(function (item) {
                    return {
                        is_selected: this.current_profile && item.id === this.current_profile.id,
                        id: item.id,
                        profile_name: item.get('name')
                    };
                }, this),
                tabs: _.each(this.tabs, function (item, key) {
                    item.is_active = key === this.active_tab;
                    return item;
                }, this)
            };
        },
        onSelectProfile: function () {
            var new_id = this.ui.$select.val();

            if ( new_id ) {
                this.setCurrentProfile(new_id);
            }
        },
        setCurrentProfile: function (new_id) {
            this.current_profile = this.collection.get(new_id);
            this.render();
        },
        setActiveTab: function (tab_name) {
            if ( _.contains(_.keys(this.tabs), tab_name) ) {
                this.active_tab = tab_name;
            }
        },
        onTabClick: function (e) {
            var target = $(e.target).attr('href').replace('#', '');

            e.preventDefault();
            this.setActiveTab(target);
            this.render();
        },
        getGetterFunction: function (pricing_tier, column_name) {
            var m = app.utils.math;
            var getter;

            var getters_hash = {
                area: function (tier) {
                    return m.square_meters(tier.width, tier.height);
                }
            };

            if ( getters_hash[column_name] ) {
                getter = getters_hash[column_name];
            } else {
                getter = function (tier, attr_name) {
                    return tier[attr_name];
                };
            }

            return getter.apply(this, arguments);
        },
        getColumnData: function (column_name) {
            var self = this;
            var setter;

            setter = function (tier, attr_name, val) {
                self.current_profile._updatePricingGrids(self.active_tab, tier, function (item) {
                    item[attr_name] = val;
                });

                return tier;
            };

            return function (pricing_tier, value) {
                if ( pricing_tier ) {
                    if ( _.isUndefined(value) ) {
                        return self.getGetterFunction(pricing_tier, column_name);
                    }

                    setter(pricing_tier, column_name, value);
                }
            };
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

            this.ui.$select.selectpicker({
                style: 'btn-xs',
                size: 10
            });

            // var dropdown_scroll_reset = false;

            if ( this.current_profile ) {
                var dataObject = this.current_profile.getPricingGrids()[this.active_tab];

                // if ( this.collection.length ) {
                //  We use setTimeout because we want to wait until flexbox
                //  sizes are calculated properly
                setTimeout(function () {
                    // if ( !self.hot ) {
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
                    // }
                }, 50);
                // }
            } else {
                this.ui.$hot_container.empty().append('<p class="no-current-profile-message">' +
                    'Please select a profile from the list at the top</p>');
            }

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
