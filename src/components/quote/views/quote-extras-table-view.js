import Marionette from 'backbone.marionette';

import { format } from '../../../utils';
import QuoteExtrasItemView from './quote-extras-item-view';
import template from '../templates/quote-extras-table-view.hbs';

export default Marionette.CompositeView.extend({
    template,
    childView: QuoteExtrasItemView,
    childViewContainer: '.quote-extras-table-body',
    childViewOptions() {
        return {
            type: this.options.type,
            show_price: this.options.show_price,
        };
    },
    filter(child) {
        return this.options.type === 'Optional' ?
            child.isOptionalType() :
            child.get('extras_type') === this.options.type;
    },
    initialize() {
        this.listenTo(this.collection, 'all', this.render);
    },
    getPriceColspan() {
        return this.options.show_price !== false ? 3 : 2;
    },
    getTotalPrices() {
        const total_price = this.options.type === 'Regular' ?
            this.collection.getRegularItemsPrice() :
            this.collection.getOptionalItemsPrice();

        return {
            total: format.price_usd(total_price),
        };
    },
    getItemsCount() {
        return this.options.type === 'Regular' ?
            this.collection.getRegularItems().length :
            this.collection.getOptionalItems().length;
    },
    hasAtLeastOneOptionalPercentBased() {
        let has_one = false;

        if (this.options.type === 'Optional') {
            this.collection.each((item) => {
                if (item.isOptionalType() && item.isPercentBasedType()) {
                    has_one = true;
                }
            });
        }

        return has_one;
    },
    templateContext() {
        return {
            items_count: this.getItemsCount(),
            price_colspan: this.getPriceColspan(),
            total_prices: this.getTotalPrices(),
            heading: this.options.type === 'Regular' ? 'Extras' : 'Optional Extras',
            is_optional: this.options.type === 'Optional',
            show_price: this.options.show_price !== false,
        };
    },
});
