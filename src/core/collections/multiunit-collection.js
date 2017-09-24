import Multiunit from '../models/multiunit';
import UnitCollection from './unit-collection';

export default UnitCollection.extend({
    model: Multiunit,
    reorder_property_name: 'multiunits',
    url() {
        return `${this.data_store && this.data_store.get('api_base_path')
            }/projects/${this.options.project.get('id')
            }/quotes/${this.options.quote.get('id')}/multiunits`;
    },
    reorder_url() {
        return `${this.data_store && this.data_store.get('api_base_path')
            }/projects/${this.options.project.get('id')
            }/quotes/${this.options.quote.get('id')}/reorder_multiunits`;
    },
    getParentForSubunit(unit_model) {
        const parent_multiunit = this.find(multiunit => multiunit.hasSubunit(unit_model));

        return parent_multiunit;
    },
    isSubunit(unit_model) {
        return !!this.getParentForSubunit(unit_model);
    },
    initialize(models, options) {
        this.options = options || {};
        this.proxy_unit = new Multiunit(null, { proxy: true });
        this.data_store = this.options.data_store;

        //  When parent quote is fully loaded, we validate multiunit positions
        this.listenTo(this.options.quote, 'fully_loaded', this.validatePositions);
    },
});
