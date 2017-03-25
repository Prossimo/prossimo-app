import Marionette from 'backbone.marionette';
import App from '../../../main';
import {format} from '../../../utils';
import QuoteExtrasItemView from './quote-extras-item-view';
import template from '../templates/quote-extras-table-view.hbs';

export default Marionette.CompositeView.extend({
    template: template,
    childView: QuoteExtrasItemView,
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
        var total_price = this.options.type === 'Regular' ?
            this.collection.getRegularItemsPrice() :
            this.collection.getOptionalItemsPrice();

        return {
            total: format.price_usd(total_price)
        };
    },
    getItemsCount: function () {
        return this.options.type === 'Regular' ?
            this.collection.getRegularItems().length :
            this.collection.getOptionalItems().length;
    },
    hasAtLeastOneOptionalPercentBased: function () {
        var has_one = false;

        if (this.options.type === 'Optional') {
            this.collection.each(function (item) {
                if (item.isOptionalType() && item.isPercentBasedType()) {
                    has_one = true;
                }
            });
        }

        return has_one;
    },
    templateContext: function () {
        return {
            items_count: this.getItemsCount(),
            price_colspan: this.getPriceColspan(),
            total_prices: this.getTotalPrices(),
            heading: this.options.type === 'Regular' ? 'Extras' : 'Optional Extras',
            is_optional: this.options.type === 'Optional',
            show_price: this.options.show_price !== false
        };
    }
});
