import _ from 'underscore';

export default {
    //  We expect source to be an array of objects in the following format:
    //  { name: 'attr_name', title: 'Attr Title', type: 'attrtype' }
    //  TODO: make sure all names have correct format and all types are
    //  among the list of allowed types (and have correct format as well)
    createSchema: function (properties_array) {
        var schema = {};

        _.each(properties_array, function (property) {
            schema[property.name] = {
                type: property.type,
                title: property.title
            };
        });

        return schema;
    },
    //  TODO: get rid of id in the list of attributes, replace
    //  item.get('id') with item.id everywhere in the app
    parseAccordingToSchema: function (model_data, schema, options) {
        var defaults = {
            allow_id: true
        };

        options = _.defaults({}, options, defaults);

        var allowed_properties = options.allow_id ?
            _.union(_.keys(schema), ['id']) :
            _.keys(schema);
        var parsed_data = {};

        _.each(model_data, function (value, key) {
            if (!_.isNull(value) && _.contains(allowed_properties, key)) {
                var parsed_value = value;

                if (schema[key] && schema[key].type === 'number') {
                    parsed_value = parseFloat(value);
                }

                parsed_data[key] = parsed_value;
            }
        });

        return parsed_data;
    }
};
