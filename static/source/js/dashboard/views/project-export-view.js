var app = app || {};

(function () {
    'use strict';

    app.ProjectExportView = Marionette.View.extend({
        tagName: 'div',
        className: 'project-export',
        template: app.templates['dashboard/project-export-view'],
        ui: {
            $export_button: '.js-export-project-data'
        },
        events: {
            'change input': 'onChangeInput'
        },
        getCsvData: function () {
            var column_delimiter = '","';
            var row_delimiter = '"\r\n"';

            var export_options = _.mapObject(this.export_options, function (item) {
                return item.checked;
            });
            var source_data = this.model.preparePricingDataForExport(_.extend({},
                export_options,
                { as_array: true }
            ));
            var csv_string = '"';
            var titles = source_data.length ? _.pluck(source_data[0], 'title') : [];

            if ( titles.length ) {
                csv_string += titles.join(column_delimiter);
                csv_string += row_delimiter;
            }

            if ( source_data.length ) {
                var rows_array = _.map(source_data, function (unit_data) {
                    return _.map(unit_data, function (item) {
                        if ( _.isArray(item.value) ) {
                            return item.value.join('\n');
                        }

                        return item.value;
                    }).join(column_delimiter);
                });

                csv_string += rows_array.join(row_delimiter);
            }

            csv_string += '"';
            csv_string = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv_string);

            return csv_string;
        },
        getDefaultFilename: function () {
            var start_time = new Date();
            var year = start_time.getFullYear();
            var month = (start_time.getMonth() > 8) ? (start_time.getMonth() + 1) : '0' + (start_time.getMonth() + 1);
            var date = (start_time.getDate() > 9) ? start_time.getDate() : '0' + start_time.getDate();

            return year + '-' + month + '-' + date + '_' +
                (this.model.id ? this.model.id + '_' : '') +
                (this.model.get('project_name') ? this.model.get('project_name').split(/\s/).join('-') : 'unnamed')
            ;
        },
        getFilename: function () {
            return (this.filename ? this.filename : 'unnamed') + '.csv';
        },
        onChangeInput: function (e) {
            var $target = $(e.target);
            var option_name = $target.attr('name');
            var new_value = $target.is(':checked');

            this.export_options[option_name].checked = new_value;
            this.updateExportButton();
        },
        updateExportButton: function () {
            var csv_data = this.getCsvData();
            var filename = this.getFilename();

            this.ui.$export_button.attr('href', csv_data);
            this.ui.$export_button.attr('download', filename);
        },
        templateContext: function () {
            return {
                export_options: this.export_options,
                filename: this.getFilename(),
                csv_data: this.getCsvData()
            };
        },
        initialize: function () {
            //  It might be made customizable via input, but currently it's not
            this.filename = this.getDefaultFilename();
            this.export_options = {
                include_project: { checked: false, title: 'Project Info', description: 'Project ID and name' },
                include_supplier_cost: { checked: true, title: 'Supplier Cost', description: 'Costs provided by supplier' },
                include_price: { checked: false, title: 'Price', description: 'Our markup and final price' },
                include_profile: { checked: false, title: 'Profile Info', description: 'Profile name and unit type' },
                include_fillings: { checked: false, title: 'Fillings', description: 'List of fillings used for unit' },
                include_options: { checked: false, title: 'Options', description: 'List of options used for unit' }
            };
        }
    });
})();
