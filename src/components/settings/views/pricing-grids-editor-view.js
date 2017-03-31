import $ from 'jquery';
import _ from 'underscore';
import Marionette from 'backbone.marionette';
import {math} from '../../../utils';
import Handsontable from 'handsontable/dist/handsontable.full';
import template from '../templates/pricing-grids-editor-view.hbs';

//  See `core/views/units-table-view.js` for reference, it's similar
//  and better commented, this file borrows a lot from there
export default Marionette.View.extend({
    tagName: 'div',
    className: 'pricing-grids-table',
    template: template,
    ui: {
        $hot_container: '.pricing-grids-handsontable-container',
        $tab_button: '.nav-tabs a'
    },
    events: {
        'click @ui.$tab_button': 'onTabClick'
    },
    templateContext: function () {
        return {
            show_notice: this.options.show_notice,
            tabs: _.each(this.tabs, function (item, key) {
                item.is_active = key === this.active_tab;
                return item;
            }, this)
        };
    },
    setActiveTab: function (tab_name) {
        if (_.contains(_.keys(this.tabs), tab_name)) {
            this.active_tab = tab_name;
        }
    },
    onTabClick: function (e) {
        var target = $(e.target).attr('href').replace('#', '');

        e.preventDefault();
        this.setActiveTab(target);
        this.render();
    },
    getGetterFunction: function (grid_entry_model, column_name) {
        var getter;

        var getters_hash = {
            area: function (model) {
                return math.square_meters(model.get('width'), model.get('height'));
            }
        };

        if (getters_hash[column_name]) {
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
            //  TODO: parse data on set
            // return model.persist(attr_name, self.getSetterParser(column_name, val));


            return model.persist(attr_name, val);
        };

        return function (grid_entry_model, value) {
            if (grid_entry_model) {
                if (_.isUndefined(value)) {
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

        if (properties_hash[column_name]) {
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

            if (custom_header) {
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

            area: 'Area (m<sup>2</sup>)',
            width: 'Width (mm)',
            height: 'Height (mm)',
            value: this.options.value_column_title || 'Price Increase (percents)'
        };

        return custom_column_headers_hash[column_name];
    },
    updateTable: function (e) {
        var self = this;

        //  We don't want to update table on validation errors, we have
        //  a special function for that
        if (e === 'invalid') {
            return;
        }

        if (this.hot) {
            clearTimeout(this.table_update_timeout);
            this.table_update_timeout = setTimeout(function () {
                self.hot.loadData(self.getDataObject());
            }, 20);
        } else {
            this.render();
        }
    },
    getDataObject: function () {
        var data_object;


        data_object = this.options.grids.getByName(this.active_tab).get('data');

        return data_object;
    },
    onRender: function () {
        var self = this;


        //  We use setTimeout because we want to wait until flexbox
        //  sizes are calculated properly
        setTimeout(function () {
            self.hot = new Handsontable(self.ui.$hot_container[0], {
                columns: self.getColumnOptions(),
                colHeaders: self.getColumnHeaders(),
                data: self.getDataObject(),
                rowHeights: 25,
                enterMoves: {row: 1, col: 0},
                stretchH: 'all'
            });
        }, 5);
    },
    onBeforeDestroy: function () {
        if (this.hot) {
            this.hot.destroy();
        }
    },
    initialize: function (options) {
        var default_options = {
            grids: undefined,
            parent_view: undefined,
            show_notice: false,
            value_column_title: ''
        };

        this.options = _.extend(default_options, options);

        this.table_update_timeout = null;
        this.columns = [
            'area', 'width', 'height', 'value'
        ];

        //  TODO: should tabs be autogenerated from the list of grids?
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
