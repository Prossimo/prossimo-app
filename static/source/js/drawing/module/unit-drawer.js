var app = app || {};

(function () {
    'use strict';

    var module;
    var model;
    var ratio;

    app.Drawers = app.Drawers || {};
    app.Drawers.UnitDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            module = params.builder;

            this.layer = params.layer;
            this.stage = params.stage;

            model = module.get('model');
        },
        el: function () {
            var group = new Konva.Group();

            return group;
        },
        render: function () {
            ratio = module.get('ratio');

            // Clear all previous objects
            this.layer.destroyChildren();
            // Creating unit and adding it to layer
            this.layer.add( this.createUnit() );
            // Draw layer
            this.layer.draw();

            // Detaching and attching events
            this.undelegateEvents();
            this.delegateEvents();
        },
        events: {
            'click .frame': 'onFrameClick',
            'tap .frame': 'onFrameClick',

            'click .filling': 'onFillingClick',
            'tap .filling': 'onFillingClick',

            'click .mullion': 'onMullionClick',
            'tap .mullion': 'onMullionClick',

            'click #back': 'onBackClick',
            'tap #back': 'onBackClick'
        },
        // Utils
        // Functions search for Konva Object inside object with specified name
        // And rises up to the parents recursively
        getSectionId: function (object) {
            if ('sectionId' in object.attrs) {
                return object;
            } else if (object.parent) {
                return this.getSectionId(object.parent);
            }

            return false;
        },
        // Handlers
        onFrameClick: function (event) {
            this.setSelection(event, 'sash', 'frame');
        },
        onFillingClick: function (event) {
            this.setSelection(event, 'sash', 'filling');
        },
        onMullionClick: function (event) {
            this.setSelection(event, 'mullion', 'mullion');
        },
        onBackClick: function () {
            this.deselectAll();
        },

        // Keyboards handlers
        onKeyDown: function (e) {
            if (e.keyCode === 46 || e.keyCode === 8) {  // DEL or BACKSPACE
                e.preventDefault();
                this.removeSelected();
            }
        },

        // Selections
        setSelection: function (event, type) {
            var origin = this.getSectionId(event.target);
            var untype = (type === 'sash') ? 'mullion' : 'sash';

            if (origin) {
                module.setState('selected:' + untype, null, false);
                module.setState('selected:' + type, origin.attrs.sectionId, false);
            }
        },
        deselectAll: function (preventUpdate) {
            module.deselectAll(preventUpdate);
        },
        removeSelected: function () {
            var selectedMullionId = module.getState('selected:mullion');
            var selectedSashId = module.getState('selected:sash');

            if (selectedMullionId) {
                model.removeMullion(selectedMullionId);
            }

            if (selectedSashId) {
                model.removeSash(selectedSashId);
            }

            this.deselectAll();
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

            var center = module.get('center');
            // place unit on stage center
            group.position( center );

            if (!module.getState('openingView')) {
                frameGroup.moveToTop();
            }

            return group;
        },
        // Create elements
        // Create transparent background to detect click on empty space
        createBack: function () {
            var back = new Konva.Rect({
                id: 'back',
                width: this.stage.width(),
                height: this.stage.height()
            });

            return back;
        },
        // Create main frame
        createMainFrame: function (root) {
            var group = new Konva.Group();

            var frameGroup;
            var isDoorFrame =
                model.profile.isThresholdPossible() &&
                model.profile.get('low_threshold');

            var isArchedWindow = (model.getArchedPosition() !== null);
            var isCircleWindow = (model.getCircleRadius() !== null);

            // create main frame
            if (isDoorFrame) {
                frameGroup = this.createDoorFrame({
                    sectionId: root.id,
                    width: model.getInMetric('width', 'mm'),
                    height: model.getInMetric('height', 'mm'),
                    frameWidth: model.profile.get('frame_width')
                });
            } else if (isArchedWindow) {
                frameGroup = this.createArchedFrame({
                    sectionId: root.id,
                    width: model.getInMetric('width', 'mm'),
                    height: model.getInMetric('height', 'mm'),
                    frameWidth: model.profile.get('frame_width'),
                    archHeight: model.getArchedPosition()
                });
            } else if (isCircleWindow) {
                frameGroup = this.createCircleFrame({
                    sectionId: root.id,
                    radius: model.getCircleRadius(),
                    frameWidth: model.profile.get('frame_width')
                });
            } else {
                frameGroup = this.createFrame({
                    sectionId: root.id,
                    width: model.getInMetric('width', 'mm'),
                    height: model.getInMetric('height', 'mm'),
                    frameWidth: model.profile.get('frame_width')
                });
            }

            frameGroup.scale({x: ratio, y: ratio});
            group.add(frameGroup);

            return group;
        },
        createCircleSashFrame: function (params) {
            var section = params.section;
            var frameWidth = params.frameWidth; // in mm
            var data = params.data;

            var group = new Konva.Group({
                name: 'frame',
                sectionId: section.id
            });

            if (data.type === 'rect') {
                // If this is a section that bordered with mullions from each side — it's a simple rectangular sash
                group = this.createFrame({
                    width: section.sashParams.width,
                    height: section.sashParams.height,
                    frameWidth: frameWidth,
                    sectionId: section.id
                });
            } else if (data.type === 'circle') {
                // If there is no edges around — it's just a circle (sash inside root section)
                group = this.createCircleFrame({
                    frameWidth: frameWidth,
                    radius: data.radius,
                    sectionId: section.id
                });
            } else if (data.type === 'arc') {
                // Otherwise it's a sash inside one of children section, so this sash have an arc side
                group = this.createArchSashFrame({
                    frameWidth: frameWidth,
                    radius: data.radius,
                    section: section
                });
            }

            return group;
        },
        createArchSashFrame: function (params) {
            var style = module.getStyle('frame');

            var opts = this.getCircleSashDrawingOpts(params);

            var group = new Konva.Group({
                name: 'frame',
                sectionId: params.section.id
            });
            var straightEdges = this.createStraightEdges(params, opts, style);
            var arcEdge = this.createArcEdges(params, opts, style);

            // Add to group
            group.add( arcEdge, straightEdges );

            return group;
        },
        createStraightEdges: function (params, opts, style) {
            var straightEdges = new Konva.Group({
                name: 'edges'
            });
            // Calculate and draw straight part of sash frame
            _.each(params.section.mullionEdges, function (val, edge) {
                if (val === 'vertical' || val === 'horizontal') {
                    var points = [];     // Original points of frame
                    var absPoints = [];  // Absolute points: Used in calculations
                    var relPoints = [];  // Relative points: After all calculations we return it into relative positions
                    var linePoints = []; // Flat array of relPoints. This will be passed into Konva.Line constructor
                    var absArcCenter = {x: 0, y: 0}; // Absolute center of local center point (for draw circle)
                    var intersects = []; // Find points that intersects with circles (outer & inner radiuses)
                    var frameConnection = {x: 0, y: 0}; // Object stores possible frame correction for straight frames

                    // Find points closest to mullion and two another, that forms a sash frame
                    // But without any skew at short edges.
                    if (edge === 'top') {
                        points = [
                            // mullion
                            {x: opts.x, y: opts.y},
                            {x: opts.x + opts.width, y: opts.y},
                            // frame
                            {x: opts.x + opts.width, y: opts.y + opts.frameWidth},
                            {x: opts.x, y: opts.y + opts.frameWidth}
                        ];

                        frameConnection.x = opts.frameWidth;
                    } else if (edge === 'right') {
                        points = [
                            // mullion
                            {x: opts.x + opts.width, y: opts.y},
                            {x: opts.x + opts.width, y: opts.y + opts.height},
                            // frame
                            {x: opts.x + opts.width - opts.frameWidth, y: opts.y + opts.height},
                            {x: opts.x + opts.width - opts.frameWidth, y: opts.y}
                        ];
                        frameConnection.y = opts.frameWidth;
                    } else if (edge === 'bottom') {
                        points = [
                            // mullion
                            {x: opts.x, y: opts.y + opts.height},
                            {x: opts.x + opts.width, y: opts.y + opts.height},
                            // frame
                            {x: opts.x + opts.width, y: opts.y + opts.height - opts.frameWidth},
                            {x: opts.x, y: opts.y + opts.height - opts.frameWidth}
                        ];
                        frameConnection.x = opts.frameWidth;
                    } else if (edge === 'left') {
                        points = [
                            // mullion
                            {x: opts.x, y: opts.y},
                            {x: opts.x, y: opts.y + opts.height},
                            // frame
                            {x: opts.x + opts.frameWidth, y: opts.y + opts.height},
                            {x: opts.x + opts.frameWidth, y: opts.y}
                        ];
                        frameConnection.y = opts.frameWidth;
                    }

                    // Get absolute position of points
                    _.each(points, function (point) {
                        var absPoint = {
                            x: point.x + opts.absX,
                            y: point.y + opts.absY
                        };

                        absPoints.push(absPoint);
                    });

                    absArcCenter.x = opts.arcCenter.x + opts.absX;
                    absArcCenter.y = opts.arcCenter.y + opts.absY;

                    // Find which of points lies at the arched frame
                    intersects = app.utils.geometry.intersectCircleLine(
                        absArcCenter,
                        opts.outerRadius - 1,
                        absPoints[0],
                        absPoints[1],
                        true
                    );
                    intersects = intersects.concat(
                        app.utils.geometry.intersectCircleLine(
                            absArcCenter,
                            opts.innerRadius,
                            absPoints[2],
                            absPoints[3],
                            true
                        )
                    );

                    relPoints = intersects.map(function (point, index) {
                        var r = {
                            x: point.x - opts.absX,
                            y: point.y - opts.absY
                        };

                        // If points wasn't intersected with circle —
                        // it's a point that connected to another straight frame side
                        // So we must substract default connection size (frameWidth) from points
                        if ( !('intersects' in point) ) {
                            // Use index to make sure that point is "inside frame" (index 2 or 3)
                            if (index === 3) {
                                r.x -= frameConnection.x;
                                r.y -= frameConnection.y;
                            } else if (index === 2) {
                                r.x += frameConnection.x;
                                r.y += frameConnection.y;
                            }
                        }

                        return r;
                    });

                    // console.log(params.section.id);
                    // console.log(edge);
                    // console.log('--');
                    // console.log('>P = ', points);
                    // console.log('aP = ', absPoints);
                    // console.log('C = ', absArcCenter);
                    // console.log('R = ', opts.outerRadius - 1);
                    // console.log('r = ', opts.innerRadius);
                    // console.log('X = ', intersects);
                    // console.log('abs = ', opts.absX, opts.absY);
                    // console.log('rel = ', relPoints);

                    _.each(relPoints, function (point) {
                        linePoints.push(point.x);
                        linePoints.push(point.y);
                    });

                    straightEdges.add( new Konva.Line({
                        points: linePoints
                    }) );
                }
            });

            straightEdges.children
                .closed(true)
                .stroke(style.stroke)
                .strokeWidth(style.strokeWidth)
                .fill(style.fill);

            return straightEdges;
        },
        createArcEdges: function (params, opts, style) {
            var arcEdge = new Konva.Group({
                name: 'arcEdge'
            });

            // Calculate and draw arched parts of sash frame
            var uPoints = [
                {x: 0, y: 0},
                {x: 0, y: 0 + opts.height},
                {x: 0 + opts.width, y: 0 + opts.height},
                {x: 0 + opts.width, y: 0}
            ];

            // Convert every point into absolute position
            _.each(uPoints, function (point) {
                point.x = point.x + opts.absX;
                point.y = point.y + opts.absY;
            });
            // Convert points to vectors relative to the center point of unit
            uPoints = app.utils.vector2d.points_to_vectors(uPoints, opts.center);

            arcEdge.add(
                new Konva.Arc({
                    x: opts.arcCenter.x,
                    y: opts.arcCenter.y,
                    innerRadius: opts.innerRadius,
                    outerRadius: opts.outerRadius,
                    angle: 360,
                    fill: style.fill
                }),
                new Konva.Arc({
                    x: opts.arcCenter.x,
                    y: opts.arcCenter.y,
                    innerRadius: opts.outerRadius,
                    outerRadius: opts.outerRadius + style.strokeWidth,
                    angle: 360,
                    fill: style.stroke
                }),
                new Konva.Arc({
                    x: opts.arcCenter.x,
                    y: opts.arcCenter.y,
                    innerRadius: opts.innerRadius,
                    outerRadius: opts.innerRadius + style.strokeWidth,
                    angle: 360,
                    fill: style.stroke
                })
            );

            // Clip it to default rectangle shape of section
            arcEdge.clipX(opts.x - 2);
            arcEdge.clipY(opts.y - 2);
            arcEdge.clipWidth(opts.width + 4);
            arcEdge.clipHeight(opts.height + 4);

            return arcEdge;
        },

        createFrame: function (params) {
            var frameWidth = params.frameWidth;  // in mm
            var width = params.width;
            var height = params.height;
            var style = module.getStyle('frame');

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
                .stroke(style.stroke)
                .strokeWidth(style.strokeWidth)
                .fill(style.fill);

            return group;
        },
        // like common frame above but fully filled
        createFlushFrame: function (params) {
            var width = params.width;
            var height = params.height;
            var opts = {};

            // Extend opts with styles
            _.extend(opts, module.getStyle('flush_frame'));
            // Extend with sizes and data
            _.extend(opts, {
                width: width,
                height: height,
                name: 'frame',
                sectionId: params.sectionId
            });

            var rect = new Konva.Rect(opts);

            return rect;
        },

        // door frame have special case for threshold drawing
        createDoorFrame: function (params) {
            var frameWidth = params.frameWidth;  // in mm
            var thresholdWidth = model.profile.get('threshold_width');
            var width = params.width;
            var height = params.height;

            var style = {
                frame: module.getStyle('frame'),
                bottom: module.getStyle('door_bottom')
            };

            var group = new Konva.Group();
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
                    frameWidth, height - thresholdWidth,
                    0, height - thresholdWidth
                ]
            });

            var right = new Konva.Line({
                points: [
                    width, 0,
                    width, height - thresholdWidth,
                    width - frameWidth, height - thresholdWidth,
                    width - frameWidth, frameWidth
                ]
            });

            group.add(top, left, right);

            group.children
                .closed(true)
                .stroke(style.frame.stroke)
                .strokeWidth(style.frame.strokeWidth)
                .fill(style.frame.fill);

            var bottom = new Konva.Line({
                points: [
                    0, height - thresholdWidth,
                    width, height - thresholdWidth,
                    width, height,
                    0, height
                ],
                closed: true,
                stroke: style.bottom.stroke,
                strokeWidth: style.bottom.strokeWidth,
                fill: style.bottom.fill
            });

            group.add(bottom);

            return group;
        },

        // arched frame have special case for arched part
        createArchedFrame: function (params) {
            var frameWidth = params.frameWidth;
            var width = params.width;
            var height = params.height;
            var archHeight = params.archHeight;

            var style = module.getStyle('frame');

            var group = new Konva.Group();
            var top = new Konva.Shape({
                stroke: style.stroke,
                strokeWidth: style.strokeWidth,
                fill: style.fill,
                sceneFunc: function (ctx) {
                    ctx.beginPath();
                    var scale = (width / 2) / archHeight;

                    ctx.save();
                    ctx.scale(scale, 1);
                    var radius = archHeight;

                    ctx._context.arc(
                        radius, radius, radius,
                        0, Math.PI, true);
                    ctx.restore();
                    ctx.translate(width / 2, archHeight);
                    ctx.scale(
                        (width / 2 - frameWidth) / archHeight,
                        (archHeight - frameWidth) / archHeight
                    );
                    ctx._context.arc(
                        0, 0,
                        radius,
                        Math.PI, 0
                    );
                    ctx.closePath();
                    ctx.fillStrokeShape(this);
                }
            });

            var left = new Konva.Line({
                points: [
                    0, archHeight,
                    frameWidth, archHeight,
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
                    width, archHeight,
                    width, height,
                    width - frameWidth, height - frameWidth,
                    width - frameWidth, archHeight
                ]
            });

            group.add(left, right, bottom, top);

            group.find('Line')
                .closed(true)
                .stroke(style.stroke)
                .strokeWidth(style.strokeWidth)
                .fill(style.fill);

            return group;
        },

        clipCircle: function (group, params) {
            var root = model.generateFullRoot();

            params = params || {};
            params = _.defaults(params, {
                x: 0,
                y: 0,
                radius: root.radius
            });

            if (root.circular && params.radius > 0) {
                group.clipType( 'circle' );
                group.clipX( params.x - 2 );
                group.clipY( params.y - 2 );
                group.clipRadius( params.radius + 2 );
            }
        },

        createCircleFrame: function (params) {
            var frameWidth = params.frameWidth;
            var radius = params.radius;
            var style = module.getStyle('frame');
            var group = new Konva.Group({
                name: 'frame',
                sectionId: params.sectionId
            });

            group.add( new Konva.Arc({
                x: radius,
                y: radius,
                innerRadius: radius - frameWidth,
                outerRadius: radius,
                angle: 360,
                fill: style.fill
            }), new Konva.Circle({
                x: radius,
                y: radius,
                radius: radius - frameWidth,
                stroke: style.stroke,
                strokeWidth: style.strokeWidth,
                listening: false
            }), new Konva.Circle({
                x: radius,
                y: radius,
                radius: radius,
                stroke: style.stroke,
                strokeWidth: style.strokeWidth,
                listening: false
            }) );

            return group;
        },

        // Create sections
        createSectionGroup: function (root) {
            // group for all nested elements
            var sectionsGroup = new Konva.Group();

            // create sections(sashes) recursively
            var sections = this.createSections(root);

            var radius = model.getCircleRadius();
            var frameWidth = model.profile.get('frame_width');
            // var sashFrameWidth = model.profile.get('sash_frame_width');

            var muls = [];

            _.each(sections, function (section) {
                sectionsGroup.add(section);

                // Clip mullions that out over the edge of filling
                if (section.attrs.name === 'mullion') {
                    this.clipCircle( section, {
                        x: frameWidth + 4,
                        y: frameWidth + 4,
                        radius: radius - frameWidth - 4
                    });

                    muls.push(section);
                }
            }.bind(this));

            if ( !module.getState('openingView') ) {
                _.each(muls, function (mullion) {
                    mullion.moveToTop();
                });
            }

            sectionsGroup.scale({x: ratio, y: ratio});

            // Clip a whole unit
            this.clipCircle( sectionsGroup );

            return sectionsGroup;
        },
        createSections: function (rootSection) {
            var objects = [];

            if (rootSection.sections && rootSection.sections.length) {
                var mullion = this.createMullion(rootSection);

                objects.push(mullion);

                // draw each child section
                rootSection.sections.forEach(function (sectionData) {
                    objects = objects.concat(this.createSections(sectionData));
                }.bind(this));
            }

            var sash = this.createSash(rootSection);

            objects.push(sash);

            return objects;
        },
        createMullion: function (section) {
            var style = module.getStyle('mullions');
            var fillStyle = module.getStyle('fillings');
            var group = new Konva.Group({
                name: 'mullion'
            });
            var mullion = new Konva.Rect({
                sectionId: section.id,
                stroke: style.default.stroke,
                fill: style.default.fill,
                strokeWidth: style.default.strokeWidth
            });

            mullion.setAttrs(section.mullionParams);
            var isVerticalInvisible = (
                section.divider === 'vertical_invisible'
            );
            var isHorizontalInvisible = (
                section.divider === 'horizontal_invisible'
            );
            var isSelected = module.getState('selected:mullion') === section.id;

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
                mullion.fill(style.hidden.fill);
                mullion.opacity(style.hidden.opacity);
            } else if ((isVerticalInvisible || isHorizontalInvisible) && isSelected) {
                mullion.opacity(style.hidden_selected.opacity);
                mullion.fill(style.hidden_selected.fill);
            } else if (isSelected) {
                mullion.fill(style.default_selected.fill);
            }

            if (hideVerticalMullion) {
                mullion.opacity(0.01);
            }

            if (hideHorizontalMullion) {
                mullion.fill(fillStyle.glass.fill);
            }

            group.add( mullion );

            return group;
        },
        createSash: function (sectionData) {
            var group = new Konva.Group({
                x: sectionData.sashParams.x,
                y: sectionData.sashParams.y,
                name: 'sash'
            });

            var circleData = (model.getCircleRadius() !== null) ? model.getCircleSashData(sectionData.id) : null;
            var hasFrame = (sectionData.sashType !== 'fixed_in_frame');
            var frameWidth = hasFrame ? model.profile.get('sash_frame_width') : 0;
            var mainFrameWidth = model.profile.get('frame_width') / 2;

            var fillX;
            var fillY;
            var fillWidth;
            var fillHeight;

            if (_.includes(['full-flush-panel', 'exterior-flush-panel'], sectionData.fillingType) &&
                !module.getState('openingView')
            ) {
                fillX = sectionData.openingParams.x - sectionData.sashParams.x;
                fillY = sectionData.openingParams.y - sectionData.sashParams.y;
                fillWidth = sectionData.openingParams.width;
                fillHeight = sectionData.openingParams.height;
            } else if (_.includes(['full-flush-panel', 'interior-flush-panel'], sectionData.fillingType) &&
                        module.getState('openingView')
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

            var shouldDrawFilling =
                !hasSubSections && !isFlushType ||
                !hasSubSections && model.isRootSection(sectionData.id) && isFlushType;

            var shouldDrawBars = shouldDrawFilling &&
                !sectionData.fillingType || sectionData.fillingType === 'glass';

            var shouldDrawDirectionLine = sectionData.sashType !== 'fixed_in_frame';

            var filling;

            var circleClip = {};

            if (circleData) {
                var sashData = (function findSash(sectionId) {
                    var section = model.getSection(sectionId);

                    if (section && section.circular) {
                        return section;
                    } else if (section && section.parentId) {
                        return findSash( section.parentId );
                    }

                    return null;
                })(sectionData.id);

                var sashCircleData = model.getCircleSashData(sashData.id);
                var pos = {
                    x: sashCircleData.sashParams.x - sectionData.sashParams.x,
                    y: sashCircleData.sashParams.y - sectionData.sashParams.y
                };

                circleClip = {
                    x: pos.x + 3,
                    y: pos.y + 3,
                    radius: sashCircleData.radius - 3
                };
            }

            if (shouldDrawFilling) {
                filling = this.createFilling(sectionData, {
                    x: (circleData) ? fillX - frameWidth : fillX,
                    y: (circleData) ? fillY - frameWidth : fillY,
                    width: (circleData) ? fillWidth + frameWidth : fillWidth,
                    height: (circleData) ? fillHeight + frameWidth : fillHeight
                });

                if (circleData) {
                    this.clipCircle(filling, circleClip);
                }

                group.add(filling);
            }

            if (shouldDrawBars) {
                var bars = this.createBars(sectionData, {
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight
                });

                if (circleData) {
                    this.clipCircle(bars, circleClip);
                }

                group.add(bars);
            }

            if (shouldDrawDirectionLine) {
                var directionLine = this.createDirectionLine(sectionData);

                // clip direction line inside filling
                if (circleData) {
                    if (circleData.type === 'circle') {
                        this.clipCircle( directionLine, {
                            x: fillX,
                            y: fillY,
                            radius: circleData.radius - frameWidth
                        });
                    }

                    if (circleData.type === 'arc') {
                        this.clipCircle( directionLine, {
                            x: 2 - sectionData.sashParams.x + mainFrameWidth,
                            y: 2 - sectionData.sashParams.y + mainFrameWidth,
                            radius: circleData.radius + mainFrameWidth - 4
                        });
                    }

                }

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

            var frameGroup;

            var isSelected = (module.getState('selected:sash') === sectionData.id);

            if (isSelected) {
                var selection = this.createSelectionShape(sectionData, {
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight
                });

                if (circleData) {
                    this.clipCircle(selection, circleClip);
                }

                group.add( selection );
            }

            if (isFlushType && !hasSubSections) {
                frameGroup = this.createFlushFrame({
                    width: sectionData.sashParams.width,
                    height: sectionData.sashParams.height,
                    sectionId: sectionData.id
                });
                group.add(frameGroup);
            }

            if (sectionData.sashType !== 'fixed_in_frame') {

                if (circleData) {
                    frameGroup = this.createCircleSashFrame({
                        frameWidth: frameWidth,
                        section: sectionData,
                        data: circleData
                    });
                } else {
                    frameGroup = this.createFrame({
                        width: sectionData.sashParams.width,
                        height: sectionData.sashParams.height,
                        frameWidth: frameWidth,
                        sectionId: sectionData.id
                    });
                }

                group.add(frameGroup);
            }

            var shouldDrawHandle = this.shouldDrawHandle(sectionData.sashType);

            if (shouldDrawHandle) {
                var handle = this.createHandle(sectionData, {
                    frameWidth: frameWidth
                });

                group.add(handle);
            }

            return group;
        },
        shouldDrawHandle: function (type) {
            var result = false;
            var typeResult = false;

            if (
                    type !== 'fixed_in_frame' &&
                    (
                        type.indexOf('left') >= 0 ||
                        type.indexOf('right') >= 0 ||
                        type === 'tilt_only'
                    ) &&
                    (type.indexOf('_hinge_hidden_latch') === -1)
            ) {
                typeResult = true;
            }

            // Draw handle if:
            // 1). type of sash has handle
            // 2a). it's inside view
            // 2b). it's outside view & profile hasOutsideHandle (for example, door)
            result = (
                        typeResult &&
                        (
                            (module.getState('insideView')) ||
                            (!module.getState('insideView') && model.profile.hasOutsideHandle())
                        )
                );

            return result;
        },
        createHandle: function (section, params) {
            var type = section.sashType;
            var offset = params.frameWidth / 2;
            var style = module.getStyle('handle');
            var pos = {
                x: null,
                y: null,
                rotation: 0
            };

            if (type === 'tilt_turn_right' || type === 'turn_only_right' ||
                type === 'slide-right' || type === 'flush-turn-right'
            ) {
                pos.x = offset;
                pos.y = section.sashParams.height / 2;
            }

            if (type === 'tilt_turn_left' || type === 'turn_only_left' ||
                type === 'slide-left' || type === 'flush-turn-left'
            ) {
                pos.x = section.sashParams.width - offset;
                pos.y = section.sashParams.height / 2;
            }

            if (type === 'tilt_only') {
                pos.x = section.sashParams.width / 2;
                pos.y = offset;
                pos.rotation = 90;
            }

            var handle = new Konva.Shape({
                name: 'handle',
                x: pos.x,
                y: pos.y,
                rotation: pos.rotation,
                stroke: style.stroke,
                fill: style.fill,
                sceneFunc: function (ctx) {
                    ctx.beginPath();
                    ctx.rect(-23, -23, 46, 55);
                    ctx.rect(-14, -5, 28, 90);
                    ctx.fillStrokeShape(this);
                }
            });

            return handle;
        },
        createDirectionLine: function (section) {
            var group = new Konva.Group({
                name: 'directionLine'
            });
            var type = section.sashType;
            var style = module.getStyle('direction_line');
            var directionLine = new Konva.Shape({
                name: 'directionLine',
                stroke: style.stroke,
                x: section.glassParams.x - section.sashParams.x,
                y: section.glassParams.y - section.sashParams.y,
                sceneFunc: function (ctx) {
                    ctx.beginPath();
                    var width = section.glassParams.width;
                    var height = section.glassParams.height;

                    if (type.indexOf('right') >= 0 && (type.indexOf('slide') === -1)) {
                        ctx.moveTo(width, height);
                        ctx.lineTo(0, height / 2);
                        ctx.lineTo(width, 0);
                    }

                    if (type.indexOf('left') >= 0 && (type.indexOf('slide') === -1)) {
                        ctx.moveTo(0, 0);
                        ctx.lineTo(width, height / 2);
                        ctx.lineTo(0, height);
                    }

                    if (type.indexOf('tilt_turn_') >= 0 || type.indexOf('slide') >= 0 || type === 'tilt_only') {
                        ctx.moveTo(0, height);
                        ctx.lineTo(width / 2, 0);
                        ctx.lineTo(width, height);
                    }

                    if (type === 'tilt_only_top_hung') {
                        ctx.moveTo(0, 0);
                        ctx.lineTo(width / 2, height);
                        ctx.lineTo(width, 0);
                    }

                    ctx.strokeShape(this);
                }
            });

            if ((type.indexOf('_hinge_hidden_latch') !== -1)) {
                directionLine.dash([10 / this.ratio, 10 / this.ratio]);
            }

            // #192: Reverse hinge indicator for outside view
            if ( module.getState('hingeIndicatorMode') === 'american' ) {
                directionLine.scale({
                    x: -1,
                    y: -1
                });
                directionLine.move({
                    x: section.glassParams.width,
                    y: section.glassParams.height
                });
            }

            group.add( directionLine );

            return group;
        },
        createSectionIndexes: function (mainSection, indexes, i) {
            var view = this;
            var result = [];

            indexes = indexes || {
                main: 0,
                add: null,
                parent: null
            };

            i = i || 0;

            // If section have a children — create Indexes for them recursively
            if (mainSection.sections.length) {

                if (module.getState('insideView') && mainSection.divider === 'vertical') {
                    mainSection.sections.reverse();
                }

                mainSection.sections.forEach(function (section, j) {

                    if (mainSection.sashType !== 'fixed_in_frame') {
                        indexes.parent = mainSection;
                    }

                    if (!section.sections.length) {
                        indexes.add += 1;

                    }

                    result = result.concat( view.createSectionIndexes(section, indexes, j) );
                });

            // If section haven't a children sections — create Index for it
            } else {
                var text = (indexes.main + 1);
                var position = {
                    x: (
                        mainSection.glassParams.x - mainSection.sashParams.x
                    ),
                    y: (
                        mainSection.glassParams.y - mainSection.sashParams.y
                    )
                };
                var size = {
                    width: mainSection.glassParams.width,
                    height: mainSection.glassParams.height
                };

                if (indexes.add !== null) {
                    text += '.' + indexes.add;

                    if (indexes.parent) {

                        position = {
                            x: (
                                mainSection.glassParams.x - indexes.parent.sashParams.x
                            ),
                            y: (
                                mainSection.glassParams.y - indexes.parent.sashParams.y
                            )
                        };
                        size = {
                            width: size.width,
                            height: size.height
                        };
                    }
                }

                result.push({
                    text: text,
                    position: position,
                    size: size,
                    id: mainSection.id
                });

            }

            return result;
        },
        createIndexes: function (indexes) {
            var group = new Konva.Group({
                name: 'sectionIndexes'
            });
            var number;

            indexes.forEach(function (section) {
                var opts = {
                    width: section.size.width,
                    text: section.text + ' (' + section.id + ')',
                    listening: false
                };

                _.extend(opts, module.getStyle('indexes'));
                opts.fontSize = opts.fontSize / ratio;

                number = new Konva.Text(opts);

                number.position( section.position );
                number.y( number.y() + section.size.height / 2 - number.height() / 2 );

                group.add( number );
            });

            return group;
        },
        createFilling: function (section, params) {
            var fillX = params.x;
            var fillY = params.y;
            var fillWidth = params.width;
            var fillHeight = params.height;
            var group = new Konva.Group({name: 'filling'});
            var filling;
            var sceneFunc;
            var opts;

            var style = module.getStyle('fillings');

            if (section.arched) {
                // Arched
                var arcPos = model.getArchedPosition();

                sceneFunc = function (ctx) {
                    ctx.beginPath();
                    ctx.moveTo(0, fillHeight);
                    ctx.lineTo(0, arcPos);
                    ctx.quadraticCurveTo(0, 0, fillWidth / 2, 0);
                    ctx.quadraticCurveTo(fillWidth, 0, fillWidth, arcPos);
                    ctx.lineTo(fillWidth, fillHeight);
                    ctx.closePath();
                    ctx.fillStrokeShape(this);
                };

                opts = {
                    sectionId: section.id,
                    x: fillX,
                    y: fillY,
                    fill: style.glass.fill,
                    sceneFunc: sceneFunc
                };
                // Draw filling
                filling = new Konva.Shape(opts);
            } else if (section.circular || params.radius) {
                // Circular
                var frameWidth = params.frameWidth || model.profile.get('frame_width');
                var radius = params.radius || section.radius - frameWidth;

                opts = {
                    sectionId: section.id,
                    x: fillX + radius,
                    y: fillY + radius,
                    fill: style.glass.fill,
                    radius: radius
                };
                // Draw filling
                filling = new Konva.Circle(opts);
            } else {
                // Default
                opts = {
                    sectionId: section.id,
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight,
                    fill: style.glass.fill,
                    sceneFunc: function (ctx) {
                        ctx.beginPath();
                        ctx.rect(0, 0, this.width(), this.height());
                        // draw louver lines
                        if (section.fillingType === 'louver') {
                            var offset = 40;

                            for (var i = 0; i < this.height() / offset; i++) {
                                ctx.moveTo(0, i * offset);
                                ctx.lineTo(this.width(), i * offset);
                            }
                        }

                        ctx.fillStrokeShape(this);
                    }
                };
                // Draw filling
                filling = new Konva.Shape(opts);
            }

            // Special fillings
            if (section.fillingType === 'louver') {
                filling.stroke(style.louver.stroke);
            }

            if (section.fillingType && section.fillingType !== 'glass') {
                filling.fill(style.others.fill);
            }

            group.add( filling );

            return group;
        },
        createBars: function (section, params) {
            var fillX = params.x;
            var fillY = params.y;
            var fillWidth = params.width;
            var fillHeight = params.height;

            var group = new Konva.Group();
            var bar;

            var hBarCount = section.bars.horizontal.length;
            var vBarCount = section.bars.vertical.length;
            var glazing_bar_width = model.get('glazing_bar_width');
            var data;
            var space;

            var style = module.getStyle('bars');

            var _from;
            var _to;
            var tbar;

            for (var i = 0; i < vBarCount; i++) {
                data = section.bars.vertical[i];
                space = data.position;

                _from = 0;
                _to = fillHeight;

                if (data.links) {
                    if (data.links[0] !== null) {
                        tbar = model.getBar(section.id, data.links[0]);
                        _from = (tbar !== null && 'position' in tbar) ? fillY + tbar.position : fillY;
                    }

                    if (data.links[1] !== null) {
                        tbar = model.getBar(section.id, data.links[1]);
                        _to = (tbar !== null && 'position' in tbar) ? tbar.position : fillHeight;
                    }
                }

                _to += fillY;

                bar = new Konva.Rect({
                    x: fillX + space - (glazing_bar_width / 2),
                    y: _from,
                    width: glazing_bar_width,
                    height: _to - _from,
                    fill: style.normal.fill,
                    listening: false
                });
                group.add(bar);
            }

            for (i = 0; i < hBarCount; i++) {
                data = section.bars.horizontal[i];
                space = data.position;

                _from = 0;
                _to = fillWidth;

                if (data.links) {
                    if (data.links[0] !== null) {
                        tbar = model.getBar(section.id, data.links[0]);
                        _from = (tbar !== null && 'position' in tbar) ? fillX + tbar.position : fillX;
                    }

                    if (data.links[1] !== null) {
                        tbar = model.getBar(section.id, data.links[1]);
                        _to = (tbar !== null && 'position' in tbar) ? tbar.position : fillWidth;
                    }
                }

                _to += fillX;

                bar = new Konva.Rect({
                    x: _from,
                    y: fillY + space - (glazing_bar_width / 2),
                    width: _to - _from,
                    height: glazing_bar_width,
                    fill: style.normal.fill,
                    listening: false
                });
                group.add(bar);
            }

            return group;
        },
        // special shape on top of sash to hightlight selection
        // it is simple to draw shape with alpha on top
        // then change styles of selected object
        createSelectionShape: function (section, params) {
            var fillX = params.x;
            var fillY = params.y;
            var fillWidth = params.width;
            var fillHeight = params.height;
            var style = module.getStyle('selection');

            var group = new Konva.Group({
                name: 'selection'
            });
            var shape;

            if (section.arched) {
                // arched shape
                var arcPos = model.getArchedPosition();

                shape = new Konva.Shape({
                    x: fillX,
                    y: fillY,
                    fill: style.fill,
                    sceneFunc: function (ctx) {
                        ctx.beginPath();
                        ctx.moveTo(0, fillHeight);
                        ctx.lineTo(0, arcPos);
                        ctx.quadraticCurveTo(0, 0, fillWidth / 2, 0);
                        ctx.quadraticCurveTo(fillWidth, 0, fillWidth, arcPos);
                        ctx.lineTo(fillWidth, fillHeight);
                        ctx.closePath();
                        ctx.fillStrokeShape(this);
                    }
                });
            } else if (section.circular) {
                // circular shape
                var radius = model.getCircleRadius();
                var frameWidth = model.profile.get('frame_width');

                if (section.sashType !== 'fixed_in_frame') {
                    frameWidth = frameWidth / 2;
                }

                shape = new Konva.Circle({
                    x: radius - frameWidth,
                    y: radius - frameWidth,
                    radius: radius - frameWidth,
                    fill: style.fill
                });
            } else {
                // usual rect
                shape = new Konva.Rect({
                    width: section.sashParams.width,
                    height: section.sashParams.height,
                    fill: style.fill
                });
            }

            group.add( shape );

            return group;
        },
        getCircleSashDrawingOpts: function (params) {
            var opts = {};

            opts.x = 0;
            opts.y = 0;
            opts.absX = params.section.sashParams.x;
            opts.absY = params.section.sashParams.y;
            opts.width = params.section.sashParams.width;
            opts.height = params.section.sashParams.height;
            opts.frameWidth = params.frameWidth;
            opts.mainFrameWidth = model.profile.get('frame_width') / 2;
            opts.radius = model.getCircleRadius();
            opts.center = {
                x: opts.radius - opts.mainFrameWidth,
                y: opts.radius - opts.mainFrameWidth
            };
            // Search relative center point for drawing arc
            opts.arcCenter = app.utils.vector2d.vectors_to_points([{x: 0, y: 0}], opts.center)[0];
            opts.arcCenter.x = opts.arcCenter.x - params.section.sashParams.x + opts.mainFrameWidth;
            opts.arcCenter.y = opts.arcCenter.y - params.section.sashParams.y + opts.mainFrameWidth;
            // Search inner and outer radius for sash
            opts.innerRadius = opts.radius - opts.mainFrameWidth - params.frameWidth;
            opts.outerRadius = opts.radius - opts.mainFrameWidth;

            return opts;
        }

    });

})();
