var app = app || {};

(function () {
    'use strict';

    app.UnitsTableTotalPricesView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'units-table-total-prices',
        template: app.templates['core/units-table-total-prices-view'],
        initialize: function () {
            this.listenTo(this.options.units, 'change', this.render);
            this.listenTo(this.options.units, 'remove', this.render);
            this.listenTo(this.options.extras, 'change', this.render);
            this.listenTo(this.options.extras, 'remove', this.render);
        },
        serializeData: function () {
            var project_settings = app.settings ? app.settings.getProjectSettings() : undefined;
            var total_prices = this.model ? this.model.getTotalPrices() : undefined;
            var total_area = this.model ? this.model.units.getTotalSquareFeet() : undefined;
            var price_per_square_foot = this.model ? this.model.units.getAveragePricePerSquareFoot() : undefined;
            var f = app.utils.format;

            return {
                grand_total: total_prices ? f.price_usd(total_prices.grand_total) : '--',
                total_cost: total_prices ? f.price_usd(total_prices.total_cost) : '--',
                profit: total_prices ? f.price_usd(total_prices.profit) : '--',
                profit_percent: total_prices ? f.percent(Math.abs(total_prices.profit_percent), 0) : '--',
                is_profit_negative: total_prices && parseFloat(total_prices.profit) < 0,
                is_profit_above_threshold: total_prices && parseFloat(total_prices.profit_percent) > 50,
                is_price_estimated: project_settings && project_settings.get('pricing_mode') === 'estimates',
                total_area: total_area ? f.square_feet(total_area, 2, 'sup') : '--',
                price_per_square_foot: price_per_square_foot ? f.price_usd(price_per_square_foot) : '--'
            };
        }
    });
})();
