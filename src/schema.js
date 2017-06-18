import _ from 'underscore';

export default {
    //  We expect source to be an array of objects in the following format:
    //  { name: 'attr_name', title: 'Attr Title', type: 'attrtype' }
    //  TODO: make sure all names have correct format and all types are
    //  among the list of allowed types (and have correct format as well)
    createSchema(properties_array) {
        const schema = {};

        _.each(properties_array, (property) => {
            schema[property.name] = { ...property };
        });

        return schema;
    },
    //  TODO: get rid of id in the list of attributes, replace
    //  item.get('id') with item.id everywhere in the app
    parseAccordingToSchema(model_data, schema, options) {
        const defaults = {
            allow_id: true,
        };
        const current_options = _.defaults({}, options, defaults);
        const allowed_properties = current_options.allow_id ? _.union(_.keys(schema), ['id']) : _.keys(schema);
        const parsed_data = {};

        _.each(model_data, (value, key) => {
            if (!_.isNull(value) && _.contains(allowed_properties, key)) {
                let parsed_value = value;

                if (schema[key] && schema[key].type === 'number') {
                    parsed_value = parseFloat(value);
                }

                parsed_data[key] = parsed_value;
            }
        });

        return parsed_data;
    },
};
