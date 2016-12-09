var app = app || {};

(function () {
    'use strict';

    var self;

    var MULTIUNIT_PROPERTIES = [
        { name: 'multiunit_subunits', title: 'Subunits', type: 'array' }
    ];

    var CONNECTOR_DEFAULTS = {
        offsets: [0, 0],
        width: 20,
        facewidth: 40,
        length: '100%'
    };





    //  We only allow editing these attributes for units where
    //  `hasOperableSections` is `true`
    var OPERABLE_ONLY_PROPERTIES = ['opening_direction'];
    //  Same as above, for `hasGlazingBars`
    var GLAZING_BAR_PROPERTIES = ['glazing_bar_width'];

    var SASH_TYPES = [
        'tilt_turn_left', 'tilt_turn_right', 'fixed_in_frame', 'tilt_only',
        'turn_only_left', 'turn_only_right', 'fixed_in_sash',
        'slide_left', 'slide_right',
        'tilt_slide_left', 'tilt_slide_right',
        // additional types for solid doors
        'flush-turn-right', 'flush-turn-left', 'tilt_only_top_hung',
        'turn_only_right_hinge_hidden_latch', 'turn_only_left_hinge_hidden_latch'
    ];

    var SASH_TYPES_WITH_OPENING = _.without(SASH_TYPES, 'fixed_in_frame');
    var OPERABLE_SASH_TYPES = _.without(SASH_TYPES, 'fixed_in_frame', 'fixed_in_sash');
    var EGRESS_ENABLED_TYPES = [
        'tilt_turn_right', 'tilt_turn_left', 'turn_only_right', 'turn_only_left',
        'turn_only_right_hinge_hidden_latch', 'turn_only_left_hinge_hidden_latch'
    ];





    function getSectionDefaults() {
        return {
            id: _.uniqueId(),
            connectors: []
        };
    }

    function isPercentage(value) {
        if (_.isArray(value)) {
            return value.some(function (subvalue) { return isPercentage(subvalue); });
        } else {
            return (_.isString(value) && value.indexOf('%') !== -1);
        }
    }




    function getDefaultBars() {
        return {
            vertical: [],
            horizontal: []
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



    app.Multiunit = Backbone.Model.extend({
        schema: _.defaults(app.schema.createSchema(MULTIUNIT_PROPERTIES), app.Unit.schema),
        defaults: function () {
            var defaults = app.Unit.prototype.defaults.apply(this, arguments);

            _.each(MULTIUNIT_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
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

            this.validateUnitOptions();
        },
        hasDummyProfile: function () {
            return this.profile && this.profile.get('is_dummy');
        },
        validateUnitOptions: function () {
            var default_options = this.getDefaultUnitOptions();
            var current_options = this.get('unit_options');
            var current_options_parsed;

            function getValidatedUnitOptions(model, currents, defaults) {
                var options_to_set = [];

                if ( app.settings ) {
                    app.settings.dictionaries.each(function (dictionary) {
                        var dictionary_id = dictionary.id;
                        var profile_id = model.profile && model.profile.id;

                        if ( dictionary_id && profile_id ) {
                            var current_option = _.findWhere(currents, { dictionary_id: dictionary_id });
                            var default_option = _.findWhere(defaults, { dictionary_id: dictionary_id });
                            var target_entry = current_option &&
                                dictionary.entries.get(current_option.dictionary_entry_id);

                            if ( current_option && target_entry ) {
                                options_to_set.push(current_option);
                            } else if ( default_option ) {
                                options_to_set.push(default_option);
                            }
                        }
                    });
                }

                return options_to_set;
            }

            if ( _.isString(current_options) ) {
                try {
                    current_options_parsed = JSON.parse(current_options);
                } catch (error) {
                    // Do nothing
                }

                if ( current_options_parsed ) {
                    this.set('unit_options', getValidatedUnitOptions(this, current_options_parsed, default_options));
                    return;
                }
            }

            if ( !_.isObject(current_options) ) {
                this.set('unit_options', default_options);
            } else {
                this.set('unit_options', getValidatedUnitOptions(this, current_options, default_options));
            }
        },
        getDefaultUnitOptions: function () {
            var default_options = [];

            if ( app.settings ) {
                app.settings.dictionaries.each(function (dictionary) {
                    var dictionary_id = dictionary.id;
                    var profile_id = this.profile && this.profile.id;
                    var rules = dictionary.get('rules_and_restrictions');
                    var is_optional = _.contains(rules, 'IS_OPTIONAL');

                    if ( !is_optional && dictionary_id && profile_id ) {
                        var option = app.settings.getDefaultOrFirstAvailableOption(dictionary_id, profile_id);

                        if ( option && option.id && dictionary.id ) {
                            default_options.push({
                                dictionary_id: dictionary.id,
                                dictionary_entry_id: option.id
                            });
                        }
                    }
                }, this);
            }

            return default_options;
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
            if ( current_section.measurements && !current_section.measurements.mullion && current_section.divider ){
                var measurementType = getInvertedDivider(current_section.divider).replace(/_invisible/, '');

                current_section.measurements.mullion = {};
                current_section.measurements.mullion[measurementType] = ['center', 'center'];
            }

            _.each(current_section.sections, function (section) {
                section = this.validateSection(section, false);
            }, this);

            return current_section;
        },
        //  Check if this unit belongs to the project which is currently active
        isParentProjectActive: function () {
            var is_active = false;

            if ( app.current_project && this.collection && this.collection.options.project &&
                this.collection.options.project === app.current_project
            ) {
                is_active = true;
            }

            return is_active;
        },
        getSubtotalPriceDiscounted: function () {
            return this.getSubtotalPrice() * (100 - parseFloat(this.get('discount'))) / 100;
        },
        getSubtotalPrice: function () {
            return this.getUnitPrice() * parseFloat(this.get('quantity'));
        },
        getSubtotalCostDiscounted: function () {
            return this.getUnitCostDiscounted() * parseFloat(this.get('quantity'));
        },
        getUnitCostDiscounted: function () {
            return this.getUnitCost() * (100 - parseFloat(this.get('supplier_discount'))) / 100;
        },
        getUnitCost: function () {
            return this.getOriginalCost() / parseFloat(this.get('conversion_rate'));
        },
        getOriginalCost: function () {
            var original_cost = this.get('original_cost');
            var project_settings = app.settings ? app.settings.getProjectSettings() : undefined;

            if ( project_settings && project_settings.get('pricing_mode') === 'estimates' ) {
                original_cost = this.getEstimatedUnitCost();
            }

            return parseFloat(original_cost);
        },
        getRelation: function () {
            var unitRelation;

            if (this.isMultiunit()) {
                unitRelation = 'multiunit';
            } else if (this.isSubunit()) {
                unitRelation = 'subunit';
            } else {
                unitRelation = 'loneunit';
            }

            return unitRelation;
        },
        isMultiunit: function () {
            return this.constructor === app.Multiunit;
        },
        isSubunit: function () {
            return false;
        },
        getId: function () {
            return this.get('root_section').id;
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

            if (!current_root.sashType) { return undefined; }

            if (current_root.sashType !== 'fixed_in_frame') {
                type = 'sections';
            }

            current_sash.id = current_root.id;

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
                current_sash.original_type = current_root.sashType;
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
        getInMetric: function (attr, metric) {
            if (!metric || (['mm', 'inches'].indexOf(metric) === -1)) {
                throw new Error('Set metric! "mm" or "inches"');
            }

            if (metric === 'inches') {
                return this.get(attr);
            }

            return app.utils.convert.inches_to_mm(this.get(attr));
        },
        isOperableOnlyAttribute: function (attribute_name) {
            return _.indexOf(OPERABLE_ONLY_PROPERTIES, attribute_name) !== -1;
        },
        isGlazingBarProperty: function (attribute_name) {
            return _.indexOf(GLAZING_BAR_PROPERTIES, attribute_name) !== -1;
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
        getUValue: function () {
            return parseFloat(this.get('uw')) * 0.176;
        },
        getRoughOpeningWidth: function () {
            return parseFloat(this.get('width')) + 1;
        },
        getRoughOpeningHeight: function () {
            return parseFloat(this.get('height')) + 1;
        },
        /* trapezoid start */
        isTrapezoid: function () {
            var root = this.generateFullRoot();

            return root.trapezoidHeights;
        },
        /* Determines the number of vertical metric columns on the unit drawing's left and right sides
         * Duplicates logic from MetricsDrawer /static/source/js/drawing/module/metrics-drawer.js */
        leftMetricCount: function (isInsideView) {

            // Inside view //

            // Trapezoid units have reversed metrics on the inside view, except for arched trapezoids
            if (isInsideView && this.isTrapezoid() && !this.isArchedWindow()) {
                return this.rightMetricCount();
            }

            // All views //

            // Trapezoid units always have one metric on the left
            if (this.isTrapezoid()) {
                return 1;

                // Arched units always have two metrics on the left
            } else if (this.isArchedWindow()) {
                return 2;

                // For regular units, at least one horizontal mullion adds the second metric
            } else {
                return (this.hasHorizontalMullion()) ? 2 : 1;
            }
        },
        isArchedWindow: function () {
            return (this.getArchedPosition() !== null);
        },
        //  FIXME: this uses while true
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
        /* Determines if the unit has at least one horizontal mullion */
        hasHorizontalMullion: function () {
            return this.getMullions().reduce(function (previous, current) {
                return previous || (current.type === 'horizontal' || current.type === 'horizontal_invisible');
            }, false);
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
        /* Determines the number of vertical metric columns on the unit drawing's right side
         * Duplicates logic from MetricsDrawer /static/source/js/drawing/module/metrics-drawer.js */
        rightMetricCount: function (isInsideView) {

            // Inside view //

            // Trapezoid units have reversed metrics on the inside view, except for arched trapezoids
            if (isInsideView && this.isTrapezoid() && !this.isArchedWindow()) {
                return this.leftMetricCount();
            }

            // All views //

            // Arched trapezoid units always have two metrics on the right
            if (this.isTrapezoid() && this.isArchedWindow()) {
                return 2;

                // For regular trapezoid units, at least one horizontal mullion adds the second metric
            } else if (this.isTrapezoid()) {
                return (this.hasHorizontalMullion()) ? 2 : 1;

                // Non-trapezoid units don't have metrics on the right
            } else {
                return 0;
            }
        },
        isOpeningDirectionOutward: function () {
            return this.get('opening_direction') === 'Outward';
        },
        getUnitPriceDiscounted: function () {
            return this.getUnitPrice() * (100 - parseFloat(this.get('discount'))) / 100;
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        },
        hasBaseFilling: function () {
            var has_base_filling = false;
            var sizes = this.getSizes();

            if (app.settings && app.settings.filling_types) {
                _.find(sizes.glasses, function (glass) {
                    var is_base = app.settings.filling_types.find(function (filling) {
                        return filling.get('name') === glass.name && filling.get('is_base_type') === true;
                    });

                    if ( is_base ) {
                        has_base_filling = true;
                        return true;
                    }
                });
            }

            return has_base_filling;
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
                    name: current_root.fillingName,
                    type: current_root.fillingType,
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

            if ( current_root.bars && current_root.bars.horizontal.length ) {
                _.each(current_root.bars.horizontal, function () {
                    result.glazing_bars.push({
                        type: 'horizontal',
                        width: current_root.glassParams.width,
                        height: this.get('glazing_bar_width'),
                        intersections: current_root.bars.vertical.length
                    });
                }, this);
            }

            if ( current_root.bars && current_root.bars.vertical.length ) {
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
            var profileWeight = this.profile.get('weight_per_length');
            var fillingWeight = {};

            if (app.settings && app.settings.filling_types) {
                app.settings.filling_types.each(function (filling) {
                    fillingWeight[filling.get('name')] = filling.get('weight_per_area');
                });
            }

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
                    area_both_sides: 0,
                    weight: 0
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
                    area_both_sides: 0,
                    weight: 0
                },
                unit_total: {
                    weight: 0
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

            var hasBaseFilling = this.hasBaseFilling();

            _.each(sizes.glasses, function (glass) {
                var area = getArea(glass.width, glass.height);

                result.glasses.area += area;
                result.glasses.area_both_sides += getArea(glass.width, glass.height) * 2;

                if (fillingWeight[glass.name]) {
                    result.glasses.weight += area * fillingWeight[glass.name];
                }
            });

            result.profile_total.linear = result.frame.linear + result.sashes.linear + result.mullions.linear;
            result.profile_total.linear_without_intersections = result.frame.linear_without_intersections +
                result.sashes.linear_without_intersections + result.mullions.linear;
            result.profile_total.area = result.frame.area + result.sashes.area + result.mullions.area;
            result.profile_total.area_both_sides = result.profile_total.area * 2;
            result.profile_total.weight = (result.profile_total.linear / 1000) * profileWeight;

            //  Calculate total unit weight, but only if there are no base fillings
            if (hasBaseFilling) {
                result.glasses.weight = -1;
            } else {
                result.unit_total.weight = result.profile_total.weight + result.glasses.weight;
            }

            return result;
        },
        getRefNum: function () {
            return this.collection ? this.collection.indexOf(this) + 1 : -1;
        },
        getSection: function (sectionId) {
            return app.Unit.findSection(this.generateFullRoot(), sectionId);
        },
        getTotalSquareFeet: function () {
            return this.getAreaInSquareFeet() * parseFloat(this.get('quantity'));
        },
        getAreaInSquareFeet: function () {
            return app.utils.math.square_feet(this.get('width'), this.get('height'));
        },
        getTrapezoidHeight: function () {
            var trapezoidHeights = this.get('root_section').trapezoidHeights;

            return (trapezoidHeights) ? trapezoidHeights[0] + ' | ' + trapezoidHeights[1] : this.get('height');
        },
        getWidthMM: function () {
            return app.utils.convert.inches_to_mm(this.get('width'));
        },
        getTrapezoidHeightMM: function () {
            var trapezoidHeights = this.get('root_section').trapezoidHeights;

            if (trapezoidHeights) {
                trapezoidHeights = [
                    app.utils.convert.inches_to_mm(trapezoidHeights[0]),
                    app.utils.convert.inches_to_mm(trapezoidHeights[1])
                ];
            }

            return trapezoidHeights || app.utils.convert.inches_to_mm(this.get('height'));
        },





        getDefaultValue: function (name) {
            var value;
            var defaults = {
                root_section: getSectionDefaults()
            };

            if (Object.keys(defaults).indexOf(name) !== -1) {
                value = defaults[name];
            } else {
                value = app.Unit.prototype.getDefaultValue.apply(this, arguments);
            }

            return value;
        },
        initialize: function () {
            self = this;

            app.Unit.prototype.initialize.apply(this, arguments);

            this.on('add', function () {
                self.listenTo(self.collection.subunits, 'update', function (event) {
                    self.connectorsToEssentialFormat();
                    self.updateSubunitsCollection();
                });
                self.listenTo(self.collection.subunits, 'remove', function (unit) {
                    if (unit.isSubunitOf(self)) {
                        self.removeSubunit(unit);
                    }
                });
            });
        },
        getUnitPrice: function () {
            var price = this.subunits.reduce(function (priceSum, subunit) {
                return priceSum + subunit.getUnitPrice();
            }, 0);

            return price;
        },
        /**
         * this.subunits is a backbone collection that holds respective subunit models, the very same models that exist
         * in multiunit's primary parent collection.
         */
        updateSubunitsCollection: function () {
            if (!this.subunits) {
                this.subunits = new app.UnitCollection();
                this.listenTo(this.subunits, 'change', function () {  // trigger self change if any subunit changes
                    self.trigger.apply(this, ['change'].concat(Array.prototype.slice.call(arguments)));
                });
            }

            var subunitsIds = this.getSubunitsIds();

            this.subunits.add(
                subunitsIds
                    .map(function (id) { return self.getSubunitById(id); })
                    .filter(function (subunit) { return !_.isUndefined(subunit); })
                    .filter(function (subunit) { return self.subunits.indexOf(subunit) === -1; })
            );
        },
        hasOnlyDefaultAttributes: function () {
            var has_only_defaults = true;

            _.each(this.toJSON(), function (value, key) {
                if ( key !== 'position' && has_only_defaults ) {
                    var property_source = _.findWhere(MULTIUNIT_PROPERTIES, { name: key });
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
                    } else if ( key === 'unit_options' ) {
                        if ( JSON.stringify(this.getDefaultUnitOptions()) !== JSON.stringify(value) ) {
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
                names = _.pluck( MULTIUNIT_PROPERTIES, 'name' );
            }

            _.each(MULTIUNIT_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_hash.push({ name: item.name, title: item.title, type: item.type });
                }
            });

            return name_title_hash;
        },
        getSubunitById: function (id) {
            return this.collection.subunits.getById(id);
        },
        addSubunit: function (subunit) {
            if (!(subunit instanceof app.Unit)) { return; }

            var subunitsIds = this.get('multiunit_subunits');
            var subunitId = subunit.getId();

            if (!_.contains(subunitsIds, subunitId)) {
                subunitsIds.push(subunitId);
                this.updateSubunitsCollection();
                this.recalculateSizes();
            }
        },
        removeSubunit: function (subunit) {
            if (!(subunit.isSubunitOf && subunit.isSubunitOf(this))) { return; }

            var subunitsIds = this.get('multiunit_subunits');
            var subunitId = subunit.getId();
            var subunitIndex = subunitsIds.indexOf(subunitId);

            if (subunitIndex !== -1) {
                subunitsIds.splice(subunitIndex, 1);
                this.removeConnector(this.getParentConnector(subunitId).id);
                this.updateSubunitsCollection();
                this.recalculateSizes();
            }
        },
        recalculateSizes: function () {  // updates multiunit width/height from subunit changes
            var subunitPositionsTree = this.getSubunitsCoordinatesTree();

            var minX = 0;
            var maxX = 0;
            var minY = 0;
            var maxY = 0;
            this.subunitsTreeForEach(subunitPositionsTree, function (node) {
                minX = Math.min(minX, node.x);
                maxX = Math.max(maxX, node.x + node.width);
                minY = Math.min(minY, node.y);
                maxY = Math.max(maxY, node.y + node.height);
            });
            var multiunitWidth = app.utils.convert.mm_to_inches(maxX - minX).toFixed(5);
            var multiunitHeight = app.utils.convert.mm_to_inches(maxY - minY).toFixed(5);
            this.set('width', multiunitWidth);
            this.set('height', multiunitHeight);

            return { width: multiunitWidth, height: multiunitHeight };
        },
        getSubunitNode: function (subunitId) {
            var subunitPositionsTree = this.getSubunitsCoordinatesTree();
            var subunitNode;
            this.subunitsTreeForEach(subunitPositionsTree, function (node) {
                if (node.unit.getId() === subunitId) {
                    subunitNode = node;
                }
            });
            
            return subunitNode;
        },
        getSubunitCoords: function (subunitId) {
            var subunitNode = this.getSubunitNode(subunitId);
            var coords;
            if (subunitNode) {
                coords = {
                    x: subunitNode.x,
                    y: subunitNode.y
                };
            }
            
            return coords;  // mm
        },
        /**
         * Subunit tree consists of nodes corresponding to subunits.
         * Each node has 3 fields:
         * unit - points to the unit model associated with this node
         * parent - points to the parent node
         * children - points to array of child nodes
         */
        getSubunitsTree: function () {
            var subunitsIds = this.getSubunitsIds();  // prepare flat array of node templates
            var nodeTemplates = subunitsIds.map(function (subunitId) {
                var unitId = subunitId;
                var parentId = self.getParentSubunitId(subunitId);
                var childrenIds = self.getChildSubunitsIds(subunitId);
                var node = {
                    unit: unitId,
                    parent: parentId,
                    children: childrenIds
                };
                return node;
            });

            var originId = this.getOriginSubunitId();  // bootstrap tree
            var originNode = nodeTemplates.filter(function (node) {
                return (node.unit === originId);
            })[0];
            originNode.unit = self.getSubunitById(originNode.unit);
            var subunitsTree = originNode;
            var processableLeafNodes = [];
            processableLeafNodes[0] = subunitsTree;

            while (processableLeafNodes.length > 0) {  // build tree by appending nodes from array
                var currentNode = processableLeafNodes.pop();
                currentNode.children.forEach(function (subunitId, childIndex) {
                    var childNode = nodeTemplates.filter(function (node) {  // append a node
                        return (node.unit === subunitId);
                    })[0];
                    currentNode.children[childIndex] = childNode;

                    childNode.unit = self.getSubunitById(subunitId);  // render node to its final form
                    childNode.parent = currentNode;

                    if (childNode.children.length > 0) {  // earmark for later processing
                        processableLeafNodes.push(childNode);
                    }
                });
            }

            return subunitsTree;
        },
        // Returns subunit tree with coordinate information at each node, in mm
        getSubunitsCoordinatesTree: function () {
            var subunitsTree = this.getSubunitsTree();
            this.subunitsTreeForEach(subunitsTree, function (node) {
                var isOrigin = self.isOriginId(node.unit.getId());

                if (isOrigin) {
                    node.width = node.unit.getInMetric('width', 'mm');
                    node.height = node.unit.getInMetric('height', 'mm');
                    node.x = 0;
                    node.y = 0;
                } else {
                    var width = node.unit.getInMetric('width', 'mm');
                    var height = node.unit.getInMetric('height', 'mm');
                    var parentX = node.parent.x;
                    var parentY = node.parent.y;
                    var parentWidth = node.parent.unit.getInMetric('width', 'mm');
                    var parentHeight = node.parent.unit.getInMetric('height', 'mm');
                    var parentConnector = self.getParentConnector(node.unit.getId());
                    var gap = parentConnector.width;
                    var offset = parentConnector.offsets[1] + parentConnector.offsets[0];
                    var side = parentConnector.side;

                    node.width = width;
                    node.height = height;

                    if (side && side === 'top') {
                        node.x = parentX + offset;
                        node.y = parentY - gap - height;
                    } else if (side && side === 'right') {
                        node.x = parentX + parentWidth + gap;
                        node.y = parentY + offset;
                    } else if (side && side === 'bottom') {
                        node.x = parentX + offset;
                        node.y = parentY + parentHeight + gap;
                    } else if (side && side === 'left') {
                        node.x = parentX - gap - width;
                        node.y = parentY + offset;
                    }
                }
            });

            return subunitsTree;
        },
        subunitsTreeForEach: function (subunitNode, func) {
            if (!subunitNode || !_.isFunction(func)) { return; }

            var children = subunitNode.children;  // start at node and apply down
            func.call(this, subunitNode);
            if (children && children.length > 0) {
                children.forEach(function (node) {  // recursive walk
                    self.subunitsTreeForEach(node, func);
                });
            }
        },
        getSubunitRelativePosition: function (subunit) {
            return this.subunits.indexOf(subunit);
        },
        getSubunitsIds: function () {
            return this.get('multiunit_subunits').slice();
        },
        getOriginSubunitId: function () {
            return this.get('multiunit_subunits')[0];
        },
        isOriginId: function (subunitId) {
            return (subunitId === this.getOriginSubunitId())
        },
        getParentSubunitId: function (subunitId) {
            if (_.isUndefined(subunitId)) { return; }
            if (this.isOriginId(subunitId)) { return; }

            var parentConnectorId = this.getParentConnector(subunitId).id;
            var parentSubunitId = this.getConnectorParentSubunitId(parentConnectorId);

            return parentSubunitId;
        },
        getChildSubunitsIds: function (subunitId) {
            if (_.isUndefined(subunitId)) { return; }

            var childConnectors = this.getChildConnectors(subunitId);
            var childSubunitsIds = childConnectors.map(function (connector) {
                return self.getConnectorChildSubunitId(connector.id);
            });

            return childSubunitsIds;
        },
        /**
         * = Conceptual connector model:
         *
         * The multiunit is a tree of subunits. Each connection is
         * parent subunit <- connector <- child subunit.
         *
         * Connector connects to parent on a side with offset along the side ("sliding" on the side).
         * Connector adds a gap between parent and child, but may itself appear thicker than that gap.
         * Child connects to connector with another offset in the same direction.
         *
         * = Essential connector format:
         * {
         *     id: '<id>',                       // Multiunit-scope unique numeric ID for the connector
         *     side: '<top|right|bottom|left>',  // Attach connector to parent side
         *     connects: [                       // IDs of subunits connected
         *         '<id>',                           // Parent subunit ID
         *         '<id>'                            // Child subunit ID
         *     ],
         *     offsets: [                        // Offsets along chosen parent side
         *         <number>,                         // Connector offset relative to parent, mm
         *         <number>                          // Child offset relative to connector, mm
         *     ],
         *     width: <number>,                  // Actual gap between connected units, mm
         *     facewidth: <number>               // How wide the connector drawing appears, mm
         *     length: <number>,                 // Connector length, mm
         * }
         *
         * = Optional ad-hoc extensions:
         * Use for particular tasks. Convert to essential format after use.
         * {
         *     offsets: [
         *         '<number>%',                      // Connector offset relative to parent, % of parent side length
         *         '<number>%'                       // Child offset relative to connector, % of connector length
         *     ],
         *     length: '<number>%',              // Connector length, % of parent side length
         * }
         *
         * = Example:
         * { id: '17', side: 'right', connects: ['123', '124'], offsets: [0, 100], width: 20, facewidth: 40, length: 200 }
         */
        getConnectors: function () {
            var connectors = this.get('root_section').connectors.slice();

            return connectors;
        },
        getConnectorById: function (id) {
            if (_.isUndefined(id)) { return; }

            return this.getConnectors().find(function (connector) { return connector.id === id; });
        },
        getParentConnector: function (subunitId) {
            if (_.isUndefined(subunitId)) { return; }

            var parentConnector = this.getConnectors()
                .filter(function (connector) {
                    return (connector.connects[1] === subunitId);
                })[0];

            return parentConnector;
        },
        getChildConnectors: function (subunitId) {
            if (_.isUndefined(subunitId)) { return; }

            var childConnectors = this.getConnectors()
                .filter(function (connector) {
                    return (connector.connects[0] === subunitId);
                });

            return childConnectors;
        },
        getConnectorParentSubunitId: function (connectorId) {
            if (_.isUndefined(connectorId)) { return; }

            var parentSubunitId = this.getConnectorById(connectorId).connects[0];
            
            return parentSubunitId;
        },
        getConnectorChildSubunitId: function (connectorId) {
            if (_.isUndefined(connectorId)) { return; }

            var childSubunitId = this.getConnectorById(connectorId).connects[1];
            
            return childSubunitId;
        },
        addConnector: function (options) {
            if (!(options && options.connects && options.side)) { return; }

            var parentSubunit = this.getSubunitById(options.connects[0]);
            var connectors = this.get('root_section').connectors;
            var newChildSubunit;

            var highestId = connectors
                .map(function (connector) { return connector.id; })
                .reduce(function (lastHighestId, currentId) { return Math.max(currentId, lastHighestId); }, 0);

            if (!options.connects[1]) {
                newChildSubunit = new app.Unit({
                    width: parentSubunit.get('width'),
                    height: parentSubunit.get('height')
                });
                options.connects[1] = parentSubunit.collection.add(newChildSubunit).getId();
            }

            var connector = {
                id: highestId + 1,
                connects: options.connects,
                side: options.side,
                offsets: options.offsets || CONNECTOR_DEFAULTS.offsets,
                width: options.width || CONNECTOR_DEFAULTS.width,
                length: options.length || CONNECTOR_DEFAULTS.length,
                facewidth: options.facewidth || CONNECTOR_DEFAULTS.facewidth
            };


            connectors.push(connector);
            this.connectorToEssentialFormat(connector);
            if (newChildSubunit) { this.addSubunit(newChildSubunit); }
            return connector;
        },
        removeConnector: function (id) {
            if (_.isUndefined(id)) { return; }

            var connectors = this.get('root_section').connectors;
            var connector;

            var connectorIndex = connectors.indexOf(this.getConnectorById(id));

            if (connectorIndex !== -1) {
                connector = connectors.splice(connectorIndex, 1)[0];
            }
            // FIXME implement
            return connector;
        },
        moveConnector: function () {
            // FIXME implement
        },
        setConnectorProperties: function (id, options) {
            if (_.isUndefined(id)) { return; }
            if (!options || options.constructor !== Object) { return; }

            var connector = this.getConnectorById(id);

            if (connector) {
                Object.keys(options).forEach(function (key) {
                    connector[key] = options[key];
                });
            }
            // FIXME implement
            return connector;
        },
        connectorToEssentialFormat: function (connector) {
            if (_.isUndefined(connector)) { return; }

            var parentId = connector.connects[0];
            var parent = this.getSubunitById(parentId);

            if (_.isUndefined(parent)) { return; }

            var parentSide = (connector.side === 'top' || connector.side === 'bottom') ?
                parent.getInMetric('width', 'mm') :
                parent.getInMetric('height', 'mm');

            if (isPercentage(connector.length)) {
                connector.length = parseFloat(connector.length) * 0.01 * parentSide;
            }

            if (isPercentage(connector.offsets[0])) {
                connector.offsets[0] = parseFloat(connector.offsets[0]) * 0.01 * parentSide;
            }

            if (isPercentage(connector.offsets[1])) {
                connector.offsets[1] = parseFloat(connector.offsets[1]) * 0.01 * connector.length;
            }

            return connector;
        },
        connectorsToEssentialFormat: function () {
            var connectors = this.get('root_section').connectors;

            connectors.forEach(function (connector) {
                self.connectorToEssentialFormat(connector);
            });
        }
    });
})();
