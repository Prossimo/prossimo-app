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

        { name: 'profile_name', title: 'Profile', type: 'string' },
        { name: 'customer_image', title: 'Customer Image', type: 'string' },
        { name: 'internal_color', title: 'Color Internal', type: 'string' },
        { name: 'external_color', title: 'Color External', type: 'string' },
        { name: 'gasket_color', title: 'Gasket Color', type: 'string' },

        { name: 'hinge_style', title: 'Hinge Style', type: 'string' },
        { name: 'opening_direction', title: 'Opening Direction', type: 'string' },
        { name: 'internal_sill', title: 'Internal Sill', type: 'string' },
        { name: 'external_sill', title: 'External Sill', type: 'string' },
        { name: 'glazing', title: 'Glazing', type: 'string' },
        { name: 'uw', title: 'Uw', type: 'number' },

        { name: 'original_cost', title: 'Original Cost', type: 'number' },
        { name: 'original_currency', title: 'Original Currency', type: 'string' },
        { name: 'conversion_rate', title: 'Conversion Rate', type: 'number' },
        { name: 'price_markup', title: 'Markup', type: 'number' },
        { name: 'discount', title: 'Discount', type: 'number' }
    ];

    var SASH_TYPES = [
        'tilt_turn_left', 'tilt_turn_right', 'fixed_in_frame', 'tilt_only',
        'turn_only_left', 'turn_only_right', 'fixed_in_sash',
        // additional types for solid doors
        'flush-turn-right', 'flush-turn-left'
    ];

    app.Unit = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};
            // var defaults = {
            //     root_section: {
            //         id: _.uniqueId(),
            //         sashType: 'fixed_in_frame'
            //     }
            // };

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
                // console.log( 'syncing unit' );
                // console.log( _.omit(model.toJSON(), ['id']) );
                // console.log( _.extendOwn(_.omit(model.toJSON(), ['id']), {
                //     root_section: JSON.stringify(model.get('root_section'))
                //     //root_section: 'ok'
                // }) );

                options.attrs = { project_unit: _.extendOwn(_.omit(model.toJSON(), ['id']), {
                    root_section: JSON.stringify(model.get('root_section'))
                }) };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        //  TODO: this function should be called on model init (maybe not only)
        //  and check whether root section could be used by drawing code or
        //  should it be reset to defaults
        validateRootSection: function () {
            console.log( 'validate root section' );

            this.set('root_section', this.getDefaultValue('root_section'));

            // var root_section = this.get('root_section');

            // if ( _.isString(root_section) ) {
            //     this.set('root_section', this.getDefaultValue('root_section'));
            // }

            // if ( _.isObject(this.get(''))JSON.parse(this.object) ) {

            // }
        },
        initialize: function () {
            this.profile = null;
            this.setProfile();
            this.validateRootSection();
            this.on('change:profile_name', this.setProfile, this);
        },
        setProfile: function () {
            this.profile = app.settings ? app.settings.getProfileByName(this.get('profile_name')) : null;
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
            return parseFloat(this.get('width')) * parseFloat(this.get('height')) / 144;
        },
        getTotalSquareFeet: function () {
            return this.getAreaInSquareFeet() * parseFloat(this.get('quantity'));
        },
        getAreaInSquareMeters: function () {
            var c = app.utils.convert;
            return parseFloat(c.inches_to_mm(this.get('width'))) / 1000 * parseFloat(c.inches_to_mm(this.get('height'))) / 1000;
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
        getUwIp: function () {
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
        _updateSection: function(sectionId, func) {
            // HAH, dirty deep clone, rewrite when you have good mood for it
            // we have to make deep clone and backbone will trigger change event
            var rootSection = JSON.parse(JSON.stringify(this.get('root_section')));
            var sectionToUpdate = app.Unit.findSection(rootSection, sectionId);

            func(sectionToUpdate);

            this.set('root_section', rootSection);
        },
        setSectionSashType: function(sectionId, type) {
            if (!_.includes(SASH_TYPES, type)) {
                throw new Error('Unrecognozed sash type: ' + type);
            }
            this._updateSection(sectionId, function(section) {
                section.sashType = type;
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
                    section.position = fullSection.params.x + fullSection.params.width / 2;
                } else {
                    section.position = fullSection.params.y + fullSection.params.height / 2;
                }
            });
        },
        setSectionMullionPosition: function(id, pos) {
            this._updateSection(id, function(section) {
                section.position = parseInt(pos, 10);
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
                    section.position = fullSection.params.x + fullSection.params.width / 2;
                } else {
                    section.position = fullSection.params.y + fullSection.params.height / 2;
                }
            }.bind(this));
        },
        // after full calulcalation section will be something like:
        // {
        //     id: 5,
        //     sashType: 'none', // top-right, top-left, none, top, right, left, slide-right, slide-left
        //     panelType: 'glass' // or 'solid'. works for doors
        //     params: { x, y, width, height },
        //     divider: 'vertical',    // or horizontal
        //     position: 50,       // position of center of mullion from top left point of unit
        //     sections: [{
        //         id: 6,
        //         mullionEdges : {right : true},
        //         params: {}
        //     }, {
        //         id: 7,
        //         mullionEdges : {left : true},
        //         params: {}
        //     }]
        // }
        generateFullRoot: function(rootSection, params) {
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
            params = params || defaultParams;
            rootSection.params = params;
            rootSection.mullionEdges = rootSection.mullionEdges || {};
            var position = rootSection.position;
            if (rootSection.sections && rootSection.sections.length) {
                var mullionAttrs = {
                    x: null, y: null, width: null, height: null
                };
                if (rootSection.divider === 'vertical') {
                    mullionAttrs.x = position - this.profile.get('mullion_width') / 2;
                    mullionAttrs.y = params.y;
                    mullionAttrs.width = this.profile.get('mullion_width');
                    mullionAttrs.height = params.height;

                } else {
                    mullionAttrs.x = params.x;
                    mullionAttrs.y = position - this.profile.get('mullion_width') / 2;
                    mullionAttrs.width = params.width;
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
                    sectionParams.x = params.x;
                    sectionParams.y = params.y;
                    if (i === 0) {
                        sectionParams.width = position - rootSection.params.x - this.profile.get('mullion_width') / 2;
                        sectionData.mullionEdges.right = true;
                    } else {
                        sectionParams.x = position + this.profile.get('mullion_width') / 2;
                        sectionParams.width = params.width + params.x - position - this.profile.get('mullion_width') / 2;
                        sectionData.mullionEdges.left = true;
                    }
                    sectionParams.height = params.height;
                } else {
                    sectionParams.x = params.x;
                    sectionParams.y = params.y;
                    sectionParams.width = params.width;
                    if (i === 0) {
                        sectionData.mullionEdges.bottom = true;
                        sectionParams.height = position - rootSection.params.y - this.profile.get('mullion_width') / 2;
                        sectionData.thresholdEdge = false;
                    } else {
                        sectionParams.y = position + this.profile.get('mullion_width') / 2;
                        sectionParams.height = params.height + params.y - position -
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
            rootSection.params.x = width - rootSection.params.x - rootSection.params.width;
            if (rootSection.divider === 'vertical') {
                rootSection.position = width - rootSection.position;
                rootSection.sections = rootSection.sections.reverse();
                // var temp = rootSection.mullionEdges.left;
                // rootSection.mullionEdges.left = rootSection.mullionEdges.right;
                // rootSection.mullionEdges.right = temp;
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
