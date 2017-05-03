import Backbone from 'backbone';

import App from '../../../main';
import UnitOption from '../../models/inline/unit-option';

export default Backbone.Collection.extend({
    model: UnitOption,
    //  We sort items not by dictionary id, but by the order of
    //  dictionaries in their respective collection
    comparator(item) {
        const corresponding_dictionary = App.settings && App.settings.dictionaries &&
            App.settings.dictionaries.get(item.get('dictionary_id'));

        return corresponding_dictionary ? corresponding_dictionary.get('position') : Infinity;
    },
    getByDictionaryId(dictionary_id) {
        return this.findWhere({ dictionary_id });
    },
});
