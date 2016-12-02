var app = app || {};

(function () {
    'use strict';

    //  --------------------------------------------------------------------
    //  Pricing Grid Model
    //  --------------------------------------------------------------------

    var GRID_ITEM_PROPERTIES = [
        { name: 'height', title: 'Height', type: 'number' },
        { name: 'width', title: 'Width', type: 'number' },
        { name: 'value', title: 'Value', type: 'number' }
    ];

    var GridItem = Backbone.Model.extend({
        schema: app.schema.createSchema(GRID_ITEM_PROPERTIES),
        defaults: function () {
            return {
                height: 0,
                width: 0,
                value: 0
            };
        },
        parse: function (data) {
            //  This is for compatibility reasons with the old format
            if ( data && data.price_per_square_meter ) {
                data.value = data.price_per_square_meter;
            }

            return app.schema.parseAccordingToSchema(data, this.schema);
        },
        getArea: function () {
            return this.get('width') * this.get('height');
        }
    });

    var Grid = Backbone.Collection.extend({
        model: GridItem,
        comparator: function (item) {
            return item.getArea();
        },
        //  How this algorithm works:
        //  1. Grid items are already sorted by area size
        //  2. If our size < lowest size, price = lowest size price
        //  3. If our size > largest size, price = largest size price
        //  4. If our size === some size, price = some size price
        //  5. If our size > some size and < some other size, price is
        //  a linear interpolation between prices for these sizes
        getValue: function (options) {
            var target_area = options.width * options.height;
            var value = 0;

            if ( this.length ) {
                if ( target_area < this.first().getArea() ) {
                    value = this.first().get('value');
                } else if ( target_area > this.last().getArea() ) {
                    value = this.last().get('value');
                } else {
                    this.models.some(function (grid_item, index) {
                        if ( target_area === grid_item.getArea() ) {
                            value = grid_item.get('value');
                            return true;
                        } else if ( this.at(index + 1) &&
                            target_area < this.at(index + 1).getArea() &&
                            target_area > grid_item.getArea()
                        ) {
                            value = app.utils.math.linear_interpolation(
                                target_area,
                                grid_item.getArea(),
                                this.at(index + 1).getArea(),
                                grid_item.get('value'),
                                this.at(index + 1).get('value')
                            );
                            return true;
                        }

                        return false;
                    }, this);
                }
            }

            return value;
        }
    });

    var PricingGrid = Backbone.Model.extend({
        defaults: function () {
            return {};
        },
        getValue: function () {
            return this.grid.getValue.apply(this.grid, arguments);
        },
        parseAsGrid: function (data) {
            var grid_data = [];

            if ( typeof data === 'string' ) {
                try {
                    grid_data = JSON.parse(data);
                } catch (e) {
                    // Do nothing
                }
            //  For regular objects and arrays
            } else if ( typeof data === 'object' ) {
                grid_data = data;
            }

            return grid_data;
        },
        initialize: function (attributes, options) {
            // console.log( 'create new pricing grid' );
            // console.log( 'attributes', attributes );
            // console.log( 'options', options );

            this.grid = new Grid(this.parseAsGrid(attributes), { parse: true });

            //  TODO: like this?
            // this.listenTo(this.grid, 'change', this.trigger('change'));

            // console.log( 'grid', this.grid );
        }
    });

    // var PricingGrids = Backbone.Collection.extend({
    //     model: PricingGridModel,
    //     initialize: function (attributes) {
    //         console.log( 'attributes' );
    //     }
    // });


    // app.pricing_grid = new PricingGrid({
    //     fixed: [
    //         {title: 'Small', height: 500, width: 500, price_per_square_meter: 55},
    //         {title: 'Medium', height: 914, width: 1514, price_per_square_meter: 50},
    //         {title: 'Large', height: 2400, width: 3000, price_per_square_meter: 45}
    //     ],
    //     operable: [
    //         {title: 'Small', height: 500, width: 500, price_per_square_meter: 0},
    //         {title: 'Medium', height: 914, width: 1514, price_per_square_meter: 0},
    //         {title: 'Large', height: 1200, width: 2400, price_per_square_meter: 0}
    //     ]
    // });

    app.pricing_grid = new PricingGrid([
        {title: 'Small', height: 500, width: 500, price_per_square_meter: 55},
        {title: 'Medium', height: 914, width: 1514, price_per_square_meter: 50},
        {title: 'Large', height: 2400, width: 3000, price_per_square_meter: 45}
    ]);

    app.pricing_grid.getValue({ width: 1000, height: 700 });
    app.pricing_grid.getValue({ width: 500, height: 500 });
    app.pricing_grid.getValue({ width: 5000, height: 5000 });

    //  --------------------------------------------------------------------
    //  Filling Type to Profile Connection Model
    //  --------------------------------------------------------------------

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
        initialize: function (attributes) {
            this.grid = new PricingGrid(attributes.pricing_grid);
        }
    });

    var FillingTypeProfiles = Backbone.Collection.extend({
        model: FillingTypeToProfileConnection,
        initialize: function () {

        }
    });

    app.demo_connections = new FillingTypeProfiles([
        {
            id: 1,
            is_default: true,
            // pricing_grid: '[{"title":"Small","height":500,"width":500,"price_per_square_meter":55},' +
            //     '{"title":"Medium","height":914,"width":1514,"price_per_square_meter":50},' +
            //     '{"title":"Large","height":2400,"width":3000,"price_per_square_meter":45}]'
            pricing_grid: [
                {title: 'Small', height: 500, width: 500, price_per_square_meter: 55},
                {title: 'Medium', height: 914, width: 1514, price_per_square_meter: 50},
                {title: 'Large', height: 2400, width: 3000, price_per_square_meter: 45}
            ]
            // pricing_grid: 'string with garbage'
        }
    ]);


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
        { name: 'profiles', title: 'Profiles', type: 'array' }
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
                profiles: getDefaultProfilesList()
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

            //  Sort profiles by id on load
            if ( filling_type_data && _.isArray(filling_type_data.profiles) ) {
                filling_type_data.profiles.sort(function (a, b) { return a.id - b.id; });
            }

            return app.schema.parseAccordingToSchema(filling_type_data, this.schema);
        },
        initialize: function (attributes, options) {
            this.options = options || {};

            // console.log( 'profiles', this.get('profiles') );

            this.profiles = app.demo_connections;

            // this.pricing_grid = new PricingGrid({
            //     fixed: [
            //         {title: 'Small', height: 500, width: 500, price_per_square_meter: 55},
            //         {title: 'Medium', height: 914, width: 1514, price_per_square_meter: 50},
            //         {title: 'Large', height: 2400, width: 3000, price_per_square_meter: 45}
            //     ],
            //     operable: [
            //         {title: 'Small', height: 500, width: 500, price_per_square_meter: 0},
            //         {title: 'Medium', height: 914, width: 1514, price_per_square_meter: 0},
            //         {title: 'Large', height: 1200, width: 2400, price_per_square_meter: 0}
            //     ]
            // });
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

                    if ( key === 'profiles' ) {
                        if ( JSON.stringify(value) !== JSON.stringify(this.getDefaultValue('profiles')) ) {
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
                this.get('profiles') && _.contains(_.pluck(this.get('profiles'), 'id'), profile_id);
        },
        isDefaultForProfile: function (profile_id) {
            var is_default = false;

            if ( !this.get('is_base_type') && this.isAvailableForProfile(profile_id) ) {
                var connection = _.findWhere(this.get('profiles'), { id: profile_id });

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
            var current_profiles_list = JSON.parse(JSON.stringify(this.get('profiles')));
            var connection = _.findWhere(current_profiles_list, { id: profile_id });
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
                        id: profile_id,
                        is_default: make_default === true
                    };

                    new_profiles_list = _.union(current_profiles_list, [connection]);
                    new_profiles_list.sort(function (a, b) { return a.id - b.id; });
                    should_persist = true;
                //  If connection exists and we want to just modify is_default
                } else if ( make_default === true || make_default === false ) {
                    should_persist = connection.is_default !== make_default;
                    connection.is_default = make_default;
                }
            }

            //  Only save when there are any changes
            if ( should_persist ) {
                this.persist('profiles', new_profiles_list || current_profiles_list);
            }
        },
        //  We assume that profiles list is sorted and deduplicated
        getIdsOfProfilesWhereIsAvailable: function () {
            return _.pluck(this.get('profiles'), 'id');
        },
        //  We assume that profiles list is sorted and deduplicated
        getIdsOfProfilesWhereIsDefault: function () {
            return _.pluck(_.where(this.get('profiles'), { is_default: true }), 'id');
        }
    });
})();
