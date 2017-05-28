import _ from 'underscore';
import Backbone from 'backbone';
import Konva from '../konva-clip-patch';

import { geometry, vector2d, array } from '../../../../utils';
import handle_data from '../../data/handle-data';

const INDEX_HOVERPAD_SIZE = 15;

function drawLouver(context, model, options) {
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
        this._module = params.builder;

        this.layer = params.layer;
        this.stage = params.stage;

        this._model = this._module.get('model');
        this._ratio = this._module.get('ratio');
    },
    el() {
        const group = new Konva.Group();

        return group;
    },
    render() {
        this._ratio = this._module.get('ratio');

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
        'click .mainFrame': 'onMainFrameClick',
        'tap .mainFrame': 'onMainFrameClick',

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
    onMainFrameClick(event) {
        this.setSelection(event, 'unit', 'frame');
    },
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
        this._module.stopSectionMenuHover();
        this.setSelection(event, 'sash', 'filling');
    },
    onIndexHoverEnter(event) {
        this._module.startSectionMenuHover({ sectionId: event.target.getAttr('sectionId') });
    },
    onIndexHoverMove() {
        this._module.restartSectionMenuHover();
    },
    onIndexHoverLeave() {
        this._module.stopSectionMenuHover();
    },
    // Keyboards handlers
    onKeyDown(e) {
        const isRemove = e.key === 'Delete' || e.key === 'Backspace';
        const isNumeric = /^[0-9]$/.test(e.key);
        const selectedMullionId = this._module.getState('selected:mullion');
        const isMullionSelected = !!selectedMullionId;

        if (isRemove) {
            e.preventDefault();
            this.removeSelected();
        } else if (isNumeric && isMullionSelected) {
            this._module.trigger('mullionNumericInput', { mullionId: selectedMullionId });
        }
    },
    // Selections
    setSelection(event, type) {
        const origin = this.getSectionId(event.target);
        const topSashId = this._model.get('root_section').id;

        this.deselectAll();

        if (type === 'unit') {
            this._module.setState('selected:unit', 'frame');
            this._module.setState('selected:sash', topSashId);
        } else if (type === 'sash' && origin) {
            this._module.setState('selected:sash', origin.attrs.sectionId);
        } else if (type === 'mullion' && origin) {
            this._module.setState('selected:mullion', origin.attrs.sectionId);
        }
    },
    deselectAll(preventUpdate) {
        this._module.deselectAll(preventUpdate);
    },
    removeSelected() {
        const selectedMullionId = this._module.getState('selected:mullion');
        const selectedSashId = this._module.getState('selected:sash');

        if (selectedMullionId) {
            this._model.removeMullion(selectedMullionId);
        }

        if (selectedSashId) {
            this._model.removeSash(selectedSashId);
        }

        this.deselectAll();
    },
    // Create unit
    createUnit() {
        const group = this.el;
        const root = (this._module.getState('openingView')) ? this._model.generateFullRoot() : this._model.generateFullReversedRoot();

        group.add(this.createBack());

        const frameGroup = this.createMainFrame(root);
        const sectionGroup = this.createSectionGroup(root);

        group.add(frameGroup);
        group.add(sectionGroup);

        const center = this._module.get('center');
        // place unit on stage center
        group.position(center);

        if (!this._module.getState('openingView')) {
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
            this._model.profile.isThresholdPossible() &&
            this._model.profile.get('low_threshold');

        const isArchedWindow = this._model.isArchedWindow();
        const isCircleWindow = this._model.isCircleWindow();

        // create main frame
        if (isDoorFrame) {
            if (this._model.isTrapezoid()) {
                frameGroup = this.createDoorTrapezoidFrame({
                    name: 'mainFrame',
                    sectionId: root.id,
                    width: this._model.getInMetric('width', 'mm'),
                    height: this._model.getInMetric('height', 'mm'),
                    trapezoidHeights: this._model.getTrapezoidHeights(this._module.getState('insideView')),
                    maxHeight: this._model.getTrapezoidMaxHeight(),
                    trapezoidCorners: this._model.getMainTrapezoidInnerCorners(),
                    frameWidth: this._model.profile.get('frame_width'),
                });
            } else {
                frameGroup = this.createDoorFrame({
                    name: 'mainFrame',
                    sectionId: root.id,
                    width: this._model.getInMetric('width', 'mm'),
                    height: this._model.getInMetric('height', 'mm'),
                    frameWidth: this._model.profile.get('frame_width'),
                });
            }
        } else if (isArchedWindow) {
            frameGroup = this.createArchedFrame({
                name: 'mainFrame',
                sectionId: root.id,
                width: this._model.getInMetric('width', 'mm'),
                height: this._model.getInMetric('height', 'mm'),
                frameWidth: this._model.profile.get('frame_width'),
                archHeight: this._model.getArchedPosition(),
            });
        } else if (isCircleWindow) {
            frameGroup = this.createCircleFrame({
                name: 'mainFrame',
                sectionId: root.id,
                radius: this._model.getCircleRadius(),
                frameWidth: this._model.profile.get('frame_width'),
            });
        } else if (this._model.isTrapezoid()) {
            frameGroup = this.createTrapezoidFrame({
                name: 'mainFrame',
                sectionId: root.id,
                width: this._model.getInMetric('width', 'mm'),
                height: this._model.getInMetric('height', 'mm'),
                trapezoidHeights: this._model.getTrapezoidHeights(this._module.getState('insideView')),
                maxHeight: this._model.getTrapezoidMaxHeight(),
                trapezoidCorners: this._model.getMainTrapezoidInnerCorners(),
                frameWidth: this._model.profile.get('frame_width'),
            });
        } else {
            frameGroup = this.createFrame({
                name: 'mainFrame',
                sectionId: root.id,
                width: this._model.getInMetric('width', 'mm'),
                height: this._model.getInMetric('height', 'mm'),
                frameWidth: this._model.profile.get('frame_width'),
            });
        }

        frameGroup.scale({ x: this._ratio, y: this._ratio });
        group.add(frameGroup);

        return group;
    },
    createCircleSashFrame(params) {
        let group = new Konva.Group({ name: params.name || 'frame', sectionId: params.section.id });
        const section = params.section;
        const frameWidth = params.frameWidth; // in mm
        const data = params.data;

        if (data.type === 'rect') {
            // If this is a section that bordered with mullions from each side — it's a simple rectangular sash
            group = this.createFrame({
                name: params.name,
                width: section.sashParams.width,
                height: section.sashParams.height,
                frameWidth,
                sectionId: section.id,
            });
        } else if (data.type === 'circle') {
            // If there is no edges around — it's just a circle (sash inside root section)
            group = this.createCircleFrame({
                name: params.name,
                frameWidth,
                radius: data.radius,
                sectionId: section.id,
            });
        } else if (data.type === 'arc') {
            // Otherwise it's a sash inside one of children section, so this sash have an arc side
            group = this.createArchSashFrame({
                name: params.name,
                frameWidth,
                radius: data.radius,
                section,
            });
        }

        return group;
    },
    createArchSashFrame(params) {
        const group = new Konva.Group({ name: params.name || 'frame', sectionId: params.section.id });
        const style = this._module.getStyle('frame');
        const opts = this.getCircleSashDrawingOpts(params);

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
        const group = new Konva.Group({ name: params.name || 'frame', sectionId: params.sectionId });
        const frameWidth = params.frameWidth;  // in mm
        const width = params.width;
        const height = params.height;
        const isSelected = this._module.getState('selected:unit') === 'frame';
        const style = (isSelected) ? this._module.getStyle('frame').selected : this._module.getStyle('frame').default;

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
    createTrapezoidFrame(params) {
        const group = new Konva.Group({ name: 'frame', sectionId: params.sectionId });
        const frameWidth = params.frameWidth;
        const width = params.width;
        const trapezoidHeights = params.trapezoidHeights;
        const maxHeight = params.maxHeight;
        const isSelected = this._module.getState('selected:unit') === 'frame';
        const style = (isSelected) ? this._module.getStyle('frame').selected : this._module.getStyle('frame').default;

        const top = new Konva.Line({
            points: [
                0, maxHeight - trapezoidHeights.left,
                width, maxHeight - trapezoidHeights.right,
                params.trapezoidCorners.right.x, params.trapezoidCorners.right.y,
                params.trapezoidCorners.left.x, params.trapezoidCorners.left.y,
            ],
        });

        const left = new Konva.Line({
            points: [
                0, maxHeight - trapezoidHeights.left,
                params.trapezoidCorners.left.x, params.trapezoidCorners.left.y,
                frameWidth, maxHeight - frameWidth,
                0, maxHeight,
            ],
        });

        const bottom = new Konva.Line({
            points: [
                0, maxHeight,
                frameWidth, maxHeight - frameWidth,
                width - frameWidth, maxHeight - frameWidth,
                width, maxHeight,
            ],
        });

        const right = new Konva.Line({
            points: [
                width, maxHeight - trapezoidHeights.right,
                width, maxHeight,
                width - frameWidth, maxHeight - frameWidth,
                params.trapezoidCorners.right.x, params.trapezoidCorners.right.y,
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
    createInnerTrapezoidFrame(section, params) {
        const current_section = section;
        const frameWidth = params.frameWidth;
        const width = params.width;
        const height = params.height;
        const frameX = params.x;
        const frameY = params.y;
        const frameOffset = this._model.getFrameOffset();
        const innerCorners = this._model.getMainTrapezoidInnerCorners();
        const newLeftY = this._model.getLineCrossingX(frameX, innerCorners.left, innerCorners.right) - frameY;
        const newRightY = this._model.getLineCrossingX(frameX + width, innerCorners.left, innerCorners.right) - frameY;
        const maxHeight = height;

        const corners = this._model.getTrapezoidInnerCorners({
            heights: { left: height - newLeftY, right: height - newRightY },
            width,
            frameWidth,
            maxHeight: height,
        });

        const points = {
            inner: [
                { x: corners.left.x, y: corners.left.y - frameOffset },
                { x: corners.right.x, y: corners.right.y - frameOffset },
                { x: width - frameWidth, y: maxHeight - frameWidth },
                { x: frameWidth, y: maxHeight - frameWidth },
            ],
            outer: [
                { x: 0, y: newLeftY - frameOffset },
                { x: width, y: newRightY - frameOffset },
                { x: width, y: maxHeight },
                { x: 0, y: maxHeight },
            ],
        };

        if (!current_section.trapezoid) {
            current_section.trapezoid = {};
        }

        current_section.trapezoid.frame = points;

        const isSelected = this._module.getState('selected:sash') === 'filling';
        const style = (isSelected) ? this._module.getStyle('frame').selected : this._module.getStyle('frame').default;

        const group = new Konva.Group({
            name: 'frame',
            sectionId: params.sectionId,
        });

        const top = new Konva.Line({
            points: [
                points.outer[0].x, points.outer[0].y,
                points.outer[1].x, points.outer[1].y,
                points.inner[1].x, points.inner[1].y,
                points.inner[0].x, points.inner[0].y,
            ],
        });

        const left = new Konva.Line({
            points: [
                points.outer[0].x, points.outer[0].y,
                points.inner[0].x, points.inner[0].y,
                points.inner[3].x, points.inner[3].y,
                points.outer[3].x, points.outer[3].y,
            ],
        });

        const bottom = new Konva.Line({
            points: [
                points.inner[3].x, points.inner[3].y,
                points.inner[2].x, points.inner[2].y,
                points.outer[2].x, points.outer[2].y,
                points.outer[3].x, points.outer[3].y,
            ],
        });

        const right = new Konva.Line({
            points: [
                points.outer[1].x, points.outer[1].y,
                points.outer[2].x, points.outer[2].y,
                points.inner[2].x, points.inner[2].y,
                points.inner[1].x, points.inner[1].y,
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
        const section = params.section;
        const width = params.width;
        const height = params.height;
        const opts = {};
        const frameWidth = this._model.profile.get('frame_width');

        // Extend opts with styles
        _.extend(opts, this._module.getStyle('flush_frame'));
        // Extend with sizes and data
        _.extend(opts, {
            width,
            height,
            name: params.name || 'frame',
            sectionId: params.sectionId,
        });

        let rect;
        const corners = this._model.getMainTrapezoidInnerCorners();
        const crossing = {
            left: this._model.getLineCrossingX(section.sashParams.x, corners.left, corners.right),
            right: this._model.getLineCrossingX(
                section.sashParams.x + section.sashParams.width, corners.left, corners.right,
            ),
        };

        if (crossing.left > section.sashParams.y || crossing.right > section.sashParams.y) {
            if (section.sashParams.width >= section.glassParams.width) {
                opts.points = [
                    0, crossing.left - frameWidth,
                    width, crossing.right - frameWidth,
                    width, height,
                    0, height,
                ];
                opts.closed = true;
                rect = new Konva.Line(opts);
            } else {
                rect = new Konva.Rect(opts);
            }
        } else {
            rect = new Konva.Rect(opts);
        }

        return rect;
    },

    // door frame have special case for threshold drawing
    createDoorFrame(params) {
        const group = new Konva.Group({ name: params.name || 'frame' });
        const frameWidth = params.frameWidth;  // in mm
        const thresholdWidth = this._model.profile.get('threshold_width');
        const width = params.width;
        const height = params.height;
        const isSelected = this._module.getState('selected:unit') === 'frame';
        const style = {
            frame: (isSelected) ? this._module.getStyle('frame').selected : this._module.getStyle('frame').default,
            bottom: this._module.getStyle('door_bottom'),
        };

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
    createDoorTrapezoidFrame(params) {
        const group = new Konva.Group({ name: params.name || 'frame' });
        const frameWidth = params.frameWidth;  // in mm
        const thresholdWidth = this._model.profile.get('threshold_width');
        const width = params.width;
        const trapezoidHeights = params.trapezoidHeights;
        const maxHeight = params.maxHeight;
        const isSelected = this._module.getState('selected:unit') === 'frame';
        const style = {
            frame: (isSelected) ? this._module.getStyle('frame').selected : this._module.getStyle('frame').default,
            bottom: this._module.getStyle('door_bottom'),
        };

        const top = new Konva.Line({
            points: [
                0, maxHeight - trapezoidHeights.left,
                width, maxHeight - trapezoidHeights.right,
                params.trapezoidCorners.right.x, params.trapezoidCorners.right.y,
                params.trapezoidCorners.left.x, params.trapezoidCorners.left.y,
            ],
        });

        const left = new Konva.Line({
            points: [
                0, maxHeight - trapezoidHeights.left,
                params.trapezoidCorners.left.x, params.trapezoidCorners.left.y,
                frameWidth, maxHeight - thresholdWidth,
                0, maxHeight - thresholdWidth,
            ],
        });

        const right = new Konva.Line({
            points: [
                width, maxHeight - trapezoidHeights.right,
                width, maxHeight - thresholdWidth,
                width - frameWidth, maxHeight - thresholdWidth,
                params.trapezoidCorners.right.x, params.trapezoidCorners.right.y,
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
                0, maxHeight - thresholdWidth,
                width, maxHeight - thresholdWidth,
                width, maxHeight,
                0, maxHeight,
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
        const group = new Konva.Group({ name: params.name || 'frame' });
        const frameWidth = params.frameWidth;
        const width = params.width;
        const height = params.height;
        const archHeight = params.archHeight;

        const isSelected = this._module.getState('selected:unit') === 'frame';
        const style = (isSelected) ? this._module.getStyle('frame').selected : this._module.getStyle('frame').default;

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
        const current_root = this._model.generateFullRoot();
        const current_params = _.defaults(params || {}, {
            x: 0,
            y: 0,
            radius: current_root.radius,
        });

        if (current_root.circular && current_params.radius > 0) {
            group.clipType('circle');
            group.clipX(current_params.x - 2);
            group.clipY(current_params.y - 2);
            group.clipRadius(current_params.radius + 2);
        }
    },
    createCircleFrame(params) {
        const group = new Konva.Group({ name: params.name || 'frame', sectionId: params.sectionId });
        const frameWidth = params.frameWidth;
        const radius = params.radius;
        const style = this._module.getStyle('frame');

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

        const radius = this._model.getCircleRadius();
        const frameWidth = this._model.profile.get('frame_width');

        // Reverse sections array to sorting from the deepest children
        // To make parent mullions lays over children sashes
        // if (!this._module.getState('openingView')) { comment when fix bug width different mullions width
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
                if (input.attrs.name === 'mullion' && drawer._model.isCircleWindow()) {
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
        sectionsGroup.scale({ x: this._ratio, y: this._ratio });

        // Clip a whole unit
        if (this._model.isCircleWindow()) {
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
                'mainFrame',
                'selection',
                'handle',
                'index',
            ];

            // Get section data
            const section = this._model.getSection(group.attrs.sectionId);
            // Make some correction in sorting order if section has...
            if (
                (section.fillingType === 'interior-flush-panel' && this._module.getState('openingView')) ||
                (section.fillingType === 'exterior-flush-panel' && !this._module.getState('openingView')) ||
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
            if (this._module.getState('openingView')) {
                objects.push(mullion);
            }

            // draw each child section
            rootSection.sections.forEach((sectionData) => {
                level = level.concat(this.createSectionsTree(sectionData));
            });

            level.push(sash);
            objects.push(level);

            // fix bug width different mullion width
            if (!this._module.getState('openingView')) {
                objects.push(mullion);
            }
        } else {
            objects.push(sash);
        }

        return objects;
    },
    createMullion(section) {
        const style = this._module.getStyle('mullions');
        const fillStyle = this._module.getStyle('fillings');
        const group = new Konva.Group({
            id: `mullion-${section.id}`,
            name: 'mullion',
            sectionId: section.id,
        });
        const params = section.mullionParams;
        const crossing = {
            left: this._model.getTrapezoidCrossing(
                { x: params.x, y: params.y },
                { x: params.x, y: params.y + params.height },
            ),
            right: this._model.getTrapezoidCrossing(
                { x: params.x + params.width, y: params.y },
                { x: params.x + params.width, y: params.y + params.height },
            ),
        };

        let mullion;

        if (!crossing.left && !crossing.right) {
            mullion = new Konva.Rect({
                sectionId: section.id,
                stroke: style.default.stroke,
                fill: style.default.fill,
                strokeWidth: style.default.strokeWidth,
            });
            mullion.setAttrs(section.mullionParams);
        } else {
            let points = [
                params.x, crossing.left.y,
                params.x + params.width, crossing.right.y,
                params.x + params.width, params.y + params.height,
                params.x, params.y + params.height,
            ];

            if (section.trapezoid && section.trapezoid.frame) {
                const inner = section.trapezoid.frame.inner;
                const topCrossing = {
                    left: this._model.getLineCrossingX(
                        params.x,
                        { x: inner[0].x + section.sashParams.x, y: inner[0].y + section.sashParams.y },
                        { x: inner[1].x + section.sashParams.x, y: inner[1].y + section.sashParams.y },
                    ),
                    right: this._model.getLineCrossingX(
                        params.x + params.width,
                        { x: inner[0].x + section.sashParams.x, y: inner[0].y + section.sashParams.y },
                        { x: inner[1].x + section.sashParams.x, y: inner[1].y + section.sashParams.y },
                    ),
                };

                points = [
                    params.x, topCrossing.left,
                    params.x + params.width, topCrossing.right,
                    params.x + params.width, params.y + params.height,
                    params.x, params.y + params.height,
                ];
            }

            mullion = new Konva.Line({
                points,
                sectionId: section.id,
                stroke: style.default.stroke,
                fill: style.default.fill,
                strokeWidth: style.default.strokeWidth,
                closed: true,
            });
        }

        const isVerticalInvisible = (
            section.divider === 'vertical_invisible'
        );
        const isHorizontalInvisible = (
            section.divider === 'horizontal_invisible'
        );
        const isSelected = this._module.getState('selected:mullion') === section.id;

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
        if (['slide_left', 'slide_right'].indexOf(sectionData.sashType) === -1) { return group; }
        const ratio = this._ratio;
        const [sashWidth, sashHeight] = [sectionData.sashParams.width, sectionData.sashParams.height];
        const [glassWidth, glassHeight] = [sectionData.glassParams.width, sectionData.glassParams.height];

        const [sashCenterX, sashCenterY] = [sashWidth / 2, sashHeight / 2];
        const directionSign = (sectionData.sashType.split('_').pop() === 'left') ? 1 : -1;
        const maxArrowScreenSize = 60 / ratio;
        const maxArrowWidth = Math.min(0.4 * glassWidth, maxArrowScreenSize);
        const maxArrowHeight = Math.min(0.5 * glassHeight, maxArrowScreenSize);
        const arrowWidth = Math.min(maxArrowWidth, maxArrowHeight);
        const arrowHeight = Math.min(maxArrowWidth, maxArrowHeight);
        const [offsetX, offsetY] = [arrowWidth / 2, arrowHeight / 2];
        const [originX, originY] = [sashCenterX - (directionSign * offsetX), sashCenterY + offsetY];
        const arrowParams = {
            points: [
                originX, originY,
                originX, originY - arrowHeight,
                originX + (directionSign * arrowWidth), originY - arrowHeight,
            ],
            pointerLength: 2 / ratio,
            pointerWidth: 2 / ratio,
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
        if (['tilt_slide_left', 'tilt_slide_right'].indexOf(sectionData.sashType) === -1) { return group; }
        const ratio = this._ratio;
        const [sashWidth, sashHeight] = [sectionData.sashParams.width, sectionData.sashParams.height];
        const [glassWidth, glassHeight] = [sectionData.glassParams.width, sectionData.glassParams.height];

        const [sashCenterX, sashCenterY] = [sashWidth / 2, sashHeight / 2];
        const directionSign = (sectionData.sashType.split('_').pop() === 'left') ? 1 : -1;
        const maxArrowScreenSize = 100 / ratio;
        const maxArrowAspectRatio = 1.25;
        const maxArrowWidth = Math.min(0.4 * glassWidth, maxArrowScreenSize);
        const maxArrowHeight = Math.min(0.33 * glassHeight, maxArrowScreenSize);
        let [arrowWidth, arrowHeight] = [maxArrowWidth, maxArrowHeight];
        if (arrowWidth / arrowHeight >= maxArrowAspectRatio) {
            arrowWidth = arrowHeight * maxArrowAspectRatio;
        } else if (arrowHeight / arrowWidth >= maxArrowAspectRatio) {
            arrowHeight = arrowWidth * maxArrowAspectRatio;
        }
        const doFixIndexOverlapping = arrowHeight * ratio < 30;
        const [offsetX, offsetY] = [arrowWidth / 3, doFixIndexOverlapping ? 0 : 8 / ratio];
        const [originX, originY] = [sashCenterX - (directionSign * offsetX), sashCenterY + offsetY];
        const arrowParams = {
            points: [
                originX, originY,
                originX + (directionSign * 0.33 * arrowWidth), originY - arrowHeight,
                originX + (directionSign * 0.66 * arrowWidth), originY,
                originX + (directionSign * 1 * arrowWidth), originY,
            ],
            pointerLength: 2 / ratio,
            pointerWidth: 2 / ratio,
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
        const model = this._model;
        let group = new Konva.Group({
            x: sectionData.sashParams.x,
            y: sectionData.sashParams.y,
            name: 'sash',
            sectionId: sectionData.id,
        });

        const circleData = (this._model.isCircleWindow()) ? this._model.getCircleSashData(sectionData.id) : null;
        const hasFrame = (sectionData.sashType !== 'fixed_in_frame');
        const frameWidth = hasFrame ? this._model.profile.get('sash_frame_width') : 0;
        const mainFrameWidth = this._model.profile.get('frame_width') / 2;
        const fill = {};

        if (
            _.includes(['full-flush-panel', 'exterior-flush-panel'], sectionData.fillingType) &&
            !this._module.getState('openingView')
        ) {
            fill.x = sectionData.openingParams.x - sectionData.sashParams.x;
            fill.y = sectionData.openingParams.y - sectionData.sashParams.y;
            fill.width = sectionData.openingParams.width;
            fill.height = sectionData.openingParams.height;
        } else if (
            _.includes(['full-flush-panel', 'interior-flush-panel'], sectionData.fillingType) &&
            this._module.getState('openingView')
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

        const shouldDrawFilling = !hasSubSections && !isFlushType;

        const shouldDrawBars = (shouldDrawFilling && !sectionData.fillingType) || sectionData.fillingType === 'glass';

        const shouldDrawDirectionLine = ([
            'fixed_in_frame',
            'slide_left',
            'slide_right',
            'tilt_slide_left',
            'tilt_slide_right',
        ].indexOf(sectionData.sashType) === -1);

        const shouldDrawHandle = this.shouldDrawHandle(sectionData.sashType);
        const isSelected = (this._module.getState('selected:sash') === sectionData.id);
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

            const sashCircleData = this._model.getCircleSashData(sashData.id);
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
                wrapper: {
                    x: sectionData.sashParams.x,
                    y: sectionData.sashParams.y,
                },
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
                section: sectionData,
                width: sectionData.sashParams.width,
                height: sectionData.sashParams.height,
                sectionId: sectionData.id,
                x: fill.x,
                y: fill.y,
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
                const params = sectionData.sashParams;
                const innerCorners = this._model.getMainTrapezoidInnerCorners();

                if (params.y < innerCorners.left.y || params.y < innerCorners.right.y) {
                    frameGroup = this.createInnerTrapezoidFrame(sectionData, {
                        width: sectionData.sashParams.width,
                        height: sectionData.sashParams.height,
                        x: params.x,
                        y: params.y,
                        frameWidth,
                        sectionId: sectionData.id,
                    });
                } else {
                    frameGroup = this.createFrame({
                        width: sectionData.sashParams.width,
                        height: sectionData.sashParams.height,
                        frameWidth,
                        sectionId: sectionData.id,
                    });
                }
            }

            group.add(frameGroup);
        }

        const sashList = this._model.getSashList();
        const index = _.findIndex(sashList, s => s.id === sectionData.id);

        if (this._module.getState('drawIndexes') && index >= 0) {
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
                wrapper: {
                    x: sectionData.sashParams.x,
                    y: sectionData.sashParams.y,
                },
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
        const style = this._module.getStyle('handle');
        const isInsideView = this._module.getState('insideView');
        const isOutsideView = !isInsideView;
        const hasOutsideHandle = this._model.profile.hasOutsideHandle();
        const isEntryDoor = this._model.profile.isEntryDoor();
        const isVisible = isInsideView || (isOutsideView && hasOutsideHandle);
        const isInvisible = !isVisible;
        const pos = {
            x: null,
            y: null,
            baseRotation: 0,
            gripRotation: 0,
            scale: { x: 1, y: 1 },
        };
        const positionLeft = () => {
            pos.x = offset + handle_data.base.rotationCenter.x;
            if (section.trapezoid && section.trapezoid.frame) {
                pos.y = (section.trapezoid.frame.outer[0].y +
                    ((section.trapezoid.frame.outer[3].y - section.trapezoid.frame.outer[0].y) / 2)) -
                    handle_data.base.rotationCenter.y;
            } else {
                pos.y = (section.sashParams.height / 2) - handle_data.base.rotationCenter.y;
            }
            pos.scale.x = -pos.scale.x;
        };
        const positionRight = () => {
            pos.x = section.sashParams.width - offset - handle_data.base.rotationCenter.x;
            if (section.trapezoid && section.trapezoid.frame) {
                pos.y =
                    (
                        section.trapezoid.frame.outer[1].y +
                        ((section.trapezoid.frame.outer[2].y - section.trapezoid.frame.outer[1].y) / 2)
                    ) - handle_data.base.rotationCenter.y;
            } else {
                pos.y = (section.sashParams.height / 2) - handle_data.base.rotationCenter.y;
            }
        };
        const positionTop = () => {
            pos.x = (section.sashParams.width / 2) - handle_data.base.rotationCenter.x;
            pos.y = (section.trapezoid && section.trapezoid.frame)
                ? ((Math.abs(section.trapezoid.frame.outer[0].y - section.trapezoid.frame.outer[1].y) / 2)
                + offset
                + (
                    (section.trapezoid.frame.outer[0].y > section.trapezoid.frame.outer[1].y)
                        ? section.trapezoid.frame.outer[1].y :
                        section.trapezoid.frame.outer[0].y
                ))
                - handle_data.base.rotationCenter.y
                : offset - handle_data.base.rotationCenter.y;
        };
        const positionUnder = () => {
            const fixes = handle.getAttr('fixes') || [];
            handle.setAttrs({ fixes: fixes.concat('positionUnder') });
        };
        const positionOver = () => {
            const fixes = handle.getAttr('fixes') || [];
            handle.setAttrs({ fixes: fixes.concat('positionOver') });
        };
        const rotateBase = (angle) => { pos.baseRotation = angle; };
        const rotateGrip = (angle) => { pos.gripRotation = angle; };
        const getFrameAngle = () => {
            let angle;
            if (section.trapezoid && section.trapezoid.frame) {
                const [bottomX, bottomY] = [section.trapezoid.frame.outer[0].x, section.trapezoid.frame.outer[0].y];
                const [topX, topY] = [section.trapezoid.frame.outer[1].x, section.trapezoid.frame.outer[1].y];
                const sidesRatio = (bottomY - topY) / (topX - bottomX);
                angle = 90 - ((Math.atan(sidesRatio) * 180) / Math.PI);
            } else {
                angle = 90;
            }
            return angle;
        };
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
        } else if (isRightHandle) {
            positionRight();
        } else if (isTiltSection) {
            positionTop();
        }

        if (isEntryDoor && !isTiltSection) {
            rotateBase(0);
            rotateGrip(90);
        } else if (isTiltSection && isOutsideView) {
            rotateBase(getFrameAngle());
            rotateGrip(getFrameAngle());
        } else if (isTiltSection && isInsideView) {
            rotateBase(getFrameAngle() - 180);
            rotateGrip(getFrameAngle() - 180);
        } else {
            rotateBase(0);
            rotateGrip(0);
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
            x: handle_data.base.rotationCenter.x,
            y: handle_data.base.rotationCenter.y,
            rotation: pos.baseRotation,
            offset: {
                x: handle_data.base.rotationCenter.x,
                y: handle_data.base.rotationCenter.y,
            },
        });
        const handleBaseStroke = new Konva.Path({
            name: 'handleBaseStroke',
            stroke: style.default.base.stroke,
            strokeWidth: style.default.base.strokeWidth,
            data: handle_data.base.stroke,
            x: handle_data.base.rotationCenter.x,
            y: handle_data.base.rotationCenter.y,
            rotation: pos.baseRotation,
            offset: {
                x: handle_data.base.rotationCenter.x,
                y: handle_data.base.rotationCenter.y,
            },
        });
        const handleGripBg = new Konva.Path({
            name: 'handleGripBg',
            fill: style.default.grip.fill,
            data: handle_data.grip.fill,
            x: handle_data.base.rotationCenter.x,
            y: handle_data.base.rotationCenter.y,
            rotation: pos.gripRotation,
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
            rotation: pos.gripRotation,
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
        const style = this._module.getStyle('handle');
        const handleKonvas = this.layer.find('.handle');
        const vagueBaseStrokeThreshold = 0.25;
        const isPhantomJS = !!window._phantom;
        let dashCorrection;

        if (isPhantomJS) {
            dashCorrection = (this._ratio < vagueBaseStrokeThreshold) ? 0.75 * this._ratio : this._ratio;
        } else {
            dashCorrection = (this._ratio < vagueBaseStrokeThreshold) ? 0.75 : 1;
        }

        const handleBaseDashStyle = [
            (dashCorrection * style.under.base.dashLength) / this._ratio,
            (dashCorrection * style.under.base.dashGap) / this._ratio,
        ];
        const handleGripDashStyle = [
            (dashCorrection * style.under.grip.dashLength) / this._ratio,
            (dashCorrection * style.under.grip.dashGap) / this._ratio,
        ];

        // Calculations are in absolute (real pixel) coordinates, except clipping space
        handleKonvas.forEach((handleKonva) => {
            const handleBaseBg = handleKonva.findOne('.handleBaseBg');
            const handleBaseStroke = handleKonva.findOne('.handleBaseStroke');
            const handleGripBg = handleKonva.findOne('.handleGripBg');
            const handleGripStroke = handleKonva.findOne('.handleGripStroke');

            handleKonva.getAttr('fixes').forEach((fix) => {
                if (fix === 'positionOver') {
                    self.moveToSeparateContainer(handleKonva);
                } else if (fix === 'positionUnder') {
                    self.moveToSeparateContainer(handleKonva);
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
    moveToSeparateContainer(konva) {
        const targetContainer = this.layer.getChildren()[0];
        const [containerOffsetX, containerOffsetY] = [targetContainer.x(), targetContainer.y()];
        const [scaleX, , , scaleY, offsetX, offsetY] = konva.getAbsoluteTransform().getMatrix();

        konva.moveTo(targetContainer);
        konva.moveToTop();
        konva.scale({ x: scaleX, y: scaleY });
        konva.position({ x: offsetX - containerOffsetX, y: offsetY - containerOffsetY });
    },
    createDirectionLine(section) {
        const model = this._model;
        const group = new Konva.Group({ name: 'direction' });
        const type = section.sashType;
        const style = this._module.getStyle('direction_line');
        const isAmericanHinge = this._module.getState('hingeIndicatorMode') === 'american';
        const isEuropeanHinge = this._module.getState('hingeIndicatorMode') === 'european';
        const isLeft = type.indexOf('left') !== -1;
        const isRight = type.indexOf('right') !== -1;
        const hasHiddenLatch = type.indexOf('_hinge_hidden_latch') !== -1;
        const isOpeningInward = this._model.isOpeningDirectionInward() && this._model.hasOperableSections();
        const isPhantomJS = !!window._phantom;
        const dashCorrection = (isPhantomJS) ? this._ratio : 1;
        const dashStyle = [
            (dashCorrection * style.dashLength) / this._ratio,
            (dashCorrection * style.dashGap) / this._ratio,
        ];
        const latchOffset = style.latchOffset / this._ratio;
        const glassWidth = section.glassParams.width;
        const glassHeight = section.glassParams.height;
        const groupX = section.glassParams.x - section.sashParams.x;
        const groupY = section.glassParams.y - section.sashParams.y;
        let hingeLine;
        let isTrapezoid = false;

        // Set group content
        const directionLine = new Konva.Shape({
            stroke: style.stroke,
            sceneFunc(ctx) {
                ctx.beginPath();

                if (section.trapezoid && section.trapezoid.frame) {
                    isTrapezoid = true;
                    const sashFrameWidth = model.profile.get('sash_frame_width');
                    const corners = [
                        section.trapezoid.frame.inner[0].y - sashFrameWidth,
                        section.trapezoid.frame.inner[1].y - sashFrameWidth,
                    ];

                    if (type.indexOf('right') >= 0 && (type.indexOf('slide') === -1)) {
                        if (isAmericanHinge) {
                            ctx.moveTo(glassWidth, 0);
                            ctx.lineTo(0, (glassHeight - corners[1]) / 2);
                            ctx.lineTo(glassWidth, glassHeight - corners[0]);
                        } else {
                            ctx.moveTo(glassWidth, corners[1]);
                            ctx.lineTo(0, ((glassHeight - corners[0]) / 2) + corners[0]);
                            ctx.lineTo(glassWidth, glassHeight);
                        }
                    }

                    if (type.indexOf('left') >= 0 && (type.indexOf('slide') === -1)) {
                        if (isAmericanHinge) {
                            ctx.moveTo(0, 0);
                            ctx.lineTo(glassWidth, (glassHeight - corners[0]) / 2);
                            ctx.lineTo(0, glassHeight - corners[1]);
                        } else {
                            ctx.moveTo(0, corners[0]);
                            ctx.lineTo(glassWidth, ((glassHeight - corners[1]) / 2) + corners[1]);
                            ctx.lineTo(0, glassHeight);
                        }
                    }

                    if (type.indexOf('tilt_turn_') >= 0 || type.indexOf('slide') >= 0 || type === 'tilt_only') {
                        if (isAmericanHinge) {
                            ctx.moveTo(0, glassHeight - corners[1]);
                            ctx.lineTo(glassWidth / 2, 0);
                            ctx.lineTo(glassWidth, glassHeight - corners[0]);
                        } else {
                            ctx.moveTo(0, glassHeight);
                            ctx.lineTo(glassWidth / 2,
                                (((corners[1] > corners[0]) ? corners[0] : corners[1]) +
                                (Math.abs(corners[1] - corners[0]) / 2)),
                            );
                            ctx.lineTo(glassWidth, glassHeight);
                        }
                    }

                    // if (type === 'tilt_only_top_hung') {
                    //     ctx.moveTo(0, 0);
                    //     ctx.lineTo(width / 2, height);
                    //     ctx.lineTo(width, 0);
                    // }
                } else {
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
                    const isSashFramedTrapezoid = section.trapezoid && section.trapezoid.frame;
                    const sashFrameWidth = model.profile.get('sash_frame_width');
                    const leftCornerOffsetY = (isSashFramedTrapezoid) ? section.trapezoid.frame.inner[0].y - sashFrameWidth : 0;
                    const rightCornerOffsetY = (isSashFramedTrapezoid) ? section.trapezoid.frame.inner[1].y - sashFrameWidth : 0;

                    ctx.beginPath();

                    if (isAmericanHinge && isLeft) {
                        ctx.moveTo(glassWidth - latchOffset, 0);
                        ctx.lineTo(glassWidth - latchOffset, glassHeight - leftCornerOffsetY);
                    } else if (isAmericanHinge && isRight) {
                        ctx.moveTo(latchOffset, 0);
                        ctx.lineTo(latchOffset, glassHeight - rightCornerOffsetY);
                    } else if (isEuropeanHinge && isLeft) {
                        ctx.moveTo(glassWidth - latchOffset, rightCornerOffsetY);
                        ctx.lineTo(glassWidth - latchOffset, glassHeight);
                    } else if (isEuropeanHinge && isRight) {
                        ctx.moveTo(latchOffset, leftCornerOffsetY);
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
        if (isAmericanHinge && !isTrapezoid) {
            group.scale({ x: -1, y: -1 });
            group.move({ x: glassWidth, y: glassHeight });
        }

        return group;
    },
    createSectionIndexes(mainSection, indexes) {
        const view = this;
        const current_indexes = indexes || {
            main: 0,
            add: null,
            parent: null,
        };
        let result = [];

        // If section has children, create Indexes for them recursively
        if (mainSection.sections.length) {
            if (this._module.getState('insideView') && mainSection.divider === 'vertical') {
                mainSection.sections.reverse();
            }

            mainSection.sections.forEach((section) => {
                if (mainSection.sashType !== 'fixed_in_frame') {
                    current_indexes.parent = mainSection;
                }

                if (!section.sections.length) {
                    current_indexes.add += 1;
                }

                result = result.concat(view.createSectionIndexes(section, current_indexes));
            });

        // If section has no child sections, create Index for it
        } else {
            let text = (current_indexes.main + 1);
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

            if (current_indexes.add !== null) {
                text += `.${current_indexes.add}`;

                if (current_indexes.parent) {
                    position = {
                        x: (
                            mainSection.glassParams.x - current_indexes.parent.sashParams.x
                        ),
                        y: (
                            mainSection.glassParams.y - current_indexes.parent.sashParams.y
                        ),
                    };
                    size = {
                        width: size.width,
                        height: size.height,
                    };
                }
            }

            const glassParams = mainSection.glassParams;
            const crossing = {
                left: this._model.getTrapezoidCrossing(
                    { x: glassParams.x, y: glassParams.y },
                    { x: glassParams.x, y: glassParams.y + glassParams.height },
                ),
                right: this._model.getTrapezoidCrossing(
                    { x: glassParams.x + glassParams.width, y: glassParams.y },
                    { x: glassParams.x + glassParams.width, y: glassParams.y + glassParams.height },
                ),
            };

            if (crossing.left && crossing.right) {
                let diff = (crossing.left.y > crossing.right.y) ?
                    crossing.left.y - ((crossing.left.y - crossing.right.y) / 2) :
                    crossing.right.y - ((crossing.right.y - crossing.left.y) / 2);

                diff -= glassParams.y;

                if (diff > 0) {
                    size.height -= diff;
                    position.y += diff;
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
            const add = (this._module.get('debug') ? ` (${section.id})` : '');
            const opts = {
                width: section.size.width,
                text: section.text + add,
                listening: false,
            };

            _.extend(opts, this._module.getStyle('indexes'));
            opts.fontSize /= this._ratio;

            const number = new Konva.Text(opts);
            number.position(section.position);
            number.y((number.y() + (section.size.height / 2)) - (number.height() / 2));
            const minUnitDimension = Math.min(section.size.width, section.size.height);
            const hoverpadRadius = Math.min(INDEX_HOVERPAD_SIZE / this._ratio, minUnitDimension / 2);

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
        const current_section = section;
        const model = this._model;
        const fillX = params.x;
        const fillY = params.y;
        const fillWidth = params.width;
        const fillHeight = params.height;
        const wrapper = params.wrapper;
        const isLouver = current_section.fillingType === 'louver';
        const frameWidth = params.frameWidth || this._model.profile.get('frame_width');
        const style = this._module.getStyle('fillings');
        const group = new Konva.Group({ name: 'filling' });
        let crossing = {
            left: this._model.getTrapezoidCrossing(
                { x: wrapper.x, y: wrapper.y },
                { x: wrapper.x, y: wrapper.y + fillHeight },
            ),
            right: this._model.getTrapezoidCrossing(
                { x: wrapper.x + fillWidth, y: wrapper.y },
                { x: wrapper.x + fillWidth, y: wrapper.y + fillHeight },
            ),
        };
        let opts;
        let points;

        // Arched
        if (current_section.arched) {
            const arcPos = this._model.getArchedPosition();

            opts = {
                sectionId: current_section.id,
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
                        drawLouver(ctx, model, { width: fillWidth, height: fillHeight, bladeWidth: style.louver.bladeWidth });
                    }

                    ctx.fillStrokeShape(this);
                },
            };

        // Circular
        } else if (current_section.circular || params.radius) {
            const radius = params.radius || current_section.radius - frameWidth;

            opts = {
                sectionId: current_section.id,
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
                        drawLouver(ctx, model, { width: radius * 2, height: radius * 2, bladeWidth: style.louver.bladeWidth });
                    }

                    ctx.fillStrokeShape(this);
                },
            };

        // Default
        } else if (!crossing.left && !crossing.right) {
            opts = {
                sectionId: current_section.id,
                x: fillX,
                y: fillY,
                width: fillWidth,
                height: fillHeight,
                fill: style.glass.fill,
                sceneFunc(ctx) {
                    ctx.beginPath();
                    ctx.rect(0, 0, this.width(), this.height());

                    if (isLouver) {
                        drawLouver(ctx, model, { width: fillWidth, height: fillHeight, bladeWidth: style.louver.bladeWidth });
                    }

                    ctx.fillStrokeShape(this);
                },
            };
        } else if (current_section.sashType === 'fixed_in_frame') {
            let emptyCrossing = '';

            if (!crossing.left || !crossing.right) {
                emptyCrossing = !crossing.left ? 'left' : 'right';
            }

            if (emptyCrossing) {
                const innerCorners = this._model.getMainTrapezoidInnerCorners();

                crossing[emptyCrossing] = {
                    x: (emptyCrossing === 'left') ? 0 : fillWidth,
                    y: this._model.getLineCrossingX(
                        ((emptyCrossing === 'left') ? wrapper.x : wrapper.x + fillWidth),
                        { x: innerCorners.left.x, y: innerCorners.left.y },
                        { x: innerCorners.right.x, y: innerCorners.right.y },
                    ),
                };
            }

            if (!current_section.trapezoid) {
                current_section.trapezoid = {};
            }

            current_section.trapezoid.glass = [
                { x: 0, y: crossing.left.y - wrapper.y },
                { x: fillWidth, y: crossing.right.y - wrapper.y },
                { x: fillWidth, y: fillHeight },
                { x: 0, y: fillHeight },
            ];
            points = current_section.trapezoid.glass;

            opts = {
                sectionId: current_section.id,
                x: fillX,
                y: fillY,
                width: fillWidth,
                height: fillHeight,
                fill: style.glass.fill,
                sceneFunc(ctx) {
                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);
                    ctx.lineTo(points[1].x, points[1].y);
                    ctx.lineTo(points[2].x, points[2].y);
                    ctx.lineTo(points[3].x, points[3].y);
                    ctx.closePath();

                    if (isLouver) {
                        drawLouver(ctx, model, {
                            width: this.width(),
                            height: this.height(),
                            bladeWidth: style.louver.bladeWidth,
                            points,
                        });
                    }

                    ctx.fillStrokeShape(this);
                },
            };
        } else {
            crossing = {
                left: this._model.getTrapezoidCrossing(
                    { x: wrapper.x + fillX, y: 0 },
                    { x: wrapper.x + fillX, y: fillHeight },
                ),
                right: this._model.getTrapezoidCrossing(
                    { x: wrapper.x + fillX + fillWidth, y: 0 },
                    { x: wrapper.x + fillX + fillWidth, y: fillHeight },
                ),
            };

            if (!current_section.trapezoid) {
                current_section.trapezoid = {};
            }

            current_section.trapezoid.glass = [
                { x: 0, y: crossing.left.y - frameWidth },
                { x: fillWidth, y: crossing.right.y - frameWidth },
                { x: fillWidth, y: fillHeight },
                { x: 0, y: fillHeight },
            ];
            points = current_section.trapezoid.glass;

            opts = {
                sectionId: current_section.id,
                x: params.x,
                y: params.y,
                width: params.width,
                height: params.height,
                fill: style.glass.fill,
                sceneFunc(ctx) {
                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);
                    ctx.lineTo(points[1].x, points[1].y);
                    ctx.lineTo(points[2].x, points[2].y);
                    ctx.lineTo(points[3].x, points[3].y);
                    ctx.closePath();

                    if (isLouver) {
                        drawLouver(ctx, model, {
                            width: this.width(),
                            height: this.height(),
                            bladeWidth: style.louver.bladeWidth,
                            points,
                        });
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

        if (current_section.fillingType && current_section.fillingType !== 'glass') {
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
        const glazing_bar_width = this._model.get('glazing_bar_width');
        let data;
        let space;

        const style = this._module.getStyle('bars');

        let _from;
        let _to;
        let tbar;
        const heights = this._model.getTrapezoidHeights();

        for (let i = 0; i < vBarCount; i += 1) {
            data = section.bars.vertical[i];
            space = data.position;

            _from = 0;
            _to = fillHeight;

            if (data.links) {
                if (data.links[0] !== null) {
                    tbar = this._model.getBar(section.id, data.links[0]);
                    _from = (tbar !== null && 'position' in tbar) ? fillY + tbar.position : fillY;
                }

                if (data.links[1] !== null) {
                    tbar = this._model.getBar(section.id, data.links[1]);
                    _to = (tbar !== null && 'position' in tbar) ? tbar.position : fillHeight;
                }
            }

            _to += fillY;

            if (section.trapezoid && section.trapezoid.glass) {
                _from = this._model.getLineCrossingX(space, section.trapezoid.glass[0], section.trapezoid.glass[1]);
            }

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

        const corners = this._model.getMainTrapezoidInnerCorners();
        const glassCrossing = {
            left: this._model.getLineCrossingX(section.glassParams.x, corners.left, corners.right),
            right: this._model.getLineCrossingX(
                section.glassParams.x + section.glassParams.width,
                corners.left, corners.right,
            ),
        };

        for (let i = 0; i < hBarCount; i += 1) {
            data = section.bars.horizontal[i];
            space = data.position;

            _from = 0;
            _to = fillWidth;

            if (data.links) {
                if (data.links[0] !== null) {
                    tbar = this._model.getBar(section.id, data.links[0]);
                    _from = (tbar !== null && 'position' in tbar) ? fillX + tbar.position : fillX;
                }

                if (data.links[1] !== null) {
                    tbar = this._model.getBar(section.id, data.links[1]);
                    _to = (tbar !== null && 'position' in tbar) ? tbar.position : fillWidth;
                }
            }

            _to += fillX;

            const crossing = this._model.getTrapezoidCrossing({
                x: _from + section.glassParams.x,
                y: space + section.glassParams.y,
            }, {
                x: _to + section.glassParams.x,
                y: space + section.glassParams.y,
            });

            if (crossing) {
                if (heights.left > heights.right) {
                    _to = crossing.x - section.glassParams.x;
                } else {
                    _from = crossing.x - section.glassParams.x;
                }
            }

            const barPositionY = (fillY + space) - (glazing_bar_width / 2);

            bar = new Konva.Rect({
                x: _from,
                y: barPositionY,
                width: _to - _from,
                height: glazing_bar_width,
                fill: style.normal.fill,
                listening: false,
            });

            if (barPositionY > glassCrossing.left || barPositionY > glassCrossing.right) {
                group.add(bar);
            }
        }

        return group;
    },
    // special shape on top of sash to hightlight selection
    // it is simple to draw shape with alpha on top
    // then change styles of selected object
    createSelectionShape(section, params) {
        const fillX = params.x;
        const fillY = params.y;
        // var fillWidth = params.width;
        // var fillHeight = params.height;
        const fillWidth = section.glassParams.width;
        const fillHeight = section.glassParams.height;
        const wrapper = params.wrapper;
        let crossing = {
            left: this._model.getTrapezoidCrossing(
                { x: wrapper.x, y: wrapper.y },
                { x: wrapper.x, y: wrapper.y + fillHeight },
            ),
            right: this._model.getTrapezoidCrossing(
                { x: wrapper.x + fillWidth, y: wrapper.y },
                { x: wrapper.x + fillWidth, y: wrapper.y + fillHeight },
            ),
        };
        const style = this._module.getStyle('selection');

        const group = new Konva.Group({
            name: 'selection',
        });
        let shape;
        let frameWidth;

        if (section.arched) {
            // arched shape
            const arcPos = this._model.getArchedPosition();

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
            const radius = this._model.getCircleRadius();
            frameWidth = this._model.profile.get('frame_width');

            if (section.sashType !== 'fixed_in_frame') {
                frameWidth /= 2;
            }

            shape = new Konva.Circle({
                x: radius - frameWidth,
                y: radius - frameWidth,
                radius: radius - frameWidth,
                fill: style.fill,
            });
        } else if (!crossing.left && !crossing.right) {
            shape = new Konva.Rect({
                width: section.sashParams.width,
                height: section.sashParams.height,
                fill: style.fill,
            });
        } else if (section.sashType === 'fixed_in_frame') {
            let points;

            if (section.trapezoid && section.trapezoid.glass) {
                points = [
                    section.trapezoid.glass[0].x, section.trapezoid.glass[0].y,
                    section.trapezoid.glass[1].x, section.trapezoid.glass[1].y,
                    section.trapezoid.glass[2].x, section.trapezoid.glass[2].y,
                    section.trapezoid.glass[3].x, section.trapezoid.glass[3].y,

                ];
            } else {
                points = [
                    0, crossing.left.y - wrapper.y,
                    fillWidth, crossing.right.y - wrapper.y,
                    fillWidth, fillHeight,
                    0, fillHeight,
                ];
            }

            shape = new Konva.Line({
                points,
                fill: style.fill,
                closed: true,
            });
        } else {
            frameWidth = this._model.profile.get('frame_width');
            const innerCorners = this._model.getMainTrapezoidInnerCorners();

            crossing = {
                left: this._model.getLineCrossingX(wrapper.x, {
                    x: innerCorners.left.x,
                    y: innerCorners.left.y - frameWidth,
                }, {
                    x: innerCorners.right.x,
                    y: innerCorners.right.y - frameWidth,
                }),
                right: this._model.getLineCrossingX(wrapper.x + section.sashParams.width, {
                    x: innerCorners.left.x,
                    y: innerCorners.left.y - frameWidth,
                }, {
                    x: innerCorners.right.x,
                    y: innerCorners.right.y - frameWidth,
                }),
            };

            shape = new Konva.Line({
                points: [
                    0, crossing.left,
                    section.sashParams.width, crossing.right,
                    section.sashParams.width, section.sashParams.height,
                    0, section.sashParams.height,
                ],
                fill: style.fill,
                closed: true,
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
        opts.mainFrameWidth = this._model.profile.get('frame_width') / 2;
        opts.radius = this._model.getCircleRadius();
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
