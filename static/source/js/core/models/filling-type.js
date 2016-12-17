var app = app || {};

(function () {
    'use strict';

    //  --------------------------------------------------------------------
    //  Filling Type to Profile Connection Model
    //  --------------------------------------------------------------------

    // var PROFILE_CONNECTION_PROPERTIES = [
    //     { name: 'profile_id', title: 'Profile ID', type: 'number' },
    //     { name: 'is_default', title: 'Is Default', type: 'boolean' },
    //     { name: 'pricing_grids', title: 'Pricing Grids', type: 'array' }
    // ];

    //  TODO: defaults for fixed and operable should be different
    //  TODO: collection should implement something like addEmptyGrid function
    function getDefaultGridCollection() {
        return [
            {
                name: 'fixed',
                // data: []
                sizes: ['500x500', '1514x914', '3000x2400']
            },
            {
                name: 'operable',
                // data: []
                sizes: ['500x500', '1514x914', '2400x1200']
            }
        ];
    }

    // var FillingTypeProfile = Backbone.Model.extend({
    var FillingTypeToProfileConnection = Backbone.Model.extend({
        defaults: function () {
            return {
                id: 0,
                is_default: false
            };
        },
        parse: function (data) {
            return data;
        },
        // toJSON: function () {

        // },
        initialize: function (attributes) {
            // console.log( 'initialize filling type to profile connection', attributes );

            // this.grid = new PricingGrid(attributes.pricing_grid);
            // this.grids = new PricingGridCollection(attributes.pricing_grids || null, { parse: true });
            // this.grids = new PricingGridCollection(null, { parse: true });

            // this.grids = new app.PricingGridCollection(getDefaultGridCollection(), { parse: true });
            // this.grids = new app.PricingGridCollection(null, { parse: true });

            //  TODO: get rid of this demo functionality
            this.grids = new app.PricingGridCollection([
                {
                    name: 'fixed',
                    data: [
                        { height: 500, width: 500, value: 15 },
                        { height: 914, width: 1514, value: 12 },
                        { height: 2400, width: 3000, value: 10 }
                    ]
                },
                {
                    name: 'operable',
                    data: [
                        { height: 500, width: 500, value: 11 },
                        { height: 914, width: 1514, value: 10 },
                        { height: 1200, width: 2400, value: 8 }
                    ]
                }
            ], { parse: true });

            // this.listenTo(this.grids, 'change', function () {
            //     console.log( 'wow, our grids did change' );
            //     console.log( 'we are going to save grids as', this.grids.toJSON() );
            // });
        }
    });

    var FillingTypeProfiles = Backbone.Collection.extend({
        model: FillingTypeToProfileConnection,
        comparator: function (item) {
            // return item.id;
            var corresponding_profile = app.settings && app.settings.profiles.get(item.id);

            return corresponding_profile ? corresponding_profile.get('position') : false;
        },
        initialize: function (models, options) {
            // console.log( 'initialize FillingTypeProfiles collection with data', models );
        }
    });


    //  --------------------------------------------------------------------
    //  Filling Type Model
    //  --------------------------------------------------------------------

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
        { name: 'filling_type_profiles', title: 'Profiles', type: 'array' }
    ];

    function getDefaultProfilesList() {
        return [];
    }

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
                filling_type_profiles: getDefaultProfilesList()
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
            var properties_to_omit = ['id', 'is_base_type'];

            if ( method === 'create' || method === 'update' ) {
                options.attrs = { filling_type: _.omit(model.toJSON(), properties_to_omit) };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        parse: function (data) {
            var filling_type_data = data && data.filling_type ? data.filling_type : data;

            if ( filling_type_data && _.isArray(filling_type_data.filling_type_profiles) ) {
                //  Sort profiles by id on load
                filling_type_data.filling_type_profiles.sort(function (a, b) { return a.profile_id - b.profile_id; });

                //  Remove excessive data from `filling_type_profiles`
                //  TODO: we need to find a more elegant way to do that, like
                //  parse them according to additional schema
                _.each(filling_type_data.filling_type_profiles, function (entry) {
                    delete entry.profile;
                    delete entry.id;
                }, this);
            }

            return app.schema.parseAccordingToSchema(filling_type_data, this.schema);
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

                    if ( key === 'filling_type_profiles' ) {
                        if ( JSON.stringify(value) !== JSON.stringify(this.getDefaultValue('filling_type_profiles')) ) {
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
        isAvailableForProfile: function (profile_id) {
            return this.get('is_base_type') === true ||
                this.get('filling_type_profiles') &&
                _.contains(_.pluck(this.get('filling_type_profiles'), 'profile_id'), profile_id);
        },
        isDefaultForProfile: function (profile_id) {
            var is_default = false;

            if ( !this.get('is_base_type') && this.isAvailableForProfile(profile_id) ) {
                var connection = _.findWhere(this.get('filling_type_profiles'), { profile_id: profile_id });

                is_default = connection.is_default || false;
            }

            return is_default;
        },
        //  TODO: Do we need to validate it against the list of globally
        //  available profiles in the app? There are reasons to do so
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
            // Deep cloning gives us a `change` event here
            var current_profiles_list = JSON.parse(JSON.stringify(this.get('filling_type_profiles')));
            var connection = _.findWhere(current_profiles_list, { profile_id: profile_id });
            var should_persist = false;
            var new_profiles_list;

            //  If there is an existing connection that we want to unset
            if ( make_available === false && connection ) {
                new_profiles_list = _.without(current_profiles_list, connection);
                should_persist = true;
            } else if ( make_available === true ) {
                //  If connection doesn't exist and we want to add it
                if ( !connection ) {
                    connection = {
                        profile_id: profile_id,
                        is_default: make_default === true
                    };

                    new_profiles_list = _.union(current_profiles_list, [connection]);
                    new_profiles_list.sort(function (a, b) { return a.profile_id - b.profile_id; });
                    should_persist = true;
                //  If connection exists and we want to just modify is_default
                } else if ( make_default === true || make_default === false ) {
                    should_persist = connection.is_default !== make_default;
                    connection.is_default = make_default;
                }
            }

            //  Only save when there are any changes
            if ( should_persist ) {
                this.persist('filling_type_profiles', new_profiles_list || current_profiles_list);
            }
        },
        //  We assume that profiles list is sorted and deduplicated
        getIdsOfProfilesWhereIsAvailable: function () {
            return _.pluck(this.get('filling_type_profiles'), 'profile_id');
        },
        //  We assume that profiles list is sorted and deduplicated
        getIdsOfProfilesWhereIsDefault: function () {
            return _.pluck(_.where(this.get('filling_type_profiles'), { is_default: true }), 'profile_id');
        },
        //  TODO: we need to have a way better nesting
        getPricingGridValue: function (profile_id, options) {
            // console.log( 'getPricingGridValue' );
            // console.log( 'profile_id', profile_id );
            // console.log( 'options', options );

            var profile_connection = this.profiles.get(profile_id);
            var value = 0;

            // console.log( 'profile_connection', profile_connection );

            if ( profile_connection ) {
                var target_grid = profile_connection.grids.getByName(options.type);

                // console.log( 'target_grid', target_grid );

                if ( target_grid ) {
                    value = target_grid.getValue({
                        width: options.width,
                        height: options.height
                    });
                }
            }

            return value;
        },
        initialize: function (attributes, options) {
            this.options = options || {};

            //  TODO: do we want to have it like this? it'd fine if they are
            //  a separate model with the separate endpoint, but if they're
            //  not, we better have profiles as a model attribute
            this.profiles = new FillingTypeProfiles(this.get('filling_type_profiles'));
        }
    });
})();
