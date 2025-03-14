import Backbone from 'backbone';

import { object } from '../../../utils';
import PricingEquationParams from '../../models/inline/pricing-equation-params';

function getDefaultEquationCollection() {
    return [
        {
            name: 'fixed',
            param_a: 0,
            param_b: 0,
        },
        {
            name: 'operable',
            param_a: 0,
            param_b: 0,
        },
    ];
}

export default Backbone.Collection.extend({
    model: PricingEquationParams,
    parse(data) {
        const data_object = object.extractObjectOrNull(data);

        return data_object;
    },
    getByName(equation_name) {
        return this.findWhere({ name: equation_name });
    },
    initialize(attribures, options) {
        if (options.append_default_sets && this.length === 0) {
            this.set(getDefaultEquationCollection(), { parse: true });
        }
    },
});
