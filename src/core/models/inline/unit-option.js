import _ from 'underscore';
import Backbone from 'backbone';
import Schema from '../../../schema';

var UNIT_OPTION_PROPERTIES = [
    {name: 'dictionary_id', title: 'Dictionary ID', type: 'number'},
    {name: 'dictionary_entry_id', title: 'Dictionary Entry ID', type: 'number'},
    {name: 'quantity', title: 'Quantity', type: 'number'}
];

export default Backbone.Model.extend({
    schema: Schema.createSchema(UNIT_OPTION_PROPERTIES),
    defaults: function () {
        var defaults = {};

        _.each(UNIT_OPTION_PROPERTIES, function (item) {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        }, this);

        return defaults;
    },
    getDefaultValue: function (name, type) {
        var default_value = '';

        var type_value_hash = {
            number: 0
        };

        var name_value_hash = {
            quantity: 1
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    parse: function (data) {
        var parsed_data = Schema.parseAccordingToSchema(data, this.schema, {
            allow_id: false
        });

        return parsed_data;
    },
    persist: function () {
        return this.set.apply(this, arguments);
    },
    //  Return { name: 'name', title: 'Title' } pairs for each item in
    //  `names` array. If the array is empty, return all possible pairs
    getNameTitleTypeHash: function (names) {
        var name_title_hash = [];

        if (!names) {
            names = _.pluck(UNIT_OPTION_PROPERTIES, 'name');
        }

        _.each(UNIT_OPTION_PROPERTIES, function (item) {
            if (_.indexOf(names, item.name) !== -1) {
                name_title_hash.push({name: item.name, title: item.title, type: item.type});
            }
        });

        return name_title_hash;
    },
    getTitles: function (names) {
        var name_title_hash = this.getNameTitleTypeHash(names);

        return _.pluck(name_title_hash, 'title');
    },
    initialize: function (attributes, options) {
        this.options = options || {};
    }
});
