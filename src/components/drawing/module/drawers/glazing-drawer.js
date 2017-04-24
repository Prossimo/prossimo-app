import _ from 'underscore';
import clone from 'clone';
import Backbone from 'backbone';
import Konva from '../konva-clip-patch';

import { parseFormat, format, convert } from '../../../../utils';

// minimal gap between bars
const MINIMAL_GAP = 25;

export default Backbone.KonvaView.extend({
    initialize(params) {
        this._module = params.builder;
        this._model = this._module.get('model');
        this._ratio = this._module.get('ratio');

        this.layer = params.layer;
        this.stage = params.stage;
        this.saveBars = (_.isFunction(params.data.saveBars)) ? params.data.saveBars : function saveBars() {};

        this.sectionId = params.data.sectionId;

        this._metricSize = params.metricSize;
    },
    el() {
        const group = new Konva.Group();

        return group;
    },
    render() {
        if (this.sectionId) {
            this.section = this._model.getSection(this.sectionId);

            this._ratio = this._module.get('ratio');

            // Clear all previous objects
            this.layer.destroyChildren();
            // Creating unit and adding it to layer
            this.layer.add(this.createView());
            // Draw layer
            this.layer.draw();
        }
    },
    events: {},
    // handlers
    handleBarClick(data) {
        this._module.setState({
            selectedBar: data,
            selectedEdge: null,
        });
    },
    handleEdgeOver(key) {
        this._module.setState({
            hoverEdge: key,
        });
    },
    handleEdgeOut() {
        this._module.setState({
            hoverEdge: null,
        });
    },
    handleEdgeClick(key) {
        this._module.setState({
            selectedEdge: key,
        });
    },
    handleControlOver(key) {
        this._module.setState({
            hoverControl: key,
        });
    },
    handleControlOut() {
        this._module.setState({
            hoverControl: null,
        });
    },
    handleControlClick(current_params) {
        const params = clone(current_params);
        const bar = this.section.bars[params.bar.type][params.bar.index];
        let id;

        if (!('id' in bar)) {
            bar.id = _.uniqueId();
        }

        if (!('links' in bar)) {
            bar.links = [null, null];
        }

        if (params.link === null) {
            id = null;
        }

        if (params.link !== null) {
            if (!('id' in params.link)) {
                params.link.id = _.uniqueId();
            }

            id = params.link.id;
        }

        bar.links[params.bar.edge] = id;
        this._model.setSectionBars(this.section.id, this.section.bars);

        this.resetStates();
    },
    handleBackClick() {
        this.resetStates();
    },
    // Common methods
    resetStates() {
        this._module.setState({
            selectedBar: null,
            selectedEdge: null,
            hoverEdge: null,
            hoverControl: null,
        });
    },
    getDefaultMetricStyles() {
        return this._module.getStyle('measurements');
    },
    updateLayer() {
        this.layer.draw();
    },
    // Get methods
    getBarsCount() {
        return {
            horizontal: (this.section) ? this.section.bars.horizontal.length : 0,
            vertical: (this.section) ? this.section.bars.vertical.length : 0,
        };
    },
    getBarPosition(type, bar) {
        let position = {
            x: 0,
            y: 0,
        };

        if (typeof bar === 'object' && 'position' in bar && 'space' in bar) {
            if (type === 'horizontal') {
                position = {
                    x: 0,
                    y: (bar.position - bar.space) * this._ratio,
                };
            }

            if (type === 'vertical') {
                position = {
                    x: this._metricSize + ((bar.position - bar.space) * this._ratio),
                    y: this.getSize().height * this._ratio,
                };
            }
        }

        return position;
    },
    getBarsWithSpaces(section) {
        return section && _.mapObject(section.bars, (group) => {
            const barGroup = clone(group);
            let spaceUsed = 0;

            return barGroup.map((bar) => {
                const barSpace = bar.position - spaceUsed;

                spaceUsed += barSpace;

                return _.extend({}, bar, {
                    space: barSpace,
                });
            });
        });
    },
    getSize() {
        return {
            width: (this.section) ? this.section.glassParams.width : 0,
            height: (this.section) ? this.section.glassParams.height : 0,
        };
    },
    // Drawer custom methods
    createView() {
        const group = this.el;

        // transparent background to detect click on empty space
        const back = new Konva.Rect({
            id: 'back',
            width: this.stage.width(),
            height: this.stage.height(),
        });

        group.add(back);

        const section = new Konva.Group();

        section.add(this.createSection());
        group.add(section);

        section.setAbsolutePosition({
            x: (this.stage.width() / 2) - ((this.getSize().width * this._ratio) / 2) - this._metricSize,
            y: 0,
        });

        return group;
    },
    createSection() {
        const group = new Konva.Group({
            x: 20,
            y: 20,
        });

        // calculate width and height
        const fillWidth = this.getSize().width;
        const fillHeight = this.getSize().height;

        // zero position for children graphics
        const zeroPos = {
            x: (0 + this._metricSize) / this._ratio,
            y: 0,
        };

        // creating graphics
        const frameGroup = this.createGlass({
            x: zeroPos.x,
            y: zeroPos.y,
            width: fillWidth,
            height: fillHeight,
        });
        const bars = this.createBars({
            x: zeroPos.x,
            y: zeroPos.y,
            width: fillWidth,
            height: fillHeight,
        });
        const metrics = this.createMetrics({
            metricSize: this._metricSize,
            width: fillWidth,
            height: fillHeight,
        });

        // scale with ratio
        frameGroup.scale({ x: this._ratio, y: this._ratio });
        bars.scale({ x: this._ratio, y: this._ratio });

        // adding to group
        group.add(frameGroup);
        group.add(bars);

        group.add(metrics);

        return group;
    },
    createGlass(params) {
        const group = new Konva.Group();
        const style = this._module.getStyle('fillings');

        const glass = new Konva.Rect({
            x: params.x,
            y: params.y,
            width: params.width,
            height: params.height,
            fill: style.glass.fill,
        });

        group.add(glass);

        return group;
    },
    createBars(params) {
        const fillX = params.x;
        const fillY = params.y;
        let fillOffset;

        const fillWidth = params.width;
        const fillHeight = params.height;
        let fillSize;

        let pos_from = 0;
        let size_to = 0;

        const group = new Konva.Group();

        let data;
        let position;
        let nullPos;

        let bar;
        let tbar;
        const controls = new Konva.Group();

        const edges = [0, 0];
        let isSelected = false;
        let selectedEdge;

        // Universal loop
        _.each(this.getBarsCount(), (count, type) => {
            for (let i = 0; i < count; i += 1) {
                data = this.section.bars[type][i];

                isSelected = (
                    this._module.getState('selectedBar') !== null &&
                    this._module.getState('selectedBar').id === data.id
                );

                pos_from = 0;

                fillOffset = (type === 'vertical') ? fillX : fillY;
                fillSize = (type === 'vertical') ? fillHeight : fillWidth;

                position = fillOffset + data.position;
                size_to = fillSize;

                if (data.links) {
                    if (data.links[0] !== null) {
                        tbar = this._model.getBar(this.section.id, data.links[0]);
                        pos_from = (tbar !== null && 'position' in tbar) ? tbar.position : fillOffset;
                    }

                    if (data.links[1] !== null) {
                        tbar = this._model.getBar(this.section.id, data.links[1]);

                        if (type === 'vertical') {
                            size_to = (tbar !== null && 'position' in tbar) ? tbar.position : fillSize;
                        } else {
                            size_to = (tbar !== null && 'position' in tbar) ? tbar.position : fillSize;
                        }
                    }
                }

                edges[0] = (type === 'vertical') ? pos_from : fillX + pos_from;
                edges[1] = (type === 'vertical') ? size_to : fillX + size_to;

                bar = this.createBar({
                    type,
                    isSelected,
                    position,
                    from: pos_from,
                    to: size_to,
                    offset: {
                        fillX,
                        fillY,
                    },
                    data,
                });

                // Draw controls to switch edges
                if (isSelected && this._module.getState('selectedEdge') === null) {
                    // 1. Draw controls to select edge
                    controls.add(this.createEdgeControls({
                        type,
                        position,
                        edges,
                    }));
                } else if (isSelected && this._module.getState('selectedEdge') !== null) {
                    // 2. Draw controls to bound selected edge
                    selectedEdge = this._module.getState('selectedEdge');

                    const invertedType = (type === 'vertical') ? 'horizontal' : 'vertical';

                    // Draw controls for intersection with horizontal bars
                    for (let j = 0; j < this.getBarsCount()[invertedType]; j += 1) {
                        if (!(
                            _.isArray(data.links) &&
                            data.links.indexOf(this.section.bars[invertedType][j].id) !== -1
                        )) {
                            controls.add(this.createBoundControl({
                                index: j,
                                edge: selectedEdge,
                                bar: {
                                    type,
                                    index: i,
                                    edge: selectedEdge,
                                },
                                link: this.section.bars[invertedType][j],
                                position: (type === 'vertical') ?
                                {
                                    x: position,
                                    y: fillY + this.section.bars[invertedType][j].position,
                                } : {
                                    x: fillX + this.section.bars.vertical[j].position,
                                    y: position,
                                },
                            }));
                        }
                    }

                    // Draw controls at section edge:
                    // For edge with key === 0 - null means section edge at left/top side
                    // For 1 - right/bottom side
                    nullPos = (selectedEdge === 0) ? 0 : fillSize;

                    controls.add(this.createBoundControl({
                        index: -1,
                        bar: {
                            type,
                            index: i,
                            edge: selectedEdge,
                        },
                        edge: selectedEdge,
                        link: null,
                        position: (type === 'vertical') ?
                        {
                            x: position,
                            y: fillY + nullPos,
                        } :
                        {
                            x: fillX + nullPos,
                            y: position,
                        },
                    }));
                }

                group.add(bar);
            }
        });

        group.add(controls);

        return group;
    },
    createBar(params) {
        const selectedColor = 'yellow';
        const normalColor = 'white';

        const bar = new Konva.Group({
            name: 'bar',
        });
        const opts = {
            line: {},
            area: {},
        };

        // Position & size
        if (params.type === 'vertical') {
            // For vertical bars
            opts.line = {
                x: params.position - (this._model.get('glazing_bar_width') / 2),
                y: params.offset.fillY + params.from,
                width: this._model.get('glazing_bar_width'),
                height: params.to - params.from,
            };
            opts.area = {
                x: params.position - (this._model.get('glazing_bar_width') * 2),
                y: params.offset.fillY + params.from,
                width: this._model.get('glazing_bar_width') * 4,
                height: params.to - params.from,
            };
        } else {
            // For horizontal bars
            opts.line = {
                x: params.offset.fillX + params.from,
                y: params.position - (this._model.get('glazing_bar_width') / 2),
                width: params.to - params.from,
                height: this._model.get('glazing_bar_width'),
            };
            opts.area = {
                x: params.offset.fillY + params.from,
                y: params.position - (this._model.get('glazing_bar_width') * 2),
                width: params.to - params.from,
                height: this._model.get('glazing_bar_width') * 4,
            };
        }
        // Colors
        opts.line.fill = (params.isSelected) ? selectedColor : normalColor;

        const line = new Konva.Rect(opts.line);
        const area = new Konva.Rect(opts.area);

        // Events
        bar.on('click', this.handleBarClick.bind(this, params.data));

        // Grouping
        bar.add(area, line);

        return bar;
    },
    createEdgeControls(params) {
        const controls = new Konva.Group();
        let circle;

        let opts = {};
        let isCircleHover;
        let isCircleSelected;

        for (let j = 0; j < 2; j += 1) {
            isCircleSelected = (this._module.getState('selectedEdge') === j);
            isCircleHover = (this._module.getState('hoverEdge') === j);

            if (!isCircleSelected) {
                // Position
                if (params.type === 'vertical') {
                    // Vertical
                    opts = {
                        x: params.position,
                        y: params.edges[j],
                    };
                } else {
                    // Horizontal
                    opts = {
                        x: params.edges[j],
                        y: params.position,
                    };
                }
                // Styles
                opts.name = 'edge';
                opts.radius = this._model.get('glazing_bar_width') * 3;
                opts.fill = 'red';
                opts.opacity = (isCircleHover) ? 0.7 : 0.3;

                circle = new Konva.Circle(opts);

                circle
                    .on('mouseover', this.handleEdgeOver.bind(this, j))
                    .on('mouseout', this.handleEdgeOut.bind(this, j))
                    .on('click', this.handleEdgeClick.bind(this, j));

                controls.add(circle);
            }
        }

        return controls;
    },
    createBoundControl(params) {
        const style = this._module.getStyle('glazing_controls');
        const circle = new Konva.Circle({
            name: 'control',
            x: params.position.x,
            y: params.position.y,
            radius: this._model.get('glazing_bar_width') * style.bound.radius,
            fill: style.bound.fill,
            opacity: (this._module.getState('hoverControl') === params.index) ?
                style.bound.hover.opacity : style.bound.normal.opacity,
        });

        circle
            .on('mouseover', this.handleControlOver.bind(this, params.index))
            .on('mouseout', this.handleControlOut.bind(this, params.index))
            .on('click', this.handleControlClick.bind(this, params));

        return circle;
    },
    createMetrics(params) {
        const drawer = this;
        const metrics = new Konva.Group();
        const max = {
            vertical: params.width,
            horizontal: params.height,
        };
        const paramName = {
            vertical: 'width',
            horizontal: 'height',
        };
        const groups = {
            vertical: new Konva.Group(),
            horizontal: new Konva.Group(),
        };
        const methods = {
            vertical: this.createHorizontalMetrics.bind(drawer),
            horizontal: this.createVerticalMetrics.bind(drawer),
        };
        let barMetric;

        const bars = this.getBarsWithSpaces(this.section);

        const defaultMethods = {
            getter() {
                return this.space;
            },
            setter(type, space, val, view) {
                const delta = val - space;
                const mm = parseFormat.dimension(this.position + delta);

                if (
                    view &&
                    (mm >= max[type] - MINIMAL_GAP || (this.position + delta) < 0 + MINIMAL_GAP)
                ) {
                    view.showError();
                    return;
                }

                this.position = this.position + delta;

                if (view) {
                    view.sortBars();
                    view.saveBars(drawer.section.bars);
                }
            },
            gap_getter() {
                return this.space;
            },
            gap_setter(type, val, view) {
                const mm = parseFormat.dimension(val);
                const lastBar = drawer.section.bars[type][view.section.bars[type].length - 1];
                const freeSpace = max[type] - lastBar.position;
                const delta = freeSpace - val;

                if (
                    view &&
                    (mm > max[type] - MINIMAL_GAP || val < 0 + MINIMAL_GAP)
                ) {
                    view.showError();
                    return;
                }

                lastBar.position += delta;

                if (view) {
                    view.sortBars();
                    view.saveBars(drawer.section.bars);
                }
            },
        };

        _.each(bars, (group, type) => {
            let spaceUsed = 0;
            let gap = 0;

            group.forEach((bar, i) => {
                const p = {
                    methods: {
                        getter: defaultMethods.getter.bind(bar),
                        setter: defaultMethods.setter.bind(drawer.section.bars[type][i], type, bar.space),
                    },
                };
                const position = drawer.getBarPosition(type, bar);

                _.extend(p, params);
                p[paramName[type]] = bar.space;

                barMetric = methods[type](p);
                barMetric.position(position);
                groups[type].add(barMetric);

                spaceUsed += bar.space;
            });
            // Add gap
            const gapObject = {
                position: max[type],
                space: max[type] - spaceUsed,
            };
            const p = {
                methods: {
                    getter: defaultMethods.gap_getter.bind(gapObject),
                },
            };
            const position = drawer.getBarPosition(type, gapObject);

            if (group.length > 0) {
                p.methods.setter = defaultMethods.gap_setter.bind(gapObject, type);
            }

            _.extend(p, params);
            p[paramName[type]] = gapObject.space;

            gap = methods[type](p);
            gap.position(position);
            groups[type].add(gap);
        });

        metrics.add(groups.vertical, groups.horizontal);

        return metrics;
    },
    createVerticalMetrics(params) {
        const drawerParams = [params.metricSize, params.height * this._ratio, params.methods];

        return this.createVerticalMetric(...drawerParams);
    },
    createHorizontalMetrics(params) {
        const drawerParams = [params.width * this._ratio, params.metricSize, params.methods];

        return this.createHorizontalMetric(...drawerParams);
    },
    createVerticalMetric(width, height, current_params, current_styles) {
        const arrowOffset = width / 2;
        const arrowSize = 5;
        const group = new Konva.Group();
        const params = clone(current_params);
        const styles = _.defaults(clone(current_styles) || {}, this.getDefaultMetricStyles());

        const lines = new Konva.Shape({
            sceneFunc(ctx) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(width, 0);

                ctx.moveTo(0, height);
                ctx.lineTo(width, height);

                ctx.stroke();
            },
            stroke: styles.arrows.stroke,
            strokeWidth: styles.arrows.strokeWidth,
        });

        const arrow = new Konva.Shape({
            sceneFunc(ctx) {
                ctx.translate(arrowOffset, 0);

                ctx.beginPath();
                // top pointer
                ctx.moveTo(-arrowSize, arrowSize);
                ctx.lineTo(0, 0);
                ctx.lineTo(arrowSize, arrowSize);

                // line
                ctx.moveTo(0, 0);
                ctx.lineTo(0, height);

                // bottom pointer
                ctx.moveTo(-arrowSize, height - arrowSize);
                ctx.lineTo(0, height);
                ctx.lineTo(arrowSize, height - arrowSize);

                ctx.strokeShape(this);
            },
            stroke: styles.arrows.stroke,
            strokeWidth: styles.arrows.strokeWidth,
        });

        // left text
        const labelMM = new Konva.Label();

        labelMM.add(new Konva.Tag({
            fill: styles.label.fill,
            stroke: styles.label.stroke,
            strokeWidth: styles.label.strokeWidth,
        }));
        const textMM = new Konva.Text({
            text: format.dimension_mm(params.getter()),
            padding: styles.label.padding,
            fontFamily: styles.label.fontFamily,
            fontSize: styles.label.fontSize,
            fill: styles.label.color,
        });

        labelMM.add(textMM);
        labelMM.position({
            x: (width / 2) - (textMM.width() / 2),
            y: (height / 2) + (textMM.height() / 2),
        });

        // left text
        const labelInches = new Konva.Label();

        labelInches.add(new Konva.Tag({
            fill: styles.label.fill,
            stroke: styles.label.stroke,
            strokeWidth: styles.label.strokeWidth,
        }));
        const inches = convert.mm_to_inches(params.getter());
        const val = format.dimension(inches, 'fraction', this._module.getState('inchesDisplayMode'));
        const textInches = new Konva.Text({
            text: val,
            padding: styles.label.padding,
            fill: styles.label.color,
            fontFamily: styles.label.fontFamily,
            fontSize: styles.label.fontSize_big,
        });

        labelInches.add(textInches);
        labelInches.position({
            x: (width / 2) - (textInches.width() / 2),
            y: (height / 2) - (textInches.height() / 2),
        });

        if (params.setter) {
            // Only for glazing-bars: position of bar can be defined using negative values
            params.canBeNegative = true;

            labelInches.on('click tap', () => {
                this._module.trigger('labelClicked', {
                    params,
                    pos: labelInches.getAbsolutePosition(),
                    size: textInches.size(),
                });
                // this.createInput(params, labelInches.getAbsolutePosition(), textInches.size());
            });
        }

        group.add(lines, arrow, labelInches, labelMM);
        return group;
    },
    createHorizontalMetric(width, height, current_params, current_styles) {
        const arrowOffset = height / 2;
        const arrowSize = 5;
        const group = new Konva.Group();
        const params = clone(current_params);
        const styles = _.defaults(clone(current_styles) || {}, this.getDefaultMetricStyles());

        const lines = new Konva.Shape({
            sceneFunc(ctx) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, height);

                ctx.moveTo(width, 0);
                ctx.lineTo(width, height);

                ctx.stroke();
            },
            stroke: styles.arrows.stroke,
            strokeWidth: styles.arrows.strokeWidth,
        });

        const arrow = new Konva.Shape({
            sceneFunc(ctx) {
                // top pointer
                ctx.translate(0, arrowOffset);

                ctx.beginPath();
                ctx.moveTo(arrowSize, -arrowSize);
                ctx.lineTo(0, 0);
                ctx.lineTo(arrowSize, arrowSize);

                // line
                ctx.moveTo(0, 0);
                ctx.lineTo(width, 0);

                // bottom pointer
                ctx.moveTo(width - arrowSize, -arrowSize);
                ctx.lineTo(width, 0);
                ctx.lineTo(width - arrowSize, arrowSize);

                ctx.strokeShape(this);
            },
            stroke: styles.arrows.stroke,
            strokeWidth: styles.arrows.strokeWidth,
        });

        const labelMM = new Konva.Label();

        labelMM.add(new Konva.Tag({
            fill: styles.label.fill,
            stroke: styles.label.stroke,
            strokeWidth: styles.label.strokeWidth,
        }));

        const textMM = new Konva.Text({
            text: format.dimension_mm(params.getter()),
            padding: styles.label.padding,
            fontFamily: styles.label.fontFamily,
            fontSize: styles.label.fontSize,
            fill: styles.label.color,
        });

        labelMM.add(textMM);
        labelMM.position({
            x: (width / 2) - (textMM.width() / 2),
            y: arrowOffset + (textMM.height() / 2),
        });

        const labelInches = new Konva.Label();

        labelInches.add(new Konva.Tag({
            fill: styles.label.fill,
            stroke: styles.label.stroke,
            strokeWidth: styles.label.strokeWidth,
        }));
        const inches = convert.mm_to_inches(params.getter());
        const val = format.dimension(inches, 'fraction', this._module.getState('inchesDisplayMode'));
        const textInches = new Konva.Text({
            text: val,
            padding: styles.label.padding,
            fill: styles.label.color,
            fontFamily: styles.label.fontFamily,
            fontSize: styles.label.fontSize_big,
        });

        labelInches.add(textInches);
        labelInches.position({
            x: (width / 2) - (textInches.width() / 2),
            y: arrowOffset - (labelInches.height() / 2),
        });

        if (params.setter) {
            // Only for glazing-bars: position of bar can be defined using negative values
            params.canBeNegative = true;

            labelInches.on('click tap', () => {
                this._module.trigger('labelClicked', {
                    params,
                    pos: labelInches.getAbsolutePosition(),
                    size: textInches.size(),
                });
                // this.createInput(params, labelInches.getAbsolutePosition(), textInches.size());
            });
        }

        group.add(lines, arrow, labelInches, labelMM);
        return group;
    },
});
