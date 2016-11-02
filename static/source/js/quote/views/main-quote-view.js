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
        options: {
            baseTableOptions: {}
        },
        initialize: function () {
            _.defaults(this.options.baseTableOptions, {
                project: app.current_project,
                collection: app.current_project.units,
                extras: app.current_project.extras
            });

            this.listenTo(app.current_project, 'change:quote_mode_type', function (model, value) {
                switch (value) {
                    case 'quote_mode':
                        app.router.navigate('quote', {trigger: true});
                        break;
                    case 'supplier_mode':
                        app.router.navigate('supplier', {trigger: true});
                        break;
                    default:
                        throw new Error('Unknown parameter quote_mode_type: ' + this.quoteModeType);
                }
            });

            this.quoteModeType = app.current_project.get('quote_mode_type');
        },
        serializeData: function () {
            var isQuoteMode = (this.quoteModeType === 'quote_mode');
            return {
                isQuoteMode: isQuoteMode,
                urlToDownloadPdf: isQuoteMode ?
                    app.settings.getPdfDownloadUrl('quote') : app.settings.getPdfDownloadUrl('supplier')
            };
        },
        onRender: function () {
            this.getRegion('$controls_container').show(new app.BaseToggleView({
                tagName: 'span',
                model: app.current_project,
                property_name: 'quote_mode_type',
                current_value: this.quoteModeType,
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
            }));

            switch (this.quoteModeType) {
                case 'quote_mode':
                    this.renderInQuoteMode();
                    break;
                case 'supplier_mode':
                    this.renderInSupplierMode();
                    break;
                default:
                    throw new Error('Unknown parameter quote_mode_type: ' + this.quoteModeType);
            }
        },
        renderInQuoteMode: function () {
            var units_table_view = new app.UnitsTableView({
                collection: app.current_project.units,
                extras: app.current_project.extras,
                parent_view: this
            });

            var quote_header_view = new app.QuoteHeaderView({
                model: app.current_project
            });

            var quote_table_view = new app.QuoteTableView(_.extend({
                show_outside_units_view: true
            }, this.options.baseTableOptions));

            this.getRegion('$units_table_region').show(units_table_view);
            this.getRegion('$header_container').show(quote_header_view);
            this.getRegion('$table_container').show(quote_table_view);
        },
        renderInSupplierMode: function () {
            var request_header_view = new app.SupplierRequestHeaderView({
                model: app.current_project
            });

            var request_table_view = new app.QuoteTableView(_.extend({
                show_price: false,
                show_customer_image: false,
                show_sizes_in_mm: true,
                show_supplier_system: true,
                show_supplier_filling_name: true,
                force_european_hinge_indicators: true
            }, this.options.baseTableOptions));

            this.getRegion('$header_container').show(request_header_view);
            this.getRegion('$table_container').show(request_table_view);
        }
    });
})();
