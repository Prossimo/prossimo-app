var app = app || {};

(function () {
    'use strict';

    app.MainSupplierRequestView = Marionette.View.extend({
        tagName: 'div',
        className: 'screen supplier-request-screen',
        template: app.templates['supplier-request/main-supplier-request-view'],
        ui: {
            $controls_container: '.controls-container',
            $header_container: '.supplier-request-header-container',
            $table_container: '.supplier-request-table-container'
        },
        onRender: function () {
            this.controls_view = new app.QuoteControlsView({
                project: app.current_project,
                quote: app.current_quote,
                quote_mode: 'supplier',
                increase_revision_enabled: false,
                set_current_date_enabled: false
            });

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

            this.ui.$controls_container.append(this.controls_view.render().el);
            this.ui.$header_container.append(this.request_header_view.render().el);
            this.ui.$table_container.append(this.request_table_view.render().el);
        },
        onBeforeDestroy: function () {
            this.controls_view.destroy();
            this.request_header_view.destroy();
            this.request_table_view.destroy();
        }
    });
})();
