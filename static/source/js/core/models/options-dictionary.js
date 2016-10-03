var app = app || {};

(function () {
    'use strict';

    var DICTIONARY_PROPERTIES = [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'rules_and_restrictions', title: 'Rules and Restrictions', type: 'string' },
        { name: 'position', title: 'Position', type: 'number' }
    ];

    var POSSIBLE_RULES_AND_RESTRICTIONS = [
        'DOOR_ONLY', 'OPERABLE_ONLY', 'GLAZING_BARS_ONLY', 'IS_OPTIONAL'
    ];

    function getDefaultRulesAndRestrictions() {
        return [];
    }

    app.OptionsDictionary = Backbone.Model.extend({
        schema: app.schema.createSchema(DICTIONARY_PROPERTIES),
        defaults: function () {
            var defaults = {};

            _.each(DICTIONARY_PROPERTIES, function (item) {
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
                rules_and_restrictions: getDefaultRulesAndRestrictions()
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        parse: function (data) {
            var dictionary_data = data && data.dictionary ? data.dictionary : data;
            var filtered_data = app.schema.parseAccordingToSchema(dictionary_data, this.schema);

            if ( dictionary_data && dictionary_data.entries ) {
                filtered_data.entries = dictionary_data.entries;
            }

            return filtered_data;
        },
        save: function () {
            return Backbone.Model.prototype.saveAndGetId.apply(this, arguments);
        },
        sync: function (method, model, options) {
            var properties_to_omit = ['id', 'entries'];

            if ( method === 'create' || method === 'update' ) {
                options.attrs = { dictionary: _.extendOwn(_.omit(model.toJSON(), properties_to_omit), {
                    rules_and_restrictions: JSON.stringify(model.get('rules_and_restrictions'))
                }) };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        validate: function (attributes, options) {
            var error_obj = null;
            var collection_names = this.collection && _.map(this.collection.without(this), function (item) {
                return item.get('name');
            });

            //  We want to have unique dictionary names across the collection
            if ( options.validate && collection_names &&
                _.contains(collection_names, attributes.name)
            ) {
                return {
                    attribute_name: 'name',
                    error_message: 'Dictionary name "' + attributes.name + '" is already used in this collection'
                };
            }

            //  Don't allow dictionary names that consist of numbers only ("123")
            if ( options.validate && attributes.name &&
                parseInt(attributes.name, 10).toString() === attributes.name
            ) {
                return {
                    attribute_name: 'name',
                    error_message: 'Dictionary name can\'t consist of only numbers'
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
                    var property_source = _.findWhere(DICTIONARY_PROPERTIES, { name: key });
                    var type = property_source ? property_source.type : undefined;

                    if ( key === 'rules_and_restrictions' ) {
                        if ( JSON.stringify(value) !==
                            JSON.stringify(this.getDefaultValue('rules_and_restrictions'))
                        ) {
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
                names = _.pluck( DICTIONARY_PROPERTIES, 'name' );
            }

            _.each(DICTIONARY_PROPERTIES, function (item) {
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
        initialize: function (attributes, options) {
            this.options = options || {};
            //  Was it fully loaded already? This means it was fetched and all
            //  dependencies (units etc.) were processed correctly. This flag
            //  could be used to tell if it's good to render any views
            this._wasLoaded = false;

            if ( !this.options.proxy ) {
                this.entries = new app.OptionsDictionaryEntryCollection(null, { dictionary: this });
                this.on('add', this.setDependencies, this);
                this.validateRulesAndRestrictions();

                this.listenTo(this.entries, 'change', function (e) {
                    this.trigger('entries_change', e);
                });
            }
        },
        validateRulesAndRestrictions: function () {
            var rules = this.get('rules_and_restrictions');
            var rules_parsed;

            if ( _.isString(rules) ) {
                try {
                    rules_parsed = JSON.parse(rules);
                } catch (error) {
                    // Do nothing
                }

                if ( rules_parsed ) {
                    this.set('rules_and_restrictions', rules_parsed);
                    return;
                }
            }

            if ( !_.isObject(rules) ) {
                this.set('rules_and_restrictions', this.getDefaultValue('rules_and_restrictions'));
            }
        },
        setDependencies: function (model, response, options) {
            var changed_flag = false;

            //  If response is empty or there was an error
            if ( !response && app.session.get('no_backend') !== true ||
                options && options.xhr && options.xhr.status && options.xhr.status !== 200
            ) {
                return;
            }

            if ( this.get('entries') ) {
                this.entries.set(this.get('entries'), { parse: true });
                this.unset('entries', { silent: true });
                changed_flag = true;
            }

            if ( changed_flag ) {
                this.trigger('set_dependencies');
            }

            if ( !this._wasLoaded ) {
                this._wasLoaded = true;
                this.trigger('fully_loaded');
            }
        },
        getPossibleRulesAndRestrictions: function () {
            return POSSIBLE_RULES_AND_RESTRICTIONS;
        }
    });
})();
