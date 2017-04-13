import Marionette from 'backbone.marionette';

import { format } from '../../utils';
import templates from '../../templates/core/units-table-total-prices-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'units-table-total-prices',
    template: templates,
    templateContext() {
        const total_prices = this.model ? this.model.getTotalPrices() : undefined;
        const total_area = this.model ? this.model.units.getTotalSquareFeet() : undefined;
        const price_per_square_foot = this.model ? this.model.units.getAveragePricePerSquareFoot() : undefined;

        return {
            grand_total: total_prices ? format.price_usd(total_prices.grand_total) : '--',
            total_cost: total_prices ? format.price_usd(total_prices.total_cost) : '--',
            gross_profit: total_prices ? format.price_usd(total_prices.gross_profit) : '--',
            net_profit: total_prices ? format.price_usd(total_prices.net_profit) : '--',
            net_profit_percent: total_prices ? format.percent(Math.abs(total_prices.net_profit_percent), 0) : '--',
            is_profit_negative: total_prices && parseFloat(total_prices.net_profit) < 0,
            is_profit_above_threshold: total_prices && parseFloat(total_prices.net_profit_percent) > 50,

            total_area: total_area ? format.square_feet(total_area, 2, 'sup') : '--',
            price_per_square_foot: price_per_square_foot ? format.price_usd(price_per_square_foot) : '--',
        };
    },
    initialize() {
        this.listenTo(this.options.units, 'change', this.render);
        this.listenTo(this.options.units, 'remove', this.render);
        this.listenTo(this.options.extras, 'change', this.render);
        this.listenTo(this.options.extras, 'remove', this.render);
    },
});
