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
            this.ui = params.data.ui;

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

                // Detaching and attching events
                // this.undelegateEvents();
                // this.delegateEvents();
            }
        },
        events: {
            /*
            // Click
            'click #back': 'handleBackClick',
            'click .bar': 'handleBarClick',
            'click .edge': 'handleEdgeClick',
            'click .control': 'handleControlClick',
            // Tap
            'tap #back': 'handleBackClick',
            'tap .bar': 'handleBarClick',
            'tap .edge': 'handleEdgeClick',
            'tap .control': 'handleControlClick',
            // Mouse over
            'mouseover .edge': 'handleEdgeOver',
            'mouseover .control': 'handleControlOver',
            // Mouse out
            'mouseout .edge': 'handleEdgeOut',
            'mouseout .control': 'handleControlOut'
            */
        },
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
                horizontal: this.section.bars.horizontal.length,
                vertical: this.section.bars.vertical.length
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
            var bars = JSON.parse( JSON.stringify( section.bars ) );

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
                width: this.section.glassParams.width,
                height: this.section.glassParams.height
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

            var glass = new Konva.Rect({
                x: params.x,
                y: params.y,
                width: params.width,
                height: params.height,
                fill: 'lightblue'
            });

            group.add(glass);

            return group;
        },
        createBars: function (params) {
            var fillX = params.x;
            var fillY = params.y;
            var fillWidth = params.width;
            var fillHeight = params.height;

            var pos_from = 0;
            var size_to = 0;

            var group = new Konva.Group();

            var hBarCount = this.getBarsCount().horizontal;
            var vBarCount = this.getBarsCount().vertical;
            var data;
            var position;
            var nullPos;

            var bar;
            var tbar;
            var line;
            var area;
            var circle;
            var controls = new Konva.Group();

            var edges = [0, 0];
            var isSelected = false;
            var isCircleHover = false;
            var isCircleSelected = false;
            var selectedEdge;

            var i;
            var j;

            // Vertical bars
            for (i = 0; i < vBarCount; i++) {
                data = this.section.bars.vertical[i];

                isSelected = (
                                module.getState('selectedBar') !== null &&
                                module.getState('selectedBar').id === data.id
                            );

                pos_from = 0;
                position = fillX + data.position;
                size_to = fillHeight;

                if (data.links) {
                    if (data.links[0] !== null) {
                        tbar = model.getBar(this.section.id, data.links[0]);
                        pos_from = (tbar !== null && 'position' in tbar) ? tbar.position : 0;
                    }

                    if (data.links[1] !== null) {
                        tbar = model.getBar(this.section.id, data.links[1]);
                        size_to = (tbar !== null && 'position' in tbar) ? fillY + tbar.position : fillHeight;
                    }
                }

                edges[0] = fillY + pos_from;
                edges[1] = size_to;

                bar = new Konva.Group({
                    name: 'bar'
                });
                line = new Konva.Rect({
                    x: position - (model.get('glazing_bar_width') / 2),
                    y: fillY + pos_from,
                    width: model.get('glazing_bar_width'),
                    height: size_to - pos_from,
                    fill: (isSelected) ? 'yellow' : 'white'
                });
                area = new Konva.Rect({
                    x: position - (model.get('glazing_bar_width') * 2),
                    y: fillY + pos_from,
                    width: model.get('glazing_bar_width') * 4,
                    height: size_to - pos_from
                });

                bar.on('click', this.handleBarClick.bind(this, data));
                bar.add(area, line);

                // Draw controls to switch edges
                if (isSelected && module.getState('selectedEdge') === null) {
                    // 1. Draw controls to select edge
                    for (j = 0; j < 2; j++) {
                        isCircleHover = (module.getState('hoverEdge') === j);

                        if (!isCircleSelected) {
                            circle = new Konva.Circle({
                                name: 'edge',
                                x: position,
                                y: edges[j],
                                radius: model.get('glazing_bar_width') * 3,
                                fill: 'red',
                                opacity: (isCircleHover) ? 0.7 : 0.3
                            });

                            circle
                                .on('mouseover', this.handleEdgeOver.bind(this, j))
                                .on('mouseout', this.handleEdgeOut.bind(this, j))
                                .on('click', this.handleEdgeClick.bind(this, j));

                            controls.add(circle);
                        }
                    }
                } else if (isSelected && module.getState('selectedEdge') !== null) {
                    // 2. Draw controls to bound selected edge
                    selectedEdge = module.getState('selectedEdge');

                    // Draw controls for intersection with horizontal bars
                    for (j = 0; j < hBarCount; j++) {

                        if (
                            _.isArray(data.links) && data.links.indexOf(this.section.bars.horizontal[j].id) !== -1
                        ) {
                            continue;
                        }

                        controls.add( this.createEdgeControl({
                            index: j,
                            edge: selectedEdge,
                            bar: {
                                type: 'vertical',
                                index: i,
                                edge: selectedEdge
                            },
                            link: this.section.bars.horizontal[j],
                            position: {
                                x: position,
                                y: fillY + this.section.bars.horizontal[j].position
                            }
                        }) );
                    }
                    // Draw controls at section edge:
                    // For edge with key === 0 - null means section edge at left/top side
                    // For 1 - right/bottom side
                    nullPos = (selectedEdge === 0) ? 0 : fillHeight;

                    controls.add( this.createEdgeControl({
                        index: -1,
                        bar: {
                            type: 'vertical',
                            index: i,
                            edge: selectedEdge
                        },
                        edge: selectedEdge,
                        link: null,
                        position: {
                            x: position,
                            y: fillY + nullPos
                        }
                    }) );
                }

                group.add(bar);
            }

            // Horizontal bars
            for (i = 0; i < hBarCount; i++) {
                data = this.section.bars.horizontal[i];

                isSelected = (
                                module.getState('selectedBar') !== null &&
                                module.getState('selectedBar').id === data.id
                            );

                pos_from = 0;
                position = fillY + data.position;
                size_to = fillWidth;

                if (data.links) {
                    if (data.links[0] !== null) {
                        tbar = model.getBar(this.section.id, data.links[0]);
                        pos_from = (tbar !== null && 'position' in tbar) ? tbar.position : 0;
                    }

                    if (data.links[1] !== null) {
                        tbar = model.getBar(this.section.id, data.links[1]);
                        size_to = (tbar !== null && 'position' in tbar) ? tbar.position : fillWidth;
                    }
                }

                edges[0] = pos_from;
                edges[1] = size_to;

                bar = new Konva.Group({
                    name: 'bar'
                });
                line = new Konva.Rect({
                    x: fillX + pos_from,
                    y: position - (model.get('glazing_bar_width') / 2),
                    width: size_to - pos_from,
                    height: model.get('glazing_bar_width'),
                    fill: (module.getState('selectedBar') === data) ? 'yellow' : 'white'
                });
                area = new Konva.Rect({
                    x: fillX + pos_from,
                    y: position - (model.get('glazing_bar_width') * 2),
                    width: size_to - pos_from,
                    height: model.get('glazing_bar_width') * 4
                });

                bar.on('click', this.handleBarClick.bind(this, data));
                bar.add(area, line);

                // Draw controls to switch edges
                if (isSelected && module.getState('selectedEdge') === null) {
                    for (j = 0; j < 2; j++) {
                        isCircleSelected = (module.getState('selectedEdge') === j);
                        isCircleHover = (module.getState('hoverEdge') === j);

                        if (!isCircleSelected) {
                            circle = new Konva.Circle({
                                name: 'edge',
                                x: fillX + edges[j],
                                y: position,
                                radius: model.get('glazing_bar_width') * 3,
                                fill: 'red',
                                opacity: (isCircleHover) ? 0.7 : 0.3
                            });

                            circle
                                .on('mouseover', this.handleEdgeOver.bind(this, j))
                                .on('mouseout', this.handleEdgeOut.bind(this, j))
                                .on('click', this.handleEdgeClick.bind(this, j));

                            controls.add(circle);
                        }
                    }
                } else if (isSelected && module.getState('selectedEdge') !== null) {
                    // 2. Draw controls to bound selected edge
                    selectedEdge = module.getState('selectedEdge');

                    // Draw controls for intersection with horizontal bars
                    for (j = 0; j < vBarCount; j++) {

                        if (
                            _.isArray(data.links) && data.links.indexOf(this.section.bars.vertical[j].id) !== -1
                        ) {
                            continue;
                        }

                        controls.add( this.createEdgeControl({
                            index: j,
                            edge: selectedEdge,
                            bar: {
                                type: 'horizontal',
                                index: i,
                                edge: selectedEdge
                            },
                            link: this.section.bars.vertical[j],
                            position: {
                                x: fillX + this.section.bars.vertical[j].position,
                                y: position
                            }
                        }) );
                    }
                    // Draw controls at section edge:
                    // For edge with key === 0 - null means section edge at left/top side
                    // For 1 - right/bottom side
                    nullPos = (selectedEdge === 0) ? 0 : fillWidth;

                    controls.add( this.createEdgeControl({
                        index: -1,
                        bar: {
                            type: 'horizontal',
                            index: i,
                            edge: selectedEdge
                        },
                        edge: selectedEdge,
                        link: null,
                        position: {
                            x: fillX + nullPos,
                            y: position
                        }
                    }) );
                }

                group.add(bar);
            }

            group.add(controls);

            return group;
        },
        createEdgeControl: function (params) {
            var circle = new Konva.Circle({
                name: 'control',
                x: params.position.x,
                y: params.position.y,
                radius: model.get('glazing_bar_width') * 3,
                fill: 'green',
                opacity: (module.getState('hoverControl') === params.index) ? 0.7 : 0.3
            });

            circle
                .on('mouseover', this.handleControlOver.bind(this, params.index))
                .on('mouseout', this.handleControlOut.bind(this, params.index))
                .on('click', this.handleControlClick.bind(this, params));

            return circle;
        },
        createMetrics: function ( params ) {
            // @TODO: Add "lock" control to metrics
            var view = this;
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
                vertical: this.createHorizontalMetrics.bind(view),
                horizontal: this.createVerticalMetrics.bind(view)
            };
            var barMetric;

            var bars = this.getBarsWithSpaces(this.section);

            var defaultMethods = {
                getter: function () {
                    return this.space;
                },
                setter: function ( type, space, val ) {
                    var delta = val - space;
                    var mm = app.utils.parseFormat.dimension( this.position + delta );

                    if ( mm >= max[type] - minimalGap || (this.position + delta) < 0 + minimalGap ) {
                        view.showError();
                        return;
                    }

                    this.position = this.position + delta;
                },
                gap_getter: function ( ) {
                    return this.space;
                },
                gap_setter: function ( type, val ) {
                    var mm = app.utils.parseFormat.dimension(val);
                    var lastBar = view.section.bars[type][view.section.bars[type].length - 1];
                    var freeSpace = max[type] - lastBar.position;
                    var delta = freeSpace - val;

                    if ( mm > max[type] - minimalGap || val < 0 + minimalGap ) {
                        view.showError();
                        return;
                    }

                    lastBar.position = lastBar.position + delta;
                }
            };

            _.each(bars, function ( group, type ) {
                var spaceUsed = 0;
                var gap;

                group.forEach(function ( bar, i ) {
                    var p = {
                        methods: {
                            getter: defaultMethods.getter.bind( bar ),
                            setter: defaultMethods.setter.bind( view.section.bars[type][i], type, bar.space )
                        }
                    };
                    var position = view.getBarPosition( type, bar );

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
                var position = view.getBarPosition( type, gapObject );

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
        // duplicate of DrawingView.createInput
        // changed only appendTo and containerPos
        createInput: function (params, pos, size) {
            var view = this;
            var $wrap = $('<div>')
                .addClass('popup-wrap')
                .appendTo(this.ui.$body)
                .on('click', function (e) {
                    if (e.target === $wrap.get(0)) {
                        $wrap.remove();
                    }
                });

            var containerPos = this.ui.$drawing.position();

            var padding = 3;
            var valInInches = app.utils.convert.mm_to_inches(params.getter());
            var val = app.utils.format.dimension(valInInches, 'fraction');

            $('<input>')
                .val(val)
                .css({
                    position: 'absolute',
                    top: (pos.y - padding + containerPos.top) + 'px',
                    left: (pos.x - padding + containerPos.left) + 'px',
                    height: (size.height + padding * 2) + 'px',
                    width: (size.width + 20 + padding * 2) + 'px',
                    fontSize: '12px'
                })
                .appendTo($wrap)
                .focus()
                .select()
                .on('keyup', function (e) {
                    if (e.keyCode === 13) {  // enter
                        var _value = this.value;
                        var sign = 1;

                        if (_value[0] === '-') {
                            sign = -1;
                            _value = _value.slice(1);
                        }

                        var inches = app.utils.parseFormat.dimension(_value);
                        var mm = app.utils.convert.inches_to_mm(inches) * sign;

                        params.setter(mm);
                        view.sortBars();
                        view.saveBars();

                        $wrap.remove();
                    }

                    if (e.keyCode === 27) { // esc
                        $wrap.remove();
                    }
                })
                .on('blur', function () {
                    $wrap.remove();
                })
                ;
        },
        sortBars: function () {
            _.each(this.section.bars, function ( group ) {
                group.sort(function ( a, b ) {
                    return a.position > b.position;
                });
            });
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
                labelInches.on('click tap', function () {
                    this.createInput(params, labelInches.getAbsolutePosition(), textInches.size());
                }.bind(this));
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
                labelInches.on('click tap', function () {
                    this.createInput(params, labelInches.getAbsolutePosition(), textInches.size());
                }.bind(this));
            }

            group.add(lines, arrow, labelInches, labelMM);
            return group;
        }
    });

})();
