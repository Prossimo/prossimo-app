import Marionette from 'backbone.marionette';

import App from '../../../main';
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
    onRender() {
        const display_options = {
            show_price: false,
            show_customer_image_and_description: false,
            show_outside_units_view: false,
            show_sizes_in_mm: true,
            show_supplier_names: true,
            show_european_hinge_indicators: true,
        };

        this.controls_view = new QuoteControlsView({
            project: App.current_project,
            quote: App.current_quote,
            quote_mode: 'supplier',
            increase_revision_enabled: false,
            set_current_date_enabled: false,
            display_options,
        });

        this.request_header_view = new SupplierRequestHeaderView({
            model: App.current_project,
        });

        this.request_body_view = new QuoteBodyView({
            project: App.current_project,
            quote: App.current_quote,
            multiunits: App.current_quote.multiunits,
            units: App.current_quote.units,
            extras: App.current_quote.extras,
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
