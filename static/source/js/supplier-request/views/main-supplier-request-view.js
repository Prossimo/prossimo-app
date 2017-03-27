var app = app || {};

(function () {
    'use strict';

    app.MainSupplierRequestView = Marionette.View.extend({
        tagName: 'div',
        className: 'screen supplier-request-screen',
        template: app.templates['supplier-request/main-supplier-request-view'],
        ui: {
            $header_container: '.supplier-request-header-container',
            $table_container: '.supplier-request-table-container'
        },
        templateContext: function () {
            return {
                urlToDownloadPdf: app.settings.getPdfDownloadUrl('supplier')
            };
        },
        onRender: function () {
            this.request_header_view = new app.SupplierRequestHeaderView({
                model: app.current_project
            });

            this.request_table_view = new app.QuoteTableView({
                project: app.current_project,
                quote: app.current_quote,
                collection: app.current_quote.units,
                extras: app.current_quote.extras,
                show_price: false,
                show_customer_image: false,
                show_sizes_in_mm: true,
                show_supplier_system: true,
                show_supplier_names: true,
                force_european_hinge_indicators: true
            });

            this.ui.$header_container.append(this.request_header_view.render().el);
            this.ui.$table_container.append(this.request_table_view.render().el);
        },
        onBeforeDestroy: function () {
            this.request_header_view.destroy();
            this.request_table_view.destroy();
        }
    });
})();
