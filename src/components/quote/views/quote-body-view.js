import _ from 'underscore';
import Marionette from 'backbone.marionette';

import App from '../../../main';
import { format } from '../../../utils';
import QuoteMultiunitsTableView from './quote-multiunits-table-view';
import QuoteUnitsTableView from './quote-units-table-view';
import QuoteExtrasTableView from './quote-extras-table-view';
import template from '../templates/quote-body-view.hbs';

export default Marionette.View.extend({
    template,
    ui: {
        $quote_table_body: '.quote-table-body',
        $extras_table_container: '.quote-extras-table-container',
        $optional_extras_table_container: '.quote-optional-extras-table-container',
    },
    initialize(options) {
        const default_display_options = {
            show_price: true,
            show_customer_image_and_description: true,
            show_outside_units_view: true,
            show_sizes_in_mm: false,
            show_supplier_names: false,
            show_european_hinge_indicators: false,
        };

        this.display_options = _.extend({}, default_display_options, options.display_options);

        this.listenTo(App.current_project.settings, 'change', this.render);
        this.listenTo(this.options.multiunits, 'change', this.render);
        this.listenTo(this.options.units, 'change', this.render);
        this.listenTo(this.options.extras, 'change', this.render);
    },
    getTotalPrices() {
        const total_prices = this.options.quote.getTotalPrices();

        return {
            subtotal_units: format.price_usd(total_prices.subtotal_units),
            subtotal_extras: format.price_usd(total_prices.subtotal_extras),
            subtotal_optional_extras: format.price_usd(total_prices.subtotal_optional_extras),
            subtotal: format.price_usd(total_prices.subtotal),
            tax_percent: total_prices.tax_percent ?
                format.percent(total_prices.tax_percent, 3) : false,
            tax: format.price_usd(total_prices.tax),
            shipping: format.price_usd(total_prices.shipping),
            grand_total: format.price_usd(total_prices.grand_total),
            deposit_percent: total_prices.deposit_percent ?
                format.percent(total_prices.deposit_percent) : false,
            deposit_on_contract: format.price_usd(total_prices.deposit_on_contract),
            balance_due_at_delivery: format.price_usd(total_prices.balance_due_at_delivery),
        };
    },
    templateContext() {
        return {
            total_unit_types: this.options.units.getTotalUnitTypes(),
            total_unit_quantity: this.options.units.getTotalUnitQuantity(),
            has_multiunits: this.options.multiunits && this.options.multiunits.length,
            has_extras: (this.options.extras && this.options.extras.getRegularItems().length) ||
                this.options.extras.getOptionalItems().length,
            total_prices: this.getTotalPrices(),
            show_price: this.display_options.show_price !== false,
        };
    },
    onRender() {
        if (this.templateContext().has_multiunits) {
            this.quote_multiunits_table_view = new QuoteMultiunitsTableView({
                project: this.options.project,
                quote: this.options.quote,
                units: this.options.units,
                collection: this.options.multiunits,
                display_options: this.display_options,
            });

            this.ui.$quote_table_body.append(this.quote_multiunits_table_view.render().el);
        }

        //  We filter out subunits, because we show them in multiunits table
        this.quote_units_table_view = new QuoteUnitsTableView({
            project: this.options.project,
            quote: this.options.quote,
            collection: this.options.units,
            filter: child => !child.isSubunit(),
            display_options: this.display_options,
        });

        this.ui.$quote_table_body.append(this.quote_units_table_view.render().el);

        if (this.templateContext().has_extras) {
            this.quote_extras_table_view = new QuoteExtrasTableView({
                collection: this.options.extras,
                show_price: this.display_options.show_price,
                type: 'Regular',
            });

            this.quote_optional_extras_table_view = new QuoteExtrasTableView({
                collection: this.options.extras,
                show_price: this.display_options.show_price,
                type: 'Optional',
            });

            this.ui.$extras_table_container.append(this.quote_extras_table_view.render().el);
            this.ui.$optional_extras_table_container.append(this.quote_optional_extras_table_view.render().el);
        }
    },
    onBeforeDestroy() {
        if (this.quote_multiunits_table_view) {
            this.quote_multiunits_table_view.destroy();
        }

        if (this.quote_units_table_view) {
            this.quote_units_table_view.destroy();
        }

        if (this.quote_extras_table_view) {
            this.quote_extras_table_view.destroy();
        }

        if (this.quote_optional_extras_table_view) {
            this.quote_optional_extras_table_view.destroy();
        }
    },
});
