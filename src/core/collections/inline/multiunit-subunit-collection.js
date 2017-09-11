import Backbone from 'backbone';

import MultiunitSubunit from '../../models/inline/multiunit-subunit';

//  TODO: add comparator function that will order things by position
//  of the linked unit in the global units table, add test for that
export default Backbone.Collection.extend({
    model: MultiunitSubunit,
    getByUnitId(unit_id_or_cid) {
        return this.findWhere({ unit_id: unit_id_or_cid }) || this.findWhere({ unit_cid: unit_id_or_cid });
    },
    initialize(models, options) {
        this.options = options || {};
    },
});
