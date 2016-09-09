var app = app || {};

(function () {
    'use strict';

    var BASE_TYPES = [
        { name: 'glass', title: 'Glass', weight: 0.2 },
        { name: 'recessed', title: 'Recessed', weight: 1.3 },
        { name: 'interior-flush-panel', title: 'Interior Flush Panel', weight: 0.4 },
        { name: 'exterior-flush-panel', title: 'Exterior Flush Panel', weight: 0.5 },
        { name: 'full-flush-panel', title: 'Full Flush Panel', weight: 0.6 },
        { name: 'louver', title: 'Louver', weight: 0.7 }
    ];

    var FILLING_TYPE_PROPERTIES = [
        { name: 'name', title: 'Prossimo Name', type: 'string' },
        { name: 'supplier_name', title: 'Supplier Name', type: 'string' },
        { name: 'type', title: 'Type', type: 'string' },
        { name: 'is_base_type', title: 'Is Base Type', type: 'boolean' },
        { name: 'position', title: 'Position', type: 'number' },
        { name: 'weight', title: 'Weight (kg/m2)', type: 'float' }
    ];

    app.FillingType = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(FILLING_TYPE_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getNameAttribute: function () {
            return 'name';
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            var type_value_hash = {
                number: 0,
                boolean: false
            };

            var name_value_hash = {
                type: this.getBaseTypes()[0].name
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        save: function () {
            return Backbone.Model.prototype.saveAndGetId.apply(this, arguments);
        },
        sync: function (method, model, options) {
            var properties_to_omit = ['id', 'is_base_type'];

            if ( method === 'create' || method === 'update' ) {
                options.attrs = { filling_type: _.omit(model.toJSON(), properties_to_omit) };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        initialize: function (attributes, options) {
            this.options = options || {};
        },
        validate: function (attributes, options) {
            var error_obj = null;
            var collection_names = this.collection && _.map(this.collection.without(this), function (item) {
                return item.get('name');
            });

            //  We want to have unique profile names across the collection
            if ( options.validate && collection_names &&
                _.contains(collection_names, attributes.name)
            ) {
                return {
                    attribute_name: 'name',
                    error_message: 'Filling type name "' + attributes.name + '" is already used in this collection'
                };
            }

            //  Simple type validation for numbers and booleans
            _.find(attributes, function (value, key) {
                var attribute_obj = this.getNameTitleTypeHash([key]);

                attribute_obj = attribute_obj.length === 1 ? attribute_obj[0] : null;

                if ( attribute_obj && attribute_obj.type === 'number' &&
                    (!_.isNumber(value) || _.isNaN(value))
                ) {
                    error_obj = {
                        attribute_name: key,
                        error_message: attribute_obj.title + ' can\'t be set to "' + value + '", it should be a number'
                    };

                    return false;
                } else if ( attribute_obj && attribute_obj.type === 'boolean' && !_.isBoolean(value) ) {
                    error_obj = {
                        attribute_name: key,
                        error_message: attribute_obj.title + ' can\'t be set to "' + value + '", it should be a boolean'
                    };

                    return false;
                }
            }, this);

            if ( options.validate && error_obj ) {
                return error_obj;
            }
        },
        hasOnlyDefaultAttributes: function () {
            var has_only_defaults = true;

            _.each(this.toJSON(), function (value, key) {
                if ( key !== 'position' && has_only_defaults ) {
                    var property_source = _.findWhere(FILLING_TYPE_PROPERTIES, { name: key });
                    var type = property_source ? property_source.type : undefined;

                    if ( this.getDefaultValue(key, type) !== value ) {
                        has_only_defaults = false;
                    }
                }
            }, this);

            return has_only_defaults;
        },
        //  Return { name: 'name', title: 'Title', type: 'type' } objects for
        //  each item in `names`. If `names` is empty, return everything
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( FILLING_TYPE_PROPERTIES, 'name' );
            }

            _.each(FILLING_TYPE_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_hash.push({ name: item.name, title: item.title, type: item.type });
                }
            });

            return name_title_hash;
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        },
        getBaseTypes: function () {
            return BASE_TYPES;
        },
        getBaseTypeTitle: function (name) {
            return _.findWhere(this.getBaseTypes(), { name: name }).title || '';
        }
    });
})();
