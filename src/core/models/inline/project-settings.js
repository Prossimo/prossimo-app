import _ from 'underscore';
import Backbone from 'backbone';

import Schema from '../../../schema';

const PROJECT_SETTINGS_PROPERTIES = [
    { name: 'inches_display_mode', title: 'Inches Display Mode', type: 'string' },
    { name: 'hinge_indicator_mode', title: 'Hinge Indicator Mode', type: 'string' },
    { name: 'show_drawings_in_quote', title: 'Show Drawings in Quote', type: 'string' },
];

const INCHES_DISPLAY_MODES = [
    { value: 'feet_and_inches', title: 'Feet + Inches' },
    { value: 'inches_only', title: 'Inches Only' },
];

const HINGE_INDICATOR_MODES = [
    { value: 'american', title: 'American' },
    { value: 'european', title: 'European' },
];

const SHOW_DRAWINGS_IN_QUOTE_OPTIONS = [
    { value: true, title: 'Yes' },
    { value: false, title: 'No' },
];

export default Backbone.Model.extend({
    schema: Schema.createSchema(PROJECT_SETTINGS_PROPERTIES),
    defaults() {
        const defaults = {};

        _.each(PROJECT_SETTINGS_PROPERTIES, (item) => {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        });

        return defaults;
    },
    getDefaultValue(name, type) {
        let default_value = '';

        const type_value_hash = {
            number: 0,
        };

        const name_value_hash = {
            inches_display_mode: INCHES_DISPLAY_MODES[0].value,
            hinge_indicator_mode: HINGE_INDICATOR_MODES[0].value,
            show_drawings_in_quote: SHOW_DRAWINGS_IN_QUOTE_OPTIONS[0].value,
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    persist(...args) {
        return this.set(...args);
    },
    parse(data) {
        const settings_data = data && data.settings ? data.settings : data;

        return Schema.parseAccordingToSchema(settings_data, this.schema);
    },
    //  Return { name: 'name', title: 'Title' } pairs for each item in
    //  `names` array. If the array is empty, return all possible pairs
    getNameTitleTypeHash(names) {
        const selected_names = names || _.pluck(PROJECT_SETTINGS_PROPERTIES, 'name');
        const name_title_hash = [];

        _.each(PROJECT_SETTINGS_PROPERTIES, (item) => {
            if (_.indexOf(selected_names, item.name) !== -1) {
                name_title_hash.push({ name: item.name, title: item.title, type: item.type });
            }
        });

        return name_title_hash;
    },
    getPossibleValuesHash() {
        return {
            inches_display_mode: INCHES_DISPLAY_MODES,
            hinge_indicator_mode: HINGE_INDICATOR_MODES,
            show_drawings_in_quote: SHOW_DRAWINGS_IN_QUOTE_OPTIONS,
        };
    },
    getReadableValue(attribute_name) {
        const possible_values = this.getPossibleValuesHash();
        let result;

        if (attribute_name in possible_values) {
            const attribute_value = this.get(attribute_name);
            result = possible_values[attribute_name].find(element => element.value === attribute_value);
        }

        return (result && result.title) || '';
    },
    getTitles(names) {
        const name_title_hash = this.getNameTitleTypeHash(names);

        return _.pluck(name_title_hash, 'title');
    },
    initialize(attributes, options) {
        this.options = options || {};
    },
});
