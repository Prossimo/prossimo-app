var app = app || {};

(function () {
    'use strict';

    app.QuoteExtrasTableView = Marionette.CompositeView.extend({
        template: app.templates['quote/quote-extras-table-view'],
        childView: app.QuoteExtrasItemView,
        childViewContainer: '.quote-extras-table-body',
        childViewOptions: function () {
            return {
                type: this.options.type,
                show_price: this.options.show_price
            };
        },
        filter: function (child) {
            return this.options.type === 'Optional' ?
                child.isOptionalType() :
                child.get('extras_type') === this.options.type;
        },
        initialize: function () {
            this.listenTo(this.collection, 'all', this.render);
        },
        getPriceColspan: function () {
            return this.options.show_price !== false ? 3 : 2;
        },
        getTotalPrices: function () {
            var f = app.utils.format;
            var total_price = this.options.type === 'Regular' ?
                this.collection.getRegularItemsPrice() :
                this.collection.getOptionalItemsPrice();

            return {
                total: f.price_usd(total_price)
            };
        },
        getItemsCount: function () {
            return this.options.type === 'Regular' ?
                this.collection.getRegularItems().length :
                this.collection.getOptionalItems().length;
        },
        hasAtLeastOneOptionalPercentBased: function () {
            var has_one = false;

            if ( this.options.type === 'Optional' ) {
                this.collection.each(function (item) {
                    if ( item.isOptionalType() && item.isPercentBasedType() ) {
                        has_one = true;
                    }
                });
            }

            return has_one;
        },
        serializeData: function () {
            var project_settings = app.settings ? app.settings.getProjectSettings() : undefined;

            return {
                items_count: this.getItemsCount(),
                price_colspan: this.getPriceColspan(),
                total_prices: this.getTotalPrices(),
                heading: this.options.type === 'Regular' ? 'Extras' : 'Optional Extras',
                is_optional: this.options.type === 'Optional',
                show_price: this.options.show_price !== false,
                is_price_estimated: project_settings && project_settings.get('pricing_mode') === 'estimates' &&
                    this.hasAtLeastOneOptionalPercentBased()
            };
        }
    });
})();
