import _ from 'underscore';
import Backbone from 'backbone';

import Schema from '../../../schema';

const MULTIUNIT_SUBUNIT_PROPERTIES = [
    { name: 'unit_id', title: 'Unit ID', type: 'number' },
    { name: 'unit_cid', title: 'Unit client ID', type: 'string' },
];

export default Backbone.Model.extend({
    schema: Schema.createSchema(MULTIUNIT_SUBUNIT_PROPERTIES),
    defaults() {
        const defaults = {};

        MULTIUNIT_SUBUNIT_PROPERTIES.forEach((item) => {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        });

        return defaults;
    },
    getDefaultValue(name, type) {
        let default_value = '';

        const type_value_hash = {
            number: 0,
            array: [],
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        return default_value;
    },
    parse(data) {
        const parsed_data = Schema.parseAccordingToSchema(data, this.schema);
        const target_unit = this.getUnit(parsed_data.unit_id || parsed_data.unit_cid || parsed_data.id);

        if (!parsed_data.unit_id && parsed_data.id) {
            parsed_data.unit_id = parsed_data.id;
        }

        if (target_unit) {
            parsed_data.unit_cid = target_unit.cid;
        }

        return _.omit(parsed_data, 'id');
    },
    toJSON() {
        return this.get('unit_id');
    },
    persist(...args) {
        return this.set(...args);
    },
    //  Return { name: 'name', title: 'Title' } pairs for each item in
    //  `names` array. If the array is empty, return all possible pairs
    getNameTitleTypeHash(names) {
        const name_title_hash = [];

        if (!names) {
            names = _.pluck(MULTIUNIT_SUBUNIT_PROPERTIES, 'name');
        }

        _.each(MULTIUNIT_SUBUNIT_PROPERTIES, (item) => {
            if (_.indexOf(names, item.name) !== -1) {
                name_title_hash.push({ name: item.name, title: item.title, type: item.type });
            }
        });

        return name_title_hash;
    },
    getTitles(names) {
        const name_title_hash = this.getNameTitleTypeHash(names);

        return _.pluck(name_title_hash, 'title');
    },
    getUnitCollection() {
        return this.collection && this.collection.options.units;
    },
    getUnit(optional_id) {
        const target_id = optional_id || this.get('unit_id') || this.get('unit_cid');
        const unit_collection = this.getUnitCollection();

        return unit_collection && unit_collection.get(target_id);
    },
    invokeOnUnit(function_name, ...args) {
        const target_unit = this.getUnit();
        const hasFunction = target_unit && _.isFunction(target_unit[function_name]);

        return hasFunction ? target_unit[function_name](...args) : undefined;
    },
    isLinkingToUnit(unit_id) {
        return this.get('unit_id') === unit_id || this.get('unit_cid') === unit_id;
    },
    initialize(attributes, options) {
        this.options = options || {};
    },
});
