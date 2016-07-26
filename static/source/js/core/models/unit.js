var app = app || {};

(function () {
    'use strict';

    var UNIT_PROPERTIES = [
        { name: 'mark', title: 'Mark', type: 'string' },
        { name: 'width', title: 'Width (inches)', type: 'number' },
        { name: 'height', title: 'Height (inches)', type: 'number' },
        { name: 'quantity', title: 'Quantity', type: 'number' },
        { name: 'description', title: 'Customer Description', type: 'string' },
        { name: 'notes', title: 'Notes', type: 'string' },
        { name: 'exceptions', title: 'Exceptions', type: 'string' },
        { name: 'glazing_bar_type', title: 'Muntin (Glazing Bar) Type', type: 'string' },
        { name: 'glazing_bar_width', title: 'Glazing Bar Width (mm)', type: 'number' },

        { name: 'profile_name', title: 'Profile', type: 'string' },
        { name: 'profile_id', title: 'Profile', type: 'string' },
        { name: 'customer_image', title: 'Customer Image', type: 'string' },
        { name: 'internal_color', title: 'Color Interior', type: 'string' },
        { name: 'external_color', title: 'Color Exterior', type: 'string' },
        { name: 'interior_handle', title: 'Interior Handle', type: 'string' },
        { name: 'exterior_handle', title: 'Exterior Handle', type: 'string' },
        { name: 'hardware_type', title: 'Hardware Type', type: 'string' },
        { name: 'lock_mechanism', title: 'Lock Mechanism', type: 'string' },
        { name: 'glazing_bead', title: 'Glazing Bead', type: 'string' },

        { name: 'gasket_color', title: 'Gasket Color', type: 'string' },
        { name: 'hinge_style', title: 'Hinge Style', type: 'string' },
        { name: 'opening_direction', title: 'Opening Direction', type: 'string' },
        { name: 'internal_sill', title: 'Internal Sill', type: 'string' },
        { name: 'external_sill', title: 'External Sill', type: 'string' },
        { name: 'glazing', title: 'Glass Packet / Panel Type', type: 'string' },
        { name: 'uw', title: 'Uw', type: 'number' },

        { name: 'original_cost', title: 'Original Cost', type: 'number' },
        { name: 'original_currency', title: 'Original Currency', type: 'string' },
        { name: 'conversion_rate', title: 'Conversion Rate', type: 'number' },
        { name: 'supplier_discount', title: 'Supplier Discount', type: 'number' },
        { name: 'price_markup', title: 'Markup', type: 'number' },
        { name: 'discount', title: 'Discount', type: 'number' },

        { name: 'position', title: 'Position', type: 'number' }
    ];

    //  We only enable those for editing on units where `isDoorType` is `true`
    var DOOR_ONLY_PROPERTIES = ['exterior_handle', 'lock_mechanism'];
    //  Same as above, for `hasOperableSections`
    var OPERABLE_ONLY_PROPERTIES = ['interior_handle', 'exterior_handle', 'hardware_type',
        'hinge_style', 'opening_direction'];
    //  Same as above, for `hasGlazingBars`
    var GLAZING_BAR_PROPERTIES = ['glazing_bar_type', 'glazing_bar_width'];

    var SASH_TYPES = [
        'tilt_turn_left', 'tilt_turn_right', 'fixed_in_frame', 'tilt_only',
        'turn_only_left', 'turn_only_right', 'fixed_in_sash',
        'slide_left', 'slide_right',
        // additional types for solid doors
        'flush-turn-right', 'flush-turn-left', 'tilt_only_top_hung',
        'turn_only_right_hinge_hidden_latch', 'turn_only_left_hinge_hidden_latch'
    ];

    var SASH_TYPES_WITH_OPENING = _.without(SASH_TYPES, 'fixed_in_frame');
    var OPERABLE_SASH_TYPES = _.without(SASH_TYPES, 'fixed_in_frame', 'fixed_in_sash');

    var SASH_TYPE_NAME_MAP = {
        // deprecated
        // 'flush-turn-right': 'Flush Panel Right Hinge',
        // 'flush-turn-left': 'Flush Panel Left Hinge',
        slide_left: 'Slide Left',
        slide_right: 'Slide Right',
        fixed_in_frame: 'Fixed',
        fixed_in_sash: 'Fixed in Sash',
        tilt_only: 'Tilt Only',
        tilt_turn_right: 'Tilt-turn Right Hinge',
        tilt_turn_left: 'Tilt-turn Left Hinge',
        turn_only_right: 'Turn Only Right Hinge',
        turn_only_left: 'Turn Only Left Hinge',
        tilt_only_top_hung: 'Tilt Only Top Hung',
        'slide-right': 'Slide Right',
        'slide-left': 'Slide Left',
        turn_only_right_hinge_hidden_latch: 'Turn Only Right Hinge Hidden Latch',
        turn_only_left_hinge_hidden_latch: 'Turn Only Left Hinge Hidden Latch'
    };

    var FILLING_TYPES = [
        'glass', 'recessed',
        'interior-flush-panel', 'exterior-flush-panel',
        'full-flush-panel', 'louver'
    ];

    var MULLION_TYPES = [
        'vertical', 'horizontal',
        'vertical_invisible', 'horizontal_invisible'
    ];

    function getDefaultFillingType() {
        return {
            fillingType: 'glass',
            fillingName: 'Glass'
        };
    }

    function getDefaultBars() {
        return {
            vertical: [],
            horizontal: []
        };
    }

    function validateBar(opts, type) {
        return {
            id: opts.id || _.uniqueId(),
            type: opts.type || type,
            position: opts.position,
            links: opts.links || [null, null]
        };
    }

    function getDefaultMeasurements(hasFrame) {
        var result = {};

        hasFrame = hasFrame || false;

        if (hasFrame) {
            result.frame = {
                vertical: ['max', 'max'],
                horizontal: ['max', 'max']
            };
        }

        result.opening = null;
        result.glass = null;

        return result;
    }

    function getSectionDefaults(type) {
        var isRootSection = ( type === 'root_section' );

        return {
            id: _.uniqueId(),
            sashType: 'fixed_in_frame',
            fillingType: getDefaultFillingType().fillingType,
            fillingName: getDefaultFillingType().fillingName,
            bars: getDefaultBars(),
            measurements: getDefaultMeasurements(isRootSection)
        };
    }

    function getInvertedDivider(type) {
        if ( /vertical/.test(type) ) {
            type = type.replace(/vertical/g, 'horizontal');
        } else if ( /horizontal/.test(type) ) {
            type = type.replace(/horizontal/g, 'vertical');
        }

        return type;
    }

    function findParent(root, childId) {
        if (root.sections.length === 0) {
            return null;
        }

        if (root.sections[0].id === childId || root.sections[1].id === childId) {
            return root;
        }

        return findParent(root.sections[0], childId) || findParent(root.sections[1], childId);
    }

    app.Unit = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(UNIT_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getNameAttribute: function () {
            return 'mark';
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            var type_value_hash = {
                number: 0
            };

            var name_value_hash = {
                original_currency: 'EUR',
                conversion_rate: 0.9,
                price_markup: 2.3,
                quantity: 1,
                root_section: getSectionDefaults(name)
            };

            if ( app.settings ) {
                name_value_hash.internal_color = app.settings.getColors()[0];
                name_value_hash.external_color = app.settings.getColors()[0];
                name_value_hash.interior_handle = app.settings.getInteriorHandleTypes()[0];
                name_value_hash.glazing_bead = app.settings.getGlazingBeadTypes()[0];
                name_value_hash.gasket_color = app.settings.getGasketColors()[0];
                name_value_hash.hinge_style = app.settings.getHingeTypes()[0];
                name_value_hash.glazing_bar_type = app.settings.getGlazingBarTypes()[0];
                name_value_hash.glazing_bar_width = app.settings.getGlazingBarWidths()[0];
                name_value_hash.opening_direction = app.settings.getOpeningDirections()[0];
                name_value_hash.glazing = app.settings.getAvailableFillingTypeNames()[0];
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
                options.attrs = { project_unit: _.extendOwn(_.omit(model.toJSON(), properties_to_omit), {
                    root_section: JSON.stringify(model.get('root_section'))
                }) };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        initialize: function (attributes, options) {
            this.options = options || {};
            this.profile = null;

            if ( !this.options.proxy ) {
                this.setProfile();
                this.validateOpeningDirection();
                this.validateRootSection();
                this.on('change:profile_id', this.setProfile, this);
                this.on('change:glazing', this.setDefaultFillingType, this);
            }
        },
        validateOpeningDirection: function () {
            if ( !app.settings ) {
                return;
            }

            if ( !_.contains(app.settings.getOpeningDirections(), this.get('opening_direction')) ) {
                this.set('opening_direction', app.settings.getOpeningDirections()[0]);
            }
        },
        //  TODO: this function should be improved
        //  The idea is to call this function on model init (maybe not only)
        //  and check whether root section could be used by our drawing code or
        //  should it be reset to defaults.
        validateRootSection: function () {
            var root_section = this.get('root_section');
            var root_section_parsed;

            if ( _.isString(root_section) ) {
                try {
                    root_section_parsed = JSON.parse(root_section);
                } catch (error) {
                    // Do nothing
                }

                if ( root_section_parsed ) {
                    this.set('root_section', this.validateSection(root_section_parsed, true));
                    return;
                }
            }

            if ( !_.isObject(root_section) ) {
                this.set('root_section', this.getDefaultValue('root_section'));
            }
        },
        //  Check if some of the section values aren't valid and try to fix that
        validateSection: function (current_section, is_root) {
            //  Replace deprecated sash types with more adequate values
            if ( current_section.sashType === 'flush-turn-left' ) {
                current_section.sashType = 'turn_only_left';
                current_section.fillingType = 'full-flush-panel';
            } else if ( current_section.sashType === 'flush-turn-right' ) {
                current_section.sashType = 'turn_only_right';
                current_section.fillingType = 'full-flush-panel';
            }

            if ( !current_section.bars ) {
                current_section.bars = getDefaultBars();
            } else {
                _.each(current_section.bars, function (barType, type) {
                    _.each(barType, function (bar, index) {
                        current_section.bars[type][index] = validateBar( bar, type );
                    });
                });
            }

            if ( !current_section.measurements ) {
                current_section.measurements = getDefaultMeasurements(is_root);
            }

            //  TODO: this duplicates code from splitSection, so ideally
            //  it should be moved to a new helper function
            if ( current_section.measurements && !current_section.measurements.mullion && current_section.divider ) {
                var measurementType = getInvertedDivider(current_section.divider).replace(/_invisible/, '');

                current_section.measurements.mullion = {};
                current_section.measurements.mullion[measurementType] = ['center', 'center'];
            }

            _.each(current_section.sections, function (section) {
                section = this.validateSection(section, false);
            }, this);

            return current_section;
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
        setProfile: function () {
            this.profile = null;

            //  Assign the default profile id to a newly created unit
            if ( app.settings && !this.get('profile_id') && !this.get('profile_name') ) {
                this.set('profile_id', app.settings.getDefaultProfileId());
            }

            if ( app.settings ) {
                this.profile = app.settings.getProfileByIdOrDummy(this.get('profile_id'));
            }

            //  Store profile name so in case when profile was deleted we can
            //  have its old name for the reference
            if ( this.profile && !this.hasDummyProfile() ) {
                this.set('profile_name', this.profile.get('name'));
            }
        },
        hasDummyProfile: function () {
            return this.profile && this.profile.get('is_dummy');
        },
        hasOnlyDefaultAttributes: function () {
            var has_only_defaults = true;

            _.each(this.toJSON(), function (value, key) {
                if ( key !== 'position' && has_only_defaults ) {
                    var property_source = _.findWhere(UNIT_PROPERTIES, { name: key });
                    var type = property_source ? property_source.type : undefined;

                    if ( key === 'profile_id' ) {
                        if ( app.settings && app.settings.getDefaultProfileId() !== value ) {
                            has_only_defaults = false;
                        }
                    } else if ( key === 'profile_name' ) {
                        var profile = app.settings && app.settings.getProfileByIdOrDummy(this.get('profile_id'));

                        if ( profile && profile.get('name') !== value ) {
                            has_only_defaults = false;
                        }
                    } else if ( key === 'root_section' ) {
                        if ( JSON.stringify(_.omit(value, 'id')) !==
                            JSON.stringify(_.omit(this.getDefaultValue('root_section'), 'id'))
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
        setDefaultFillingType: function () {
            var filling_type;
            var glazing = this.get('glazing');

            if ( glazing && app.settings ) {
                filling_type = app.settings.getFillingTypeByName(glazing);

                if ( filling_type ) {
                    this.setFillingType(
                        this.get('root_section').id,
                        filling_type.get('type'),
                        filling_type.get('name')
                    );
                }
            }
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( UNIT_PROPERTIES, 'name' );
            }

            _.each(UNIT_PROPERTIES, function (item) {
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
        getProfileProperties: function () {
            return app.settings ? app.settings.getProfileProperties(this.get('profile')) : {};
        },
        getRefNum: function () {
            return this.collection ? this.collection.indexOf(this) + 1 : -1;
        },
        getWidthMM: function () {
            return app.utils.convert.inches_to_mm(this.get('width'));
        },
        getHeightMM: function () {
            return app.utils.convert.inches_to_mm(this.get('height'));
        },
        getRoughOpeningWidth: function () {
            return parseFloat(this.get('width')) + 1;
        },
        getRoughOpeningHeight: function () {
            return parseFloat(this.get('height')) + 1;
        },
        getAreaInSquareFeet: function () {
            return app.utils.math.square_feet(this.get('width'), this.get('height'));
        },
        getTotalSquareFeet: function () {
            return this.getAreaInSquareFeet() * parseFloat(this.get('quantity'));
        },
        getAreaInSquareMeters: function () {
            var c = app.utils.convert;

            return app.utils.math.square_meters(c.inches_to_mm(this.get('width')), c.inches_to_mm(this.get('height')));
        },
        //  We either get a value from model, or get get estimated unit cost
        //  when special toggle is enabled in settings
        getOriginalCost: function () {
            var original_cost = this.get('original_cost');
            var project_settings = app.settings ? app.settings.getProjectSettings() : undefined;

            if ( project_settings && project_settings.get('pricing_mode') === 'estimates' ) {
                original_cost = this.getEstimatedUnitCost();
            }

            return parseFloat(original_cost);
        },
        getUnitCost: function () {
            return this.getOriginalCost() / parseFloat(this.get('conversion_rate'));
        },
        getSubtotalCost: function () {
            return this.getUnitCost() * parseFloat(this.get('quantity'));
        },
        getUnitCostDiscounted: function () {
            return this.getUnitCost() * (100 - parseFloat(this.get('supplier_discount'))) / 100;
        },
        getSubtotalCostDiscounted: function () {
            return this.getUnitCostDiscounted() * parseFloat(this.get('quantity'));
        },
        getUnitPrice: function () {
            return this.getUnitCostDiscounted() * parseFloat(this.get('price_markup'));
        },
        getSubtotalPrice: function () {
            return this.getUnitPrice() * parseFloat(this.get('quantity'));
        },
        getUValue: function () {
            return parseFloat(this.get('uw')) * 0.176;
        },
        getUnitPriceDiscounted: function () {
            return this.getUnitPrice() * (100 - parseFloat(this.get('discount'))) / 100;
        },
        getSubtotalPriceDiscounted: function () {
            return this.getSubtotalPrice() * (100 - parseFloat(this.get('discount'))) / 100;
        },
        getSubtotalProfit: function () {
            return this.getSubtotalPriceDiscounted() - this.getSubtotalCostDiscounted();
        },
        getSquareFeetPrice: function () {
            return this.getTotalSquareFeet() ? this.getSubtotalPrice() / this.getTotalSquareFeet() : 0;
        },
        getSquareFeetPriceDiscounted: function () {
            return this.getTotalSquareFeet() ? this.getSubtotalPriceDiscounted() / this.getTotalSquareFeet() : 0;
        },
        getSection: function (sectionId) {
            return app.Unit.findSection(this.generateFullRoot(), sectionId);
        },
        //  Right now we think that door is something where profile
        //  returns `true` on `hasOutsideHandle` call
        isDoorType: function () {
            var is_door_type = false;

            if ( this.profile && this.profile.hasOutsideHandle() ) {
                is_door_type = true;
            }

            return is_door_type;
        },
        isDoorOnlyAttribute: function (attribute_name) {
            return _.indexOf(DOOR_ONLY_PROPERTIES, attribute_name) !== -1;
        },
        isOpeningDirectionOutward: function () {
            return this.get('opening_direction') === 'Outward';
        },
        isCircularPossible: function (sashId) {
            var root = this.generateFullRoot();
            var parent = findParent(root, sashId);

            if (!parent) {
                return true;
            }

            return false;
        },
        getCircleRadius: function () {
            var root = this.generateFullRoot();

            if (root.circular) {
                return root.radius;
            }

            return null;
        },
        isArchedPossible: function (sashId) {
            var root = this.generateFullRoot();

            if (app.Unit.findSection(root, sashId).sashType !== 'fixed_in_frame') {
                return false;
            }

            if (root.id === sashId && root.sections.length === 0) {
                return true;
            }

            var parent = findParent(root, sashId);

            if (!parent) {
                return false;
            }

            var childId = sashId;

            while (parent) {
                if (parent.sashType !== 'fixed_in_frame') {
                    return false;
                }
                // arched section should be only on top (index 0)
                if (parent.sections[0].id !== childId) {
                    return false;
                }

                // and it should be horizontal mullions only
                if (!(parent.divider === 'horizontal' || parent.divider === 'horizontal_invisible')) {
                    return false;
                }

                childId = parent.id;
                parent = findParent(root, childId);
            }

            return true;
        },
        getArchedPosition: function () {
            var root = this.get('root_section');

            if (root.arched) {
                return root.archPosition;
            }

            while (true) {
                var topSection = root.sections && root.sections[0] && root.sections[0];

                if (topSection && topSection.arched) {
                    return root.position;
                }

                if (!topSection) {
                    return null;
                }

                root = topSection;
            }

            return null;
        },
        isRootSection: function (sectionId) {
            return this.get('root_section').id === sectionId;
        },
        //  If reverse_hinges is true, we replace "Left" with "Right" and
        //  "Right" with "Left" in sash name
        getSashName: function (type, reverse_hinges) {
            reverse_hinges = reverse_hinges || false;

            if ( _.indexOf(_.keys(SASH_TYPE_NAME_MAP), type) === -1 ) {
                throw new Error('Unrecognized sash type: ' + type);
            }

            var string = SASH_TYPE_NAME_MAP[type];

            if ( reverse_hinges ) {
                if ( /Right/.test(string) ) {
                    string = string.replace(/Right/g, 'Left');
                } else if ( /Left/.test(string) ) {
                    string = string.replace(/Left/g, 'Right');
                }
            }

            return string;
        },
        _updateSection: function (sectionId, func) {
            // HAH, dirty deep clone, rewrite when you have good mood for it
            // we have to make deep clone and backbone will trigger change event
            var rootSection = JSON.parse(JSON.stringify(this.get('root_section')));
            var sectionToUpdate = app.Unit.findSection(rootSection, sectionId);

            func(sectionToUpdate);

            this.persist('root_section', rootSection);
        },
        setCircular: function (sectionId, opts) {
            //  Deep clone, same as above
            var root_section = JSON.parse(JSON.stringify(this.get('root_section')));
            var section = app.Unit.findSection(root_section, sectionId);
            var update_data = {};

            if (opts.radius) {
                update_data.width = opts.radius * 2;
                update_data.height = opts.radius * 2;
            }

            //  Set circular and reset bars
            if (opts.circular !== undefined) {
                section.circular = !!opts.circular;
                section.bars = getDefaultBars();
            }

            //  Set or reset radius
            if (section.circular) {
                section.radius = app.utils.convert.inches_to_mm(opts.radius);
            } else {
                section.radius = 0;
            }

            update_data.root_section = root_section;
            this.persist(update_data);
        },
        toggleCircular: function (sectionId, val) {
            if (this.isRootSection(sectionId)) {
                var section = this.getSection( sectionId );
                var radius = Math.min(this.get('width'), this.get('height')) / 2;

                this.setCircular(sectionId, {
                    circular: val || !section.circular,
                    radius: radius
                });
            }
        },
        getCircleSashData: function (sectionId) {
            var root;
            var section = this.getSection( sectionId );
            var result = {};

            result.sashParams = section.sashParams;
            result.edges = {
                top: !!section.mullionEdges.top || false,
                right: !!section.mullionEdges.right || false,
                bottom: !!section.mullionEdges.bottom || false,
                left: !!section.mullionEdges.left || false
            };

            // If we have a mullions all around the sash — it's rectangle!
            // If we have no mullions around the sash — it's a circle!
            // But if we have mullions at few edges — it's an arc!
            if ( result.edges.top === result.edges.right &&
                 result.edges.top === result.edges.bottom &&
                 result.edges.top === result.edges.left
            ) {
                result.type = (result.edges.top === true) ? 'rect' : 'circle';
            } else {
                result.type = 'arc';
            }

            // In this method we calculate the same data for arc and circle
            // But other methods could use this helpful information about type.
            // For example, it used in unit-drawer.js
            if (result.type === 'circle' || result.type === 'arc') {
                root = this.generateFullRoot();

                result.circle = {
                    x: root.sashParams.x,
                    y: root.sashParams.y
                };
                result.radius = Math.min( root.sashParams.width, root.sashParams.height ) / 2;
            }

            return result;
        },
        setSectionSashType: function (sectionId, type) {
            if (!_.includes(SASH_TYPES, type)) {
                console.error('Unrecognized sash type: ' + type);
                return;
            }

            var full = this.generateFullRoot();
            var fullSection = app.Unit.findSection(full, sectionId);

            // Update section
            this._updateSection(sectionId, function (section) {
                section.sashType = type;
                section.measurements.opening = false;
                section.measurements.glass = false;
            });

            //  Change all nested sections recursively
            _.each(fullSection.sections, function (childSection) {
                this.setSectionSashType(childSection.id, 'fixed_in_frame');
            }, this);
        },
        setSectionBars: function (sectionId, bars) {
            this._updateSection(sectionId, function (section) {
                section.bars = bars;
            });
        },
        setSectionMeasurements: function (sectionId, measurements) {
            this._updateSection(sectionId, function (section) {
                section.measurements = measurements;
            });
        },
        getMeasurementStates: function (type) {
            var defaults = {
                mullion: [{
                    value: 'min',
                    viewname: 'Without mullion'
                }, {
                    value: 'center',
                    viewname: 'Center of mullion',
                    default: true
                }, {
                    value: 'max',
                    viewname: 'With mullion'
                }],
                frame: [{
                    value: 'max',
                    viewname: 'With frame',
                    default: true
                }, {
                    value: 'min',
                    viewname: 'Without frame'
                }]
            };

            return defaults[type];
        },
        getMeasurementEdges: function (section_id, type) {
            var section_data = this.getSection(section_id);
            var edges = { top: 'frame', right: 'frame', bottom: 'frame', left: 'frame' };

            _.each(section_data.mullionEdges, function (edge, key) {
                edges[key] = 'mullion';
            });

            if (type) {
                if (type === 'vertical' || type === 'vertical_invisible') {
                    delete edges.top;
                    delete edges.bottom;
                } else {
                    delete edges.left;
                    delete edges.right;
                }
            }

            return edges;
        },
        getInvertedMeasurementVal: function (val) {
            return (val === 'min') ? 'max' :
                   (val === 'max') ? 'min' :
                   (val === 'center') ? 'center' :
                   val;
        },
        getBar: function (sectionId, id) {
            var found = null;
            var section = this.getSection(sectionId);

            _.each(section.bars, function (arr) {
                _.each(arr, function (bar) {
                    if (bar.id === id) {
                        found = bar;
                        return;
                    }
                });
            });

            return found;
        },
        // @TODO: Add method, that checks for correct values of measurement data
        // @TODO: Add method, that drops measurement data to default
        setFillingType: function (sectionId, type, name) {
            if (!_.includes(FILLING_TYPES, type)) {
                console.error('Unknow filling type: ' + type);
                return;
            }

            this._updateSection(sectionId, function (section) {
                section.fillingType = type;
                section.fillingName = name;
            });

            //  We also change all nested sections recursively
            var full = this.generateFullRoot();
            var fullSection = app.Unit.findSection(full, sectionId);

            _.each(fullSection.sections, function (childSection) {
                this.setFillingType(childSection.id, type, name);
            }, this);
        },
        setSectionMullionPosition: function (id, pos) {
            this._updateSection(id, function (section) {
                section.position = parseFloat(pos);
            });
        },
        removeMullion: function (sectionId) {
            this._updateSection(sectionId, function (section) {
                section.divider = null;
                section.sections = [];
                section.position = null;
            });
        },
        removeSash: function (sectionId) {
            this._updateSection(sectionId, function (section) {
                section.sashType = 'fixed_in_frame';
                _.assign(section, getDefaultFillingType());
                section.divider = null;
                section.sections = [];
                section.position = null;
            });
        },
        splitSection: function (sectionId, type) {
            if (!_.includes(MULLION_TYPES, type)) {
                console.error('Unknow mullion type', type);
                return;
            }

            this._updateSection(sectionId, function (section) {
                var full = this.generateFullRoot();
                var fullSection = app.Unit.findSection(full, sectionId);
                var measurementType = getInvertedDivider(type).replace(/_invisible/, '');

                section.divider = type;
                section.sections = [getSectionDefaults(), getSectionDefaults()];
                // Drop mullion dimension-points
                section.measurements.mullion = {};
                section.measurements.mullion[measurementType] = ['center', 'center'];
                // Drop overlay glassSize metrics (openingSize still actually)
                section.measurements.glass = false;

                // Reset bars parameter
                section.bars = getDefaultBars();

                if ( section.fillingType && section.fillingName ) {
                    section.sections[0].fillingType = section.sections[1].fillingType = section.fillingType;
                    section.sections[0].fillingName = section.sections[1].fillingName = section.fillingName;
                }

                if (type === 'horizontal' || type === 'horizontal_invisible') {
                    section.position = fullSection.openingParams.y + fullSection.openingParams.height / 2;
                } else {
                    section.position = fullSection.openingParams.x + fullSection.openingParams.width / 2;
                }
            }.bind(this));
        },
        // after full calulcalation section will be something like:
        // {
        //     id: 5,
        //     sashType: 'none', // top-right, top-left, none, top, right, left, slide-right, slide-left
        //     panelType: 'glass' // or 'solid'. works for doors
        //     openingParams: { x, y, width, height },
        //     divider: 'vertical',    // or horizontal
        //     position: 50,       // position of center of mullion from top left point of unit
        //     sections: [{
        //         id: 6,
        //         mullionEdges : {right : true},
        //         openingParams: {}
        //     }, {
        //         id: 7,
        //         mullionEdges : {left : true},
        //         openingParams: {}
        //     }]
        // }
        generateFullRoot: function (rootSection, openingParams) {
            rootSection = rootSection || JSON.parse(JSON.stringify(this.get('root_section')));
            var defaultParams = {
                x: 0,
                y: 0,
                width: this.getInMetric('width', 'mm'),
                height: this.getInMetric('height', 'mm')
            };

            if (rootSection.id === this.get('root_section').id) {
                defaultParams = {
                    x: this.profile.get('frame_width'),
                    y: this.profile.get('frame_width'),
                    width: this.getInMetric('width', 'mm') - this.profile.get('frame_width') * 2,
                    height: this.getInMetric('height', 'mm') - this.profile.get('frame_width') * 2
                };
            }

            if (rootSection.id === this.get('root_section').id &&
                    this.profile.isThresholdPossible() &&
                    this.profile.get('low_threshold')) {
                defaultParams = {
                    x: this.profile.get('frame_width'),
                    y: this.profile.get('frame_width'),
                    width: this.getInMetric('width', 'mm') - this.profile.get('frame_width') * 2,
                    height: this.getInMetric('height', 'mm') -
                        this.profile.get('frame_width') - this.profile.get('threshold_width')
                };
                rootSection.thresholdEdge = true;
            }

            openingParams = openingParams || defaultParams;
            rootSection.openingParams = openingParams;
            rootSection.mullionEdges = rootSection.mullionEdges || {};
            rootSection.glassParams = {};
            rootSection.sashParams = {};

            var hasFrame = (rootSection.sashType !== 'fixed_in_frame');
            var topOverlap = 0;
            var bottomOverlap = 0;
            var leftOverlap = 0;
            var rightOverlap = 0;
            var frameOverlap = this.profile.get('sash_frame_overlap');
            var mullionOverlap = this.profile.get('sash_mullion_overlap');
            var thresholdOverlap = mullionOverlap;

            if (hasFrame) {
                topOverlap = rootSection.mullionEdges.top ? mullionOverlap : frameOverlap;
                bottomOverlap = rootSection.mullionEdges.bottom ? mullionOverlap : frameOverlap;

                if (rootSection.mullionEdges.left === 'vertical') {
                    leftOverlap = mullionOverlap;
                } else if (rootSection.mullionEdges.left === 'vertical_invisible') {
                    leftOverlap = this.profile.get('mullion_width') / 2;
                } else {
                    leftOverlap = frameOverlap;
                }

                if (rootSection.mullionEdges.right === 'vertical') {
                    rightOverlap = mullionOverlap;
                } else if (rootSection.mullionEdges.right === 'vertical_invisible') {
                    rightOverlap = this.profile.get('mullion_width') / 2;
                } else {
                    rightOverlap = frameOverlap;
                }
            }

            if (hasFrame && rootSection.thresholdEdge) {
                bottomOverlap = thresholdOverlap;
            }

            rootSection.sashParams.width = rootSection.openingParams.width + leftOverlap + rightOverlap;
            rootSection.sashParams.height = rootSection.openingParams.height + topOverlap + bottomOverlap;
            rootSection.sashParams.x = rootSection.openingParams.x - leftOverlap;
            rootSection.sashParams.y = rootSection.openingParams.y - topOverlap;

            var frameWidth = hasFrame ? this.profile.get('sash_frame_width') : 0;

            rootSection.glassParams.x = rootSection.sashParams.x + frameWidth;
            rootSection.glassParams.y = rootSection.sashParams.y + frameWidth;
            rootSection.glassParams.width = rootSection.sashParams.width - frameWidth * 2;
            rootSection.glassParams.height = rootSection.sashParams.height - frameWidth * 2;

            var position = rootSection.position;

            if (rootSection.sections && rootSection.sections.length) {
                var mullionAttrs = {
                    x: null, y: null, width: null, height: null
                };

                if (rootSection.divider === 'vertical' || rootSection.divider === 'vertical_invisible') {
                    mullionAttrs.x = position - this.profile.get('mullion_width') / 2;
                    mullionAttrs.y = rootSection.glassParams.y;
                    mullionAttrs.width = this.profile.get('mullion_width');
                    mullionAttrs.height = rootSection.glassParams.height;

                } else {
                    mullionAttrs.x = rootSection.glassParams.x;
                    mullionAttrs.y = position - this.profile.get('mullion_width') / 2;
                    mullionAttrs.width = rootSection.glassParams.width;
                    mullionAttrs.height = this.profile.get('mullion_width');
                }

                rootSection.mullionParams = mullionAttrs;
            }

            rootSection.sections = _.map(rootSection.sections, function (sectionData, i) {
                var sectionParams = {
                    x: null, y: null, width: null, height: null
                };

                sectionData.mullionEdges = _.clone(rootSection.mullionEdges);
                sectionData.thresholdEdge = rootSection.thresholdEdge;
                sectionData.parentId = rootSection.id;

                // Correction params. Needed for sections in operable sash
                var corr = -1 * (this.profile.get('sash_frame_width') - this.profile.get('sash_frame_overlap'));
                var correction = {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                };

                // Calculate correction params
                if (rootSection.sashType !== 'fixed_in_frame') {
                    if (rootSection.divider === 'vertical' || rootSection.divider === 'vertical_invisible') {
                        // correction for vertical sections
                        if (i === 0) {
                            correction.x = -1 * corr;
                        }

                        correction.y = -1 * corr;
                        correction.width = corr;
                        correction.height = corr * 2;
                    } else {
                        // correction for horizontal sections
                        if (i === 0) {
                            correction.y = -1 * corr;
                        }

                        correction.x = -1 * corr;
                        correction.width = corr * 2;
                        correction.height = corr;
                    }
                }

                if (rootSection.divider === 'vertical' || rootSection.divider === 'vertical_invisible') {
                    sectionParams.x = openingParams.x;
                    sectionParams.y = openingParams.y;

                    if (i === 0) {
                        sectionParams.width = position - rootSection.openingParams.x -
                            this.profile.get('mullion_width') / 2;
                        sectionData.mullionEdges.right = rootSection.divider;
                    } else {
                        sectionParams.x = position + this.profile.get('mullion_width') / 2;
                        sectionParams.width = openingParams.width + openingParams.x -
                            position - this.profile.get('mullion_width') / 2;
                        sectionData.mullionEdges.left = rootSection.divider;
                    }

                    sectionParams.height = openingParams.height;
                } else {
                    sectionParams.x = openingParams.x;
                    sectionParams.y = openingParams.y;
                    sectionParams.width = openingParams.width;

                    if (i === 0) {
                        sectionData.mullionEdges.bottom = rootSection.divider;
                        sectionParams.height = position - rootSection.openingParams.y -
                            this.profile.get('mullion_width') / 2;
                        sectionData.thresholdEdge = false;
                    } else {
                        sectionParams.y = position + this.profile.get('mullion_width') / 2;
                        sectionParams.height = openingParams.height + openingParams.y - position -
                            this.profile.get('mullion_width') / 2;
                        sectionData.mullionEdges.top = rootSection.divider;
                    }
                }

                // Apply corrections
                sectionParams.x += correction.x;
                sectionParams.y += correction.y;
                sectionParams.width += correction.width;
                sectionParams.height += correction.height;

                return this.generateFullRoot(sectionData, sectionParams);
            }.bind(this));
            return rootSection;
        },
        generateFullReversedRoot: function (rootSection) {
            rootSection = rootSection || this.generateFullRoot();
            var width = this.getInMetric('width', 'mm');

            rootSection.openingParams.x = width - rootSection.openingParams.x - rootSection.openingParams.width;
            rootSection.glassParams.x = width - rootSection.glassParams.x - rootSection.glassParams.width;
            rootSection.sashParams.x = width - rootSection.sashParams.x - rootSection.sashParams.width;

            if (rootSection.divider === 'vertical' || rootSection.divider === 'vertical_invisible') {
                rootSection.position = width - rootSection.position;
                rootSection.sections = rootSection.sections.reverse();
                rootSection.mullionParams.x = width - rootSection.mullionParams.x - this.profile.get('mullion_width');
            }

            if (rootSection.divider === 'horizontal' || rootSection.divider === 'horizontal_invisible') {
                rootSection.mullionParams.x = width - rootSection.mullionParams.x - rootSection.mullionParams.width;
            }

            var type = rootSection.sashType;

            if (type.indexOf('left') >= 0) {
                type = type.replace('left', 'right');
            } else if (type.indexOf('right') >= 0) {
                type = type.replace('right', 'left');
            }

            rootSection.sashType = type;
            rootSection.sections = _.map(rootSection.sections, function (sectionData) {
                var temp = sectionData.mullionEdges.left;

                sectionData.mullionEdges.left = sectionData.mullionEdges.right;
                sectionData.mullionEdges.right = temp;
                return this.generateFullReversedRoot(sectionData);
            }.bind(this));
            return rootSection;
        },
        // it is not possible to add sash inside another sash
        // so this function check all parent
        canAddSashToSection: function (sectionId) {
            var fullRoot = this.generateFullRoot();
            var section = app.Unit.findSection(fullRoot, sectionId);

            if (section.parentId === undefined) {
                return true;
            }

            var parentSection = app.Unit.findSection(fullRoot, section.parentId);

            if (parentSection.sashType !== 'fixed_in_frame') {
                return false;
            }

            return this.canAddSashToSection(section.parentId);
        },
        flatterSections: function (rootSection) {
            rootSection = rootSection || this.get('root_section');
            var sections = [];

            if (rootSection.sections) {
                sections = _.concat(_.map(rootSection.sections, function (s) {
                    return this.flatterSections(s);
                }));
            } else {
                sections = [rootSection];
            }

            return sections;
        },
        getMullions: function (rootSection) {
            rootSection = rootSection || this.get('root_section');
            var mullions = [];

            if (rootSection.sections && rootSection.sections.length) {
                mullions.push({
                    type: rootSection.divider,
                    position: rootSection.position,
                    id: rootSection.id,
                    sections: [rootSection.sections[0], rootSection.sections[1]]
                });

                var submullions = _.map(rootSection.sections, function (s) {
                    return this.getMullions(s);
                }.bind(this));

                mullions = mullions.concat(submullions);
            } else {
                mullions = [];
            }

            return _.flatten(mullions);
        },
        getRevertedMullions: function () {
            return this.getMullions(this.generateFullReversedRoot());
        },
        getInMetric: function (attr, metric) {
            if (!metric || (['mm', 'inches'].indexOf(metric) === -1)) {
                throw new Error('Set metric! "mm" or "inches"');
            }

            if (metric === 'inches') {
                return this.get(attr);
            }

            return app.utils.convert.inches_to_mm(this.get(attr));
        },
        //  Inches by default, mm optional
        updateDimension: function (attr, val, metric) {
            var possible_metrics = ['mm', 'inches'];
            var possible_dimensions = ['width', 'height'];

            if ( !attr || possible_dimensions.indexOf(attr) === -1 ) {
                throw new Error('Wrong dimension. Possible values: ' + possible_dimensions.join(', ') );
            }

            if ( metric && possible_metrics.indexOf(metric) === -1 ) {
                throw new Error('Wrong metric. Possible values: ' + possible_metrics.join(', ') );
            }

            //  No metric means inches
            val = (!metric || metric === 'inches') ? val : app.utils.convert.mm_to_inches(val);

            if ( this.getCircleRadius() !== null ) {
                var full_root = this.generateFullRoot();

                this.setCircular(full_root.id, {
                    radius: val / 2
                });
            } else {
                this.persist(attr, val);
            }
        },
        clearFrame: function () {
            var rootId = this.get('root_section').id;

            //  Similar to removeMullion but affects more properties
            this._updateSection(rootId, function (section) {
                section.divider = null;
                section.sections = [];
                section.position = null;
                section.sashType = 'fixed_in_frame';
                _.assign(section, getDefaultFillingType());
            });
        },
        //  Here we get a list with basic sizes for each piece of the unit:
        //  frame, sashes, mullions, openings, glasses. Each piece got width,
        //  height, and some also got frame_width
        getSizes: function (current_root) {
            current_root = current_root || this.generateFullRoot();

            var result = {
                sashes: [],
                glasses: [],
                openings: [],
                mullions: [],
                glazing_bars: []
            };

            if ( !result.frame ) {
                result.frame = {
                    width: app.utils.convert.inches_to_mm(this.get('width')),
                    height: app.utils.convert.inches_to_mm(this.get('height')),
                    frame_width: this.profile.get('frame_width')
                };
            }

            _.each(current_root.sections, function (sec) {
                var subSizes = this.getSizes(sec);

                result.sashes = result.sashes.concat(subSizes.sashes);
                result.glasses = result.glasses.concat(subSizes.glasses);
                result.openings = result.openings.concat(subSizes.openings);
                result.mullions = result.mullions.concat(subSizes.mullions);
                result.glazing_bars = result.glazing_bars.concat(subSizes.glazing_bars);
            }, this);

            if ( current_root.sections.length === 0 ) {
                result.glasses.push({
                    width: current_root.glassParams.width,
                    height: current_root.glassParams.height
                });
            }

            if ( current_root.divider ) {
                result.mullions.push({
                    type: current_root.divider,
                    width: current_root.mullionParams.width,
                    height: current_root.mullionParams.height
                });
            }

            if ( current_root.bars.horizontal.length ) {
                _.each(current_root.bars.horizontal, function () {
                    result.glazing_bars.push({
                        type: 'horizontal',
                        width: current_root.glassParams.width,
                        height: this.get('glazing_bar_width'),
                        intersections: current_root.bars.vertical.length
                    });
                }, this);
            }

            if ( current_root.bars.vertical.length ) {
                _.each(current_root.bars.vertical, function () {
                    result.glazing_bars.push({
                        type: 'vertical',
                        width: this.get('glazing_bar_width'),
                        height: current_root.glassParams.height,
                        intersections: current_root.bars.horizontal.length
                    });
                }, this);
            }

            if ( current_root.sashType !== 'fixed_in_frame' ) {
                result.sashes.push({
                    width: current_root.sashParams.width,
                    height: current_root.sashParams.height,
                    frame_width: this.profile.get('sash_frame_width')
                });

                result.openings.push({
                    width: current_root.openingParams.width,
                    height: current_root.openingParams.height
                });
            }

            return result;
        },
        //  Get linear and area size stats for various parts of the window.
        //  These values could be used as a base to calculate estimated
        //  cost of options for the unit
        getLinearAndAreaStats: function () {
            var sizes = this.getSizes();
            var result = {
                frame: {
                    linear: 0,
                    linear_without_intersections: 0,
                    area: 0,
                    area_both_sides: 0
                },
                sashes: {
                    linear: 0,
                    linear_without_intersections: 0,
                    area: 0,
                    area_both_sides: 0
                },
                glasses: {
                    area: 0,
                    area_both_sides: 0
                },
                openings: {
                    area: 0
                },
                mullions: {
                    linear: 0,
                    area: 0,
                    area_both_sides: 0
                },
                glazing_bars: {
                    linear: 0,
                    linear_without_intersections: 0,
                    area: 0,
                    area_both_sides: 0
                },
                profile_total: {
                    linear: 0,
                    linear_without_intersections: 0,
                    area: 0,
                    area_both_sides: 0
                }
            };

            function getProfilePerimeter(width, height) {
                return (width + height) * 2;
            }

            function getProfilePerimeterWithoutIntersections(width, height, frame_width) {
                return (width + height) * 2 - frame_width * 4;
            }

            function getBarLengthWithoutIntersections(length, bar_width, intersections_number) {
                return length - bar_width * intersections_number;
            }

            function getArea(width, height) {
                return app.utils.math.square_meters(width, height);
            }

            result.frame.linear = getProfilePerimeter(sizes.frame.width, sizes.frame.height);
            result.frame.linear_without_intersections =
                getProfilePerimeterWithoutIntersections(sizes.frame.width, sizes.frame.height, sizes.frame.frame_width);
            result.frame.area = getArea(result.frame.linear_without_intersections, sizes.frame.frame_width);
            result.frame.area_both_sides = result.frame.area * 2;

            _.each(sizes.sashes, function (sash) {
                var sash_perimeter = getProfilePerimeter(sash.width, sash.height);
                var sash_perimeter_without_intersections =
                    getProfilePerimeterWithoutIntersections(sash.width, sash.height, sash.frame_width);

                result.sashes.linear += sash_perimeter;
                result.sashes.linear_without_intersections += sash_perimeter_without_intersections;
                result.sashes.area += getArea(sash_perimeter_without_intersections, sash.frame_width);
                result.sashes.area_both_sides += getArea(sash_perimeter_without_intersections, sash.frame_width) * 2;
            });

            _.each(sizes.mullions, function (mullion) {
                if ( mullion.type === 'vertical' ) {
                    result.mullions.linear += mullion.height;
                    result.mullions.area += getArea(mullion.height, mullion.width);
                    result.mullions.area_both_sides += getArea(mullion.height, mullion.width) * 2;
                } else {
                    result.mullions.linear += mullion.width;
                    result.mullions.area += getArea(mullion.width, mullion.height);
                    result.mullions.area_both_sides += getArea(mullion.width, mullion.height) * 2;
                }
            });

            _.each(sizes.glazing_bars, function (bar) {
                if ( bar.type === 'vertical' ) {
                    result.glazing_bars.linear += bar.height;
                    result.glazing_bars.linear_without_intersections += bar.height;
                    result.glazing_bars.area += getArea(bar.height, bar.width);
                    result.glazing_bars.area_both_sides += getArea(bar.height, bar.width) * 2;
                } else {
                    result.glazing_bars.linear += bar.width;
                    result.glazing_bars.linear_without_intersections +=
                        getBarLengthWithoutIntersections(bar.width, bar.height, bar.intersections);
                    result.glazing_bars.area += getArea(bar.width, bar.height);
                    result.glazing_bars.area_both_sides += getArea(bar.width, bar.height) * 2;
                }
            });

            _.each(sizes.openings, function (opening) {
                result.openings.area += getArea(opening.width, opening.height);
            });

            _.each(sizes.glasses, function (glass) {
                result.glasses.area += getArea(glass.width, glass.height);
                result.glasses.area_both_sides += getArea(glass.width, glass.height) * 2;
            });

            result.profile_total.linear = result.frame.linear + result.sashes.linear + result.mullions.linear;
            result.profile_total.linear_without_intersections = result.frame.linear_without_intersections +
                result.sashes.linear_without_intersections + result.mullions.linear;
            result.profile_total.area = result.frame.area + result.sashes.area + result.mullions.area;
            result.profile_total.area_both_sides = result.profile_total.area * 2;

            return result;
        },
        //  Returns sizes in mms
        getSashList: function (current_root, parent_root, reverse_hinges) {
            var current_sash = {
                opening: {},
                sash_frame: {},
                filling: {},
                sections: []
            };
            var section_result;
            var filling_type;
            var result = {
                sashes: [],
                sections: []
            };
            var type = 'sashes';

            current_root = current_root || this.generateFullRoot();
            current_sash.id = current_root.id;

            if (current_root.sashType !== 'fixed_in_frame') {
                type = 'sections';
            }

            _.each(current_root.sections, function (section) {
                section_result = this.getSashList(section, current_root, reverse_hinges);

                if (current_root.divider === 'vertical' || current_root.divider === 'vertical_invisible') {
                    result[type] = section_result.concat(result[type]);
                } else {
                    result[type] = result[type].concat(section_result);
                }
            }, this);

            if ( _.indexOf(SASH_TYPES_WITH_OPENING, current_root.sashType) !== -1 ) {
                current_sash.opening.width = current_root.openingParams.width;
                current_sash.opening.height = current_root.openingParams.height;
                current_sash.sash_frame.width = current_root.sashParams.width;
                current_sash.sash_frame.height = current_root.sashParams.height;
            }

            if ( current_root.sections.length === 0 ||
                ((current_root.sashType === 'fixed_in_frame') && (current_root.sections.length === 0)) ||
                ((current_root.sashType !== 'fixed_in_frame') && (current_root.sections.length))
            ) {
                current_sash.type = this.getSashName(current_root.sashType, reverse_hinges);
                current_sash.filling.width = current_root.glassParams.width;
                current_sash.filling.height = current_root.glassParams.height;

                current_sash.divider = current_root.divider;

                if ( current_root.fillingType && current_root.fillingName ) {
                    current_sash.filling.type = current_root.fillingType;
                    current_sash.filling.name = current_root.fillingName;
                } else if ( parent_root && parent_root.fillingType && parent_root.fillingName ) {
                    current_sash.filling.type = parent_root.fillingType;
                    current_sash.filling.name = parent_root.fillingName;
                } else if (
                    this.get('glazing') && app.settings &&
                    app.settings.getFillingTypeByName(this.get('glazing'))
                ) {
                    filling_type = app.settings.getFillingTypeByName(this.get('glazing'));
                    current_sash.filling.type = filling_type.get('type');
                    current_sash.filling.name = filling_type.get('name');
                } else {
                    filling_type = getDefaultFillingType();
                    current_sash.filling.type = filling_type.fillingType;
                    current_sash.filling.name = filling_type.fillingName;
                }

                if ( current_root.sections.length ) {
                    current_sash.sections = result.sections;
                }

                result.sashes.unshift(current_sash);
            }

            return result.sashes;
        },
        //  Returns sizes in mms
        getFixedAndOperableSectionsList: function (current_root) {
            var profile = this.profile;
            var current_area = {};
            var section_result;
            var result = [];

            current_root = current_root || this.generateFullRoot();

            _.each(current_root.sections, function (section) {
                section_result = this.getFixedAndOperableSectionsList(section);

                if (current_root.divider === 'vertical' || current_root.divider === 'vertical_invisible') {
                    result = section_result.concat(result);
                } else {
                    result = result.concat(section_result);
                }
            }, this);

            if ( _.indexOf(OPERABLE_SASH_TYPES, current_root.sashType) !== -1 ) {
                current_area.type = 'operable';
            } else {
                current_area.type = 'fixed';
            }

            if ( current_root.sections.length === 0 ) {
                current_area.width = current_root.openingParams.width;
                current_area.height = current_root.openingParams.height;

                _.each(['top', 'right', 'bottom', 'left'], function (position) {
                    var measurement = position === 'top' || position === 'bottom' ?
                        'height' : 'width';

                    if ( current_root.mullionEdges[position] ) {
                        current_area[measurement] += profile.get('mullion_width') / 2;
                    } else {
                        current_area[measurement] += profile.get('frame_width');
                    }

                }, this);

                if ( current_root.thresholdEdge ) {
                    current_area.height -= profile.get('frame_width');
                    current_area.height += profile.get('threshold_width');
                }

                result.unshift(current_area);
            }

            return result;
        },
        getSectionsListWithEstimatedPrices: function () {
            var pricing_grids = this.profile.getPricingGrids();
            var sections_list = this.getFixedAndOperableSectionsList();

            function getArea(item) {
                return item.height * item.width;
            }

            //  How this algorithm works:
            //  1. grids are already sorted by area size
            //  2. if our size < lowest size, price = lowest size price
            //  3. if our size > largest size, price = largest size price
            //  4. if our size === some size, price = some size price
            //  5. if our size > some size and < some other size, price is
            //  linear interpolation between prices for these sizes
            _.each(sections_list, function (section) {
                var section_area = getArea(section);
                var pricing_grid;

                section.price_per_square_meter = 0;

                if ( section.type === 'operable' ) {
                    pricing_grid = pricing_grids.operable;
                } else {
                    pricing_grid = pricing_grids.fixed;
                }

                if ( pricing_grid.length ) {
                    if ( section_area < getArea(pricing_grid[0]) ) {
                        section.price_per_square_meter = pricing_grid[0].price_per_square_meter;
                    } else if ( section_area > getArea(pricing_grid[pricing_grid.length - 1]) ) {
                        section.price_per_square_meter = pricing_grid[pricing_grid.length - 1].price_per_square_meter;
                    } else {
                        _.some(pricing_grid, function (pricing_tier, tier_index) {
                            if ( section_area === getArea(pricing_tier) ) {
                                section.price_per_square_meter = pricing_tier.price_per_square_meter;
                                return true;
                            } else if ( pricing_grid[tier_index + 1] &&
                                section_area < getArea(pricing_grid[tier_index + 1]) &&
                                section_area > getArea(pricing_tier)
                            ) {
                                section.price_per_square_meter = app.utils.math.linear_interpolation(
                                    section_area,
                                    getArea(pricing_tier),
                                    getArea(pricing_grid[tier_index + 1]),
                                    pricing_tier.price_per_square_meter,
                                    pricing_grid[tier_index + 1].price_per_square_meter
                                );
                                return true;
                            }
                        }, this);
                    }
                }

                section.estimated_price = app.utils.math.square_meters(section.width, section.height) *
                    section.price_per_square_meter;
            }, this);

            return sections_list;
        },
        getEstimatedUnitCost: function () {
            var sections_list = this.getSectionsListWithEstimatedPrices();
            var price = _.reduce(_.map(sections_list, function (item) {
                return item.estimated_price;
            }), function (memo, number) {
                return memo + number;
            }, 0);

            return price;
        },
        //  Check if unit has at least one operable section. This could be used
        //  to determine whether we should allow editing handles and such stuff
        hasOperableSections: function (current_root) {
            var has_operable_sections = false;

            current_root = current_root || this.generateFullRoot();

            if ( _.contains(OPERABLE_SASH_TYPES, current_root.sashType) ) {
                has_operable_sections = true;
            } else {
                _.each(current_root.sections, function (section) {
                    var section_is_operable = has_operable_sections || this.hasOperableSections(section);

                    if ( section_is_operable ) {
                        has_operable_sections = true;
                    }
                }, this);
            }

            return has_operable_sections;
        },
        isOperableOnlyAttribute: function (attribute_name) {
            return _.indexOf(OPERABLE_ONLY_PROPERTIES, attribute_name) !== -1;
        },
        //  Check if any of unit sections has glazing bars. This could be used
        //  to determine whether we should allow editing related properties
        hasGlazingBars: function (current_root) {
            var has_glazing_bars = false;

            current_root = current_root || this.generateFullRoot();

            if ( current_root.bars.horizontal.length > 0 || current_root.bars.vertical.length > 0 ) {
                has_glazing_bars = true;
            } else {
                _.each(current_root.sections, function (section) {
                    var section_has_glazing_bars = has_glazing_bars || this.hasGlazingBars(section);

                    if ( section_has_glazing_bars ) {
                        has_glazing_bars = true;
                    }
                }, this);
            }

            return has_glazing_bars;
        },
        isGlazingBarProperty: function (attribute_name) {
            return _.indexOf(GLAZING_BAR_PROPERTIES, attribute_name) !== -1;
        },
        getInvertedDivider: function (type) {
            return getInvertedDivider(type);
        },

        isCircleWindow: function () {
            return (this.getCircleRadius() !== null);
        },
        isArchedWindow: function () {
            return (this.getArchedPosition() !== null);
        }
    });

    // static function
    // it will find section with passed id from passed section and all its children
    // via nested search
    app.Unit.findSection = function (section, sectionId) {
        function findNested(sec, id) {
            if (sec.id === id) {
                return sec;
            }

            if (!sec.sections) {
                return null;
            }

            for (var i = 0; i < sec.sections.length; i++) {
                var founded = findNested(sec.sections[i], sectionId);

                if (founded) {
                    return founded;
                }
            }
        }

        return findNested(section, sectionId);
    };
})();
