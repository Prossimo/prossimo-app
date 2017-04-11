var app = app || {};

(function () {
    'use strict';

    app.UnitsTableTotalPricesView = Marionette.View.extend({
        tagName: 'div',
        className: 'units-table-total-prices',
        template: app.templates['core/units-table-total-prices-view'],
        templateContext: function () {
            var total_prices = this.model ? this.model.getTotalPrices() : undefined;
            var total_area = this.model ? this.model.units.getTotalSquareFeet() : undefined;
            var price_per_square_foot = this.model ? this.model.units.getAveragePricePerSquareFoot() : undefined;
            var f = app.utils.format;

            return {
                grand_total: total_prices ? f.price_usd(total_prices.grand_total) : '--',
                total_cost: total_prices ? f.price_usd(total_prices.total_cost) : '--',
                gross_profit: total_prices ? f.price_usd(total_prices.gross_profit) : '--',
                net_profit: total_prices ? f.price_usd(total_prices.net_profit) : '--',
                net_profit_percent: total_prices ? f.percent(Math.abs(total_prices.net_profit_percent), 0) : '--',
                is_profit_negative: total_prices && parseFloat(total_prices.net_profit) < 0,
                is_profit_above_threshold: total_prices && parseFloat(total_prices.net_profit_percent) > 50,
                total_area: total_area ? f.square_feet(total_area, 2, 'sup') : '--',
                price_per_square_foot: price_per_square_foot ? f.price_usd(price_per_square_foot) : '--'
            };
        },
        initialize: function () {
            this.listenTo(this.options.units, 'change', this.render);
            this.listenTo(this.options.units, 'remove', this.render);
            this.listenTo(this.options.extras, 'change', this.render);
            this.listenTo(this.options.extras, 'remove', this.render);
        }
    });
})();
