import _ from 'underscore';
import Backbone from 'backbone';

import Schema from '../../../schema';

var EQUATION_PROPERTIES = [
    {name: 'name', title: 'Name', type: 'string'},
    {name: 'param_a', title: 'Param A', type: 'number'},
    {name: 'param_b', title: 'Param B', type: 'number'}
];

export default Backbone.Model.extend({
    schema: Schema.createSchema(EQUATION_PROPERTIES),
    defaults: function () {
        var defaults = {};

        _.each(EQUATION_PROPERTIES, function (item) {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        }, this);

        return defaults;
    },
    getDefaultValue: function (name, type) {
        var default_value = '';

        var type_value_hash = {
            number: 0
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        return default_value;
    },
    //  TODO: this is probably how it should be implemented everywhere
    getAttributeType: function (attribute_name) {
        return this.schema && this.schema[attribute_name].type || undefined;
    },
    parse: function (data) {
        return Schema.parseAccordingToSchema(data, this.schema);
    },
    persist: function () {
        return this.set.apply(this, arguments);
    }
});
