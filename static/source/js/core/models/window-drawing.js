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
                id: 1,
                sashType: ''
            }
        },
        findSection: function(section, sectionId) {
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
        },
        _updateSection: function(sectionId, func) {
            // HAH, dirty deep clone, rewrite when you have good mood for it
            var rootSection = JSON.parse(JSON.stringify(this.get('rootSection')));
            var sectionToUpdate = this.findSection(rootSection, sectionId);

            func(sectionToUpdate);

            this.set('rootSection', rootSection);
        },
        setSectionSashType: function(sectionId, type) {
            this._updateSection(sectionId, function(section) {
                section.sashType = type;
            });
        },
        splitSection: function(sectionId, type) {
            this._updateSection(sectionId, function(section) {
                section.devider = type;
                section.sections = [{
                    id: Math.random(),
                    sashType: 'none'
                }, {
                    id: Math.random(),
                    sashType: 'none'
                }];
                section.position = 300;
            });
        }
    });
})();
