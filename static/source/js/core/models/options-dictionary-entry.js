var app = app || {};

(function () {
    'use strict';

    var UNSET_VALUE = '--';

    //  TODO: we better have original_cost and original_currency here, similar
    //  to units / accessories, instead of price
    var ENTRY_PROPERTIES = [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'supplier_name', title: 'Supplier Name', type: 'string' },
        { name: 'price', title: 'Price', type: 'number' },
        { name: 'data', title: 'Additional Data', type: 'string' },
        { name: 'position', title: 'Position', type: 'number' },
        { name: 'dictionary_entry_profiles', title: 'Profiles', type: 'array' }
    ];

    function getDefaultEntryData() {
        return _.extend({}, {});
    }

    function getDefaultProfilesList() {
        return [];
    }

    app.OptionsDictionaryEntry = Backbone.Model.extend({
        schema: app.schema.createSchema(ENTRY_PROPERTIES),
        defaults: function () {
            var defaults = {};

            _.each(ENTRY_PROPERTIES, function (item) {
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
                number: 0
            };

            var name_value_hash = {
                data: getDefaultEntryData(),
                dictionary_entry_profiles: getDefaultProfilesList()
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        sync: function (method, model, options) {
            var properties_to_omit = ['id'];

            if ( method === 'create' || method === 'update' ) {
                options.attrs = { entry: _.extendOwn(_.omit(model.toJSON(), properties_to_omit), {
                    //  TODO: we need to parse this value first, then we could
                    //  stringify it with no problem
                    data: _.isString(model.get('data')) ? model.get('data') : JSON.stringify(model.get('data'))
                }) };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        parse: function (data) {
            var entry_data = data && data.entry ? data.entry : data;

            //  Remove excessive data from `dictionary_entry_profiles`
            //  TODO: we need to find a more elegant way to do that, like
            //  parse them according to additional schema
            if ( entry_data && entry_data.dictionary_entry_profiles ) {
                _.each(entry_data.dictionary_entry_profiles, function (entry) {
                    delete entry.id;
                }, this);
            }

            return app.schema.parseAccordingToSchema(entry_data, this.schema);
        },
        validate: function (attributes, options) {
            var error_obj = null;
            var collection_names = this.collection && _.map(this.collection.without(this), function (item) {
                return item.get('name');
            });

            //  We want to have unique option names across the collection
            if ( options.validate && collection_names &&
                _.contains(collection_names, attributes.name)
            ) {
                return {
                    attribute_name: 'name',
                    error_message: 'Entry name "' + attributes.name + '" is already used in this collection'
                };
            }

            //  Don't allow option names that consist of numbers only ("123")
            if ( options.validate && attributes.name &&
                parseInt(attributes.name, 10).toString() === attributes.name
            ) {
                return {
                    attribute_name: 'name',
                    error_message: 'Entry name can\'t consist of only numbers'
                };
            }

            //  Don't allow option names that is similar to UNSET_VALUE
            if ( options.validate && attributes.name && UNSET_VALUE === attributes.name ) {
                return {
                    attribute_name: 'name',
                    error_message: 'Entry name can\'t be set to ' + UNSET_VALUE
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
                    var property_source = _.findWhere(ENTRY_PROPERTIES, { name: key });
                    var type = property_source ? property_source.type : undefined;

                    if ( key === 'data' ) {
                        if ( JSON.stringify(value) !== JSON.stringify(this.getDefaultValue('data')) ) {
                            has_only_defaults = false;
                        }
                    } else if ( key === 'dictionary_entry_profiles' ) {
                        if ( JSON.stringify(value) !== JSON.stringify(this.getDefaultValue('dictionary_entry_profiles')) ) {
                            has_only_defaults = false;
                        }
                    } else if ( this.getDefaultValue(key, type) !== value ) {
                        has_only_defaults = false;
                    }
                }
            }, this);

            return has_only_defaults;
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( ENTRY_PROPERTIES, 'name' );
            }

            _.each(ENTRY_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_hash.push({ name: item.name, title: item.title, type: item.type });
                }
            });

            return name_title_hash;
        },
        getAttributeType: function (attribute_name) {
            var name_title_hash = this.getNameTitleTypeHash();
            var target_attribute = _.findWhere(name_title_hash, {name: attribute_name});

            return target_attribute ? target_attribute.type : undefined;
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        },
        isAvailableForProfile: function (profile_id) {
            return this.get('dictionary_entry_profiles') &&
                _.contains(_.pluck(this.get('dictionary_entry_profiles'), 'profile_id'), profile_id);
        },
        isDefaultForProfile: function (profile_id) {
            var is_default = false;

            if ( this.isAvailableForProfile(profile_id) ) {
                var connection = _.findWhere(this.get('dictionary_entry_profiles'), { profile_id: profile_id });

                is_default = connection.is_default || false;
            }

            return is_default;
        },
        //  We assume that profiles list is sorted and deduplicated
        getIdsOfProfilesWhereIsAvailable: function () {
            return _.pluck(this.get('dictionary_entry_profiles'), 'profile_id');
        },
        //  We assume that profiles list is sorted and deduplicated
        getIdsOfProfilesWhereIsDefault: function () {
            return _.pluck(_.where(this.get('dictionary_entry_profiles'), { is_default: true }), 'profile_id');
        },
        initialize: function (attributes, options) {
            this.options = options || {};
        }
    });
})();
