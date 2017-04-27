import Marionette from 'backbone.marionette';

import App from '../../../main';
import UnitsTableView from '../../../core/views/units-table-view';
import QuoteHeaderView from './quote-header-view';
import QuoteTableView from './quote-table-view';
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
            show_customer_image: true,
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

        this.units_table_view = new UnitsTableView({
            collection: App.current_quote.units,
            extras: App.current_quote.extras,
            parent_view: this,
        });

        this.quote_header_view = new QuoteHeaderView({
            model: App.current_project,
            quote: App.current_quote,
        });

        this.quote_table_view = new QuoteTableView({
            project: App.current_project,
            quote: App.current_quote,
            collection: App.current_quote.units,
            extras: App.current_quote.extras,
            display_options,
        });

        this.$el.append(this.units_table_view.render().el);
        this.ui.$controls_container.append(this.controls_view.render().el);
        this.ui.$header_container.append(this.quote_header_view.render().el);
        this.ui.$table_container.append(this.quote_table_view.render().el);
    },
    onBeforeDestroy() {
        this.controls_view.destroy();
        this.units_table_view.destroy();
        this.quote_header_view.destroy();
        this.quote_table_view.destroy();
    },
});
