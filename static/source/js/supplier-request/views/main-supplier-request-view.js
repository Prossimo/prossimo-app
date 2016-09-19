var app = app || {};

(function () {
    'use strict';

    app.MainSupplierRequestView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen supplier-request-screen',
        template: app.templates['supplier-request/main-supplier-request-view'],
        ui: {
            $header_container: '.supplier-request-header-container',
            $table_container: '.supplier-request-table-container'
        },
        serializeData: function () {
            return {
                urlToDownloadPdf: this.getDownloadPdfUrl()
            };
        },
        getDownloadPdfUrl: function () {
            var url = app.settings.get('pdf_api_base_path');

            url += '/supplier';
            url += '/' + app.current_project.get('id');
            url += '/' + app.current_project.get('project_name');
            url += '/' + app.current_project.get('quote_revision');
            url += '/' + window.localStorage.getItem('authToken');

            return url;
        },
        onRender: function () {
            this.request_header_view = new app.SupplierRequestHeaderView({
                model: app.current_project
            });

            this.request_table_view = new app.QuoteTableView({
                project: app.current_project,
                collection: app.current_project.units,
                extras: app.current_project.extras,
                show_price: false,
                show_customer_image: false,
                show_sizes_in_mm: true,
                show_supplier_system: true,
                show_supplier_filling_name: true,
                force_european_hinge_indicators: true
            });

            this.ui.$header_container.append(this.request_header_view.render().el);
            this.ui.$table_container.append(this.request_table_view.render().el);
        },
        onDestroy: function () {
            this.request_header_view.destroy();
            this.request_table_view.destroy();
        }
    });
})();
