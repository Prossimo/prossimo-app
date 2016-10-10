var app = app || {};

(function () {
    'use strict';

    var module;
    var model;
    var metricSize;
    var ratio;
    var minimalGap = 25; // minimal gap between bars

    app.Drawers = app.Drawers || {};
    app.Drawers.GlazingBarDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            module = params.builder;
            model = module.get('model');

            this.layer = params.layer;
            this.stage = params.stage;
            this.saveBars = (_.isFunction(params.data.saveBars)) ? params.data.saveBars : function () {};

            this.sectionId = params.data.sectionId;

            metricSize = params.metricSize;
        },
        el: function () {
            var group = new Konva.Group();

            return group;
        },
        render: function () {
            if (this.sectionId) {
                this.section = model.getSection(this.sectionId);

                ratio = module.get('ratio');

                // Clear all previous objects
                this.layer.destroyChildren();
                // Creating unit and adding it to layer
                this.layer.add( this.createView() );
                // Draw layer
                this.layer.draw();
            }
        },
        events: {},
        // handlers
        handleBarClick: function (data) {
            module.setState({
                selectedBar: data,
                selectedEdge: null
            });
        },
        handleEdgeOver: function (key) {
            module.setState({
                hoverEdge: key
            });
        },
        handleEdgeOut: function () {
            module.setState({
                hoverEdge: null
            });
        },
        handleEdgeClick: function (key) {
            module.setState({
                selectedEdge: key
            });
        },
        handleControlOver: function (key) {
            module.setState({
                hoverControl: key
            });
        },
        handleControlOut: function () {
            module.setState({
                hoverControl: null
            });
        },
        handleControlClick: function (params) {
            var bar = this.section.bars[params.bar.type][params.bar.index];
            var id;

            if ( !('id' in bar) ) {
                bar.id = _.uniqueId();
            }

            if ( !('links' in bar) ) {
                bar.links = [null, null];
            }

            if (params.link === null) {
                id = null;
            }

            if ( params.link !== null ) {
                if ( !('id' in params.link) ) {
                    params.link.id = _.uniqueId();
                }

                id = params.link.id;
            }

            bar.links[params.bar.edge] = id;
            model.setSectionBars( this.section.id, this.section.bars );

            this.resetStates();
        },
        handleBackClick: function () {
            this.resetStates();
        },
        // Common methods
        resetStates: function () {
            module.setState({
                selectedBar: null,
                selectedEdge: null,
                hoverEdge: null,
                hoverControl: null
            });
        },
        getDefaultMetricStyles: function () {
            return module.getStyle('measurements');
        },
        updateLayer: function () {
            this.layer.draw();
        },
        // Get methods
        getBarsCount: function () {
            return {
                horizontal: (this.section) ? this.section.bars.horizontal.length : 0,
                vertical: (this.section) ? this.section.bars.vertical.length : 0
            };
        },
        getBarPosition: function ( type, bar ) {
            var position = {
                x: 0,
                y: 0
            };

            if ( typeof bar === 'object' && 'position' in bar && 'space' in bar) {
                if (type === 'horizontal') {
                    position = {
                        x: 0,
                        y: (bar.position - bar.space) * ratio
                    };
                }

                if (type === 'vertical') {
                    position = {
                        x: metricSize + ((bar.position - bar.space) * ratio),
                        y: this.getSize().height * ratio
                    };
                }
            }

            return position;
        },
        getBarsWithSpaces: function ( section ) {
            var bars;

            if (section) {
                bars = JSON.parse( JSON.stringify( section.bars ) );
            }

            _.each(bars, function ( group ) {
                var spaceUsed = 0;

                group.forEach(function ( bar ) {
                    bar.space = bar.position - spaceUsed;
                    spaceUsed += bar.space;
                });
            });

            return bars;
        },
        getSize: function () {
            return {
                width: (this.section) ? this.section.glassParams.width : 0,
                height: (this.section) ? this.section.glassParams.height : 0
            };
        },
        // Drawer custom methods
        createView: function () {
            var group = this.el;

            // transparent background to detect click on empty space
            var back = new Konva.Rect({
                id: 'back',
                width: this.stage.width(),
                height: this.stage.height()
            });

            group.add(back);

            var section = new Konva.Group();

            section.add( this.createSection() );
            group.add( section );

            section.setAbsolutePosition({
                x: (this.stage.width() / 2) - (this.getSize().width * ratio / 2) - metricSize,
                y: 0
            });

            return group;
        },
        createSection: function () {
            var group = new Konva.Group({
                x: 20,
                y: 20
            });

            // calculate width and height
            var fillWidth = this.getSize().width;
            var fillHeight = this.getSize().height;

            // zero position for children graphics
            var zeroPos = {
                x: (0 + metricSize) / ratio,
                y: 0
            };

            // creating graphics
            var frameGroup = this.createGlass({
                x: zeroPos.x,
                y: zeroPos.y,
                width: fillWidth,
                height: fillHeight
            });
            var bars = this.createBars({
                x: zeroPos.x,
                y: zeroPos.y,
                width: fillWidth,
                height: fillHeight
            });
            var metrics = this.createMetrics({
                metricSize: metricSize,
                width: fillWidth,
                height: fillHeight
            });

            // scale with ratio
            frameGroup.scale({x: ratio, y: ratio});
            bars.scale({x: ratio, y: ratio});

            // adding to group
            group.add( frameGroup );
            group.add( bars );

            group.add( metrics );

            return group;
        },
        createGlass: function ( params ) {
            var group = new Konva.Group();
            var style = module.getStyle('fillings');

            var glass = new Konva.Rect({
                x: params.x,
                y: params.y,
                width: params.width,
                height: params.height,
                fill: style.glass.fill
            });

            group.add(glass);

            return group;
        },
        createBars: function (params) {
            var fillX = params.x;
            var fillY = params.y;
            var fillOffset;

            var fillWidth = params.width;
            var fillHeight = params.height;
            var fillSize;

            var pos_from = 0;
            var size_to = 0;

            var group = new Konva.Group();

            var data;
            var position;
            var nullPos;

            var bar;
            var tbar;
            var controls = new Konva.Group();

            var edges = [0, 0];
            var isSelected = false;
            var selectedEdge;

            // Universal loop
            _.each(this.getBarsCount(), function (count, type) {
                for (var i = 0; i < count; i++) {
                    data = this.section.bars[type][i];

                    isSelected = (
                        module.getState('selectedBar') !== null &&
                        module.getState('selectedBar').id === data.id
                    );

                    pos_from = 0;

                    fillOffset = (type === 'vertical') ? fillX : fillY;
                    fillSize = (type === 'vertical') ? fillHeight : fillWidth;

                    position = fillOffset + data.position;
                    size_to = fillSize;

                    if (data.links) {
                        if (data.links[0] !== null) {
                            tbar = model.getBar(this.section.id, data.links[0]);
                            pos_from = (tbar !== null && 'position' in tbar) ? tbar.position : fillOffset;
                        }

                        if (data.links[1] !== null) {
                            tbar = model.getBar(this.section.id, data.links[1]);

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
                        type: type,
                        isSelected: isSelected,
                        position: position,
                        from: pos_from,
                        to: size_to,
                        offset: {
                            fillX: fillX,
                            fillY: fillY
                        },
                        data: data
                    });

                    // Draw controls to switch edges
                    if (isSelected && module.getState('selectedEdge') === null) {
                        // 1. Draw controls to select edge
                        controls.add( this.createEdgeControls({
                            type: type,
                            position: position,
                            edges: edges
                        }) );
                    } else if (isSelected && module.getState('selectedEdge') !== null) {
                        // 2. Draw controls to bound selected edge
                        selectedEdge = module.getState('selectedEdge');

                        var invertedType = (type === 'vertical') ? 'horizontal' : 'vertical';

                        // Draw controls for intersection with horizontal bars
                        for (var j = 0; j < this.getBarsCount()[invertedType]; j++) {

                            if (
                                _.isArray(data.links) &&
                                data.links.indexOf(this.section.bars[invertedType][j].id) !== -1
                            ) {
                                continue;
                            }

                            controls.add( this.createBoundControl({
                                index: j,
                                edge: selectedEdge,
                                bar: {
                                    type: type,
                                    index: i,
                                    edge: selectedEdge
                                },
                                link: this.section.bars[invertedType][j],
                                position: (type === 'vertical') ?
                                    {
                                        x: position,
                                        y: fillY + this.section.bars[invertedType][j].position
                                    } : {
                                        x: fillX + this.section.bars.vertical[j].position,
                                        y: position
                                    }
                            }) );
                        }
                        // Draw controls at section edge:
                        // For edge with key === 0 - null means section edge at left/top side
                        // For 1 - right/bottom side
                        nullPos = (selectedEdge === 0) ? 0 : fillSize;

                        controls.add( this.createBoundControl({
                            index: -1,
                            bar: {
                                type: type,
                                index: i,
                                edge: selectedEdge
                            },
                            edge: selectedEdge,
                            link: null,
                            position: (type === 'vertical') ?
                                {
                                    x: position,
                                    y: fillY + nullPos
                                } :
                                {
                                    x: fillX + nullPos,
                                    y: position
                                }
                        }) );
                    }

                    group.add( bar );

                }
            }.bind(this));

            group.add(controls);

            return group;
        },
        createBar: function (params) {
            var selectedColor = 'yellow';
            var normalColor = 'white';

            var bar = new Konva.Group({
                name: 'bar'
            });
            var opts = {
                line: {},
                area: {}
            };

            // Position & size
            if (params.type === 'vertical') {
                // For vertical bars
                opts.line = {
                    x: params.position - (model.get('glazing_bar_width') / 2),
                    y: params.offset.fillY + params.from,
                    width: model.get('glazing_bar_width'),
                    height: params.to - params.from
                };
                opts.area = {
                    x: params.position - (model.get('glazing_bar_width') * 2),
                    y: params.offset.fillY + params.from,
                    width: model.get('glazing_bar_width') * 4,
                    height: params.to - params.from
                };
            } else {
                // For horizontal bars
                opts.line = {
                    x: params.offset.fillX + params.from,
                    y: params.position - (model.get('glazing_bar_width') / 2),
                    width: params.to - params.from,
                    height: model.get('glazing_bar_width')
                };
                opts.area = {
                    x: params.offset.fillY + params.from,
                    y: params.position - (model.get('glazing_bar_width') * 2),
                    width: params.to - params.from,
                    height: model.get('glazing_bar_width') * 4
                };
            }
            // Colors
            opts.line.fill = (params.isSelected) ? selectedColor : normalColor;

            var line = new Konva.Rect(opts.line);
            var area = new Konva.Rect(opts.area);

            // Events
            bar.on('click', this.handleBarClick.bind(this, params.data));

            // Grouping
            bar.add(area, line);

            return bar;
        },
        createEdgeControls: function (params) {
            var controls = new Konva.Group();
            var circle;

            var opts = {};
            var isCircleHover;
            var isCircleSelected;

            for (var j = 0; j < 2; j++) {
                isCircleSelected = (module.getState('selectedEdge') === j);
                isCircleHover = (module.getState('hoverEdge') === j);

                if (!isCircleSelected) {
                    // Position
                    if (params.type === 'vertical') {
                        // Vertical
                        opts = {
                            x: params.position,
                            y: params.edges[j]
                        };
                    } else {
                        // Horizontal
                        opts = {
                            x: params.edges[j],
                            y: params.position
                        };
                    }
                    // Styles
                    opts.name = 'edge';
                    opts.radius = model.get('glazing_bar_width') * 3;
                    opts.fill = 'red';
                    opts.opacity = (isCircleHover) ? 0.7 : 0.3;

                    circle = new Konva.Circle(opts);

                    circle
                        .on('mouseover', this.handleEdgeOver.bind(this, j))
                        .on('mouseout', this.handleEdgeOut.bind(this, j))
                        .on('click', this.handleEdgeClick.bind(this, j));

                    controls.add( circle );
                }
            }

            return controls;
        },
        createBoundControl: function (params) {
            var style = module.getStyle('glazing_controls');
            var circle = new Konva.Circle({
                name: 'control',
                x: params.position.x,
                y: params.position.y,
                radius: model.get('glazing_bar_width') * style.bound.radius,
                fill: style.bound.fill,
                opacity: (module.getState('hoverControl') === params.index) ?
                            style.bound.hover.opacity : style.bound.normal.opacity
            });

            circle
                .on('mouseover', this.handleControlOver.bind(this, params.index))
                .on('mouseout', this.handleControlOut.bind(this, params.index))
                .on('click', this.handleControlClick.bind(this, params));

            return circle;
        },
        createMetrics: function ( params ) {
            var drawer = this;
            var metrics = new Konva.Group();
            var max = {
                vertical: params.width,
                horizontal: params.height
            };
            var paramName = {
                vertical: 'width',
                horizontal: 'height'
            };
            var groups = {
                vertical: new Konva.Group(),
                horizontal: new Konva.Group()
            };
            var methods = {
                vertical: this.createHorizontalMetrics.bind(drawer),
                horizontal: this.createVerticalMetrics.bind(drawer)
            };
            var barMetric;

            var bars = this.getBarsWithSpaces(this.section);

            var defaultMethods = {
                getter: function () {
                    return this.space;
                },
                setter: function ( type, space, val, view ) {
                    var delta = val - space;
                    var mm = app.utils.parseFormat.dimension( this.position + delta );

                    if (
                        view &&
                        (mm >= max[type] - minimalGap || (this.position + delta) < 0 + minimalGap )
                    ) {
                        view.showError();
                        return;
                    }

                    this.position = this.position + delta;

                    if (view) {
                        view.sortBars();
                        view.saveBars( drawer.section.bars );
                    }

                },
                gap_getter: function ( ) {
                    return this.space;
                },
                gap_setter: function ( type, val, view ) {
                    var mm = app.utils.parseFormat.dimension(val);
                    var lastBar = drawer.section.bars[type][view.section.bars[type].length - 1];
                    var freeSpace = max[type] - lastBar.position;
                    var delta = freeSpace - val;

                    if (
                        view &&
                        (mm > max[type] - minimalGap || val < 0 + minimalGap )
                    ) {
                        view.showError();
                        return;
                    }

                    lastBar.position = lastBar.position + delta;

                    if (view) {
                        view.sortBars();
                        view.saveBars( drawer.section.bars );
                    }

                }
            };

            _.each(bars, function ( group, type ) {
                var spaceUsed = 0;
                var gap;

                group.forEach(function ( bar, i ) {
                    var p = {
                        methods: {
                            getter: defaultMethods.getter.bind( bar ),
                            setter: defaultMethods.setter.bind( drawer.section.bars[type][i], type, bar.space )
                        }
                    };
                    var position = drawer.getBarPosition( type, bar );

                    _.extend(p, params);
                    p[paramName[type]] = bar.space;

                    barMetric = methods[type]( p );
                    barMetric.position(position);
                    groups[type].add(barMetric);

                    spaceUsed += bar.space;
                });
                // Add gap
                var gapObject = {
                    position: max[type],
                    space: max[type] - spaceUsed
                };
                var p = {
                    methods: {
                        getter: defaultMethods.gap_getter.bind( gapObject )
                    }
                };
                var position = drawer.getBarPosition( type, gapObject );

                if (group.length > 0) {
                    p.methods.setter = defaultMethods.gap_setter.bind( gapObject, type );
                }

                _.extend(p, params);
                p[paramName[type]] = gapObject.space;

                gap = methods[type]( p );
                gap.position(position);
                groups[type].add(gap);
            });

            metrics.add( groups.vertical, groups.horizontal );

            return metrics;
        },
        createVerticalMetrics: function ( params ) {
            var drawerParams = [params.metricSize, params.height * ratio, params.methods];

            return this.createVerticalMetric.apply(this, drawerParams);
        },
        createHorizontalMetrics: function ( params ) {
            var drawerParams = [params.width * ratio, params.metricSize, params.methods];

            return this.createHorizontalMetric.apply(this, drawerParams);
        },
        createVerticalMetric: function (width, height, params, styles) {
            var arrowOffset = width / 2;
            var arrowSize = 5;
            var group = new Konva.Group();

            // Define styles
            styles = styles || {};
            styles = _.defaults(styles, this.getDefaultMetricStyles());

            var lines = new Konva.Shape({
                sceneFunc: function (ctx) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(width, 0);

                    ctx.moveTo(0, height);
                    ctx.lineTo(width, height);

                    ctx.stroke();
                },
                stroke: styles.arrows.stroke,
                strokeWidth: styles.arrows.strokeWidth
            });

            var arrow = new Konva.Shape({
                sceneFunc: function (ctx) {
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
                strokeWidth: styles.arrows.strokeWidth
            });

            // left text
            var labelMM = new Konva.Label();

            labelMM.add(new Konva.Tag({
                fill: styles.label.fill,
                stroke: styles.label.stroke,
                strokeWidth: styles.label.strokeWidth
            }));
            var textMM = new Konva.Text({
                text: app.utils.format.dimension_mm(params.getter()),
                padding: styles.label.padding,
                fontFamily: styles.label.fontFamily,
                fontSize: styles.label.fontSize,
                fill: styles.label.color
            });

            labelMM.add(textMM);
            labelMM.position({
                x: width / 2 - textMM.width() / 2,
                y: height / 2 + textMM.height() / 2
            });

            // left text
            var labelInches = new Konva.Label();

            labelInches.add(new Konva.Tag({
                fill: styles.label.fill,
                stroke: styles.label.stroke,
                strokeWidth: styles.label.strokeWidth
            }));
            var inches = app.utils.convert.mm_to_inches(params.getter());
            var val = app.utils.format.dimension(inches, 'fraction', module.getState('inchesDisplayMode'));
            var textInches = new Konva.Text({
                text: val,
                padding: styles.label.padding,
                fill: styles.label.color,
                fontFamily: styles.label.fontFamily,
                fontSize: styles.label.fontSize_big
            });

            labelInches.add(textInches);
            labelInches.position({
                x: width / 2 - textInches.width() / 2,
                y: height / 2 - textInches.height() / 2
            });

            if (params.setter) {
                // Only for glazing-bars: position of bar can be defined using negative values
                params.canBeNegative = true;

                labelInches.on('click tap', function () {
                    module.trigger('labelClicked', {
                        params: params,
                        pos: labelInches.getAbsolutePosition(),
                        size: textInches.size()
                    });
                    // this.createInput(params, labelInches.getAbsolutePosition(), textInches.size());
                });
            }

            group.add(lines, arrow, labelInches, labelMM);
            return group;
        },
        createHorizontalMetric: function (width, height, params, styles) {
            var arrowOffset = height / 2;
            var arrowSize = 5;
            var group = new Konva.Group();

            // Define styles
            styles = styles || {};
            styles = _.defaults(styles, this.getDefaultMetricStyles());

            var lines = new Konva.Shape({
                sceneFunc: function (ctx) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, height);

                    ctx.moveTo(width, 0);
                    ctx.lineTo(width, height);

                    ctx.stroke();
                },
                stroke: styles.arrows.stroke,
                strokeWidth: styles.arrows.strokeWidth
            });

            var arrow = new Konva.Shape({
                sceneFunc: function (ctx) {
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
                strokeWidth: styles.arrows.strokeWidth
            });

            var labelMM = new Konva.Label();

            labelMM.add(new Konva.Tag({
                fill: styles.label.fill,
                stroke: styles.label.stroke,
                strokeWidth: styles.label.strokeWidth
            }));

            var textMM = new Konva.Text({
                text: app.utils.format.dimension_mm(params.getter()),
                padding: styles.label.padding,
                fontFamily: styles.label.fontFamily,
                fontSize: styles.label.fontSize,
                fill: styles.label.color
            });

            labelMM.add(textMM);
            labelMM.position({
                x: width / 2 - textMM.width() / 2,
                y: arrowOffset + textMM.height() / 2
            });

            var labelInches = new Konva.Label();

            labelInches.add(new Konva.Tag({
                fill: styles.label.fill,
                stroke: styles.label.stroke,
                strokeWidth: styles.label.strokeWidth
            }));
            var inches = app.utils.convert.mm_to_inches(params.getter());
            var val = app.utils.format.dimension(inches, 'fraction', module.getState('inchesDisplayMode'));
            var textInches = new Konva.Text({
                text: val,
                padding: styles.label.padding,
                fill: styles.label.color,
                fontFamily: styles.label.fontFamily,
                fontSize: styles.label.fontSize_big
            });

            labelInches.add(textInches);
            labelInches.position({
                x: width / 2 - textInches.width() / 2,
                y: arrowOffset - labelInches.height() / 2
            });

            if (params.setter) {
                // Only for glazing-bars: position of bar can be defined using negative values
                params.canBeNegative = true;

                labelInches.on('click tap', function () {
                    module.trigger('labelClicked', {
                        params: params,
                        pos: labelInches.getAbsolutePosition(),
                        size: textInches.size()
                    });
                    // this.createInput(params, labelInches.getAbsolutePosition(), textInches.size());
                });
            }

            group.add(lines, arrow, labelInches, labelMM);
            return group;
        }
    });

})();
