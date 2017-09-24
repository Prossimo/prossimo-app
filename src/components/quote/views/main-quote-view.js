import Marionette from 'backbone.marionette';

import QuoteHeaderView from './quote-header-view';
import QuoteBodyView from './quote-body-view';
import QuoteControlsView from './quote-controls-view';
import template from '../templates/main-quote-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'screen quote-screen',
    template,
    ui: {
        $controls_container: '.controls-container',
        $header_container: '.quote-header-container',
        $table_container: '.quote-table-container',
    },
    initialize() {
        this.data_store = this.getOption('data_store');
    },
    templateContext() {
        return {
            lead_time: this.data_store.current_project.get('lead_time'),
        };
    },
    onRender() {
        const display_options = {
            show_price: true,
            show_customer_image: true,
            show_outside_units_view: true,
            show_sizes_in_mm: false,
            show_supplier_names: false,
            show_european_hinge_indicators: false,
        };

        this.controls_view = new QuoteControlsView({
            project: this.data_store.current_project,
            quote: this.data_store.current_quote,
            quote_mode: 'quote',
            increase_revision_enabled: true,
            set_current_date_enabled: true,
            data_store: this.data_store,
            display_options,
        });

        this.quote_header_view = new QuoteHeaderView({
            model: this.data_store.current_project,
            quote: this.data_store.current_quote,
        });

        this.quote_body_view = new QuoteBodyView({
            project: this.data_store.current_project,
            quote: this.data_store.current_quote,
            multiunits: this.data_store.current_quote.multiunits,
            units: this.data_store.current_quote.units,
            extras: this.data_store.current_quote.extras,
            data_store: this.data_store,
            display_options,
        });

        this.ui.$controls_container.append(this.controls_view.render().el);
        this.ui.$header_container.append(this.quote_header_view.render().el);
        this.ui.$table_container.append(this.quote_body_view.render().el);
    },
    onBeforeDestroy() {
        this.controls_view.destroy();
        this.quote_header_view.destroy();
        this.quote_body_view.destroy();
    },
});
