var app = app || {};

(function () {
    'use strict';

    app.QuoteTableView = Marionette.CompositeView.extend({
        template: app.templates['quote/quote-table-view'],
        childView: app.QuoteItemView,
        childViewContainer: '.quote-table-body',
        reorderOnSort: true,
        ui: {
            $extras_table_container: '.quote-extras-table-container',
            $optional_extras_table_container: '.quote-optional-extras-table-container'
        },
        initialize: function () {
            this.listenTo(app.current_project.settings, 'change', this.render);
            //  TODO: this affects performance significantly. We need to
            //  fine-tune what parts of quote are updated when, don't redraw
            //  the whole thing
            this.listenTo(app.current_project.units, 'change', this.render);
            this.listenTo(app.current_project.extras, 'change', this.render);
        },
        childViewOptions: function () {
            return {
                extras: this.options.extras,
                project: this.options.project,
                show_price: this.options.show_price,
                show_customer_image: this.options.show_customer_image,
                show_outside_units_view: this.options.show_outside_units_view,
                show_sizes_in_mm: this.options.show_sizes_in_mm,
                show_supplier_system: this.options.show_supplier_system,
                show_supplier_filling_name: this.options.show_supplier_filling_name,
                force_european_hinge_indicators: this.options.force_european_hinge_indicators
            };
        },
        getTotalPrices: function () {
            var f = app.utils.format;
            var total_prices = this.options.project.getTotalPrices();

            return {
                subtotal_units: f.price_usd(total_prices.subtotal_units),
                subtotal_extras: f.price_usd(total_prices.subtotal_extras),
                subtotal_optional_extras: f.price_usd(total_prices.subtotal_optional_extras),
                subtotal: f.price_usd(total_prices.subtotal),
                tax_percent: total_prices.tax_percent ?
                    f.percent(total_prices.tax_percent) : false,
                tax: f.price_usd(total_prices.tax),
                shipping: f.price_usd(total_prices.shipping),
                grand_total: f.price_usd(total_prices.grand_total),
                deposit_percent: total_prices.deposit_percent ?
                    f.percent(total_prices.deposit_percent) : false,
                deposit_on_contract: f.price_usd(total_prices.deposit_on_contract),
                balance_due_at_delivery: f.price_usd(total_prices.balance_due_at_delivery)
            };
        },
        serializeData: function () {
            var project_settings = app.settings ? app.settings.getProjectSettings() : undefined;

            return {
                total_unit_types: this.collection.getTotalUnitTypes(),
                total_unit_quantity: this.collection.getTotalUnitQuantity(),
                has_extras: this.options.extras &&
                    this.options.extras.getRegularItems().length ||
                    this.options.extras.getOptionalItems().length,
                total_prices: this.getTotalPrices(),
                show_price: this.options.show_price !== false,
                is_price_estimated: project_settings && project_settings.get('pricing_mode') === 'estimates'
            };
        },
        onRender: function () {
            if ( this.serializeData().has_extras ) {
                this.quote_extras_table_view = new app.QuoteExtrasTableView({
                    collection: this.options.extras,
                    show_price: this.options.show_price,
                    type: 'Regular'
                });

                this.quote_optional_extras_table_view = new app.QuoteExtrasTableView({
                    collection: this.options.extras,
                    show_price: this.options.show_price,
                    type: 'Optional'
                });

                this.ui.$extras_table_container.append(this.quote_extras_table_view.render().el);
                this.ui.$optional_extras_table_container.append(this.quote_optional_extras_table_view.render().el);
            }
        },
        onDestroy: function () {
            if ( this.quote_extras_table_view ) {
                this.quote_extras_table_view.destroy();
            }

            if ( this.quote_optional_extras_table_view ) {
                this.quote_optional_extras_table_view.destroy();
            }
        }
    });
})();
