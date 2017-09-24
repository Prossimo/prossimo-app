import Backbone from 'backbone';

import UnitOption from '../../models/inline/unit-option';

export default Backbone.Collection.extend({
    model: UnitOption,
    //  We sort items not by dictionary id, but by the order of
    //  dictionaries in their respective collection
    comparator(item) {
        const corresponding_dictionary = this.options.dictionaries && this.options.dictionaries.get(item.get('dictionary_id'));

        return corresponding_dictionary ? corresponding_dictionary.get('position') : Infinity;
    },
    initialize(models, options) {
        this.options = options || {};
    },
    getByDictionaryId(dictionary_id) {
        return this.findWhere({ dictionary_id });
    },
});
