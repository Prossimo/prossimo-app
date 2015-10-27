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
        splitSection: function(sectionId, type) {
            this._updateSection(sectionId, function(section) {
                section.devider = type;
                section.sections = [{
                    id: _.uniqueId(),
                    sashType: 'none'
                }, {
                    id: _.uniqueId(),
                    sashType: 'none'
                }];
                section.position = 300;
            });
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
