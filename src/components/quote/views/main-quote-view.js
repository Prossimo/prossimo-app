import Marionette from 'backbone.marionette';

import App from '../../../main';
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
    templateContext() {
        return {
            lead_time: App.current_project.get('lead_time'),
        };
    },
    onRender() {
        const display_options = {
            show_price: true,
            show_customer_image_and_description: true,
            show_outside_units_view: true,
            show_sizes_in_mm: false,
            show_supplier_names: false,
            show_european_hinge_indicators: false,
        };

        this.controls_view = new QuoteControlsView({
            project: App.current_project,
            quote: App.current_quote,
            quote_mode: 'quote',
            increase_revision_enabled: true,
            set_current_date_enabled: true,
            display_options,
        });

        this.quote_header_view = new QuoteHeaderView({
            model: App.current_project,
            quote: App.current_quote,
        });

        this.quote_body_view = new QuoteBodyView({
            project: App.current_project,
            quote: App.current_quote,
            multiunits: App.current_quote.multiunits,
            units: App.current_quote.units,
            extras: App.current_quote.extras,
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
