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
            'click .js-remove-item': 'onRemoveItem'
        },
        initialize: function () {
            this.columns = [
                'name', 'unitType', 'system', 'frameWidth', 'mullionWidth',
                'sashFrameWidth', 'sashFrameOverlap', 'sashMullionOverlap',
                'lowThreshold', 'thresholdWidth', 'remove_item'
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
                this.hot.getData().remove(target_object);
            }
        },
        getColumnData: function (column_name) {
            var setter;
            var getter;

            getter = function (model, attr_name) {
                return model.get(attr_name);
            };

            setter = function (model, attr_name, val) {
                return model.set(attr_name, val);
            };

            return function (profile_model, value) {
                if ( profile_model ) {
                    if ( _.isUndefined(value) ) {
                        return getter(profile_model, column_name);
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
                frameWidth: { format: '0,0[.]00' },
                mullionWidth: { format: '0,0[.]00' },
                sashFrameWidth: { format: '0,0[.]00' }
            };

            var properties_hash = {
                unitType: {
                    type: 'dropdown',
                    source: this.collection.getUnitTypes()
                },
                lowThreshold: {
                    renderer: app.hot_renderers.thresholdCheckboxRenderer
                },
                thresholdWidth: {
                    renderer: app.hot_renderers.thresholdWidthRenderer
                },
                remove_item: {
                    readOnly: true,
                    renderer: app.hot_renderers.removeItemRenderer
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
                remove_item: ' '
            };

            return custom_column_headers_hash[column_name];
        },
        updateTable: function () {
            if ( this.hot ) {
                this.hot.render();
            }
        },
        onRender: function () {
            this.hot = new Handsontable(this.ui.$hot_container[0], {
                data: this.collection,
                columns: this.getColumnOptions(),
                colHeaders: this.getColumnHeaders(),
                rowHeaders: true,
                trimDropdown: false
            });
        },
        onDestroy: function () {
            if ( this.hot ) {
                this.hot.destroy();
            }
        }
    });
})();
