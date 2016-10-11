var app = app || {};

(function () {
    'use strict';

    var UNIT_TYPES = ['Window', 'Patio Door', 'Entry Door'];
    var DEFAULT_UNIT_TYPE = 'Window';
    var TYPES_WITH_POSSIBLE_THRESHOLD = ['Patio Door', 'Entry Door'];
    var TYPES_WITH_EDITABLE_THRESHOLD = ['Patio Door'];
    var TYPES_WITH_ALWAYS_LOW_THRESHOLD = ['Entry Door'];
    var TYPES_WITH_POSSIBLE_SOLID_PANEL = ['Patio Door', 'Entry Door'];
    var TYPES_WITH_POSSIBLE_FLUSH_PANEL = ['Entry Door', 'Window'];
    var TYPES_WITH_OUTSIDE_HANDLE = ['Patio Door', 'Entry Door'];

    //  Profile sizes are set in millimeters
    var PROFILE_PROPERTIES = [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'unit_type', title: 'Type', type: 'string' },
        { name: 'system', title: 'Prossimo System', type: 'string' },
        { name: 'supplier_system', title: 'Supplier System', type: 'string' },
        { name: 'frame_width', title: 'Frame Width (mm)', type: 'number' },
        { name: 'mullion_width', title: 'Mullion Width (mm)', type: 'number' },
        { name: 'sash_frame_width', title: 'Sash Frame Width (mm)', type: 'number' },
        { name: 'sash_frame_overlap', title: 'Sash-Frame Overlap (mm)', type: 'number' },
        { name: 'sash_mullion_overlap', title: 'Sash-Mullion Overlap (mm)', type: 'number' },
        { name: 'frame_corners', title: 'Frame Corners', type: 'string' },
        { name: 'sash_corners', title: 'Sash Corners', type: 'string' },
        { name: 'threshold_width', title: 'Threshold Height (mm)', type: 'number' },
        { name: 'low_threshold', title: 'Low Threshold', type: 'boolean' },
        { name: 'frame_u_value', title: 'Frame U Value', type: 'number' },
        { name: 'spacer_thermal_bridge_value', title: 'Spacer Thermal Bridge Value', type: 'number' },
        { name: 'position', title: 'Position', type: 'number' },
        { name: 'pricing_grids', title: 'Pricing Grids', type: 'string' },
        { name: 'weight_per_length', title: 'Weight per Length (kg/m)', type: 'number' },
        { name: 'clear_width_deduction', title: 'Clear Width Deduction (mm)', type: 'number' }
    ];

    function getDefaultPricingGrids() {
        function getTier(title, height, width, price_per_square_meter) {
            return _.extend({}, {
                title: title,
                height: height,
                width: width,
                price_per_square_meter: price_per_square_meter
            });
        }

        return {
            fixed: [
                getTier('Small', 500, 500, 0),
                getTier('Medium', 914, 1514, 0),
                getTier('Large', 2400, 3000, 0)
            ],
            operable: [
                getTier('Small', 500, 500, 0),
                getTier('Medium', 914, 1514, 0),
                getTier('Large', 1200, 2400, 0)
            ]
        };
    }

    app.Profile = Backbone.Model.extend({
        schema: app.schema.createSchema(PROFILE_PROPERTIES),
        defaults: function () {
            var defaults = {};

            _.each(PROFILE_PROPERTIES, function (item) {
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
                unit_type: DEFAULT_UNIT_TYPE,
                low_threshold: false,
                threshold_width: 20,
                pricing_grids: getDefaultPricingGrids()
            };

            if ( app.settings ) {
                name_value_hash.system = app.settings.getSystems()[0];
                name_value_hash.supplier_system = app.settings.getSupplierSystems()[0];
                name_value_hash.frame_corners = app.settings.getFrameCornerTypes()[0];
                name_value_hash.sash_corners = app.settings.getSashCornerTypes()[0];
            }

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
            var properties_to_omit = ['id'];

            if ( method === 'create' || method === 'update' ) {
                options.attrs = { profile: _.extendOwn(_.omit(model.toJSON(), properties_to_omit), {
                    pricing_grids: JSON.stringify(model.get('pricing_grids'))
                }) };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        parse: function (data) {
            var profile_data = data && data.profile ? data.profile : data;

            return app.schema.parseAccordingToSchema(profile_data, this.schema);
        },
        initialize: function (attributes, options) {
            this.options = options || {};

            if ( !this.options.proxy ) {
                this.validatePricingGrids();
                this.on('change:unit_type', this.onTypeUpdate, this);
            }
        },
        validatePricingGrids: function () {
            var grids = this.get('pricing_grids');
            var grids_parsed;

            if ( _.isString(grids) ) {
                try {
                    grids_parsed = JSON.parse(grids);
                } catch (error) {
                    // Do nothing
                }

                if ( grids_parsed ) {
                    this.set('pricing_grids', grids_parsed);
                    return;
                }
            }

            if ( !_.isObject(grids) ) {
                this.set('pricing_grids', this.getDefaultValue('pricing_grids'));
            }
        },
        _updatePricingGrids: function (grid, tier, func) {
            var pricing_grids = this.get('pricing_grids');
            var target_tier = _.find(pricing_grids[grid], function (item) {
                return item === tier;
            });

            if ( target_tier ) {
                func(target_tier);
                this.persist('pricing_grids', pricing_grids);
            }
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
                    error_message: 'Profile name "' + attributes.name + '" is already used in this collection'
                };
            }

            //  Don't allow profile names that consist of numbers only ("123")
            if ( options.validate && attributes.name &&
                parseInt(attributes.name, 10).toString() === attributes.name
            ) {
                return {
                    attribute_name: 'name',
                    error_message: 'Profile name can\'t consist of only numbers'
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
                    var property_source = _.findWhere(PROFILE_PROPERTIES, { name: key });
                    var type = property_source ? property_source.type : undefined;

                    if ( key === 'pricing_grids' ) {
                        if ( JSON.stringify(value) !==
                            JSON.stringify(this.getDefaultValue('pricing_grids'))
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
        isThresholdPossible: function () {
            return _.indexOf(TYPES_WITH_POSSIBLE_THRESHOLD, this.get('unit_type')) !== -1;
        },
        isThresholdEditable: function () {
            return _.indexOf(TYPES_WITH_EDITABLE_THRESHOLD, this.get('unit_type')) !== -1;
        },
        hasAlwaysLowThreshold: function () {
            return _.indexOf(TYPES_WITH_ALWAYS_LOW_THRESHOLD, this.get('unit_type')) !== -1;
        },
        isSolidPanelPossible: function () {
            return _.indexOf(TYPES_WITH_POSSIBLE_SOLID_PANEL, this.get('unit_type')) !== -1;
        },
        isFlushPanelPossible: function () {
            return _.indexOf(TYPES_WITH_POSSIBLE_FLUSH_PANEL, this.get('unit_type')) !== -1;
        },
        hasOutsideHandle: function () {
            return _.indexOf(TYPES_WITH_OUTSIDE_HANDLE, this.get('unit_type')) !== -1;
        },
        getThresholdType: function () {
            var threshold_type = '(None)';

            if ( this.isThresholdPossible() ) {
                if ( this.get('low_threshold') === true ) {
                    threshold_type = 'Low';
                } else {
                    threshold_type = 'Standard';
                }
            }

            return threshold_type;
        },
        onTypeUpdate: function () {
            if ( !this.isThresholdPossible() ) {
                this.set('low_threshold', false);
            } else if ( this.hasAlwaysLowThreshold() ) {
                this.set('low_threshold', true);
            }
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( PROFILE_PROPERTIES, 'name' );
            }

            _.each(PROFILE_PROPERTIES, function (item) {
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
        getUnitTypes: function () {
            return UNIT_TYPES;
        },
        getVisibleFrameWidthFixed: function () {
            return this.get('frame_width');
        },
        getVisibleFrameWidthOperable: function () {
            return parseFloat(this.get('frame_width')) + parseFloat(this.get('sash_frame_width')) -
                parseFloat(this.get('sash_frame_overlap'));
        },
        //  Returns grids sorted by area size
        getPricingGrids: function () {
            return {
                fixed: _.sortBy(this.get('pricing_grids').fixed, function (item) {
                    return item.width * item.height;
                }, this),
                operable: _.sortBy(this.get('pricing_grids').operable, function (item) {
                    return item.width * item.height;
                }, this)
            };
        }
    });
})();
