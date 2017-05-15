import App from '../../main';
import Multiunit from '../models/multiunit';
import UnitCollection from './unit-collection';

export default UnitCollection.extend({
    model: Multiunit,
    reorder_property_name: 'multiunits',
    url() {
        return `${App.settings.get('api_base_path')
            }/projects/${this.options.project.get('id')
            }/quotes/${this.options.quote.get('id')}/multiunits`;
    },
    reorder_url() {
        return `${App.settings.get('api_base_path')
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

        //  When parent quote is fully loaded, we validate multiunit positions
        this.listenTo(this.options.quote, 'fully_loaded', this.validatePositions);
    },
});
