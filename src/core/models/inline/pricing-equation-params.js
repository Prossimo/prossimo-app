import _ from 'underscore';
import Backbone from 'backbone';

import Schema from '../../../schema';

const EQUATION_PROPERTIES = [
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'param_a', title: 'Param A', type: 'number' },
    { name: 'param_b', title: 'Param B', type: 'number' },
];

export default Backbone.Model.extend({
    schema: Schema.createSchema(EQUATION_PROPERTIES),
    defaults() {
        const defaults = {};

        _.each(EQUATION_PROPERTIES, function (item) {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        }, this);

        return defaults;
    },
    getDefaultValue(name, type) {
        let default_value = '';

        const type_value_hash = {
            number: 0,
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        return default_value;
    },
    //  TODO: this is probably how it should be implemented everywhere
    getAttributeType(attribute_name) {
        return (this.schema && this.schema[attribute_name].type) || undefined;
    },
    parse(data) {
        return Schema.parseAccordingToSchema(data, this.schema);
    },
    persist(...args) {
        return this.set(...args);
    },
});
