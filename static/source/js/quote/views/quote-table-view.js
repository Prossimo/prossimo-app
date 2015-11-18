var app = app || {};

(function () {
    'use strict';

    app.QuoteTableView = Marionette.CompositeView.extend({
        template: app.templates['quote/quote-table-view'],
        childView: app.QuoteItemView,
        childViewContainer: '.quote-table-body',
        ui: {
            '$extras_table_container': '.quote-extras-table-container',
            '$optional_extras_table_container': '.quote-optional-extras-table-container'
        },
        childViewOptions: function () {
            return {
                extras: this.options.extras,
                project: this.options.project,
                show_price: this.options.show_price
            };
        },
        initialize: function () {
            this.listenTo(this.collection, 'all', this.render);
            this.listenTo(this.options.extras, 'all', this.render);
        },
        getQuoteTableAttributes: function () {
            var name_title_hash = {
                ref: 'Ref.',
                customer_image: 'Customer Image',
                product_image: 'Shop Drawing',
                product_description: 'Product Description',
                quantity: 'Quantity'
            };

             if ( this.options.show_price !== false ) {
                name_title_hash.price = 'Price';
            }

            var table_attributes = _.map(name_title_hash, function (item, key) {
                return { name: key, title: item };
            }, this);

            return table_attributes;
        },
        getTotalPrices: function () {
            var f = app.utils.format;
            var total_prices = this.options.project.getTotalPrices();

            return {
                subtotal_units: f.price_usd(total_prices.subtotal_units),
                subtotal_units_with_hidden: f.price_usd(total_prices.subtotal_units_with_hidden),
                subtotal_extras: f.price_usd(total_prices.subtotal_extras),
                subtotal_optional_extras: f.price_usd(total_prices.subtotal_optional_extras),
                subtotal: f.price_usd(total_prices.subtotal),
                tax_percent: f.percent(total_prices.tax_percent),
                tax: f.price_usd(total_prices.tax),
                shipping: f.price_usd(total_prices.shipping),
                grand_total: f.price_usd(total_prices.grand_total)
            };
        },
        serializeData: function () {
            return {
                table_attributes: this.getQuoteTableAttributes(),
                has_extras: this.options.extras &&
                    this.options.extras.getRegularItems().length ||
                    this.options.extras.getOptionalItems().length,
                price_colspan: this.getQuoteTableAttributes().length - 1,
                total_prices: this.getTotalPrices(),
                show_price: this.options.show_price !== false
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
            if ( this.serializeData().has_extras ) {
                this.quote_extras_table_view.destroy();
                this.quote_optional_extras_table_view.destroy();
            }
        }
    });
})();
