import Backbone from '../../backbone-extended';

import OptionsDictionary from '../models/options-dictionary';

export default Backbone.Collection.extend({
    model: OptionsDictionary,
    reorder_property_name: 'dictionaries',
    url: function () {
        return (this.options.api_base_path ? this.options.api_base_path : '') + '/dictionaries';
    },
    reorder_url: function () {
        return (this.options.api_base_path ? this.options.api_base_path : '') + '/reorder_dictionaries';
    },
    parse: function (data) {
        return data.dictionaries || data;
    },
    initialize: function (models, options) {
        this.options = options || {};
        this.proxy_dictionary = new OptionsDictionary(null, {proxy: true});
    },
    getNameTitleTypeHash: function (names) {
        return this.proxy_dictionary.getNameTitleTypeHash(names);
    },
    getTitles: function (names) {
        return this.proxy_dictionary.getTitles(names);
    },
    getAttributeType: function () {
        return this.proxy_dictionary.getAttributeType();
    }
});
