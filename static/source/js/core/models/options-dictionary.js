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
            return data;
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
                this.entries.set(this.get('entries'));
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
