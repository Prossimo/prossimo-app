import Marionette from 'backbone.marionette';

import SupplierRequestHeaderView from './supplier-request-header-view';
import QuoteBodyView from '../../quote/views/quote-body-view';
import QuoteControlsView from '../../quote/views/quote-controls-view';
import template from '../templates/main-supplier-request-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'screen supplier-request-screen',
    template,
    ui: {
        $controls_container: '.controls-container',
        $header_container: '.supplier-request-header-container',
        $table_container: '.supplier-request-table-container',
    },
    initialize() {
        this.data_store = this.getOption('data_store');
    },
    onRender() {
        const display_options = {
            show_price: false,
            show_customer_image: false,
            show_outside_units_view: false,
            show_sizes_in_mm: true,
            show_supplier_names: true,
            show_european_hinge_indicators: true,
        };

        this.controls_view = new QuoteControlsView({
            project: this.data_store.current_project,
            quote: this.data_store.current_quote,
            quote_mode: 'supplier',
            increase_revision_enabled: false,
            set_current_date_enabled: false,
            data_store: this.data_store,
            display_options,
        });

        this.request_header_view = new SupplierRequestHeaderView({
            model: this.data_store.current_project,
        });

        this.request_body_view = new QuoteBodyView({
            project: this.data_store.current_project,
            quote: this.data_store.current_quote,
            multiunits: this.data_store.current_quote.multiunits,
            units: this.data_store.current_quote.units,
            extras: this.data_store.current_quote.extras,
            data_store: this.data_store,
            display_options,
        });

        this.ui.$controls_container.append(this.controls_view.render().el);
        this.ui.$header_container.append(this.request_header_view.render().el);
        this.ui.$table_container.append(this.request_body_view.render().el);
    },
    onBeforeDestroy() {
        this.controls_view.destroy();
        this.request_header_view.destroy();
        this.request_body_view.destroy();
    },
});
