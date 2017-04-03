import Marionette from 'backbone.marionette';

import App from '../../../main';
import SupplierRequestHeaderView from './supplier-request-header-view';
import QuoteTableView from '../../quote/views/quote-table-view';
import template from '../templates/main-supplier-request-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'screen supplier-request-screen',
    template: template,
    ui: {
        $header_container: '.supplier-request-header-container',
        $table_container: '.supplier-request-table-container'
    },
    templateContext: function () {
        return {
            urlToDownloadPdf: App.settings.getPdfDownloadUrl('supplier')
        };
    },
    onRender: function () {
        this.request_header_view = new SupplierRequestHeaderView({
            model: App.current_project
        });

        this.request_table_view = new QuoteTableView({
            project: App.current_project,
            quote: App.current_quote,
            collection: App.current_quote.units,
            extras: App.current_quote.extras,
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
