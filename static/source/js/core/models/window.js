var app = app || {};

(function () {
    'use strict';

    var WindowProperties = [
        { name: 'mark', title: 'Mark', type: 'string' },
        { name: 'width', title: 'Width (inches)', type: 'number' },
        { name: 'height', title: 'Height (inches)', type: 'number' },
        { name: 'quantity', title: 'Quantity', type: 'number' },
        { name: 'type', title: 'Type', type: 'string' },
        { name: 'description', title: 'Description', type: 'string' },
        { name: 'notes', title: 'Notes', type: 'string' },

        { name: 'system', title: 'System', type: 'string' },
        { name: 'customer_image', title: 'Customer Image', type: 'base64image' },
        { name: 'internal_color', title: 'Color Internal', type: 'string' },
        { name: 'external_color', title: 'Color External', type: 'string' },
        { name: 'gasket_color', title: 'Gasket Color', type: 'string' },

        { name: 'hinge_style', title: 'Hinge Style', type: 'string' },
        { name: 'opening_direction', title: 'Opening Direction', type: 'string' },
        { name: 'threshold', title: 'Threshold', type: 'string' },
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

    //  Window properties that could be copied from a spreadsheet or a PDF
    app.Window = Backbone.Model.extend({
        defaults: function () {
            var defaults = {
                // in mm for now...
                frameWidth: 70,
                mullionWidth: 92,
                sashFrameWidth: 82,
                rootSection: {
                    id: _.uniqueId(),
                    sashType: ''
                }
            };

            _.each(WindowProperties, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        initialize: function () {
            // this.drawing = new app.Window();
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

            return default_value;
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( WindowProperties, 'name' );
            }

            _.each(WindowProperties, function (item) {
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
        getRefNum: function () {
            return this.collection ? this.collection.indexOf(this) + 1 : -1;
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
        _updateSection: function(sectionId, func) {
            // HAH, dirty deep clone, rewrite when you have good mood for it
            // we have to make deep clone and backbone will trigger change event
            var rootSection = JSON.parse(JSON.stringify(this.get('rootSection')));
            var sectionToUpdate = app.Window.findSection(rootSection, sectionId);

            func(sectionToUpdate);

            this.set('rootSection', rootSection);
        },
        setSectionSashType: function(sectionId, type) {
            this._updateSection(sectionId, function(section) {
                section.sashType = type;
            });
        },
        setSectionMullionPosition: function(id, pos) {
            this._updateSection(id, function(section) {
                section.position = parseInt(pos, 10);
            });
        },
        splitSection: function(sectionId, type) {
            this._updateSection(sectionId, function(section) {
                var full = this.generateFullRoot();
                var fullSection = app.Window.findSection(full, sectionId);
                section.devider = type;
                section.sections = [{
                    id: _.uniqueId(),
                    sashType: 'none'
                }, {
                    id: _.uniqueId(),
                    sashType: 'none'
                }];
                if (type === 'vertical') {
                    section.position = fullSection.params.x + fullSection.params.width / 2;
                } else {
                    section.position = fullSection.params.y + fullSection.params.height / 2;
                }
            }.bind(this));
        },
        generateFullRoot: function(rootSection, params) {
            rootSection = rootSection || JSON.parse(JSON.stringify(this.get('rootSection')));
            var defaultParams = {
                x: 0,
                y: 0,
                width: this.getInMetric('width', 'mm'),
                height: this.getInMetric('height', 'mm')
            };
            if (rootSection.id === this.get('rootSection').id) {
                defaultParams = {
                    x: this.get('frameWidth'),
                    y: this.get('frameWidth'),
                    width: this.getInMetric('width', 'mm') - this.get('frameWidth') * 2,
                    height: this.getInMetric('height', 'mm') - this.get('frameWidth') * 2
                };
            }
            params = params || defaultParams;
            rootSection.params = params;
            var position = rootSection.position;
            if (rootSection.sections && rootSection.sections.length) {
                var mullionAttrs = {
                    x: null, y: null, width: null, height: null
                };
                if (rootSection.devider === 'vertical') {
                    mullionAttrs.x = position - this.get('mullionWidth') / 2;
                    mullionAttrs.y = params.y;
                    mullionAttrs.width = this.get('mullionWidth');
                    mullionAttrs.height = params.height;

                } else {
                    mullionAttrs.x = params.x;
                    mullionAttrs.y = position - this.get('mullionWidth') / 2;
                    mullionAttrs.width = params.width;
                    mullionAttrs.height = this.get('mullionWidth');
                }
                rootSection.mullionParams = mullionAttrs;
            }
            rootSection.sections = _.map(rootSection.sections, function(sectionData, i) {
                var sectionParams = {
                    x: null, y: null, width: null, height: null
                };
                if (rootSection.devider === 'vertical') {
                    sectionParams.x = params.x;
                    sectionParams.y = params.y;
                    if (i === 0) {
                        // sectionParams.x += this.get('frameWidth');
                        // sectionParams.width = position - this.get('mullionWidth') / 2 - this.get('frameWidth');
                        sectionParams.width = position - rootSection.params.x - this.get('mullionWidth') / 2;
                        // if (rootSection.id === this.get('rootSection').id) {
                        //     sectionParams.width -= this.get('frameWidth') * 2;
                        // }
                    } else {
                        sectionParams.x = position + this.get('mullionWidth') / 2;
                        sectionParams.width = params.width + params.x - position - this.get('mullionWidth') / 2;
                    }
                    sectionParams.height = params.height;
                } else {
                    sectionParams.x = params.x;
                    sectionParams.y = params.y;
                    sectionParams.width = params.width;
                    if (i === 0) {
                        // sectionParams.y += this.get('frameWidth');
                        sectionParams.height = position - rootSection.params.y - this.get('mullionWidth') / 2;
                    } else {
                        sectionParams.y = position + this.get('mullionWidth') / 2;
                        sectionParams.height = params.height + params.y - position - this.get('mullionWidth') / 2;
                    }
                }
                return this.generateFullRoot(sectionData, sectionParams);
            }.bind(this));
            return rootSection;
        },
        flatterSections: function(rootSection) {
            rootSection = rootSection || this.get('rootSection');
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
            rootSection = rootSection || this.get('rootSection');
            var mullions = [];
            if (rootSection.sections) {
                mullions.push({
                    type: rootSection.devider,
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
        }
    });

    // static function
    // it will find section with passed id from passed section and all its children
    // via nested search
    app.Window.findSection = function(section, sectionId) {
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
