var app = app || {};

(function () {
    'use strict';

    //  Window properties used for a drawing part
    app.WindowDrawing = Backbone.Model.extend({
        defaults: {
            width: 1000,
            height: 2000,
            frameWidth: 70,
            mullionWidth: 92,
            rootSection: {
                id: _.uniqueId(),
                sashType: ''
            }
        },
        _updateSection: function(sectionId, func) {
            // HAH, dirty deep clone, rewrite when you have good mood for it
            // we have to make deep close and backbone will trigger change event
            var rootSection = JSON.parse(JSON.stringify(this.get('rootSection')));
            var sectionToUpdate = app.WindowDrawing.findSection(rootSection, sectionId);

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
                var fullSection = app.WindowDrawing.findSection(full, sectionId);
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
                width: this.get('width'),
                height: this.get('height')
            };
            if (rootSection.id === this.get('rootSection').id) {
                defaultParams = {
                    x: this.get('frameWidth'),
                    y: this.get('frameWidth'),
                    width: this.get('width') - this.get('frameWidth') * 2,
                    height: this.get('height') - this.get('frameWidth') * 2
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
                        // console.log(rootSection.params.x + position - this.get('mullionWidth') / 2 - this.get('frameWidth'));
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
        }
    });

    // static function
    // it will find section with passed id from passed section and all its children
    // via nested search
    app.WindowDrawing.findSection = function(section, sectionId) {
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


// some calculation tests.
// move them into another file
// add CI test tool
// write test before adding new feature are bug fixis
// be awesome


function tests() {
    var model = new app.WindowDrawing({
        width: 1000,
        height: 2000,
        frameWidth: 10,
        mullionWidth: 20
    });
    var id = model.get('rootSection').id;
    model.splitSection(id, 'vertical');
    var rootSection = model.generateFullRoot();
    var leftSection = rootSection.sections[0].params;
    console.assert(leftSection.x === model.get('frameWidth'));
    console.assert(leftSection.y === model.get('frameWidth'));
    console.assert(leftSection.width === 500 - 10 - 20 / 2);
    console.assert(leftSection.height === 2000 - 10 * 2);


    id = model.get('rootSection').sections[0].id;
    model.splitSection(id, 'vertical');
    rootSection = model.generateFullRoot();
    leftSection = rootSection.sections[0].sections[0].params;
    console.assert(leftSection.x === model.get('frameWidth'));
    console.assert(leftSection.y === model.get('frameWidth'));
    console.assert(leftSection.width === (500 - 10 - 20 / 2) / 2 - 20 / 2);
    console.assert(leftSection.height === 2000 - 10 * 2);
}
tests();



