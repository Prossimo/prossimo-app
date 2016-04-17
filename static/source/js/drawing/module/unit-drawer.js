var app = app || {};

(function () {
    'use strict';

    var composer;
    var module;
    var model;
    var metricSize;
    var ratio;

    app.Drawers = app.Drawers || {};
    app.Drawers.UnitDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            module = app.DrawingModule;

            this.layer = params.layer;
            this.stage = module.get('stage');

            metricSize = params.metricSize;
            model = module.get('model');
            composer = app.App.module('DrawingModule.Composer');
        },
        el: function () {
            var group = new Konva.Group();

            return group;
        },
        render: function () {
            ratio = composer.getSizes().ratio;

            this.layer.add( this.createUnit() );
            this.layer.draw();
        },
        events: {
            'click .frame': 'onFrameClick'
        },

        // Create unit
        createUnit: function () {
            var group = this.el;
            var root = (module.getState('openingView')) ? model.generateFullRoot() : model.generateFullReversedRoot();

            group.add( this.createBack() );

            var frameGroup = this.createMainFrame(root);
            var sectionGroup = this.createSectionGroup(root);

            group.add( frameGroup );
            group.add( sectionGroup );

            if (module.getState('openingView')) {
                frameGroup.moveToTop();
            }

            return group;
        },
        // Create elements
        // Create transparent background to detect click on empty space
        createBack: function () {
            var back = new Konva.Rect({
                width: this.stage.width(),
                height: this.stage.height()
            });

            back.on('click tap', function () {
                module.deselectAll();
            });

            return back;
        },
        // Create main frame
        createMainFrame: function (root) {
            var group = new Konva.Group();
            var sizes = composer.getSizes();
            var center = sizes.center;

            // place unit on stage center
            group.position( center );

            var frameGroup;
            // var isDoorFrame =
            //     model.profile.isThresholdPossible() &&
            //     model.profile.get('low_threshold');

            // var isArchedWindow = (model.getArchedPosition() !== null);

            // // create main frame
            // if (isDoorFrame) {
            //     frameGroup = this.createDoorFrame({
            //         sectionId: root.id,
            //         width: model.getInMetric('width', 'mm'),
            //         height: model.getInMetric('height', 'mm'),
            //         frameWidth: model.profile.get('frame_width')
            //     });
            // } else if (isArchedWindow) {
            //     frameGroup = this.createArchedFrame({
            //         sectionId: root.id,
            //         width: model.getInMetric('width', 'mm'),
            //         height: model.getInMetric('height', 'mm'),
            //         frameWidth: model.profile.get('frame_width'),
            //         archHeight: model.getArchedPosition()
            //     });
            // } else {
                frameGroup = this.createFrame({
                    sectionId: root.id,
                    width: model.getInMetric('width', 'mm'),
                    height: model.getInMetric('height', 'mm'),
                    frameWidth: model.profile.get('frame_width')
                });
            // }

            frameGroup.scale({x: ratio, y: ratio});
            group.add(frameGroup);

            return group;
        },
        createFrame: function (params) {
            var frameWidth = params.frameWidth;  // in mm
            var width = params.width;
            var height = params.height;

            var group = new Konva.Group({
                name: 'frame',
                sectionId: params.sectionId
            });
            var top = new Konva.Line({
                points: [
                    0, 0,
                    width, 0,
                    width - frameWidth, frameWidth,
                    frameWidth, frameWidth
                ]
            });

            var left = new Konva.Line({
                points: [
                    0, 0,
                    frameWidth, frameWidth,
                    frameWidth, height - frameWidth,
                    0, height
                ]
            });

            var bottom = new Konva.Line({
                points: [
                    0, height,
                    frameWidth, height - frameWidth,
                    width - frameWidth, height - frameWidth,
                    width, height
                ]
            });

            var right = new Konva.Line({
                points: [
                    width, 0,
                    width, height,
                    width - frameWidth, height - frameWidth,
                    width - frameWidth, frameWidth
                ]
            });

            group.add(top, left, bottom, right);

            // add styles for borders
            group.children
                .closed(true)
                .stroke('black')
                .strokeWidth(1)
                .fill('white');

            return group;
        },
        // Create sections
        createSectionGroup: function (root) {
            // group for all nested elements
            var sectionsGroup = new Konva.Group();

            // create sections(sashes) recursively
            var sections = this.createSections(root);

            sectionsGroup.add.apply(sectionsGroup, sections);
            sectionsGroup.scale({x: ratio, y: ratio});

            return sectionsGroup;
        },
        createSections: function (rootSection) {
            var objects = [];

            if (rootSection.sections && rootSection.sections.length) {
                var mullion = this.createMullion(rootSection);

                if (module.getState('openingView')) {
                    objects.push(mullion);
                }

                // draw each child section
                rootSection.sections.forEach(function (sectionData) {
                    objects = objects.concat(this.createSections(sectionData));
                }.bind(this));

                if (!module.getState('openingView')) {
                    objects.push(mullion);
                }
            }

            var sash = this.createSash(rootSection);

            objects.push(sash);

            return objects;
        },
        createMullion: function (section) {
            var mullion = new Konva.Rect({
                stroke: 'black',
                fill: 'white',
                strokeWidth: 1
            });

            mullion.setAttrs(section.mullionParams);
            var isVerticalInvisible = (
                section.divider === 'vertical_invisible'
            );
            var isHorizontalInvisible = (
                section.divider === 'horizontal_invisible'
            );
            var isSelected = this.state.selectedMullionId === section.id;

            // do not show mullion for type vertical_invisible
            // and sash is added for both right and left sides
            var hideVerticalMullion =
                (section.divider === 'vertical_invisible') &&
                (section.sections[0].sashType !== 'fixed_in_frame') &&
                (section.sections[1].sashType !== 'fixed_in_frame') && !isSelected;

            var hideHorizontalMullion =
                (section.divider === 'horizontal_invisible') &&
                (section.sections[0].sashType === 'fixed_in_frame') &&
                (section.sections[1].sashType === 'fixed_in_frame') && !isSelected;

            if (isVerticalInvisible && !isSelected) {
                mullion.fill('lightgreen');
                mullion.opacity(0.5);
            } else if ((isVerticalInvisible || isHorizontalInvisible) && isSelected) {
                mullion.opacity(0.7);
                mullion.fill('#4E993F');
            } else if (isSelected) {
                mullion.fill('lightgrey');
            }

            if (hideVerticalMullion) {
                mullion.opacity(0.01);
            }

            if (hideHorizontalMullion) {
                mullion.fill('lightblue');
            }

            mullion.on('click', function () {
                this.deselectAll();
                this.setState({
                    selectedMullionId: section.id
                });
            }.bind(this));
            return mullion;
        },
        createSash: function (sectionData) {
            var group = new Konva.Group({
                x: sectionData.sashParams.x,
                y: sectionData.sashParams.y
            });

            // @TODO:
            /*
            var hasFrame = (sectionData.sashType !== 'fixed_in_frame');
            var frameWidth = hasFrame ? this.model.profile.get('sash_frame_width') : 0;


            var fillX;
            var fillY;
            var fillWidth;
            var fillHeight;

            if (_.includes(['full-flush-panel', 'exterior-flush-panel'], sectionData.fillingType) &&
                !this.state.openingView
            ) {
                fillX = sectionData.openingParams.x - sectionData.sashParams.x;
                fillY = sectionData.openingParams.y - sectionData.sashParams.y;
                fillWidth = sectionData.openingParams.width;
                fillHeight = sectionData.openingParams.height;
            } else if (_.includes(['full-flush-panel', 'interior-flush-panel'], sectionData.fillingType) &&
                        this.state.openingView
            ) {
                fillX = 0;
                fillY = 0;
                fillWidth = sectionData.sashParams.width;
                fillHeight = sectionData.sashParams.height;
            } else {
                fillX = sectionData.glassParams.x - sectionData.sashParams.x;
                fillY = sectionData.glassParams.y - sectionData.sashParams.y;
                fillWidth = sectionData.glassParams.width;
                fillHeight = sectionData.glassParams.height;
            }

            var hasSubSections = sectionData.sections && sectionData.sections.length;
            var isFlushType = sectionData.fillingType &&
                sectionData.fillingType.indexOf('flush') >= 0;

            var frameGroup;

            if (isFlushType && !hasSubSections) {
                frameGroup = this.createFlushFrame({
                    width: sectionData.sashParams.width,
                    height: sectionData.sashParams.height,
                    sectionId: sectionData.id
                });
                group.add(frameGroup);
            }

            if (sectionData.sashType !== 'fixed_in_frame') {

                frameGroup = this.createFrame({
                    width: sectionData.sashParams.width,
                    height: sectionData.sashParams.height,
                    frameWidth: frameWidth,
                    sectionId: sectionData.id
                });

                group.add(frameGroup);
            }

            var shouldDrawFilling =
                !hasSubSections && !isFlushType ||
                !hasSubSections && this.model.isRootSection(sectionData.id) && isFlushType;

            if (shouldDrawFilling) {
                var filling = this.createFilling(sectionData, {
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight
                });

                group.add(filling);
            }

            var shouldDrawBars = shouldDrawFilling &&
                !sectionData.fillingType || sectionData.fillingType === 'glass';

            if (shouldDrawBars) {
                var bars = this.createBars(sectionData, {
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight
                });

                group.add(bars);
            }

            var type = sectionData.sashType;
            var shouldDrawHandle = this.shouldDrawHandle(type);

            if (shouldDrawHandle) {
                var handle = this.createHandle(sectionData, {
                    frameWidth: frameWidth
                });

                group.add(handle);
            }

            var shouldDrawDirectionLine = sectionData.sashType !== 'fixed_in_frame';

            if (shouldDrawDirectionLine) {
                var directionLine = this.createDirectionLine(sectionData);

                group.add(directionLine);
            }

            var sashList = model.getSashList();
            var index = _.findIndex(sashList, function (s) {
                return s.id === sectionData.id;
            });

            if (index >= 0) {
                var indexes = this.createSectionIndexes(sectionData, {main: index, add: null});

                group.add( this.createIndexes(indexes) );
            }

            var isSelected = (module.getState('selected:sash') === sectionData.id);

            if (isSelected) {
                var selection = this.createSelectionShape(sectionData, {
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight
                });

                group.add(selection);
            }
            */

            return group;
        },
        // Handlers
        onFrameClick: function () {
            console.log('frame click!', arguments);
        }

    });

})();
