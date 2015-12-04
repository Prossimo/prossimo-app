var app = app || {};

(function () {
    'use strict';

    var UNIT_PROPERTIES = [
        { name: 'mark', title: 'Mark', type: 'string' },
        { name: 'width', title: 'Width (inches)', type: 'number' },
        { name: 'height', title: 'Height (inches)', type: 'number' },
        { name: 'quantity', title: 'Quantity', type: 'number' },
        { name: 'type', title: 'Type', type: 'string' },
        { name: 'description', title: 'Description', type: 'string' },
        { name: 'notes', title: 'Notes', type: 'string' },
        { name: 'glazing_bar_width', title: 'Glazing Bar Width (mm)', type: 'number' },

        { name: 'profile_name', title: 'Profile', type: 'string' },
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
        { name: 'price_markup', title: 'Markup', type: 'number' },
        { name: 'discount', title: 'Discount', type: 'number' }
    ];

    //  We only enable those properties for editing on units where profile
    //  returns `true` on `hasOutsideHandle` call
    var DOOR_ONLY_PROPERTIES = ['exterior_handle', 'lock_mechanism'];

    var SASH_TYPES = [
        'tilt_turn_left', 'tilt_turn_right', 'fixed_in_frame', 'tilt_only',
        'turn_only_left', 'turn_only_right', 'fixed_in_sash',
        // additional types for solid doors
        'flush-turn-right', 'flush-turn-left'
    ];

    app.Unit = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(UNIT_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        //  TODO: change to hash format like everywhere else
        getDefaultValue: function (name, type) {
            var default_value = '';

            if ( type === 'number' ) {
                default_value = 0;
            }

            if ( name === 'original_currency' ) {
                default_value = 'USD';
            }

            if ( name === 'conversion_rate' ) {
                default_value = 1;
            }

            if ( name === 'price_markup' ) {
                default_value = 1;
            }

            if ( name === 'glazing_bar_width' ) {
                default_value = 22;
            }

            if ( name === 'root_section' ) {
                default_value = {
                    id: _.uniqueId(),
                    sashType: 'fixed_in_frame'
                };
            }

            return default_value;
        },
        save: function () {
            return Backbone.Model.prototype.saveAndGetId.apply(this, arguments);
        },
        sync: function (method, model, options) {
            if ( method === 'create' || method === 'update' ) {
                options.attrs = { project_unit: _.extendOwn(_.omit(model.toJSON(), ['id']), {
                    root_section: JSON.stringify(model.get('root_section'))
                }) };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        //  TODO: this function should be called on model init (maybe not only)
        //  and check whether root section could be used by drawing code or
        //  should it be reset to defaults.
        //  TODO: It doesn't validate anything currently, we have to fix it
        validateRootSection: function () {
            if ( _.isString(this.get('root_section')) ) {
                this.set('root_section', JSON.parse(this.get('root_section')));
            } else if ( !_.isObject(this.get('root_section')) ) {
                this.set('root_section', this.getDefaultValue('root_section'));
            }
        },
        initialize: function (attributes, options) {
            this.options = options || {};
            this.profile = null;

            if ( !this.options.proxy ) {
                this.setProfile();
                this.validateRootSection();
                this.on('change:profile_name', this.setProfile, this);
            }
        },
        setProfile: function () {
            this.profile = null;

            if ( app.settings && !this.get('profile_name') ) {
                this.set('profile_name', app.settings.getDefaultProfileName());
            }

            if ( app.settings ) {
                this.profile = app.settings.getProfileByNameOrNew(this.get('profile_name'));
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
        //  TODO: do some checks? return error value in some cases?
        getUnitCost: function () {
            return parseFloat(this.get('original_cost')) / parseFloat(this.get('conversion_rate'));
        },
        getUnitPrice: function () {
            return this.getUnitCost() * parseFloat(this.get('price_markup'));
        },
        getSubtotalPrice: function () {
            return this.getUnitPrice() * parseFloat(this.get('quantity'));
        },
        getUValue: function () {
            return parseFloat(this.get('uw')) * 0.176;
        },
        getUnitPriceDiscounted: function () {
            return this.getUnitPrice() * (100 - this.get('discount')) / 100;
        },
        getSubtotalPriceDiscounted: function () {
            return this.getSubtotalPrice() * (100 - this.get('discount')) / 100;
        },
        getSquareFeetPrice: function () {
            return this.getTotalSquareFeet() ? this.getSubtotalPrice() / this.getTotalSquareFeet() : 0;
        },
        getSquareFeetPriceDiscounted: function () {
            return this.getTotalSquareFeet() ? this.getSubtotalPriceDiscounted() / this.getTotalSquareFeet() : 0;
        },
        getSection: function(sectionId) {
            return app.Unit.findSection(this.generateFullRoot(), sectionId);
        },
        isDoorOnlyAttribute: function (attribute_name) {
            return _.indexOf(DOOR_ONLY_PROPERTIES, attribute_name) !== -1;
        },
        areDoorOnlyAttributesEditable: function () {
            var is_editable = false;

            if ( this.profile && this.profile.hasOutsideHandle() ) {
                is_editable = true;
            }

            return is_editable;
        },
        _updateSection: function(sectionId, func) {
            // HAH, dirty deep clone, rewrite when you have good mood for it
            // we have to make deep clone and backbone will trigger change event
            var rootSection = JSON.parse(JSON.stringify(this.get('root_section')));
            var sectionToUpdate = app.Unit.findSection(rootSection, sectionId);

            func(sectionToUpdate);

            this.persist('root_section', rootSection);
        },
        setSectionSashType: function(sectionId, type) {
            if (!_.includes(SASH_TYPES, type)) {
                throw new Error('Unrecognozed sash type: ' + type);
            }
            this._updateSection(sectionId, function(section) {
                section.sashType = type;
            });
        },
        setSectionBars: function(sectionId, bars) {
            this._updateSection(sectionId, function(section) {
                section.vertical_bars_number = parseInt(bars.vertical, 10);
                section.horizontal_bars_number = parseInt(bars.horizontal, 10);
            });
        },
        setPanelType: function(sectionId, type){
            this._updateSection(sectionId, function(section) {
                section.panelType = type;
            });
        },
        addMullion: function(sectionId, type) {
            this._updateSection(sectionId, function(section) {
                var full = this.generateFullRoot();
                var fullSection = app.Unit.findSection(full, sectionId);
                section.mullions = section.mullions || [];
                section.mullion.push({

                });
                if (type === 'vertical') {
                    section.position = fullSection.openingParams.x + fullSection.openingParams.width / 2;
                } else {
                    section.position = fullSection.openingParams.y + fullSection.openingParams.height / 2;
                }
            });
        },
        setSectionMullionPosition: function(id, pos) {
            this._updateSection(id, function(section) {
                section.position = parseFloat(pos);
            });
        },
        removeMullion: function(sectionId) {
            this._updateSection(sectionId, function(section) {
                section.divider = null;
                section.sections = null;
                section.position = null;
            });
        },
        removeSash: function(sectionId) {
            this._updateSection(sectionId, function(section) {
                section.sashType = 'fixed_in_frame';
                section.divider = null;
                section.sections = null;
                section.position = null;
            });
        },
        splitSection: function(sectionId, type) {
            this._updateSection(sectionId, function(section) {
                var full = this.generateFullRoot();
                var fullSection = app.Unit.findSection(full, sectionId);
                section.divider = type;
                section.sections = [{
                    id: _.uniqueId(),
                    sashType: 'fixed_in_frame'
                }, {
                    id: _.uniqueId(),
                    sashType: 'fixed_in_frame'
                }];
                if (type === 'vertical') {
                    section.position = fullSection.openingParams.x + fullSection.openingParams.width / 2;
                } else {
                    section.position = fullSection.openingParams.y + fullSection.openingParams.height / 2;
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
        generateFullRoot: function(rootSection, openingParams) {
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
                    height: this.getInMetric('height', 'mm') - this.profile.get('frame_width') - this.profile.get('threshold_width')
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
                leftOverlap = rootSection.mullionEdges.left ? mullionOverlap : frameOverlap;
                rightOverlap = rootSection.mullionEdges.right ? mullionOverlap : frameOverlap;
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
                if (rootSection.divider === 'vertical') {
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
                // if (rootSection.sashType !== 'none') {

                // }
                rootSection.mullionParams = mullionAttrs;
            }
            rootSection.sections = _.map(rootSection.sections, function(sectionData, i) {
                var sectionParams = {
                    x: null, y: null, width: null, height: null
                };
                sectionData.mullionEdges = _.clone(rootSection.mullionEdges);
                sectionData.thresholdEdge = rootSection.thresholdEdge;
                if (rootSection.divider === 'vertical') {
                    sectionParams.x = openingParams.x;
                    sectionParams.y = openingParams.y;
                    if (i === 0) {
                        sectionParams.width = position - rootSection.openingParams.x - this.profile.get('mullion_width') / 2;
                        sectionData.mullionEdges.right = true;
                    } else {
                        sectionParams.x = position + this.profile.get('mullion_width') / 2;
                        sectionParams.width = openingParams.width + openingParams.x - position - this.profile.get('mullion_width') / 2;
                        sectionData.mullionEdges.left = true;
                    }
                    sectionParams.height = openingParams.height;
                } else {
                    sectionParams.x = openingParams.x;
                    sectionParams.y = openingParams.y;
                    sectionParams.width = openingParams.width;
                    if (i === 0) {
                        sectionData.mullionEdges.bottom = true;
                        sectionParams.height = position - rootSection.openingParams.y - this.profile.get('mullion_width') / 2;
                        sectionData.thresholdEdge = false;
                    } else {
                        sectionParams.y = position + this.profile.get('mullion_width') / 2;
                        sectionParams.height = openingParams.height + openingParams.y - position -
                            this.profile.get('mullion_width') / 2;
                        sectionData.mullionEdges.top = true;
                    }
                }
                return this.generateFullRoot(sectionData, sectionParams);
            }.bind(this));
            return rootSection;
        },
        generateFullReversedRoot: function(rootSection){
            rootSection = rootSection || this.generateFullRoot();
            var width = this.getInMetric('width', 'mm');
            rootSection.openingParams.x = width - rootSection.openingParams.x - rootSection.openingParams.width;
            rootSection.glassParams.x = width - rootSection.glassParams.x - rootSection.glassParams.width;
            rootSection.sashParams.x = width - rootSection.sashParams.x - rootSection.sashParams.width;
            if (rootSection.divider === 'vertical') {
                rootSection.position = width - rootSection.position;
                rootSection.sections = rootSection.sections.reverse();
                rootSection.mullionParams.x = width - rootSection.mullionParams.x - this.profile.get('mullion_width');
            }
            if (rootSection.divider === 'horizontal') {
                rootSection.mullionParams.x = width - rootSection.mullionParams.x - rootSection.mullionParams.width;
            }
            var type = rootSection.sashType;
            if (type.indexOf('left') >= 0) {
                type = type.replace('left', 'right');
            } else if (type.indexOf('right') >= 0) {
                type = type.replace('right', 'left');
            }
            rootSection.sashType = type;
            rootSection.sections = _.map(rootSection.sections, function(sectionData) {
                var temp = sectionData.mullionEdges.left;
                sectionData.mullionEdges.left = sectionData.mullionEdges.right;
                sectionData.mullionEdges.right = temp;
                return this.generateFullReversedRoot(sectionData);
            }.bind(this));
            return rootSection;
        },
        flatterSections: function(rootSection) {
            rootSection = rootSection || this.get('root_section');
            var sections = [];
            if (rootSection.sections) {
                sections = _.concat(_.map(rootSection.sections, function(s) {
                    return this.flatterSections(s);
                }));
            } else {
                sections = [rootSection];
            }
            return sections;
        },
        getMullions: function(rootSection) {
            rootSection = rootSection || this.get('root_section');
            var mullions = [];
            if (rootSection.sections && rootSection.sections.length) {
                mullions.push({
                    type: rootSection.divider,
                    position: rootSection.position,
                    id: rootSection.id
                });
                var submullions = _.map(rootSection.sections, function(s) {
                    return this.getMullions(s);
                }.bind(this));
                mullions = mullions.concat(submullions);
            } else {
                mullions = [];
            }
            return _.flatten(mullions);
        },
        getRevertedMullions: function() {
            return this.getMullions(this.generateFullReversedRoot());
        },
        getInMetric: function(attr, metric) {
            if (!metric || (['mm', 'inches'].indexOf(metric) === -1)) {
                throw new Error('Set metric! "mm" or "inches"');
            }
            if (metric === 'inches') {
                return this.get(attr);
            }
            return app.utils.convert.inches_to_mm(this.get(attr));
        },
        setInMetric: function(attr, val, metric) {
            if (!metric || (['mm', 'inches'].indexOf(metric) === -1)) {
                throw new Error('Set metric! "mm" or "inches"');
            }
            if (metric === 'inches') {
                this.set(attr, val);
            } else {
                this.set(attr, app.utils.convert.mm_to_inches(val));
            }
        },
        clearFrame: function() {
            var rootId = this.get('root_section').id;
            this.removeMullion(rootId);
            this._updateSection(rootId, function(section) {
                section.sashType = 'fixed_in_frame';
            });
        },
        getSizes: function(root) {
            root = root || this.generateFullRoot();
            var res = {
                openings: [],
                glasses: []
            };
            _.each(root.sections, function(sec) {
                var subSizes = this.getSizes(sec);
                res.openings = res.openings.concat(subSizes.openings);
                res.glasses = res.glasses.concat(subSizes.glasses);
            }, this);
            if (root.sections.length === 0) {
                res.glasses.push(root.glassParams);
            }
            if (root.sashType !== 'fixed_in_frame') {
                res.openings.push(root.sashParams);
            }
            return res;
        }
    });

    // static function
    // it will find section with passed id from passed section and all its children
    // via nested search
    app.Unit.findSection = function(section, sectionId) {
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
