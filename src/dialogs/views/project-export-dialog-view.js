import _ from 'underscore';
import $ from 'jquery';
import Clipboard from 'clipboard';

import BaseDialogView from './base-dialog-view';
import template from '../../templates/dialogs/project-export-dialog-view.hbs';

const UNSET_VALUE = '--';

export default BaseDialogView.extend({
    className: 'project-export-modal modal fade',
    template,
    ui: {
        $copy_to_clipboard_button: '.js-copy-data-to-clipboard',
        $export_button: '.js-export-project-data',
    },
    events: {
        'change input[type="checkbox"]': 'onChangeCheckboxInput',
        'change input[type="radio"]': 'onChangeRadioInput',
    },
    getData() {
        const data_array = [];
        const export_options = _.mapObject(this.export_options, item => item.checked);
        const source_data = this.model.preparePricingDataForExport(_.extend({},
            export_options,
            {
                quote_mode: this.export_quote_mode.value,
            },
        ));
        //  Determine titles by the largest entry array
        const longest_row = source_data.length && _.max(source_data, row => row.length);
        const titles = longest_row ? _.pluck(longest_row, 'title') : [];

        if (titles.length) {
            data_array.push(titles);
        }

        if (source_data.length) {
            _.each(source_data, (unit_data) => {
                const row_data = _.pluck(unit_data, 'value');
                const length_difference = titles.length - row_data.length;

                //  We pad some entries with empty sash data columns, so
                //  each row has the same number of columns, even if empty
                if (length_difference > 0) {
                    for (let i = 0; i < length_difference; i += 1) {
                        row_data.push(UNSET_VALUE);
                    }
                }

                data_array.push(row_data);
            });
        }

        return data_array;
    },
    //  Inspired by https://gist.github.com/adilapapaya/9787842
    getCsvData() {
        const column_delimiter = '","';
        const row_delimiter = '"\r\n"';
        let csv_string = '"';
        const data_array = this.getData();

        if (data_array.length) {
            csv_string += _.map(data_array, data_row => data_row.join(column_delimiter)).join(row_delimiter);
        }

        csv_string += '"';
        csv_string = `data:application/csv;charset=utf-8,${encodeURIComponent(csv_string)}`;

        return csv_string;
    },
    getTabularData() {
        const column_delimiter = '\t';
        const row_delimiter = '\r\n';
        let tabular_data_string = '';
        const data_array = this.getData();

        if (data_array.length) {
            tabular_data_string += _.map(data_array, data_row => data_row.join(column_delimiter)).join(row_delimiter);
        }

        return tabular_data_string;
    },
    getDefaultFilename() {
        const start_time = new Date();
        const year = start_time.getFullYear();
        const month = (start_time.getMonth() > 8) ? (start_time.getMonth() + 1) : `0${start_time.getMonth() + 1}`;
        const date = (start_time.getDate() > 9) ? start_time.getDate() : `0${start_time.getDate()}`;
        const id = this.export_quote_mode.value === 'current' ? this.options.quote.getNumber() : this.model.id;
        let project_name = this.model.get('project_name') ? this.model.get('project_name') : 'unnamed';
        let quote_name = this.export_quote_mode.value === 'current' ? this.options.quote.get('name') : 'All Quotes';

        project_name = project_name.split(/\s/).join('-');
        quote_name = quote_name.split(/\s/).join('-');

        return `${year}-${month}-${date}_${id ? `${id}_` : ''}${project_name}${quote_name ? `_${quote_name}` : ''}`;
    },
    getFilename() {
        this.filename = this.getDefaultFilename();

        return `${this.filename ? this.filename : 'unnamed'}.csv`;
    },
    onChangeCheckboxInput(e) {
        const $target = $(e.target);
        const option_name = $target.attr('name');
        const new_value = $target.is(':checked');

        this.export_options[option_name].checked = new_value;
        this.updateExportButton();
    },
    onChangeRadioInput(e) {
        const $target = $(e.target);
        const option_name = $target.attr('name');
        const $checked = this.$el.find(`input[name="${option_name}"]:checked`);
        const new_value = $checked.length ? $checked.val() : undefined;

        if (new_value) {
            this.export_quote_mode.value = new_value;
            this.updateExportButton();
        }
    },
    updateExportButton() {
        const csv_data = this.getCsvData();
        const filename = this.getFilename();

        this.ui.$export_button.attr('href', csv_data);
        this.ui.$export_button.attr('download', filename);
    },
    templateContext() {
        return {
            export_options: this.export_options,
            export_quote_mode: this.export_quote_mode,
            filename: this.getFilename(),
            csv_data: this.getCsvData(),
            dialog_title: 'Pricing Data Export',
        };
    },
    onRender() {
        const self = this;

        this.clipboard = new Clipboard('.js-copy-data-to-clipboard', {
            text() {
                return self.getTabularData();
            },
        });
    },
    onBeforeDestroy() {
        if (this.clipboard) {
            this.clipboard.destroy();
        }
    },
    initialize() {
        this.export_options = {
            include_project: { checked: false, title: 'Project Info', description: 'Project ID and name' },
            include_quote: { checked: false, title: 'Quote Info', description: 'Quote ID and name' },
            include_dimensions_mm: { checked: false, title: 'Dimensions, mm', description: 'Width and height in mm' },
            include_supplier_cost_original: {
                checked: true,
                title: 'Supplier Cost, Original',
                description: 'Costs provided by supplier',
            },
            include_supplier_cost_converted: {
                checked: false,
                title: 'Supplier Cost, Converted',
                description: 'Supplier costs converted to USD',
            },
            include_supplier_discount: {
                checked: false,
                title: 'Supplier Discount',
                description: 'Discount size and discounted costs',
            },
            include_price: { checked: true, title: 'Price', description: 'Our markup and final price' },
            include_discount: { checked: false, title: 'Discount', description: 'Our price with discount' },
            include_profile: { checked: false, title: 'Profile Info', description: 'Profile name and unit type' },
            include_options: { checked: false, title: 'Options', description: 'List of options used for unit' },
            include_sections: {
                checked: false,
                title: 'Sections',
                description: 'Type, area and filling for each section',
            },
        };
        this.export_quote_mode = {
            value: 'current',
            possible_values: [
                { checked: true, value: 'current', title: 'Current Quote' },
                { checked: false, value: 'all', title: 'All Quotes' },
            ],
        };
        //  It might be made customizable via input, but currently it's not
        this.filename = this.getDefaultFilename();
    },
});
