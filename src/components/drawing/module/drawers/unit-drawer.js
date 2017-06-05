import _ from 'underscore';
import Backbone from 'backbone';
import Konva from '../konva-clip-patch';

import { geometry, vector2d, array } from '../../../../utils';
import handle_data from '../../data/handle-data';

const INDEX_HOVERPAD_SIZE = 15;

let module;
let model;
let ratio;

function drawLouver(context, options) {
    if (!context || !(options && options.width && options.height)) { return; }
    const width = options.width;
    const height = options.height;
    const bladeWidth = options.bladeWidth || 40;
    const points = options.points;

    if (points) {  // Trapezoid
        for (let i = 0; i < height / bladeWidth; i += 1) {
            const section_crossing = model.getLineCrossingY(
                i * bladeWidth,
                { x: points[0].x, y: points[0].y },
                { x: points[1].x, y: points[1].y },
            );

            if (points[0].y < points[1].y && section_crossing > 0) {
                context.moveTo(0, i * bladeWidth);
                context.lineTo(
                    ((width < section_crossing) ? width : section_crossing),
                    i * bladeWidth,
                );
            } else if (points[0].y > points[1].y && section_crossing < width) {
                context.moveTo(((section_crossing > 0) ? section_crossing : 0), i * bladeWidth);
                context.lineTo(width, i * bladeWidth);
            }
        }
    } else {  // Non-trapezoid
        for (let i = 0; i < height / bladeWidth; i += 1) {
            context.moveTo(0, i * bladeWidth);
            context.lineTo(width, i * bladeWidth);
        }
    }
}

