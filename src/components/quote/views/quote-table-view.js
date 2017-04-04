import Marionette from 'backbone.marionette';

import App from '../../../main';
import {format} from '../../../utils';
import QuoteItemView from './quote-item-view';
import QuoteExtrasTableView from './quote-extras-table-view';
import template from '../templates/quote-table-view.hbs';

export default Marionette.CompositeView.extend({
    template: template,
    childView: QuoteItemView,
    childViewContainer: '.quote-table-body',
    reorderOnSort: true,
    ui: {
        $extras_table_container: '.quote-extras-table-container',
        $optional_extras_table_container: '.quote-optional-extras-table-container'
    },
    initialize: function () {
        this.listenTo(App.current_project.settings, 'change', this.render);
        this.listenTo(this.collection, 'change', this.render);
        this.listenTo(this.options.extras, 'change', this.render);
    },
    childViewOptions: function () {
        return {
            extras: this.options.extras,
            project: this.options.project,
            quote: this.options.quote,
            show_price: this.options.show_price,
            show_customer_image: this.options.show_customer_image,
            show_outside_units_view: this.options.show_outside_units_view,
            show_sizes_in_mm: this.options.show_sizes_in_mm,
            show_supplier_system: this.options.show_supplier_system,
            show_supplier_names: this.options.show_supplier_names,
            force_european_hinge_indicators: this.options.force_european_hinge_indicators
        };
    },
    getTotalPrices: function () {
        var total_prices = this.options.quote.getTotalPrices();

        return {
            subtotal_units: format.price_usd(total_prices.subtotal_units),
            subtotal_extras: format.price_usd(total_prices.subtotal_extras),
            subtotal_optional_extras: format.price_usd(total_prices.subtotal_optional_extras),
            subtotal: format.price_usd(total_prices.subtotal),
            tax_percent: total_prices.tax_percent ?
                format.percent(total_prices.tax_percent) : false,
            tax: format.price_usd(total_prices.tax),
            shipping: format.price_usd(total_prices.shipping),
            grand_total: format.price_usd(total_prices.grand_total),
            deposit_percent: total_prices.deposit_percent ?
                format.percent(total_prices.deposit_percent) : false,
            deposit_on_contract: format.price_usd(total_prices.deposit_on_contract),
            balance_due_at_delivery: format.price_usd(total_prices.balance_due_at_delivery)
        };
    },
    templateContext: function () {
        return {
            total_unit_types: this.collection.getTotalUnitTypes(),
            total_unit_quantity: this.collection.getTotalUnitQuantity(),
            has_extras: this.options.extras &&
                this.options.extras.getRegularItems().length ||
                this.options.extras.getOptionalItems().length,
            total_prices: this.getTotalPrices(),
            show_price: this.options.show_price !== false
        };
    },
    onRender: function () {
        if (this.templateContext().has_extras) {
            this.quote_extras_table_view = new QuoteExtrasTableView({
                collection: this.options.extras,
                show_price: this.options.show_price,
                type: 'Regular'
            });

            this.quote_optional_extras_table_view = new QuoteExtrasTableView({
                collection: this.options.extras,
                show_price: this.options.show_price,
                type: 'Optional'
            });

            this.ui.$extras_table_container.append(this.quote_extras_table_view.render().el);
            this.ui.$optional_extras_table_container.append(this.quote_optional_extras_table_view.render().el);
        }
    },
    onBeforeDestroy: function () {
        if (this.quote_extras_table_view) {
            this.quote_extras_table_view.destroy();
        }

        if (this.quote_optional_extras_table_view) {
            this.quote_optional_extras_table_view.destroy();
        }
    }
});
