var app = app || {};

(function () {
    'use strict';

    var module;
    var model;
    var metricSize;
    var controlSize;
    var ratio;

    app.Drawers = app.Drawers || {};
    app.Drawers.TrapezoidControlsDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            module = params.builder;

            this.layer = params.layer;
            this.stage = params.stage;

            model = module.get('model');
            metricSize = params.metricSize;
        },
        el: function () {
            var group = new Konva.Group();

            return group;
        },
        render: function () {
            ratio = module.get('ratio');
            // We scale this.el using ratio, so we need to divide controlSize by ratio
            controlSize = Math.round(metricSize / 4 / ratio);

            // Clear all previous objects
            this.layer.destroyChildren();
            // Creating unit and adding it to layer
            this.layer.add( this.createControls() );
            // Draw layer
            this.layer.draw();

            // Detaching and attaching events
            this.undelegateEvents();
            this.delegateEvents();
        },
        events: {
            'mouseover .trapezoidControl': 'onControlOver',
            'mouseout .trapezoidControl': 'onControlOut',
            'click .trapezoidControl': 'onControlClick',
            'tap .trapezoidControl': 'onControlClick'
        },
        // Event Handlers
        onControlOver: function (event) {
            var control = event.target;
            var style = module.getStyle('trapezoid_controls');

            control.fill(style.hover.fill);
            control.opacity(style.hover.opacity);
            this.updateLayer();
        },
        onControlOut: function (event) {
            var control = event.target;
            var style = module.getStyle('trapezoid_controls');

            control.fill(style.normal.fill);
            control.opacity(style.normal.opacity);
            this.updateLayer();
        },
        onControlClick: function (event) {
            var control = event.target;
            var sectionId = control.attrs.sectionId;
            var cornerIndex = control.attrs.cornerIndex;

            module.trigger('trapezoidControlClicked', {
                params: {
                    sectionId: sectionId,
                    cornerIndex: cornerIndex
                },
                pos: control.getAbsolutePosition()
            });
        },

        // Drawing methods
        createControls: function () {
            var group = this.el;
            var selectedId = module.getState('selected:sash');
            var center = module.get('center');

            // Do anything only if it possible to use this feature!
            // And show controls only if one of sections is selected
            if (model.isTrapezoidPossible() && selectedId) {
                var root = (module.getState('openingView')) ?
                           model.generateFullRoot() : model.generateFullReversedRoot();

                var selectedSection = app.Unit.findSection(root, selectedId );

                var sections = this.createSections(selectedSection);

                _.each(sections, function (section) {
                    group.add( section );
                });
            }

            // Place at center of stage
            group.position( {
                x: center.x,
                y: center.y
            } );
            // Apply ratio to whole group
            group.scale({x: ratio, y: ratio});

            return group;
        },
        createSections: function (rootSection) {
            var objects = [];

            if (rootSection.sections && rootSection.sections.length) {
                rootSection.sections.forEach(function (sectionData) {
                    objects = objects.concat(this.createSections(sectionData));
                }.bind(this));
            } else {
                // draw controls for sections without childs
                objects.push( this.createSectionControls(rootSection) );
            }

            return objects;
        },
        createSectionControls: function (sectionData) {
            var fill = module.utils.getSashParams(sectionData, true);
            var group = new Konva.Group({
                name: 'trapezoidControlsGroup-' + sectionData.id,
                x: fill.x,
                y: fill.y
            });

            var corners = module.utils.getCornerExternality(sectionData);
            var trapezoid = module.get('model').getTrapezoid(sectionData.id, module.getState('openingView'));
            var cornerPoints = module.utils.getCornerPoints(sectionData);

            // Make controls
            _.each(corners, function (corner, cornerIndex) {
                if (corner) {
                    var _ci = (!module.getState('openingView')) ? cornerIndex : this.invertCornerIndex(cornerIndex);
                    var point = {
                        x: cornerPoints[cornerIndex].x + (trapezoid[cornerIndex].x),
                        y: cornerPoints[cornerIndex].y + trapezoid[cornerIndex].y
                    };

                    group.add( this.makeControl(point, sectionData.id, _ci) );
                }
            }.bind(this));

            return group;
        },

        makeControl: function (point, sectionId, cornerIndex) {
            var style = module.getStyle('trapezoid_controls');

            return new Konva.Rect({
                name: 'trapezoidControl',
                sectionId: sectionId,
                cornerIndex: cornerIndex,
                x: point.x,
                y: point.y,
                width: controlSize,
                height: controlSize,
                fill: style.normal.fill,
                opacity: style.normal.opacity,
                offset: { x: controlSize / 2, y: controlSize / 2 },
                rotation: 45
            });
        },

        // Utils
        invertCornerIndex: function (cornerIndex) {
            var newIndex;

            switch (cornerIndex) {
                default:
                    newIndex = cornerIndex;
                break;
                case 0:
                    newIndex = 1;
                break;
                case 1:
                    newIndex = 0;
                break;
                case 2:
                    newIndex = 3;
                break;
                case 3:
                    newIndex = 2;
                break;
            }

            return newIndex;
        },
        updateLayer: function () {
            this.layer.draw();
        }
    });

})();
