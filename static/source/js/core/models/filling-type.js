var app = app || {};

(function () {
    'use strict';

    var PRICING_SCHEME_PRICING_GRIDS = app.constants.PRICING_SCHEME_PRICING_GRIDS;
    var PRICING_SCHEME_LINEAR_EQUATION = app.constants.PRICING_SCHEME_LINEAR_EQUATION;

    var POSSIBLE_PRICING_SCHEMES = [
        PRICING_SCHEME_LINEAR_EQUATION,
        PRICING_SCHEME_PRICING_GRIDS
    ];

    var UNSET_VALUE = '--';

    var BASE_TYPES = [
        { name: 'glass', title: 'Glass' },
        { name: 'recessed', title: 'Recessed' },
        { name: 'interior-flush-panel', title: 'Interior Flush Panel' },
        { name: 'exterior-flush-panel', title: 'Exterior Flush Panel' },
        { name: 'full-flush-panel', title: 'Full Flush Panel' },
        { name: 'louver', title: 'Louver' }
    ];

    //  TODO: `type` attribute should be actually called `base_type`, makes
    //  more sense that way (but we need to get rid of `is_base_type` concept)
    var FILLING_TYPE_PROPERTIES = [
        { name: 'name', title: 'Prossimo Name', type: 'string' },
        { name: 'supplier_name', title: 'Supplier Name', type: 'string' },
        { name: 'type', title: 'Type', type: 'string' },
        { name: 'is_base_type', title: 'Is Base Type', type: 'boolean' },
        { name: 'weight_per_area', title: 'Weight per Area (kg/m2)', type: 'number' },
        { name: 'position', title: 'Position', type: 'number' },
        { name: 'pricing_scheme', title: 'Pricing Scheme', type: 'string' },
        { name: 'filling_type_profiles', title: 'Profiles', type: 'collection:FillingTypeProfileCollection' }
    ];

    app.FillingType = Backbone.Model.extend({
        schema: app.schema.createSchema(FILLING_TYPE_PROPERTIES),
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
        getAttributeType: function (attribute_name) {
            var name_title_hash = this.getNameTitleTypeHash();
            var target_attribute = _.findWhere(name_title_hash, {name: attribute_name});

            return target_attribute ? target_attribute.type : undefined;
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            var type_value_hash = {
                number: 0,
                boolean: false
            };

            var name_value_hash = {
                type: this.getBaseTypes()[0].name,
                pricing_scheme: this.getPossiblePricingSchemes()[0],
                filling_type_profiles: new app.FillingTypeProfileCollection(null, {
                    parent_filling_type: this
                })
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
            if ( method === 'create' || method === 'update' ) {
                options.attrs = { filling_type: model.toJSON() };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        parse: function (data) {
            var filling_type_data = data && data.filling_type ? data.filling_type : data;
            var parsed_data = app.schema.parseAccordingToSchema(filling_type_data, this.schema);

            if ( parsed_data && parsed_data.filling_type_profiles ) {
                parsed_data.filling_type_profiles = new app.FillingTypeProfileCollection(
                    app.utils.object.extractObjectOrNull(parsed_data.filling_type_profiles),
                    {
                        parent_filling_type: this,
                        parse: true
                    }
                );
            }

            return parsed_data;
        },
        toJSON: function () {
            var properties_to_omit = ['id', 'is_base_type'];
            var json = Backbone.Model.prototype.toJSON.apply(this, arguments);

            json.filling_type_profiles = this.get('filling_type_profiles').toJSON();

            return _.omit(json, properties_to_omit);
        },
        validate: function (attributes, options) {
            var error_obj = null;
            var collection_names = this.collection && _.map(this.collection.without(this), function (item) {
                return item.get('name');
            });

            //  We want to have unique filling type names across the collection
            if ( options.validate && collection_names &&
                _.contains(collection_names, attributes.name)
            ) {
                return {
                    attribute_name: 'name',
                    error_message: 'Filling type name "' + attributes.name + '" is already used in this collection'
                };
            }

            //  Don't allow filling type names that is similar to UNSET_VALUE
            if ( options.validate && attributes.name && UNSET_VALUE === attributes.name ) {
                return {
                    attribute_name: 'name',
                    error_message: 'Filling type name can\'t be set to ' + UNSET_VALUE
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

                    //  This might not be super accurate, but should work
                    if ( key === 'filling_type_profiles' ) {
                        if ( value.length !== 0 ) {
                            has_only_defaults = false;
                        }
                    } else if ( this.getDefaultValue(key, type) !== value ) {
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
        getBaseTypeTitle: function () {
            return _.findWhere(this.getBaseTypes(), { name: this.get('type') }).title || '';
        },
        getPossiblePricingSchemes: function () {
            return POSSIBLE_PRICING_SCHEMES;
        },
        isAvailableForProfile: function (profile_id) {
            return this.get('is_base_type') === true ||
                this.get('filling_type_profiles') &&
                _.contains(this.get('filling_type_profiles').pluck('profile_id'), profile_id);
        },
        isDefaultForProfile: function (profile_id) {
            var is_default = false;

            if ( !this.get('is_base_type') && this.isAvailableForProfile(profile_id) ) {
                var connection = this.get('filling_type_profiles').getByProfileId(profile_id);

                is_default = connection.get('is_default') || false;
            }

            return is_default;
        },
        //  TODO: Do we need to validate it against the list of globally
        //  available profiles in the app? Or maybe we do want to validate
        //  them, but not on creation, rather separately, just to indicate
        //  where it's wrong?
        /**
         * Toggle item availability and default status for a certain profile
         *
         * @param {number} profile_id - id of the target profile
         * @param {boolean} make_available - true to make item available,
         * false to make it unavailable for this profile
         * @param {boolean} make_default - true to set as default, false
         * to unset. You can't make item default when it's not available
         */
        setProfileAvailability: function (profile_id, make_available, make_default) {
            var profiles_list = this.get('filling_type_profiles');
            var connection = profiles_list.getByProfileId(profile_id);

            //  If there is an existing connection that we want to unset
            if ( make_available === false && connection ) {
                connection.destroy();
            } else if ( make_available === true ) {
                //  If connection doesn't exist and we want to add it
                if ( !connection ) {
                    profiles_list.add({
                        profile_id: profile_id,
                        is_default: make_default === true
                    });
                //  If connection exists and we want to just modify is_default
                } else if ( make_default === true || make_default === false ) {
                    connection.set('is_default', make_default);
                }
            }
        },
        //  We assume that profiles list is sorted and deduplicated
        getIdsOfProfilesWhereIsAvailable: function () {
            return this.get('filling_type_profiles').pluck('profile_id');
        },
        //  We assume that profiles list is sorted and deduplicated
        getIdsOfProfilesWhereIsDefault: function () {
            return _.map(
                this.get('filling_type_profiles').where({ is_default: true }),
                function (item) {
                    return item.get('profile_id');
                }
            );
        },
        //  It returns a combination of scheme and data to calculate price
        getPricingDataForProfile: function (profile_id) {
            var pricing_data = null;

            if ( this.isAvailableForProfile(profile_id) ) {
                var connection = this.get('filling_type_profiles').getByProfileId(profile_id);

                pricing_data = (connection && connection.getPricingData()) || null;
            }

            return pricing_data;
        },
        initialize: function (attributes, options) {
            this.options = options || {};

            //  Any change to `filling_type_profiles` should be persisted
            this.listenTo(this.get('filling_type_profiles'), 'change update', function () {
                this.persist('filling_type_profiles', this.get('filling_type_profiles'));
            });
        }
    });
})();
