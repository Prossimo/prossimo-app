var app = app || {};

(function () {
    'use strict';

    //  See `core/views/units-table-view.js` for reference, it's similar
    //  and better commented, this file borrows a lot from there
    app.PerProfilePricingGridsEditorView = Marionette.View.extend({
        tagName: 'div',
        className: 'per-profile-pricing-grids-table',
        template: app.templates['settings/per-profile-pricing-grids-editor-view'],
        // template: _.template(
        //     '<div class="pricing-grids-table-scroll-wrapper">' +
        //         '<div class="pricing-grids-handsontable-container"></div>' +
        //     '</div>'
        // ),
        // template: false,
        ui: {
            $hot_container: '.pricing-grids-handsontable-container',
            // $select: '.selectpicker'
            $tab_button: '.nav-tabs a'
            // $tab_button: '.js-pricing-grids-nav a'
        },
        events: {
            // 'change @ui.$select': 'onSelectProfile',
            // 'click .nav-tabs a': 'onTabClick'
            'click @ui.$tab_button': 'onTabClick'
            // 'click .pricing-grids-table-title': 'onWhatever'
        },
        templateContext: function () {
            return {
                // profile_list: this.collection.map(function (item) {
                //     return {
                //         is_selected: this.current_profile && item.id === this.current_profile.id,
                //         id: item.id,
                //         name: item.get('name')
                //     };
                // }, this),
                tabs: _.each(this.tabs, function (item, key) {
                    item.is_active = key === this.active_tab;
                    return item;
                }, this)
            };
        },
        // onSelectProfile: function () {
        //     var new_id = this.ui.$select.val();

        //     if ( new_id ) {
        //         this.setCurrentProfile(new_id);
        //     }
        // },
        // setCurrentProfile: function (new_id) {
        //     this.current_profile = this.collection.get(new_id);
        //     this.render();
        // },
        // onWhatever: function (e) {
        //     console.log( 'onWhatever', e );
        // },
        setActiveTab: function (tab_name) {
            if ( _.contains(_.keys(this.tabs), tab_name) ) {
                this.active_tab = tab_name;
            }
        },
        onTabClick: function (e) {
            // console.log( 'onTabClick', e );
            var target = $(e.target).attr('href').replace('#', '');

            e.preventDefault();
            // e.stopPropagation();
            this.setActiveTab(target);
            this.render();
        },
        getGetterFunction: function (grid_entry_model, column_name) {
            var m = app.utils.math;
            var getter;

            var getters_hash = {
                area: function (model) {
                    // return m.square_meters(tier.width, tier.height);
                    return m.square_meters(model.get('width'), model.get('height'));
                }
            };

            if ( getters_hash[column_name] ) {
                getter = getters_hash[column_name];
            } else {
                getter = function (model, attr_name) {
                    // return tier[attr_name];
                    return model.get(attr_name);
                };
            }

            return getter.apply(this, arguments);
        },
        getColumnData: function (column_name) {
            var self = this;
            var setter;

            setter = function (model, attr_name, val) {
                // self.current_profile._updatePricingGrids(self.active_tab, tier, function (item) {
                //     item[attr_name] = val;
                // });
                //

                // return model;
                // return model.persist(attr_name, self.getSetterParser(column_name, val));
                return model.persist(attr_name, val);
            };

            return function (grid_entry_model, value) {
                if ( grid_entry_model ) {
                    if ( _.isUndefined(value) ) {
                        return self.getGetterFunction(grid_entry_model, column_name);
                    }

                    setter(grid_entry_model, column_name, value);
                }
            };
        },
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
                value: {
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
                    data: this.getColumnData(column_name)
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
                // title: 'Tier',
                area: 'Area (m<sup>2</sup>)',
                width: 'Width (mm)',
                height: 'Height (mm)',
                // value: 'Price / m<sup>2</sup> (orig.curr.)'
                value: 'Price Increase (percents)'
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
                    self.hot.loadData(self.getDataObject());

                    // console.log( 'getRowHeight', self.hot && self.hot.getRowHeight() );
                }, 20);
            } else {
                this.render();
            }
        },
        getDataObject: function () {
            var data_object;

            // if ( this.current_profile ) {
                // data_object = this.current_profile.getPricingGrids()[this.active_tab];
            // data_object = this.options.grids.getByName(this.active_tab);
            data_object = this.options.grids.getByName(this.active_tab).grid;
            // }

            // console.log( 'data_object', data_object );

            return data_object;
        },
        onRender: function () {
            var self = this;

            // this.ui.$select.selectpicker({
            //     style: 'btn-xs',
            //     size: 10
            // });

            // if ( this.current_profile ) {
            //  We use setTimeout because we want to wait until flexbox
            //  sizes are calculated properly
            setTimeout(function () {
                self.hot = new Handsontable(self.ui.$hot_container[0], {
                // self.hot = new Handsontable(self.el, {
                    columns: self.getColumnOptions(),
                    colHeaders: self.getColumnHeaders(),
                    data: self.getDataObject(),
                    rowHeights: 25,
                    enterMoves: { row: 1, col: 0 },
                    stretchH: 'all'
                });

                // console.log( 'getRowHeight', self.hot && self.hot.getRowHeight() );
            }, 5);
            // } else {
            //     this.ui.$hot_container.empty().append('<p class="no-current-profile-message">' +
            //         'Please select a profile from the list at the top</p>');
            // }
        },
        onBeforeDestroy: function () {
            if ( this.hot ) {
                this.hot.destroy();
            }
        },
        initialize: function () {
            // console.log( 'this.options', this.options );

            this.table_update_timeout = null;
            this.columns = [
                // 'title', 'area', 'width', 'height', 'price_per_square_meter'
                'area', 'width', 'height', 'value'
            ];
            // this.current_profile = undefined;

            this.tabs = {
                fixed: {
                    title: 'Fixed'
                },
                operable: {
                    title: 'Operable'
                }
            };
            this.active_tab = 'fixed';

            this.listenTo(this.options.grids, 'all', this.updateTable);
            this.listenTo(this.options.parent_view, 'attach', this.updateTable);
        }
    });
})();
