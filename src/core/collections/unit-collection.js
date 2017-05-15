import _ from 'underscore';
import Backbone from 'backbone';

import App from '../../main';
import Unit from '../models/unit';

export default Backbone.Collection.extend({
    model: Unit,
    reorder_property_name: 'units',
    url() {
        const project_id = this.options.project && this.options.project.get('id');
        const quote_id = this.options.quote && this.options.quote.get('id');

        return `${App.settings.get('api_base_path')
            }/projects/${project_id
            }/quotes/${quote_id}/units`;
    },
    reorder_url() {
        const project_id = this.options.project && this.options.project.get('id');
        const quote_id = this.options.quote && this.options.quote.get('id');

        return `${App.settings.get('api_base_path')
            }/projects/${project_id
            }/quotes/${quote_id}/reorder_units`;
    },
    initialize(models, options) {
        this.options = options || {};
        this.proxy_unit = new Unit(null, { proxy: true });

        if (this.options.profile) {
            this.profile = this.options.profile;
        }

        //  When parent quote is fully loaded, we validate unit positions
        this.listenTo(this.options.quote, 'fully_loaded', this.validatePositions);
    },
    getNameTitleTypeHash(names) {
        return this.proxy_unit.getNameTitleTypeHash(names);
    },
    getTitles(names) {
        return this.proxy_unit.getTitles(names);
    },
    getSubtotalPrice() {
        let total_price = 0;

        this.each((item) => {
            total_price += item.getSubtotalPrice();
        });

        return total_price;
    },
    getSubtotalPriceDiscounted() {
        let total_price = 0;

        this.each((item) => {
            total_price += item.getSubtotalPriceDiscounted();
        });

        return total_price;
    },
    getSubtotalCost() {
        let total_cost = 0;

        this.each((item) => {
            total_cost += item.getSubtotalCost();
        });

        return total_cost;
    },
    getSubtotalCostDiscounted() {
        let total_cost = 0;

        this.each((item) => {
            total_cost += item.getSubtotalCostDiscounted();
        });

        return total_cost;
    },
    hasAtLeastOneCustomerImage() {
        return this.any(item => item.get('customer_image') !== '');
    },
    /**
     * Return length of the collection
     * @return {Number} length of the collection or 0
     */
    getTotalUnitTypes() {
        return this.length;
    },
    /**
     * Return sum all "quantity" of the collection
     * @returns {Number} sum all "quantity" of the collection or 0
     */
    getTotalUnitQuantity() {
        let total_quantity = 0;

        this.each((item) => {
            if (item.get('quantity')) {
                total_quantity += parseFloat(item.get('quantity'));
            }
        }, this);

        return total_quantity;
    },
    /**
     * Return units by profiles
     * @returns {Array.<Backbone.Collection>} аn array of collections with units or empty array
     */
    getUnitsByProfiles() {
        return _.map(this.groupBy('profile_id'), (units, profile_id) => new this.constructor(units, {
            model: this.model,
            comparator: this.comparator,
            profile: App.settings.getProfileByIdOrDummy(profile_id),
        }));
    },
    /**
     * Return sum all squares of the models
     * @returns {Number} sum all squares of the models or 0
     */
    getTotalSquareFeet() {
        let total_area = 0;

        this.each((item) => {
            total_area += item.getTotalSquareFeet();
        });

        return total_area;
    },
    getAveragePricePerSquareFoot() {
        const total_area = this.getTotalSquareFeet();
        const total_price = this.getSubtotalPriceDiscounted();

        return total_area ? total_price / total_area : 0;
    },
});
