import _ from 'underscore';
import Backbone from 'backbone';

import App from '../../main';
import Accessory from '../models/accessory';

//  Helper function. Get total price for the subset of collection
function getPrice(collection) {
    let total_price = 0;

    _.each(collection, (item) => {
        total_price += item.getSubtotalPriceDiscounted();
    });

    return total_price;
}

export default Backbone.Collection.extend({
    model: Accessory,
    reorder_property_name: 'accessories',
    url() {
        return `${App.settings.get('api_base_path')
            }/projects/${this.options.project.get('id')
            }/quotes/${this.options.quote.get('id')}/accessories`;
    },
    reorder_url() {
        return `${App.settings.get('api_base_path')
            }/projects/${this.options.project.get('id')
            }/quotes/${this.options.quote.get('id')}/reorder_accessories`;
    },
    initialize(models, options) {
        this.options = options || {};
        this.proxy_accessory = new Accessory(null, { proxy: true });

        //  When parent quote is fully loaded, we validate positions
        this.listenTo(this.options.quote, 'fully_loaded', this.validatePositions);
        this.on('loaded', this.addDefaultShipping, this);
    },
    //  Add new `Shipping` item if there's no shipping yet
    addDefaultShipping() {
        if (!this.findWhere({ extras_type: 'Shipping' })) {
            this.add(new Accessory({
                description: 'Shipping',
                extras_type: 'Shipping',
            }));
        }
    },
    getNameTitleTypeHash(names) {
        return this.proxy_accessory.getNameTitleTypeHash(names);
    },
    getTitles(names) {
        return this.proxy_accessory.getTitles(names);
    },
    getExtrasTypes() {
        return this.proxy_accessory.getExtrasTypes();
    },
    getRegularItems() {
        return this.models.filter(item => item.get('extras_type') === 'Regular');
    },
    getOptionalItems() {
        return this.models.filter(item => item.isOptionalType());
    },
    getOptionalPercentBasedItems() {
        return this.models.filter(item => item.get('extras_type') === 'Optional, %');
    },
    getHiddenItems() {
        return this.models.filter(item => item.get('extras_type') === 'Hidden');
    },
    getShipping() {
        return this.models.filter(item => item.get('extras_type') === 'Shipping');
    },
    getTaxes() {
        return this.models.filter(item => item.get('extras_type') === 'Tax');
    },
    getRegularItemsCost() {
        let total_cost = 0;

        _.each(this.getRegularItems(), (item) => {
            total_cost += item.getSubtotalCost();
        });

        return total_cost;
    },
    getRegularItemsPrice() {
        return getPrice(this.getRegularItems());
    },
    getOptionalItemsPrice() {
        return getPrice(this.getOptionalItems());
    },
    getHiddenPrice() {
        return getPrice(this.getHiddenItems());
    },
    getShippingPrice() {
        return getPrice(this.getShipping());
    },
    getTotalTaxPercent() {
        let base_value = 0;

        _.each(this.getTaxes(), (item) => {
            base_value += item.getMarkupPercent();
        });

        return base_value;
    },
});