export default Backbone.KonvaView.extend({
    initialize(params) {
        module = params.builder;

        this.layer = params.layer;
        this.stage = params.stage;

        model = module.get('model');
    },
    el() {
        const group = new Konva.Group();

        return group;
    },
    render() {
        ratio = module.get('ratio');

        // Clear all previous objects
        this.layer.destroyChildren();
        // Creating unit and adding it to layer
        this.layer.add(this.createUnit());
        this.applyHandleFixes();
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
        'tap #back': 'onBackClick',

        'click .indexHoverPad': 'onIndexHoverClick',
        'tap .indexHoverPad': 'onIndexHoverClick',
        'mouseenter .indexHoverPad': 'onIndexHoverEnter',
        'mousemove .indexHoverPad': 'onIndexHoverMove',
        'mouseleave .indexHoverPad': 'onIndexHoverLeave',
    },
    // Utils
    // Functions search for Konva Object inside object with specified name
    // And rises up to the parents recursively
    getSectionId(object) {
        if ('sectionId' in object.attrs) {
            return object;
        } else if (object.parent) {
            return this.getSectionId(object.parent);
        }

        return false;
    },
    // Handlers
    onFrameClick(event) {
        this.setSelection(event, 'sash', 'frame');
    },
    onFillingClick(event) {
        this.setSelection(event, 'sash', 'filling');
    },
    onMullionClick(event) {
        this.setSelection(event, 'mullion', 'mullion');
    },
    onBackClick() {
        this.deselectAll();
    },
    onIndexHoverClick(event) {
        module.stopSectionMenuHover();
        this.setSelection(event, 'sash', 'filling');
    },
    onIndexHoverEnter(event) {
        module.startSectionMenuHover({ sectionId: event.target.getAttr('sectionId') });
    },
    onIndexHoverMove() {
        module.restartSectionMenuHover();
    },
    onIndexHoverLeave() {
        module.stopSectionMenuHover();
    },

    // Keyboards handlers
    onKeyDown(e) {
        const isRemove = e.key === 'Delete' || e.key === 'Backspace';
        const isNumeric = /^[0-9]$/.test(e.key);
        const selectedMullionId = module.getState('selected:mullion');
        const isMullionSelected = !!selectedMullionId;

        if (isRemove) {
            e.preventDefault();
            this.removeSelected();
        } else if (isNumeric && isMullionSelected) {
            module.trigger('mullionNumericInput', { mullionId: selectedMullionId });
        }
    },

    // Selections
    setSelection(event, type) {
        const origin = this.getSectionId(event.target);
        const untype = (type === 'sash') ? 'mullion' : 'sash';

        if (origin) {
            module.setState(`selected:${untype}`, null);
            module.setState(`selected:${type}`, origin.attrs.sectionId);
        }
    },
    deselectAll(preventUpdate) {
        module.deselectAll(preventUpdate);
    },
    removeSelected() {
        const selectedMullionId = module.getState('selected:mullion');
        const selectedSashId = module.getState('selected:sash');

        if (selectedMullionId) {
            model.removeMullion(selectedMullionId);
        }

        if (selectedSashId) {
            model.removeSash(selectedSashId);
        }

        this.deselectAll();
    },

    // Create unit
    createUnit() {
        const group = this.el;
        const root = (module.getState('openingView')) ? model.generateFullRoot() : model.generateFullReversedRoot();

        group.add(this.createBack());

        const frameGroup = this.createMainFrame(root);
        const sectionGroup = this.createSectionGroup(root);

        group.add(frameGroup);
        group.add(sectionGroup);

        const center = module.get('center');
        // place unit on stage center
        group.position(center);

        if (!module.getState('openingView')) {
            frameGroup.moveToTop();
        }

        return group;
    },
    // Create elements
    // Create transparent background to detect click on empty space
    createBack() {
        const back = new Konva.Rect({
            id: 'back',
            width: this.stage.width(),
            height: this.stage.height(),
        });

        return back;
    },
    // Create main frame
    createMainFrame(root) {
        const group = new Konva.Group();

        let frameGroup;
        const isDoorFrame =
            model.profile.isThresholdPossible() &&
            model.profile.get('low_threshold');

        const isArchedWindow = model.isArchedWindow();
        const isCircleWindow = model.isCircleWindow();

        // create main frame
        if (isDoorFrame) {
            frameGroup = this.createDoorFrame({
                sectionId: root.id,
                width: model.getInMetric('width', 'mm'),
                height: model.getInMetric('height', 'mm'),
                frameWidth: model.profile.get('frame_width'),
            });
        } else if (isArchedWindow) {
            frameGroup = this.createArchedFrame({
                sectionId: root.id,
                width: model.getInMetric('width', 'mm'),
                height: model.getInMetric('height', 'mm'),
                frameWidth: model.profile.get('frame_width'),
                archHeight: model.getArchedPosition(),
            });
        } else if (isCircleWindow) {
            frameGroup = this.createCircleFrame({
                sectionId: root.id,
                radius: model.getCircleRadius(),
                frameWidth: model.profile.get('frame_width'),
            });
        } else {
            frameGroup = this.createFrame({
                sectionId: root.id,
                width: model.getInMetric('width', 'mm'),
                height: model.getInMetric('height', 'mm'),
                frameWidth: model.profile.get('frame_width'),
            });
        }

        frameGroup.scale({ x: ratio, y: ratio });
        group.add(frameGroup);

        return group;
    },
    createCircleSashFrame(params) {
        const section = params.section;
        const frameWidth = params.frameWidth; // in mm
        const data = params.data;

        let group = new Konva.Group({
            name: 'frame',
            sectionId: section.id,
        });

        if (data.type === 'rect') {
            // If this is a section that bordered with mullions from each side — it's a simple rectangular sash
            group = this.createFrame({
                width: section.sashParams.width,
                height: section.sashParams.height,
                frameWidth,
                sectionId: section.id,
            });
        } else if (data.type === 'circle') {
            // If there is no edges around — it's just a circle (sash inside root section)
            group = this.createCircleFrame({
                frameWidth,
                radius: data.radius,
                sectionId: section.id,
            });
        } else if (data.type === 'arc') {
            // Otherwise it's a sash inside one of children section, so this sash have an arc side
            group = this.createArchSashFrame({
                frameWidth,
                radius: data.radius,
                section,
            });
        }

        return group;
    },
    createArchSashFrame(params) {
        const style = module.getStyle('frame');

        const opts = this.getCircleSashDrawingOpts(params);

        const group = new Konva.Group({
            name: 'frame',
            sectionId: params.section.id,
        });
        const straightEdges = this.createStraightEdges(params, opts, style);
        const arcEdge = this.createArcEdges(params, opts, style);

        // Add to group
        group.add(arcEdge, straightEdges);

        return group;
    },
    createStraightEdges(params, opts, style) {
        const straightEdges = new Konva.Group({
            name: 'edges',
        });
        // Calculate and draw straight part of sash frame
        _.each(params.section.mullionEdges, (val, edge) => {
            if (val === 'vertical' || val === 'horizontal') {
                let points = [];     // Original points of frame
                const absPoints = [];  // Absolute points: Used in calculations
                let relPoints = [];  // Relative points: After all calculations we return it into relative positions
                const linePoints = []; // Flat array of relPoints. This will be passed into Konva.Line constructor
                const absArcCenter = { x: 0, y: 0 }; // Absolute center of local center point (for draw circle)
                let intersects = []; // Find points that intersects with circles (outer & inner radiuses)
                const frameConnection = { x: 0, y: 0 }; // Object stores possible frame correction for straight frames

                // Find points closest to mullion and two another, that forms a sash frame
                // But without any skew at short edges.
                if (edge === 'top') {
                    points = [
                        // mullion
                        { x: opts.x, y: opts.y },
                        { x: opts.x + opts.width, y: opts.y },
                        // frame
                        { x: opts.x + opts.width, y: opts.y + opts.frameWidth },
                        { x: opts.x, y: opts.y + opts.frameWidth },
                    ];

                    frameConnection.x = opts.frameWidth;
                } else if (edge === 'right') {
                    points = [
                        // mullion
                        { x: opts.x + opts.width, y: opts.y },
                        { x: opts.x + opts.width, y: opts.y + opts.height },
                        // frame
                        { x: opts.x + (opts.width - opts.frameWidth), y: opts.y + opts.height },
                        { x: opts.x + (opts.width - opts.frameWidth), y: opts.y },
                    ];
                    frameConnection.y = opts.frameWidth;
                } else if (edge === 'bottom') {
                    points = [
                        // mullion
                        { x: opts.x, y: opts.y + opts.height },
                        { x: opts.x + opts.width, y: opts.y + opts.height },
                        // frame
                        { x: opts.x + opts.width, y: opts.y + (opts.height - opts.frameWidth) },
                        { x: opts.x, y: opts.y + (opts.height - opts.frameWidth) },
                    ];
                    frameConnection.x = opts.frameWidth;
                } else if (edge === 'left') {
                    points = [
                        // mullion
                        { x: opts.x, y: opts.y },
                        { x: opts.x, y: opts.y + opts.height },
                        // frame
                        { x: opts.x + opts.frameWidth, y: opts.y + opts.height },
                        { x: opts.x + opts.frameWidth, y: opts.y },
                    ];
                    frameConnection.y = opts.frameWidth;
                }

                // Get absolute position of points
                _.each(points, (point) => {
                    const absPoint = {
                        x: point.x + opts.absX,
                        y: point.y + opts.absY,
                    };

                    absPoints.push(absPoint);
                });

                absArcCenter.x = opts.arcCenter.x + opts.absX;
                absArcCenter.y = opts.arcCenter.y + opts.absY;

                // Find which of points lies at the arched frame
                intersects = geometry.intersectCircleLine(
                    absArcCenter,
                    opts.outerRadius - 1,
                    absPoints[0],
                    absPoints[1],
                    true,
                );
                intersects = intersects.concat(
                    geometry.intersectCircleLine(
                        absArcCenter,
                        opts.innerRadius,
                        absPoints[2],
                        absPoints[3],
                        true,
                    ),
                );

                relPoints = intersects.map((point, index) => {
                    const r = {
                        x: point.x - opts.absX,
                        y: point.y - opts.absY,
                    };

                    // If points wasn't intersected with circle —
                    // it's a point that connected to another straight frame side
                    // So we must substract default connection size (frameWidth) from points
                    if (!('intersects' in point)) {
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

                _.each(relPoints, (point) => {
                    linePoints.push(point.x);
                    linePoints.push(point.y);
                });

                straightEdges.add(new Konva.Line({
                    points: linePoints,
                }));
            }
        });

        straightEdges.children
            .closed(true)
            .stroke(style.stroke)
            .strokeWidth(style.strokeWidth)
            .fill(style.fill);

        return straightEdges;
    },
    createArcEdges(params, opts, style) {
        const arcEdge = new Konva.Group({
            name: 'arcEdge',
        });

        // Calculate and draw arched parts of sash frame
        let uPoints = [
            { x: 0, y: 0 },
            { x: 0, y: 0 + opts.height },
            { x: 0 + opts.width, y: 0 + opts.height },
            { x: 0 + opts.width, y: 0 },
        ];

        // Convert every point into absolute position
        _.each(uPoints, (point) => {
            point.x += opts.absX;
            point.y += opts.absY;
        });
        // Convert points to vectors relative to the center point of unit
        uPoints = vector2d.points_to_vectors(uPoints, opts.center);

        arcEdge.add(
            new Konva.Arc({
                x: opts.arcCenter.x,
                y: opts.arcCenter.y,
                innerRadius: opts.innerRadius,
                outerRadius: opts.outerRadius,
                angle: 360,
                fill: style.fill,
            }),
            new Konva.Arc({
                x: opts.arcCenter.x,
                y: opts.arcCenter.y,
                innerRadius: opts.outerRadius,
                outerRadius: opts.outerRadius + style.strokeWidth,
                angle: 360,
                fill: style.stroke,
            }),
            new Konva.Arc({
                x: opts.arcCenter.x,
                y: opts.arcCenter.y,
                innerRadius: opts.innerRadius,
                outerRadius: opts.innerRadius + style.strokeWidth,
                angle: 360,
                fill: style.stroke,
            }),
        );

        // Clip it to default rectangle shape of section
        arcEdge.clipX(opts.x - 2);
        arcEdge.clipY(opts.y - 2);
        arcEdge.clipWidth(opts.width + 4);
        arcEdge.clipHeight(opts.height + 4);

        return arcEdge;
    },

    createFrame(params) {
        const frameWidth = params.frameWidth;  // in mm
        const width = params.width;
        const height = params.height;
        const style = module.getStyle('frame');

        const group = new Konva.Group({
            name: 'frame',
            sectionId: params.sectionId,
        });
        const top = new Konva.Line({
            points: [
                0, 0,
                width, 0,
                width - frameWidth, frameWidth,
                frameWidth, frameWidth,
            ],
        });

        const left = new Konva.Line({
            points: [
                0, 0,
                frameWidth, frameWidth,
                frameWidth, height - frameWidth,
                0, height,
            ],
        });

        const bottom = new Konva.Line({
            points: [
                0, height,
                frameWidth, height - frameWidth,
                width - frameWidth, height - frameWidth,
                width, height,
            ],
        });

        const right = new Konva.Line({
            points: [
                width, 0,
                width, height,
                width - frameWidth, height - frameWidth,
                width - frameWidth, frameWidth,
            ],
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
    createFlushFrame(params) {
        const width = params.width;
        const height = params.height;
        const opts = {};

        // Extend opts with styles
        _.extend(opts, module.getStyle('flush_frame'));
        // Extend with sizes and data
        _.extend(opts, {
            width,
            height,
            name: 'frame',
            sectionId: params.sectionId,
        });

        const rect = new Konva.Rect(opts);

        return rect;
    },

    // door frame have special case for threshold drawing
    createDoorFrame(params) {
        const frameWidth = params.frameWidth;  // in mm
        const thresholdWidth = model.profile.get('threshold_width');
        const width = params.width;
        const height = params.height;

        const style = {
            frame: module.getStyle('frame'),
            bottom: module.getStyle('door_bottom'),
        };

        const group = new Konva.Group({
            name: 'frame',
        });
        const top = new Konva.Line({
            points: [
                0, 0,
                width, 0,
                width - frameWidth, frameWidth,
                frameWidth, frameWidth,
            ],
        });

        const left = new Konva.Line({
            points: [
                0, 0,
                frameWidth, frameWidth,
                frameWidth, height - thresholdWidth,
                0, height - thresholdWidth,
            ],
        });

        const right = new Konva.Line({
            points: [
                width, 0,
                width, height - thresholdWidth,
                width - frameWidth, height - thresholdWidth,
                width - frameWidth, frameWidth,
            ],
        });

        group.add(top, left, right);

        group.children
            .closed(true)
            .stroke(style.frame.stroke)
            .strokeWidth(style.frame.strokeWidth)
            .fill(style.frame.fill);

        const bottom = new Konva.Line({
            points: [
                0, height - thresholdWidth,
                width, height - thresholdWidth,
                width, height,
                0, height,
            ],
            closed: true,
            stroke: style.bottom.stroke,
            strokeWidth: style.bottom.strokeWidth,
            fill: style.bottom.fill,
        });

        group.add(bottom);

        return group;
    },

    // arched frame have special case for arched part
    createArchedFrame(params) {
        const frameWidth = params.frameWidth;
        const width = params.width;
        const height = params.height;
        const archHeight = params.archHeight;

        const style = module.getStyle('frame');

        const group = new Konva.Group({
            name: 'frame',
        });
        const top = new Konva.Shape({
            stroke: style.stroke,
            strokeWidth: style.strokeWidth,
            fill: style.fill,
            sceneFunc(ctx) {
                ctx.beginPath();
                const scale = (width / 2) / archHeight;

                ctx.save();
                ctx.scale(scale, 1);
                const radius = archHeight;

                ctx._context.arc(
                    radius, radius, radius,
                    0, Math.PI, true);
                ctx.restore();
                ctx.translate(width / 2, archHeight);
                ctx.scale(
                    ((width / 2) - frameWidth) / archHeight,
                    (archHeight - frameWidth) / archHeight,
                );
                ctx._context.arc(
                    0, 0,
                    radius,
                    Math.PI, 0,
                );
                ctx.closePath();
                ctx.fillStrokeShape(this);
            },
        });

        const left = new Konva.Line({
            points: [
                0, archHeight,
                frameWidth, archHeight,
                frameWidth, height - frameWidth,
                0, height,
            ],
        });

        const bottom = new Konva.Line({
            points: [
                0, height,
                frameWidth, height - frameWidth,
                width - frameWidth, height - frameWidth,
                width, height,
            ],
        });

        const right = new Konva.Line({
            points: [
                width, archHeight,
                width, height,
                width - frameWidth, height - frameWidth,
                width - frameWidth, archHeight,
            ],
        });

        group.add(left, right, bottom, top);

        group.find('Line')
            .closed(true)
            .stroke(style.stroke)
            .strokeWidth(style.strokeWidth)
            .fill(style.fill);

        return group;
    },
    clipCircle(group, params) {
        const root = model.generateFullRoot();

        params = params || {};
        params = _.defaults(params, {
            x: 0,
            y: 0,
            radius: root.radius,
        });

        if (root.circular && params.radius > 0) {
            group.clipType('circle');
            group.clipX(params.x - 2);
            group.clipY(params.y - 2);
            group.clipRadius(params.radius + 2);
        }
    },
    createCircleFrame(params) {
        const frameWidth = params.frameWidth;
        const radius = params.radius;
        const style = module.getStyle('frame');
        const group = new Konva.Group({
            name: 'frame',
            sectionId: params.sectionId,
        });

        group.add(new Konva.Arc({
            x: radius,
            y: radius,
            innerRadius: radius - frameWidth,
            outerRadius: radius,
            angle: 360,
            fill: style.fill,
        }), new Konva.Circle({
            x: radius,
            y: radius,
            radius: radius - frameWidth,
            stroke: style.stroke,
            strokeWidth: style.strokeWidth,
            listening: false,
        }), new Konva.Circle({
            x: radius,
            y: radius,
            radius,
            stroke: style.stroke,
            strokeWidth: style.strokeWidth,
            listening: false,
        }));

        return group;
    },
    // Create sections
    createSectionGroup(root) {
        const drawer = this;
        // group for all nested elements
        const sectionsGroup = new Konva.Group();

        // create sections(sashes) recursively
        const sections = this.createSectionsTree(root);

        const radius = model.getCircleRadius();
        const frameWidth = model.profile.get('frame_width');

        // Reverse sections array to sorting from the deepest children
        // To make parent mullions lays over children sashes
        // if (!module.getState('openingView')) { comment when fix bug width different mullions width
        //     sections.reverse();
        // }

        // draw section group recursively
        function drawSectionGroup(input) {
            if (input.length > 0 && input instanceof Array) {
                _.each(input, (section) => {
                    drawSectionGroup(section);
                });
            } else {
                sectionsGroup.add(input);

                // Clip mullions that out over the edge of filling
                if (input.attrs.name === 'mullion' && model.isCircleWindow()) {
                    drawer.clipCircle(input, {
                        x: frameWidth + 4,
                        y: frameWidth + 4,
                        radius: radius - frameWidth - 4,
                    });
                }

                drawer.sortSection(input);
            }
        }

        drawSectionGroup(sections);
        sectionsGroup.scale({ x: ratio, y: ratio });

        // Clip a whole unit
        if (model.isCircleWindow()) {
            this.clipCircle(sectionsGroup);
        }

        return sectionsGroup;
    },
    sortSection(group) {
        // group = sash or mullion
        if (group.attrs.name === 'sash') {
            // sort sash children:
            let sortingOrder = [
                'filling',
                'bars',
                'direction',
                'frame',
                'selection',
                'handle',
                'index',
            ];

            // Get section data
            const section = model.getSection(group.attrs.sectionId);
            // Make some correction in sorting order if section has...
            if (
                (section.fillingType === 'interior-flush-panel' && module.getState('openingView')) ||
                (section.fillingType === 'exterior-flush-panel' && !module.getState('openingView')) ||
                section.fillingType === 'full-flush-panel'
            ) {
                // Move frame before filling
                sortingOrder = array.moveByValue(sortingOrder, 'frame', 'filling');
            }

            _.each(sortingOrder, (name) => {
                const _node = group.find(`.${name}`);

                if (_node.length > 0) {
                    _node.moveToTop();
                }
            });
        }
    },
    createSectionsTree(rootSection) {
        const objects = [];

        const sash = this.createSash(rootSection);

        if (rootSection.sections && rootSection.sections.length) {
            let level = [];
            const mullion = this.createMullion(rootSection);

            // fix bug width different mullion width
            if (module.getState('openingView')) {
                objects.push(mullion);
            }

            // draw each child section
            rootSection.sections.forEach((sectionData) => {
                level = level.concat(this.createSectionsTree(sectionData));
            });

            level.push(sash);
            objects.push(level);

            // fix bug width different mullion width
            if (!module.getState('openingView')) {
                objects.push(mullion);
            }
        } else {
            objects.push(sash);
        }

        return objects;
    },
    createMullion(section) {
        const style = module.getStyle('mullions');
        const fillStyle = module.getStyle('fillings');
        const group = new Konva.Group({
            id: `mullion-${section.id}`,
            name: 'mullion',
            sectionId: section.id,
        });
        const mullion = new Konva.Rect({
            sectionId: section.id,
            stroke: style.default.stroke,
            fill: style.default.fill,
            strokeWidth: style.default.strokeWidth,
        });

        mullion.setAttrs(section.mullionParams);
        const isVerticalInvisible = (
            section.divider === 'vertical_invisible'
        );
        const isHorizontalInvisible = (
            section.divider === 'horizontal_invisible'
        );
        const isSelected = module.getState('selected:mullion') === section.id;

        // do not show mullion for type vertical_invisible
        // and sash is added for both right and left sides
        const hideVerticalMullion =
            (section.divider === 'vertical_invisible') &&
            (section.sections[0].sashType !== 'fixed_in_frame') &&
            (section.sections[1].sashType !== 'fixed_in_frame') && !isSelected;

        const hideHorizontalMullion =
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

        group.add(mullion);

        return group;
    },
    drawSlideDirection(sectionData, /* Konva.Group*/group) {
        if (['slide_left', 'slide_right'].indexOf(sectionData.sashType) === -1) {
            return group;
        }

        const direction = sectionData.sashType.split('_').pop();
        const factors = {
            offsetX: sectionData.sashParams.width / 3,
            offsetY: sectionData.sashParams.height / 4,
            stepX: 60 / ratio,
            stepY: 60 / ratio,
            left: {
                initialOffsetSign: -1,
                directionSign: 1,
            },
            right: {
                initialOffsetSign: 1,
                directionSign: -1,
            },
        };
        const initialX = (sectionData.sashParams.width / 2) + ((15 / ratio) * factors[direction].initialOffsetSign);
        const initialY = (sectionData.sashParams.height / 2) + (10 / ratio);
        const arrowParams = {
            points: [
                initialX,
                initialY,
                initialX,
                initialY - factors.stepY,
                initialX + (factors.stepX * factors[direction].directionSign),
                initialY - factors.stepY,
            ],
            pointerLength: (1 / ratio) * 2,
            pointerWidth: (1 / ratio) * 2,
            fill: 'black',
            stroke: 'black',
            strokeWidth: 1 / ratio,
            name: 'index',
        };
        const arrow = new Konva.Arrow(arrowParams);

        group.add(arrow);
        return group;
    },
    drawTiltSlideDirection(sectionData, /* Konva.Group*/group) {
        if (['tilt_slide_left', 'tilt_slide_right'].indexOf(sectionData.sashType) === -1) {
            return group;
        }

        const direction = sectionData.sashType.split('_').pop();
        const factors = {
            stepX: sectionData.sashParams.width / 5,
            stepY: sectionData.sashParams.height / 5,
            left: {
                initialOffsetSign: -1,
                directionSign: 1,
            },
            right: {
                initialOffsetSign: 1,
                directionSign: -1,
            },
        };
        const centerX = sectionData.sashParams.width / 2;
        const centerY = sectionData.sashParams.height / 2;
        const initialX = centerX + ((factors.stepX / 2) * factors[direction].initialOffsetSign);
        const initialY = centerY + (10 / ratio);
        const arrowParams = {
            points: [
                initialX,
                initialY,
                initialX + ((factors.stepX / 2) * factors[direction].directionSign),
                initialY - factors.stepY,
                initialX + (factors.stepX * factors[direction].directionSign),
                initialY,
                initialX + (factors.stepX * 2 * factors[direction].directionSign),
                initialY,
            ],
            pointerLength: (1 / ratio) * 2,
            pointerWidth: (1 / ratio) * 2,
            fill: 'black',
            stroke: 'black',
            strokeWidth: 1 / ratio,
            name: 'index',
        };
        const arrow = new Konva.Arrow(arrowParams);

        group.add(arrow);
        return group;
    },
    createSash(sectionData) {
        let group = new Konva.Group({
            x: sectionData.sashParams.x,
            y: sectionData.sashParams.y,
            name: 'sash',
            sectionId: sectionData.id,
        });

        const circleData = (model.isCircleWindow()) ? model.getCircleSashData(sectionData.id) : null;
        const hasFrame = (sectionData.sashType !== 'fixed_in_frame');
        const frameWidth = hasFrame ? model.profile.get('sash_frame_width') : 0;
        const mainFrameWidth = model.profile.get('frame_width') / 2;
        const fill = {};

        if (
            _.includes(['full-flush-panel', 'exterior-flush-panel'], sectionData.fillingType) &&
            !module.getState('openingView')
        ) {
            fill.x = sectionData.openingParams.x - sectionData.sashParams.x;
            fill.y = sectionData.openingParams.y - sectionData.sashParams.y;
            fill.width = sectionData.openingParams.width;
            fill.height = sectionData.openingParams.height;
        } else if (
            _.includes(['full-flush-panel', 'interior-flush-panel'], sectionData.fillingType) &&
            module.getState('openingView')
        ) {
            fill.x = 0;
            fill.y = 0;
            fill.width = sectionData.sashParams.width;
            fill.height = sectionData.sashParams.height;
        } else {
            fill.x = sectionData.glassParams.x - sectionData.sashParams.x;
            fill.y = sectionData.glassParams.y - sectionData.sashParams.y;
            fill.width = sectionData.glassParams.width;
            fill.height = sectionData.glassParams.height;
        }

        const hasSubSections = sectionData.sections && sectionData.sections.length;
        const isFlushType = sectionData.fillingType &&
            sectionData.fillingType.indexOf('flush') >= 0;

        const shouldDrawFilling =
            (!hasSubSections && !isFlushType) ||
            (!hasSubSections && model.isRootSection(sectionData.id) && isFlushType);

        const shouldDrawBars = (shouldDrawFilling && !sectionData.fillingType) || sectionData.fillingType === 'glass';

        const shouldDrawDirectionLine = ([
            'fixed_in_frame',
            'slide_left',
            'slide_right',
            'tilt_slide_left',
            'tilt_slide_right',
        ].indexOf(sectionData.sashType) === -1);

        const shouldDrawHandle = this.shouldDrawHandle(sectionData.sashType);
        const isSelected = (module.getState('selected:sash') === sectionData.id);
        let circleClip = {};
        let frameGroup;

        if (circleData) {
            if (isFlushType) {
                fill.x += frameWidth;
                fill.y += frameWidth;
                fill.width += frameWidth;
                fill.height += frameWidth;
            }

            const sashData = (function findSash(sectionId) {
                const section = model.getSection(sectionId);

                if (section && section.circular) {
                    return section;
                } else if (section && section.parentId) {
                    return findSash(section.parentId);
                }

                return null;
            }(sectionData.id));

            const sashCircleData = model.getCircleSashData(sashData.id);
            const pos = {
                x: sashCircleData.sashParams.x - sectionData.sashParams.x,
                y: sashCircleData.sashParams.y - sectionData.sashParams.y,
            };

            circleClip = {
                x: pos.x + 3,
                y: pos.y + 3,
                radius: sashCircleData.radius - 3,
            };
        }

        if (shouldDrawFilling) {
            const filling = this.createFilling(sectionData, {
                x: (circleData) ? fill.x - frameWidth : fill.x,
                y: (circleData) ? fill.y - frameWidth : fill.y,
                width: (circleData) ? fill.width + frameWidth : fill.width,
                height: (circleData) ? fill.height + frameWidth : fill.height,
            });

            if (circleData) {
                this.clipCircle(filling, circleClip);
            }

            group.add(filling);
        }

        if (shouldDrawBars) {
            const bars = this.createBars(sectionData, {
                x: fill.x,
                y: fill.y,
                width: fill.width,
                height: fill.height,
            });

            if (circleData) {
                this.clipCircle(bars, circleClip);
            }

            group.add(bars);
        }

        if (isFlushType && !hasSubSections) {
            const flushFrame = new Konva.Group();

            flushFrame.add(this.createFlushFrame({
                width: sectionData.sashParams.width,
                height: sectionData.sashParams.height,
                sectionId: sectionData.id,
            }));

            group.add(flushFrame);

            if (circleData) {
                this.clipCircle(flushFrame, circleClip);
            }
        }

        if (shouldDrawDirectionLine) {
            const directionLine = this.createDirectionLine(sectionData);

            // clip direction line inside filling
            if (circleData) {
                if (circleData.type === 'circle') {
                    this.clipCircle(directionLine, {
                        x: fill.x,
                        y: fill.y,
                        radius: circleData.radius - frameWidth,
                    });
                }

                if (circleData.type === 'arc') {
                    this.clipCircle(directionLine, {
                        x: (2 - sectionData.sashParams.x) + mainFrameWidth,
                        y: (2 - sectionData.sashParams.y) + mainFrameWidth,
                        radius: (circleData.radius + mainFrameWidth) - 4,
                    });
                }
            }

            group.add(directionLine);
        }

        if (sectionData.sashType !== 'fixed_in_frame') {
            if (circleData) {
                frameGroup = this.createCircleSashFrame({
                    frameWidth,
                    section: sectionData,
                    data: circleData,
                });
            } else {
                frameGroup = this.createFrame({
                    width: sectionData.sashParams.width,
                    height: sectionData.sashParams.height,
                    frameWidth,
                    sectionId: sectionData.id,
                });
            }

            group.add(frameGroup);
        }

        const sashList = model.getSashList();
        const index = _.findIndex(sashList, s => s.id === sectionData.id);

        if (index >= 0) {
            const indexes = this.createSectionIndexes(sectionData, { main: index, add: null });

            group.add(this.createIndexes(indexes));
        }

        if (shouldDrawHandle) {
            const handle = this.createHandle(sectionData, {
                frameWidth,
            });

            group.add(handle);
        }

        group = this.drawSlideDirection(sectionData, group);
        this.drawTiltSlideDirection(sectionData, group);

        if (isSelected) {
            const selection = this.createSelectionShape(sectionData, {
                x: fill.x,
                y: fill.y,
                width: fill.width,
                height: fill.height,
            });

            if (circleData) {
                this.clipCircle(selection, circleClip);
            }

            group.add(selection);
        }

        return group;
    },
    shouldDrawHandle(type) {
        let result = false;

        if (
            type !== 'fixed_in_frame' &&
            (
                type.indexOf('left') >= 0 ||
                type.indexOf('right') >= 0 ||
                type === 'tilt_only'
            ) &&
            (type.indexOf('_hinge_hidden_latch') === -1)
        ) {
            result = true;
        }

        // Draw handle if this type of sash has a handle
        return result;
    },
    createHandle(section, params) {
        const handle = new Konva.Group();
        const type = section.sashType;
        const offset = params.frameWidth / 2;
        const style = module.getStyle('handle');
        const isInsideView = module.getState('insideView');
        const isOutsideView = !isInsideView;
        const hasOutsideHandle = model.profile.hasOutsideHandle();
        const isEntryDoor = model.profile.isEntryDoor();
        const isVisible = isInsideView || (isOutsideView && hasOutsideHandle);
        const isInvisible = !isVisible;
        const pos = {
            x: null,
            y: null,
            rotation: 0,
            scale: { x: 1, y: 1 },
        };
        const positionLeft = () => {
            pos.x = offset + handle_data.base.rotationCenter.x;
            pos.y = (section.sashParams.height / 2) - handle_data.base.rotationCenter.y;
            pos.scale.x = -pos.scale.x;
        };
        const positionRight = () => {
            pos.x = section.sashParams.width - offset - handle_data.base.rotationCenter.x;
            pos.y = (section.sashParams.height / 2) - handle_data.base.rotationCenter.y;
        };
        const positionUnder = () => {
            const fixes = handle.getAttr('fixes') || [];
            handle.setAttrs({ fixes: fixes.concat('positionUnder') });
        };
        const positionOver = () => {
            const fixes = handle.getAttr('fixes') || [];
            handle.setAttrs({ fixes: fixes.concat('positionOver') });
        };
        const rotate = (angle) => { pos.rotation = angle; };
        const isLeftHandle = (type === 'tilt_turn_right' || type === 'turn_only_right' ||
            type === 'slide-right' || type === 'flush-turn-right' ||
            type === 'slide_left' || type === 'tilt_slide_left');
        const isRightHandle = (type === 'tilt_turn_left' || type === 'turn_only_left' ||
            type === 'slide-left' || type === 'flush-turn-left' ||
            type === 'slide_right' || type === 'tilt_slide_right');
        const isTiltSection = (type === 'tilt_only');

        if (isVisible) {
            positionOver();
        } else if (isInvisible) {
            positionUnder();
        }

        if (isLeftHandle) {
            positionLeft();
        } else if (isRightHandle || isTiltSection) {
            positionRight();
        }

        if (isEntryDoor) {
            rotate(90);
        } else {
            rotate(0);
        }

        // Create a group of 2 paths (stroke and backdrop) from SVG path data
        // If created paths are offset, use Inkscape's Save as -> Optimized SVG
        handle.setAttrs({
            name: 'handle',
            x: pos.x,
            y: pos.y,
            scale: pos.scale,
        });
        const handleBaseBg = new Konva.Path({
            name: 'handleBaseBg',
            fill: style.default.base.fill,
            data: handle_data.base.fill,
        });
        const handleBaseStroke = new Konva.Path({
            name: 'handleBaseStroke',
            stroke: style.default.base.stroke,
            strokeWidth: style.default.base.strokeWidth,
            data: handle_data.base.stroke,
        });
        const handleGripBg = new Konva.Path({
            name: 'handleGripBg',
            fill: style.default.grip.fill,
            data: handle_data.grip.fill,
            x: handle_data.base.rotationCenter.x,
            y: handle_data.base.rotationCenter.y,
            rotation: pos.rotation,
            offset: {
                x: handle_data.base.rotationCenter.x,
                y: handle_data.base.rotationCenter.y,
            },
        });
        const handleGripStroke = new Konva.Path({
            name: 'handleGripStroke',
            stroke: style.default.grip.stroke,
            strokeWidth: style.default.grip.strokeWidth,
            data: handle_data.grip.stroke,
            x: handle_data.base.rotationCenter.x,
            y: handle_data.base.rotationCenter.y,
            rotation: pos.rotation,
            offset: {
                x: handle_data.base.rotationCenter.x,
                y: handle_data.base.rotationCenter.y,
            },
        });

        handle.add(handleBaseBg, handleBaseStroke, handleGripBg, handleGripStroke);

        return handle;
    },
    applyHandleFixes() {
        const self = this;
        const style = module.getStyle('handle');
        const handleKonvas = this.layer.find('.handle');
        const vagueBaseStrokeThreshold = 0.25;
        const isPhantomJS = !!window._phantom;
        let dashCorrection;
        if (isPhantomJS) {
            dashCorrection = (ratio < vagueBaseStrokeThreshold) ? 0.75 * ratio : ratio;
        } else {
            dashCorrection = (ratio < vagueBaseStrokeThreshold) ? 0.75 : 1;
        }
        const handleBaseDashStyle = [
            (dashCorrection * style.under.base.dashLength) / ratio,
            (dashCorrection * style.under.base.dashGap) / ratio,
        ];
        const handleGripDashStyle = [
            (dashCorrection * style.under.grip.dashLength) / ratio,
            (dashCorrection * style.under.grip.dashGap) / ratio,
        ];

        // Calculations are in absolute (real pixel) coordinates, except clipping space
        handleKonvas.forEach((handleKonva) => {
            const handleBaseBg = handleKonva.findOne('.handleBaseBg');
            const handleBaseStroke = handleKonva.findOne('.handleBaseStroke');
            const handleGripBg = handleKonva.findOne('.handleGripBg');
            const handleGripStroke = handleKonva.findOne('.handleGripStroke');

            handleKonva.getAttr('fixes').forEach((fix) => {
                if (fix === 'positionOver') {
                    self.moveToSeparateLayer(handleKonva);
                } else if (fix === 'positionUnder') {
                    self.moveToSeparateLayer(handleKonva);
                    handleBaseStroke.moveToTop();
                    handleBaseStroke.dash(handleBaseDashStyle);
                    handleGripStroke.dash(handleGripDashStyle);
                    handleBaseStroke.setAttrs({ opacity: style.under.base.opacity });
                    handleGripStroke.setAttrs({ opacity: style.under.grip.opacity });
                    handleBaseBg.setAttrs({ opacity: style.under.base.backgroundOpacity });
                    handleGripBg.setAttrs({ opacity: style.under.grip.backgroundOpacity });
                }
            });
        });
    },
    moveToSeparateLayer(konva) {
        const transform = konva.getAbsoluteTransform().getMatrix();
        konva.moveTo(this.layer);
        konva.moveToTop();
        konva.scale({ x: transform[0], y: transform[3] });
        konva.position({ x: transform[4], y: transform[5] });
    },
    createDirectionLine(section) {
        const group = new Konva.Group({ name: 'direction' });
        const type = section.sashType;
        const style = module.getStyle('direction_line');
        const isAmericanHinge = module.getState('hingeIndicatorMode') === 'american';
        const isLeft = type.indexOf('left') !== -1;
        const isRight = type.indexOf('right') !== -1;
        const hasHiddenLatch = type.indexOf('_hinge_hidden_latch') !== -1;
        const isOpeningInward = model.isOpeningDirectionInward() && model.hasOperableSections();
        const isPhantomJS = !!window._phantom;
        const dashCorrection = (isPhantomJS) ? ratio : 1;
        const dashStyle = [
            (dashCorrection * style.dashLength) / ratio,
            (dashCorrection * style.dashGap) / ratio,
        ];
        const latchOffset = style.latchOffset / ratio;
        const glassWidth = section.glassParams.width;
        const glassHeight = section.glassParams.height;
        const groupX = section.glassParams.x - section.sashParams.x;
        const groupY = section.glassParams.y - section.sashParams.y;
        let hingeLine;

        // Set group content
        const directionLine = new Konva.Shape({
            stroke: style.stroke,
            sceneFunc(ctx) {
                ctx.beginPath();

                if (type.indexOf('right') >= 0 && (type.indexOf('slide') === -1)) {
                    ctx.moveTo(glassWidth, glassHeight);
                    ctx.lineTo(0, glassHeight / 2);
                    ctx.lineTo(glassWidth, 0);
                }

                if (type.indexOf('left') >= 0 && (type.indexOf('slide') === -1)) {
                    ctx.moveTo(0, 0);
                    ctx.lineTo(glassWidth, glassHeight / 2);
                    ctx.lineTo(0, glassHeight);
                }

                if (type.indexOf('tilt_turn_') >= 0 || type.indexOf('slide') >= 0 || type === 'tilt_only') {
                    ctx.moveTo(0, glassHeight);
                    ctx.lineTo(glassWidth / 2, 0);
                    ctx.lineTo(glassWidth, glassHeight);
                }

                if (type === 'tilt_only_top_hung') {
                    ctx.moveTo(0, 0);
                    ctx.lineTo(glassWidth / 2, glassHeight);
                    ctx.lineTo(glassWidth, 0);
                }

                ctx.strokeShape(this);
            },
        });

        if (isOpeningInward) {
            directionLine.dash(dashStyle);
        }

        if (hasHiddenLatch) {
            hingeLine = new Konva.Shape({
                stroke: style.stroke,
                sceneFunc(ctx) {
                    ctx.beginPath();

                    if (isLeft) {
                        ctx.moveTo(glassWidth - latchOffset, 0);
                        ctx.lineTo(glassWidth - latchOffset, glassHeight);
                    } else if (isRight) {
                        ctx.moveTo(latchOffset, 0);
                        ctx.lineTo(latchOffset, glassHeight);
                    }

                    ctx.strokeShape(this);
                },
            });
            hingeLine.dash(dashStyle);
        }

        // Set group attrs
        if (directionLine) {
            group.add(directionLine);
        }

        if (hingeLine) {
            group.add(hingeLine);
        }

        group.setAttrs({ x: groupX, y: groupY });

        // #192: Reverse hinge indicator for outside view
        if (isAmericanHinge) {
            group.scale({ x: -1, y: -1 });
            group.move({ x: glassWidth, y: glassHeight });
        }

        return group;
    },
    createSectionIndexes(mainSection, indexes) {
        const view = this;
        let result = [];

        indexes = indexes || {
            main: 0,
            add: null,
            parent: null,
        };

        // If section has children, create Indexes for them recursively
        if (mainSection.sections.length) {
            if (module.getState('insideView') && mainSection.divider === 'vertical') {
                mainSection.sections.reverse();
            }

            mainSection.sections.forEach((section) => {
                if (mainSection.sashType !== 'fixed_in_frame') {
                    indexes.parent = mainSection;
                }

                if (!section.sections.length) {
                    indexes.add += 1;
                }

                result = result.concat(view.createSectionIndexes(section, indexes));
            });

        // If section has no child sections, create Index for it
        } else {
            let text = (indexes.main + 1);
            let position = {
                x: (
                    mainSection.glassParams.x - mainSection.sashParams.x
                ),
                y: (
                    mainSection.glassParams.y - mainSection.sashParams.y
                ),
            };
            let size = {
                width: mainSection.glassParams.width,
                height: mainSection.glassParams.height,
            };

            if (indexes.add !== null) {
                text += `.${indexes.add}`;

                if (indexes.parent) {
                    position = {
                        x: (
                            mainSection.glassParams.x - indexes.parent.sashParams.x
                        ),
                        y: (
                            mainSection.glassParams.y - indexes.parent.sashParams.y
                        ),
                    };
                    size = {
                        width: size.width,
                        height: size.height,
                    };
                }
            }

            result.push({
                text,
                position,
                size,
                id: mainSection.id,
            });
        }

        return result;
    },
    createIndexes(indexes) {
        const group = new Konva.Group({ name: 'index' });

        indexes.forEach((section) => {
            const add = (module.get('debug') ? ` (${section.id})` : '');
            const opts = {
                width: section.size.width,
                text: section.text + add,
                listening: false,
            };
            _.extend(opts, module.getStyle('indexes'));
            opts.fontSize /= ratio;

            const number = new Konva.Text(opts);
            number.position(section.position);
            number.y((number.y() + (section.size.height / 2)) - (number.height() / 2));
            const minUnitDimension = Math.min(section.size.width, section.size.height);
            const hoverpadRadius = Math.min(INDEX_HOVERPAD_SIZE / ratio, minUnitDimension / 2);

            if (_.isNumber(hoverpadRadius) && hoverpadRadius > 0) {
                const hoverpad = new Konva.Circle({
                    id: `indexHoverPad-${section.id}`,
                    name: 'indexHoverPad',
                    sectionId: section.id,
                    x: number.x() + (section.size.width / 2),
                    y: number.y() + (number.height() / 2),
                    radius: hoverpadRadius,
                });

                group.add(hoverpad, number);
            }
        });

        return group;
    },
    createFilling(section, params) {
        const fillX = params.x;
        const fillY = params.y;
        const fillWidth = params.width;
        const fillHeight = params.height;
        const isLouver = section.fillingType === 'louver';
        const frameWidth = params.frameWidth || model.profile.get('frame_width');
        const style = module.getStyle('fillings');
        const group = new Konva.Group({ name: 'filling' });
        let opts;

        // Arched
        if (section.arched) {
            const arcPos = model.getArchedPosition();

            opts = {
                sectionId: section.id,
                x: fillX,
                y: fillY,
                fill: style.glass.fill,
                sceneFunc(ctx) {
                    ctx.beginPath();
                    ctx.moveTo(0, fillHeight);
                    ctx.lineTo(0, arcPos);
                    ctx.quadraticCurveTo(0, 0, fillWidth / 2, 0);
                    ctx.quadraticCurveTo(fillWidth, 0, fillWidth, arcPos);
                    ctx.lineTo(fillWidth, fillHeight);
                    ctx.clip();
                    ctx.closePath();

                    if (isLouver) {
                        drawLouver(ctx, { width: fillWidth, height: fillHeight, bladeWidth: style.louver.bladeWidth });
                    }

                    ctx.fillStrokeShape(this);
                },
            };

        // Circular
        } else if (section.circular || params.radius) {
            const radius = params.radius || section.radius - frameWidth;

            opts = {
                sectionId: section.id,
                x: fillX,
                y: fillY,
                fill: style.glass.fill,
                sceneFunc(ctx) {
                    ctx.beginPath();

                    if (radius > 0) {
                        ctx.arc(fillX + radius, fillY + radius, radius + frameWidth + 10, 0, 2 * Math.PI);
                    } else {
                        ctx.rect(0, 0, fillWidth, fillHeight);
                    }

                    if (isLouver) {
                        drawLouver(ctx, { width: radius * 2, height: radius * 2, bladeWidth: style.louver.bladeWidth });
                    }

                    ctx.fillStrokeShape(this);
                },
            };

        // Default
        } else {
            opts = {
                sectionId: section.id,
                x: fillX,
                y: fillY,
                width: fillWidth,
                height: fillHeight,
                fill: style.glass.fill,
                sceneFunc(ctx) {
                    ctx.beginPath();
                    ctx.rect(0, 0, this.width(), this.height());

                    if (isLouver) {
                        drawLouver(ctx, { width: this.width(), height: this.height(), bladeWidth: style.louver.bladeWidth });
                    }

                    ctx.fillStrokeShape(this);
                },
            };
        }

        // Draw filling
        const filling = new Konva.Shape(opts);

        // Special fillings
        if (isLouver) {
            filling.stroke(style.louver.stroke);
        }

        if (section.fillingType && section.fillingType !== 'glass') {
            filling.fill(style.others.fill);
        }

        group.add(filling);

        return group;
    },
    createBars(section, params) {
        const fillX = params.x;
        const fillY = params.y;
        const fillWidth = params.width;
        const fillHeight = params.height;

        const group = new Konva.Group({
            name: 'bars',
        });
        let bar;

        const hBarCount = section.bars.horizontal.length;
        const vBarCount = section.bars.vertical.length;
        const glazing_bar_width = model.get('glazing_bar_width');
        let data;
        let space;

        const style = module.getStyle('bars');

        let _from;
        let _to;
        let tbar;

        for (let i = 0; i < vBarCount; i += 1) {
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
                x: (fillX + space) - (glazing_bar_width / 2),
                y: _from,
                width: glazing_bar_width,
                height: _to - _from,
                fill: style.normal.fill,
                listening: false,
            });

            group.add(bar);
        }

        for (let i = 0; i < hBarCount; i += 1) {
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
                y: (fillY + space) - (glazing_bar_width / 2),
                width: _to - _from,
                height: glazing_bar_width,
                fill: style.normal.fill,
                listening: false,
            });

            group.add(bar);
        }

        return group;
    },
    // special shape on top of sash to hightlight selection
    // it is simple to draw shape with alpha on top
    // then change styles of selected object
    createSelectionShape(section, params) {
        const fillX = params.x;
        const fillY = params.y;
        const fillWidth = params.width;
        const fillHeight = params.height;
        const style = module.getStyle('selection');

        const group = new Konva.Group({
            name: 'selection',
        });
        let shape;

        if (section.arched) {
            // arched shape
            const arcPos = model.getArchedPosition();

            shape = new Konva.Shape({
                x: fillX,
                y: fillY,
                fill: style.fill,
                sceneFunc(ctx) {
                    ctx.beginPath();
                    ctx.moveTo(0, fillHeight);
                    ctx.lineTo(0, arcPos);
                    ctx.quadraticCurveTo(0, 0, fillWidth / 2, 0);
                    ctx.quadraticCurveTo(fillWidth, 0, fillWidth, arcPos);
                    ctx.lineTo(fillWidth, fillHeight);
                    ctx.closePath();
                    ctx.fillStrokeShape(this);
                },
            });
        } else if (section.circular) {
            // circular shape
            const radius = model.getCircleRadius();
            let frameWidth = model.profile.get('frame_width');

            if (section.sashType !== 'fixed_in_frame') {
                frameWidth /= 2;
            }

            shape = new Konva.Circle({
                x: radius - frameWidth,
                y: radius - frameWidth,
                radius: radius - frameWidth,
                fill: style.fill,
            });
        } else {
            // usual rect
            shape = new Konva.Rect({
                width: section.sashParams.width,
                height: section.sashParams.height,
                fill: style.fill,
            });
        }

        group.add(shape);

        return group;
    },
    getCircleSashDrawingOpts(params) {
        const opts = {};

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
            y: opts.radius - opts.mainFrameWidth,
        };
        // Search relative center point for drawing arc
        opts.arcCenter = vector2d.vectors_to_points([{ x: 0, y: 0 }], opts.center)[0];
        opts.arcCenter.x = (opts.arcCenter.x - params.section.sashParams.x) + opts.mainFrameWidth;
        opts.arcCenter.y = (opts.arcCenter.y - params.section.sashParams.y) + opts.mainFrameWidth;
        // Search inner and outer radius for sash
        opts.innerRadius = opts.radius - opts.mainFrameWidth - params.frameWidth;
        opts.outerRadius = opts.radius - opts.mainFrameWidth;

        return opts;
    },
});
