import Marionette from 'backbone.marionette';
import _ from 'underscore';

import {format} from '../../../utils';
import template from '../templates/quote-totals-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'quote-total-prices',
    template: template,
    templateContext: function () {
        var total_prices = this.model ? this.model.getTotalPrices() : undefined;
        var total_area = this.model ? this.model.units.getTotalSquareFeet() : undefined;
        var price_per_square_foot = this.model ? this.model.units.getAveragePricePerSquareFoot() : undefined;
        var total_unit_types = this.model ? this.model.units.getTotalUnitTypes() : undefined;
        var total_of_units = this.model ? this.model.units.getTotalUnitQuantity() : undefined;
        var unitsByProfile = this.model ? this.model.units.getUnitsByProfiles() : [];

        var table = _.map(unitsByProfile, function (item) {
            return {
                profile_name: item.profile.get('name') || '--',
                total_types: item.length,
                total_quantity: item.getTotalUnitQuantity(),
                total_area: format.square_feet(item.getTotalSquareFeet(), 2, 'sup'),
                price_per_square_foot: format.price_usd(item.getAveragePricePerSquareFoot())
            };
        });

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
            total_unit_types: total_unit_types || '--',
            total_of_units: total_of_units || '--',
            data_summary: table
        };
    }
});
