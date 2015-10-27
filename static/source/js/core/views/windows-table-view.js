var app = app || {};

(function () {
    'use strict';

    app.WindowsTableView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'windows-table-container',
        template: app.templates['core/windows-table-view'],
        ui: {
            '$hot_container': '.handsontable-container'
        },
        events: {
            'click .windows-table-title': 'toggleTableVisibility',
            'click .js-add-new-window': 'addNewWindow',
            'click .nav-tabs a': 'onTabClick'
        },
        initialize: function () {
            // this.table_visibility = 'hidden';
            this.table_visibility = 'visible';

            //  Pretend we already have tabs, and this is the default tab
            //  TODO: update this comment later
            this.base_tab_names = ['width', 'height', 'quantity', 'description', 'type'];

            this.tabs = {
                base: {
                    title: 'Base',
                    columns: ['width', 'height', 'quantity', 'description', 'type']
                },
                sizes: {
                    title: 'Sizes',
                    columns: ['width', 'height', 'width_mm', 'height_mm', 'dimensions']
                },
                images: {
                    title: 'Images',
                    columns: ['customer_image']
                }
            };
            this.active_tab = 'base';

            this.listenTo(this.collection, 'all', this.render);
            // this.listenTo(this.collection, 'all', this.renderTable);
            this.listenTo(app.vent, 'paste_image', this.onPasteImage);

            // console.log( 'active tab headers', this.getActiveTabHeaders() );
            // console.log( 'active tab column options', this.getActiveTabColumnOptions() );
        },
        getActiveTab: function () {
            return this.tabs[this.active_tab];
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
        toggleTableVisibility: function () {
            this.table_visibility = this.table_visibility === 'hidden' ? 'visible' : 'hidden';
            this.render();
        },
        addNewWindow: function (e) {
            var new_window = new app.Window();

            e.stopPropagation();
            this.collection.add(new_window);
        },
        serializeData: function () {
            return {
                tabs: _.each(this.tabs, function (item, key) {
                    item.is_active = key === this.active_tab;
                    return item;
                }, this),
                table_visibility: this.table_visibility//,
                // table_name_title_hash: this.collection.getNameTitleHash()
            };
        },
        onPasteImage: function (data) {
            if ( this.hot ) {
                //  Selected cells are returned in the format:
                //  [starting_cell_column_num, starting_cell_row_num,
                //   ending_cell_column_num, ending_cell_row_num]
                var selected_cells = this.hot.getSelected();

                //  Paste to each selected sell.
                if ( selected_cells && selected_cells.length ) {
                    for (var x = selected_cells[0]; x <= selected_cells[2]; x++) {
                        for (var y = selected_cells[1]; y <= selected_cells[3]; y++) {
                            this.hot.setDataAtCell(x, y, data);
                        }
                    }
                }

            }
        },
        // getNewWindow: function () {
        //     return new app.Window();
        // },
        //  TODO: add better description
        //  This one is from Handsontable / Backbone integration docs
        // getModelAttributeValue: function (attr_name) {
        //     //  TODO: add types and validation
        //     return {
        //         data: function (window_model, value) {
        //             if ( window_model ) {
        //                 if ( _.isUndefined(value) ) {
        //                     return window_model.get(attr_name);
        //                 }

        //                 window_model.set(attr_name, value);
        //             }
        //         }
        //     };
        // },
        //  TODO: rename all similar functions, they shouldn't be called
        //  getSomething
        getDimensions: function () {
            return {
                data: function (window_model, value) {
                    var f = app.utils.format;
                    // var p = app.utils.parseFormat;

                    if ( window_model ) {
                        if ( _.isUndefined(value) ) {
                            return f.dimensions(window_model.get('width'), window_model.get('height'));
                        }

                        //  TODO: add proper format parser (with a validator)
                        // window_model.set('width', p.dimensions(value, 'width'));
                        // window_model.set('width', value);
                    }
                },
                readOnly: true
            };
        },
        // getWidthMM: function () {
        //     return {
        //         data: function (window_model, value) {
        //             var c = app.utils.convert;

        //             if ( window_model ) {
        //                 if ( _.isUndefined(value) ) {
        //                     return c.inches_to_mm(window_model.get('width'));
        //                 }
        //             }
        //         },
        //         readOnly: true
        //     };
        // },
        // getHeightMM: function () {
        //     return {
        //         data: function (window_model, value) {
        //             var c = app.utils.convert;

        //             if ( window_model ) {
        //                 if ( _.isUndefined(value) ) {
        //                     return c.inches_to_mm(window_model.get('height'));
        //                 }
        //             }
        //         },
        //         readOnly: true
        //     };
        // },
        getCustomerImage: function () {
            return {
                data: function (window_model, value) {
                    if ( window_model ) {
                        if ( _.isUndefined(value) ) {
                            return window_model.get('customer_image');
                        }

                        window_model.set('customer_image', value);
                    }
                },
                width: 100,
                renderer: this.customerImageRenderer
            };
        },
        //  This one is from Handsontable demo on renderers
        customerImageRenderer: function (instance, td, row, col, prop, value) {
            var escaped = Handsontable.helper.stringify(value);
            var img;
            var $td = $(td);

            if ( escaped.indexOf('data:image/png') === 0 ) {
                img = document.createElement('IMG');
                img.src = value;

                Handsontable.Dom.addEvent(img, 'mousedown', function (e) {
                    e.preventDefault();
                });

                // Handsontable.Dom.empty(td);
                $td.empty();
                td.appendChild(img);
            } else {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
            }

            $td.addClass('hot-customer-image-cell');

            return td;
        },
        // getColumnValues: function () {
        //     var basic_values = _.map(this.collection.getNameTitleHash(this.base_tab_names), function (item) {
        //         return this.getModelAttributeValue(item.name);
        //     }, this);

        //     basic_values.push(this.getDimensions());
        //     basic_values.push(this.getWidthMM());
        //     basic_values.push(this.getHeightMM());
        //     basic_values.push(this.getCustomerImage());

        //     return basic_values;
        // },
        // renderTable: function () {
        //     console.log( 'rendertable!' );

        //     console.log( this.hot );

        //     if ( this.hot ) {
        //         console.log( 'rendertable', this.hot );

        //         // this.hot.render();
        //     }
        // },
        getGetterFunction: function (window_model, column_name) {
            var c = app.utils.convert;
            var f = app.utils.format;
            var getters_hash = {
                width_mm: function (window_model) {
                    return c.inches_to_mm(window_model.get('height'));
                },
                height_mm: function (window_model) {
                    return c.inches_to_mm(window_model.get('height'));
                },
                dimensions: function (window_model) {
                    return f.dimensions(window_model.get('width'), window_model.get('height'));
                }
            };

            var getter = function (window_model, column_name) {
                return window_model.get(column_name);
            };

            if ( getters_hash[column_name] ) {
                getter = getters_hash[column_name];
            }

            return getter.apply(this, arguments);
        },
        getSetterFunction: function (window_model, column_name, value) {
            // var p = app.utils.parseFormat;

            var setter = function (window_model, column_name, value) {
                return window_model.set(column_name, value);
            };

            return setter.apply(this, arguments);
        },
        getColumnData: function (column_name) {
            // var data_obj = {};

            // function (window_model, value) {
            //         if ( window_model ) {
            //             if ( _.isUndefined(value) ) {
            //                 return window_model.get(attr_name);
            //             }

            //             window_model.set(attr_name, value);
            //         }
            //     }

            // var getter = function (window_model, column_name) {
            //     return window_model.get(column_name);
            // };

            // var self = this;

            // var getter = this.getGetterFunction(window_model, column_name);

            // var getter = function (window_model, column_name) {
            //     return self.getGetterFunction(window_model, column_name);
            // };

            // var setter = function (window_model, column_name, value) {
            //     return window_model.set(column_name, value);
            // };

            var self = this;

            return function (window_model, value) {
                if ( window_model ) {
                    if ( _.isUndefined(value) ) {
                        return self.getGetterFunction(window_model, column_name);
                    }

                    // setter(window_model, column_name, value);
                    // window_model.set(column_name, value);
                    self.getSetterFunction(window_model, column_name, value);
                }
            };
        },
        getColumnExtras: function (column_name) {
            var extras_obj = {};
            var extras_hash = {
                width_mm: { readOnly: true },
                height_mm: { readOnly: true },
                dimensions: { readOnly: true },
                customer_image: {
                    width: 100,
                    renderer: this.customerImageRenderer
                }
            };

            if ( extras_hash[column_name] ) {
                extras_obj = _.extend({}, extras_hash[column_name]);
            }

            return extras_obj;
        },
        //  Return all columns
        //  TODO: describe this in a similar fashion as a following method
        getActiveTabColumnOptions: function () {
            var columns = [];

            _.each(this.getActiveTab().columns, function (column_name) {
                // console.log( column_name );

                var column_obj = _.extend({},
                    { data: this.getColumnData(column_name) },
                    this.getColumnExtras(column_name)
                );

                // console.log( column_obj );

                columns.push(column_obj);
            }, this);

            return columns;
        },
        //  We try to get a proper heading for all columns in our active tab
        //  - first we check if we have some custom headings (mainly to
        //    redefine titles from original Window object or add new columns)
        //  - then we check if original Window object has title for that column
        //  - if both fail, we show just a system name of a column
        getActiveTabHeaders: function () {
            var headers = [];

            _.each(this.getActiveTab().columns, function (column_name) {
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
                dimensions: 'Dimensions',
                width_mm: 'Width (mm)',
                height_mm: 'Height (mm)',
                customer_image: 'Customer Image'
            };

            return custom_column_headers_hash[column_name];
        },
        // getHeaders: function () {
        //     var headers = this.collection.getTitles(this.base_tab_names);
        //     headers.push('Dimensions');
        //     headers.push('Width (mm)');
        //     headers.push('Height (mm)');
        //     headers.push('Customer Image');
        //     return headers;
        // },
        onRender: function () {
            // this.hot = new Handsontable(this.ui.$hot_container[0], {
            //     data: this.collection,
            //     columns: this.getColumnValues(),
            //     colHeaders: this.getHeaders(),
            //     stretchH: 'all',
            //     height: 200
            // });

            this.hot = new Handsontable(this.ui.$hot_container[0], {
                data: this.collection,
                columns: this.getActiveTabColumnOptions(),
                colHeaders: this.getActiveTabHeaders(),
                stretchH: 'all',
                height: 200
            });

            //  TODO: remove this
            var self = this;
            setTimeout(function () {
                // console.log( self.$el.is(':visible') );
                self.hot.render();
            }, 100);

            // console.log( 'onrender', this.hot );
            // console.log( this.$el );
            // console.log( this.$el.is(':visible') );

            // var self = this;

            // setTimeout(function () {
            //     console.log( self.$el.is(':visible') );
            // }, 200);

            // Handsontable.hooks.once('afterInit', this.renderTable, this.hot);
        }//,
        // onShow: function () {
        //     console.log( 'onshow!' );
        // },
        // onDomRefresh: function () {
        //     console.log( 'ondomrefresh!' );
        // },
        // onAttach: function () {
        //     console.log( 'onattach!' );

        //     this.renderTable();
        // },
        // attachElContent: function ( html ) {
        //     this.$el.html(html);
        //     var self = this;

        //     setTimeout(function () {
        //         // console.log( self.$el.is(':visible') );
        //         self.onAttach();
        //     }, 200);

        //     this.onAttach();

        //     return this;
        // }
        // onShow: function () {
        //     this.renderTable();
        // }
    });
})();
