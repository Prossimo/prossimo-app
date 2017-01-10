import Marionette from 'backbone.marionette';
import App from '../../../main';
import _ from 'underscore';
import {format} from '../../../utils';
import template from '../templates/project-totals-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'project-total-prices',
    template: template,
    initialize: function () {
        this.listenTo(App.current_project.settings, 'change', this.render);
    },
    templateContext: function () {
        var project_settings = App.settings ? App.settings.getProjectSettings() : undefined;
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
            profit: total_prices ? format.price_usd(total_prices.profit) : '--',
            profit_percent: total_prices ? format.percent(Math.abs(total_prices.profit_percent), 0) : '--',
            is_profit_negative: total_prices && parseFloat(total_prices.profit) < 0,
            is_profit_above_threshold: total_prices && parseFloat(total_prices.profit_percent) > 50,
            is_price_estimated: project_settings && project_settings.get('pricing_mode') === 'estimates',
            total_area: total_area ? format.square_feet(total_area, 2, 'sup') : '--',
            price_per_square_foot: price_per_square_foot ? format.price_usd(price_per_square_foot) : '--',
            total_unit_types: total_unit_types ? total_unit_types : '--',
            total_of_units: total_of_units ? total_of_units : '--',
            data_summary: table
        };
    }
});
