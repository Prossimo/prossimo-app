var app = app || {};

(function () {
    'use strict';

    app.MainQuoteView = Marionette.LayoutView.extend({
        tagName: 'div',
        className: 'screen quote-screen',
        template: app.templates['quote/main-quote-view'],
        regions: {
            $header_container: '.quote-header-container',
            $table_container: '.quote-table-container',
            $units_table_region: '.units-table-region',
            $controls_container: '.toggle-mode-region'
        },
        serializeData: function () {
            return {
                urlToDownloadPdf: app.settings.getPdfDownloadUrl('quote')
            };
        },
        onRender: function () {
            var units_table_view = new app.UnitsTableView({
                collection: app.current_project.units,
                extras: app.current_project.extras,
                parent_view: this
            });

            var quote_header_view = new app.QuoteHeaderView({
                model: app.current_project
            });

            var quote_table_view = new app.QuoteTableView({
                project: app.current_project,
                collection: app.current_project.units,
                extras: app.current_project.extras,
                show_outside_units_view: true
            });

            var toggleMod = new app.BaseToggleView({
                tagName: 'span',
                model: app.current_project,
                property_name: 'quote_mode_type',
                current_value: app.current_project.get('quote_mode_type'),
                size: 'normal',
                width: '180',
                values_list: [
                    {
                        value: 'quote_mode',
                        title: 'Quote Mode'
                    },
                    {
                        value: 'supplier_mode',
                        title: 'Supplier Request Mode'
                    }
                ],
                possible_values_number: 2
            });

            this.getRegion('$controls_container').show(toggleMod);
            this.getRegion('$units_table_region').show(units_table_view);
            this.getRegion('$header_container').show(quote_header_view);
            this.getRegion('$table_container').show(quote_table_view);
        }
    });
})();
