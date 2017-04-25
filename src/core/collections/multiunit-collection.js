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
    initialize(models, options) {
        this.options = options || {};
        this.proxy_unit = new Multiunit(null, { proxy: true });

        if (this.options.subunits) {
            this.subunits = this.options.subunits;
        }

        if (this.subunits) {
            this.subunits.multiunits = this;
        }

        //  When parent quote is fully loaded, we validate multiunit positions
        this.listenTo(this.options.quote, 'fully_loaded', this.validatePositions);
    },
});
