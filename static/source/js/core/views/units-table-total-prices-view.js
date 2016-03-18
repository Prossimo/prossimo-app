var app = app || {};

(function () {
    'use strict';

    app.UnitsTableTotalPricesView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'units-table-total-prices',
        template: app.templates['core/units-table-total-prices-view'],
        initialize: function () {
            this.listenTo(this.options.units, 'change', this.render);
            this.listenTo(this.options.extras, 'change', this.render);
            this.listenTo(this.model, 'set_dependencies', this.render);
        },
        serializeData: function () {
            var total_prices = this.model ? this.model.getTotalPrices() : undefined;
            var f = app.utils.format;

            return {
                grand_total: total_prices ? f.price_usd(total_prices.grand_total) : '--',
                total_cost: total_prices ? f.price_usd(total_prices.total_cost) : '--',
                profit: total_prices ? f.price_usd(total_prices.profit) : '--',
                profit_percent: total_prices ? f.percent(Math.abs(total_prices.profit_percent), 0) : '--',
                is_profit_negative: total_prices && parseFloat(total_prices.profit) < 0,
                is_profit_above_threshold: total_prices && parseFloat(total_prices.profit_percent) > 50
            };
        }
    });
})();
