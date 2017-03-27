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
            'change input[type="checkbox"]': 'onChangeCheckboxInput',
            'change input[type="radio"]': 'onChangeRadioInput'
        },
        getCsvData: function () {
            var column_delimiter = '","';
            var row_delimiter = '"\r\n"';

            var export_options = _.mapObject(this.export_options, function (item) {
                return item.checked;
            });
            var source_data = this.model.preparePricingDataForExport(_.extend({},
                export_options,
                {
                    as_array: true,
                    quote_mode: this.export_quote_mode.value
                }
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
            var project_name = this.model.get('project_name') ? this.model.get('project_name') : 'unnamed';
            var quote_name = this.export_quote_mode.value === 'current' ?
                this.options.quote.getName() :
                'All Quotes';

            project_name = project_name.split(/\s/).join('-');
            quote_name = quote_name.split(/\s/).join('-');

            return year + '-' + month + '-' + date + '_' +
                (this.model.id ? this.model.id + '_' : '') +
                project_name + '_' + quote_name
            ;
        },
        getFilename: function () {
            this.filename = this.getDefaultFilename();

            return (this.filename ? this.filename : 'unnamed') + '.csv';
        },
        onChangeCheckboxInput: function (e) {
            var $target = $(e.target);
            var option_name = $target.attr('name');
            var new_value = $target.is(':checked');

            this.export_options[option_name].checked = new_value;
            this.updateExportButton();
        },
        onChangeRadioInput: function (e) {
            var $target = $(e.target);
            var option_name = $target.attr('name');
            var $checked = this.$el.find('input[name="' + option_name + '"]:checked');
            var new_value = $checked.length ? $checked.val() : undefined;

            if ( new_value ) {
                this.export_quote_mode.value = new_value;
                this.updateExportButton();
            }
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
                export_quote_mode: this.export_quote_mode,
                filename: this.getFilename(),
                csv_data: this.getCsvData()
            };
        },
        initialize: function () {
            this.export_options = {
                include_project: { checked: false, title: 'Project Info', description: 'Project ID and name' },
                include_quote: { checked: false, title: 'Quote Info', description: 'Quote ID and name' },
                include_supplier_cost: { checked: true, title: 'Supplier Cost', description: 'Costs provided by supplier' },
                include_price: { checked: false, title: 'Price', description: 'Our markup and final price' },
                include_profile: { checked: false, title: 'Profile Info', description: 'Profile name and unit type' },
                include_fillings: { checked: false, title: 'Fillings', description: 'List of fillings used for unit' },
                include_options: { checked: false, title: 'Options', description: 'List of options used for unit' }
            };
            this.export_quote_mode = {
                value: 'current',
                possible_values: [
                    { checked: true, value: 'current', title: 'Current Quote' },
                    { checked: false, value: 'all', title: 'All Quotes' }
                ]
            };
            //  It might be made customizable via input, but currently it's not
            this.filename = this.getDefaultFilename();
        }
    });
})();
