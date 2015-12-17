var app = app || {};

(function () {
    'use strict';

    // global params
    var insideView = false;
    var merticSize = 50;
    app.DrawingView = Marionette.ItemView.extend({
        tagName: 'div',
        template: app.templates['drawing/drawing-view'],
        initialize: function () {
            this.listenTo(this.model, 'all', this.updateRenderedScene);
            this.on('update_rendered', this.updateRenderedScene, this);
            this.state = {
                insideView: insideView
            };
        },

        ui: {
            '$panel_type': '.panel-type',
            '$flush_panels': '[data-type="flush-turn-right"], [data-type="flush-turn-left"]',
            '$title': '#drawing-view-title',
            '$bars_control': '#bars-control',
            '$section_control': '#section_control',
            '$vertical_bars_number': '#vertical-bars-number',
            '$horizontal_bars_number': '#horizontal-bars-number',
            '$filling_type': '.filling-type',
            '$filling_select': '.filling-select'
        },

        events: {
            'click .split-section': 'splitSection',
            'click .change-sash-type': 'changeSashType',
            'click .change-panel-type': 'changePanelType',
            'click .popup-wrap': function(e) {
                var el = $(e.target);
                if (el.hasClass('popup-wrap')) {
                    el.hide();
                }
            },
            'click #clear-frame': 'clearFrame',
            'keydown #drawing': 'handleCanvasKeyDown',
            'click #change-view': 'handleChangeView',
            'change #vertical-bars-number': 'handleBarNumberChange',
            'input #vertical-bars-number': 'handleBarNumberChange',
            'change #horizontal-bars-number': 'handleBarNumberChange',
            'input #horizontal-bars-number': 'handleBarNumberChange',
            'change .filling-select': 'handleFillingTypeChange'
        },

        onRender: function(){
            this.stage = new Konva.Stage({
                container: this.$('#drawing').get(0)
            });

            this.layer = new Konva.Layer();
            this.stage.add(this.layer);
        },
        updateRenderedScene: function () {
            this.checkUnitType();
            this.updateUI();
            this.updateSize();
            this.updateCanvas();
            this.$('#drawing').focus();
        },
        onDestroy: function() {
            this.stage.destroy();
        },

        handleCanvasKeyDown: function(e) {
            if (e.keyCode === 46 || e.keyCode === 8) {  // DEL or BACKSPACE
                e.preventDefault();
                if (this.state.selectedMullionId) {
                    this.model.removeMullion(this.state.selectedMullionId);
                }
                if (this.state.selectedSashId) {
                    this.model.removeSash(this.state.selectedSashId);
                }
                this.deselectAll();
            }
        },
        handleChangeView: function() {
            insideView = !insideView;
            this.setState({
                insideView: insideView
            });
        },
        handleBarNumberChange: function() {
            this.model.setSectionBars(this.state.selectedSashId, {
                vertical: this.ui.$vertical_bars_number.val(),
                horizontal: this.ui.$horizontal_bars_number.val()
            });
        },
        handleFillingTypeChange: function() {
            var type = this.ui.$filling_select.val();
            this.model.setFillingType(this.state.selectedSashId, type);
        },
        setState: function(state) {
            this.state = _.assign(this.state, state);
            this.updateCanvas();
            this.updateUI();
            this.$('#drawing').focus();
        },
        updateSize: function(width, height) {
            this.stage.width(width || this.$('#drawing').get(0).offsetWidth);
            this.stage.height(height || this.$('#drawing').get(0).offsetHeight);
        },

        clearFrame: function() {
            this.deselectAll();
            this.model.clearFrame();
        },

        checkUnitType: function() {
            this.ui.$panel_type.toggle(this.model.profile.isSolidPanelPossible());
            this.ui.$flush_panels.toggle(this.model.profile.isFlushPanelPossible());
        },

        createFrame: function(params) {

            var frameWidth = params.frameWidth;  // in mm
            var width = params.width;
            var height = params.height;
            var sectionId = params.sectionId;

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

            group.on('click', function() {
                this.deselectAll();
                this.setState({
                    selectedSashId: sectionId
                });
            }.bind(this));

            return group;
        },

        createFlushFrame: function(params) {
            // var frameWidth = params.frameWidth;  // in mm
            var width = params.width;
            var height = params.height;
            var sectionId = params.sectionId;

            var group = new Konva.Group();
            var rect = new Konva.Rect({
                width: width,
                height: height,
                fill: 'white',
                stroke: 'black',
                strokeWidth: 1
            });

            group.add(rect);
            group.on('click', this.showPopup.bind(this, sectionId));

            return group;
        },

        createDoorFrame: function(params) {
            var frameWidth = params.frameWidth;  // in mm
            var thresholdWidth = this.model.profile.get('threshold_width');
            var width = params.width;
            var height = params.height;

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
                .stroke('black')
                .strokeWidth(1)
                .fill('white');


            var bottom = new Konva.Line({
                points: [
                    0, height - thresholdWidth,
                    width, height - thresholdWidth,
                    width, height,
                    0, height
                ],
                closed: true,
                stroke: 'black',
                strokeWidth: 1,
                fill: 'grey'
            });
            group.add(bottom);

            return group;
        },
        deselectAll: function() {
            this.setState({
                selectedMullionId: null,
                selectedSashId: null
            });
        },
        createSection: function(rootSection) {
            var objects = [];
            if (rootSection.sections && rootSection.sections.length) {
                var mullion = new Konva.Rect({
                    stroke: 'black',
                    fill: 'white',
                    strokeWidth: 1
                });
                mullion.setAttrs(rootSection.mullionParams);
                if (this.state.selectedMullionId === rootSection.id) {
                    mullion.fill('lightgrey');
                }
                mullion.on('click', function() {
                    this.deselectAll();
                    this.setState({
                        selectedMullionId: rootSection.id
                    });
                }.bind(this));
                if (this.state.insideView) {
                    objects.push(mullion);
                }

                // draw each child section
                rootSection.sections.forEach(function(sectionData) {
                    objects = objects.concat(this.createSection(sectionData));
                }.bind(this));

                if (!this.state.insideView) {
                    objects.push(mullion);
                }
            }
            var sash = this.createSash(rootSection);
            objects.push(sash);

            return objects;
        },

        createSash: function(sectionData) {
            var hasFrame = (sectionData.sashType !== 'fixed_in_frame');
            var frameWidth = hasFrame ? this.model.profile.get('sash_frame_width') : 0;

            var group = new Konva.Group({
                x: sectionData.sashParams.x,
                y: sectionData.sashParams.y
            });

            var fillX, fillY, fillWidth, fillHeight;
            if (_.includes(['full-flush-panel', 'exterior-flush-panel'], sectionData.fillingType) && !this.state.insideView) {
                fillX = sectionData.openingParams.x - sectionData.sashParams.x;
                fillY = sectionData.openingParams.y - sectionData.sashParams.y;
                fillWidth = sectionData.openingParams.width;
                fillHeight = sectionData.openingParams.height;
            } else if (_.includes(['full-flush-panel', 'interior-flush-panel'], sectionData.fillingType) && this.state.insideView) {
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
            if (sectionData.sashType !== 'fixed_in_frame') {
                var frameGroup;
                if (sectionData.sashType === 'flush-turn-right' || sectionData.sashType === 'flush-turn-left') {
                    frameGroup = this.createFlushFrame({
                        width: sectionData.sashParams.width,
                        height: sectionData.sashParams.height,
                        frameWidth: frameWidth,
                        sectionId: sectionData.id
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
            if (!sectionData.sections || !sectionData.sections.length) {
                var glass = new Konva.Shape({
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight,
                    fill: 'lightblue',
                    id: sectionData.id,
                    stroke: 'black',
                    sceneFunc: function(ctx) {
                        ctx.beginPath();
                        ctx.rect(0, 0, this.width(), this.height());
                        if (sectionData.fillingType === 'louver') {
                            var offset = 40;
                            for (var i = 0; i < this.height() / offset; i++) {
                                ctx.moveTo(0, i * offset);
                                ctx.lineTo(this.width(), i * offset);
                            }
                        }
                        ctx.fillStrokeShape(this);
                    }
                });
                group.add(glass);

                if (sectionData.fillingType && sectionData.fillingType !== 'glass') {
                    glass.fill('lightgrey');
                }
                glass.on('click', this.showPopup.bind(this, sectionData.id));


                if (!sectionData.fillingType || sectionData.fillingType === 'glass') {
                    var bar;
                    var x_offset = fillWidth / (sectionData.vertical_bars_number + 1);
                    for(var i = 0; i < sectionData.vertical_bars_number; i++) {
                        bar = new Konva.Rect({
                            x: fillX + x_offset * (i + 1), y: fillY,
                            width: this.model.get('glazing_bar_width'), height: fillHeight,
                            fill: 'white'
                        });
                        group.add(bar);
                    }
                    var y_offset = fillHeight / (sectionData.horizontal_bars_number + 1);
                    for(i = 0; i < sectionData.horizontal_bars_number; i++) {
                        bar = new Konva.Rect({
                            x: fillX, y: fillY + y_offset * (i + 1),
                            width: fillWidth, height: this.model.get('glazing_bar_width'),
                            fill: 'white'
                        });
                        group.add(bar);
                    }
                }
            }
            var type = sectionData.sashType;

            if (type !== 'fixed_in_frame') {
                var shouldDrawHandle = (this.state.insideView &&
                    (type.indexOf('left') >= 0 || type.indexOf('right') >= 0 || type === 'tilt_only'))
                    || (!this.state.insideView && this.model.profile.hasOutsideHandle());
                if (shouldDrawHandle) {
                    var offset = frameWidth / 2;
                    var pos = {
                        x: null,
                        y: null,
                        rotation: 0
                    };
                    if (type === 'tilt_turn_right' || type === 'turn_only_right' || type === 'slide-right' || type === 'flush-turn-right') {
                        pos.x = offset;
                        pos.y = sectionData.sashParams.height / 2;
                    }
                    if (type === 'tilt_turn_left' || type === 'turn_only_left' || type === 'slide-left' || type === 'flush-turn-left') {
                        pos.x = sectionData.sashParams.width - offset;
                        pos.y = sectionData.sashParams.height / 2;
                    }
                    if (type === 'tilt_only') {
                        pos.x = sectionData.sashParams.width / 2;
                        pos.y = offset;
                        pos.rotation = 90;
                    }
                    var handle = new Konva.Shape({
                        x: pos.x,
                        y: pos.y,
                        rotation: pos.rotation,
                        stroke: 'black',
                        fill: 'rgba(0,0,0,0.2)',
                        sceneFunc: function(ctx) {
                            ctx.beginPath();
                            ctx.rect(-23, -23, 46, 55);
                            ctx.rect(-14, -5, 28, 90);
                            ctx.fillStrokeShape(this);
                        }
                    });
                    group.add(handle);
                }
                var directionLine = new Konva.Shape({
                    stroke: 'black',
                    x: sectionData.glassParams.x - sectionData.sashParams.x,
                    y: sectionData.glassParams.y - sectionData.sashParams.y,
                    sceneFunc: function(ctx) {
                        ctx.beginPath();
                        var width = sectionData.glassParams.width;
                        var height = sectionData.glassParams.height;
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
                        if (type.indexOf('tilt_turn_') >= 0 || type.indexOf('slide') >= 0) {
                            ctx.moveTo(0, height);
                            ctx.lineTo(width / 2, 0);
                            ctx.lineTo(width, height);
                        }
                        ctx.strokeShape(this);
                    }
                });
                group.add(directionLine);
            }
            var sashList = this.model.getSashList();
            var index = _.findIndex(sashList, function(s) {
                return s.id === sectionData.id;
            });
            if (index >= 0) {
                var number = new Konva.Text({
                    x: sectionData.glassParams.x - sectionData.sashParams.x,
                    y: sectionData.glassParams.height / 2,
                    width: sectionData.glassParams.width,
                    align: 'center',
                    text: index + 1,
                    fontSize: 15 / this.ratio,
                    listening: false
                });
                group.add(number);
            }
            if (sectionData.id === this.state.selectedSashId) {
                var selectionRect = new Konva.Rect({
                    width: sectionData.sashParams.width,
                    height: sectionData.sashParams.height,
                    fill: 'rgba(0,0,0,0.2)'
                });
                group.add(selectionRect);
            }
            return group;
        },
        createVerticalMetric: function(width, height, params) {
            var arrowOffset = width / 2;
            var arrowSize = 5;
            var group = new Konva.Group();

            var lines = new Konva.Shape({
                sceneFunc: function(ctx) {
                    ctx.fillStyle = 'grey';
                    ctx.lineWidth = 0.5;

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(width, 0);

                    ctx.moveTo(0, height);
                    ctx.lineTo(width, height);

                    ctx.stroke();
                }
            });

            var arrow = new Konva.Shape({
                sceneFunc: function(ctx) {
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
                stroke: 'grey',
                strokeWidth: 0.5
            });

            // left text
            var labelMM = new Konva.Label();

            labelMM.add(new Konva.Tag({
                fill: 'white',
                stroke: 'grey'
            }));
            var textMM = new Konva.Text({
                text: app.utils.format.dimension_mm(params.getter()),
                padding: 2,
                fontSize: 11,
                fill: 'black'
            });

            labelMM.add(textMM);
            labelMM.position({
                x: width - textMM.width() - 5,
                y: height / 2 + textMM.height() / 2
            });

            // left text
            var labelInches = new Konva.Label();

            labelInches.add(new Konva.Tag({
                fill: 'white',
                stroke: 'grey'
            }));
            var inches = app.utils.convert.mm_to_inches(params.getter());
            var val = app.utils.format.dimension(inches, 'fraction');
            var textInches = new Konva.Text({
                text: val,
                padding: 2,
                fill: 'black'
            });

            labelInches.add(textInches);
            labelInches.position({
                x: width / 2 - textInches.width() / 2,
                y: height / 2 - textInches.height() / 2
            });


            if (params.setter) {
                labelInches.on('click tap', function() {
                    this.createInput(params, labelInches.getAbsolutePosition(), textInches.size());
                }.bind(this));
            }

            group.add(lines, arrow, labelInches, labelMM);
            return group;
        },

        createHorizontalMetric: function(width, height, params) {
            var arrowOffset = height / 2;
            var arrowSize = 5;
            var group = new Konva.Group();

            var lines = new Konva.Shape({
                sceneFunc: function(ctx) {
                    ctx.fillStyle = 'grey';
                    ctx.lineWidth = 0.5;

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, height);

                    ctx.moveTo(width, 0);
                    ctx.lineTo(width, height);

                    ctx.stroke();
                }
            });

            var arrow = new Konva.Shape({
                sceneFunc: function(ctx) {
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
                stroke: 'grey',
                strokeWidth: 0.5
            });

            var labelMM = new Konva.Label();

            labelMM.add(new Konva.Tag({
                fill: 'white',
                stroke: 'grey'
            }));
            var textMM = new Konva.Text({
                text: app.utils.format.dimension_mm(params.getter()),
                padding: 2,
                fontSize: 11,
                fill: 'black'
            });

            labelMM.add(textMM);
            labelMM.position({
                x: width / 2 - textMM.width() / 2,
                y: arrowOffset + textMM.height() / 2
            });

            var labelInches = new Konva.Label();

            labelInches.add(new Konva.Tag({
                fill: 'white',
                stroke: 'grey'
            }));
            var inches = app.utils.convert.mm_to_inches(params.getter());
            var val = app.utils.format.dimension(inches, 'fraction');
            var textInches = new Konva.Text({
                text: val,
                padding: 2,
                fill: 'black'
            });

            labelInches.add(textInches);
            labelInches.position({
                x: width / 2 - textInches.width() / 2,
                y: arrowOffset - labelInches.height() / 2
            });

            if (params.setter) {
                labelInches.on('click tap', function() {
                    this.createInput(params, labelInches.getAbsolutePosition(), textInches.size());
                }.bind(this));
            }

            group.add(lines, arrow, labelInches, labelMM);
            return group;
        },

        createInfo: function(mullions, width, height) {
            var group = new Konva.Group();
            var verticalRows = 0;
            var horizontalRows = 0;
            var verticalMullions = [];
            var horizontalMullions = [];

            mullions.forEach(function(mul) {
                if (this.state.selectedMullionId && this.state.selectedMullionId !== mul.id) {
                    return;
                }
                if (mul.type === 'vertical') {
                    verticalMullions.push(mul);
                } else {
                    horizontalMullions.push(mul);
                }
            }.bind(this));

            verticalMullions.sort(function(a, b) {return a.position - b.position; });
            horizontalMullions.sort(function(a, b) {return a.position - b.position; });

            var pos = 0;
            verticalMullions.forEach(function(mul, i) {
                var width_ = mul.position - pos;
                // do not draw very small dimension
                if (width_ > 0) {
                    var params = {
                        getter: function() {
                            return width_;
                        }
                    };
                    if (verticalMullions.length === 1) {
                        params.setter = function(val) {
                            if (!this.state.insideView) {
                                val = this.model.getInMetric('width', 'mm') - val;
                            }
                            this.model.setSectionMullionPosition(mul.id, val);
                        }.bind(this);
                    }
                    var metric = this.createHorizontalMetric(width_ * this.ratio, merticSize, params);
                    metric.position({
                        x: pos * this.ratio,
                        y: height
                    });
                    pos = mul.position;
                    group.add(metric);
                }
                if ( i === verticalMullions.length - 1) {
                    horizontalRows += 1;
                    var width__ = this.model.getInMetric('width', 'mm') - pos;
                    params = {
                        getter: function() {
                            return width__;
                        }
                    };
                    if (verticalMullions.length === 1) {
                        params.setter = function(val) {
                            if (this.state.insideView) {
                                val = this.model.getInMetric('width', 'mm') - val;
                            }
                            this.model.setSectionMullionPosition(mul.id, val);
                        }.bind(this);
                    }
                    metric = this.createHorizontalMetric(width__ * this.ratio, merticSize, params);
                    metric.position({
                        x: pos * this.ratio,
                        y: height
                    });
                    group.add(metric);
                }
            }.bind(this));

            pos = 0;
            horizontalMullions.forEach(function(mul, i) {
                var height_ = mul.position - pos;
                if (height_ > 0) {
                    var params = {
                        getter: function() {
                            return height_;
                        }
                    };
                    if (horizontalMullions.length === 1) {
                        params.setter = function(val) {
                            this.model.setSectionMullionPosition(mul.id, val);
                        }.bind(this);
                    }
                    var metric = this.createVerticalMetric(merticSize, height_ * this.ratio, params);
                    metric.position({
                        x: -merticSize,
                        y: pos * this.ratio
                    });
                    pos = mul.position;
                    group.add(metric);
                }
                if ( i === horizontalMullions.length - 1) {
                    verticalRows += 1;
                    var height__ = this.model.getInMetric('height', 'mm') - pos;
                    params = {
                        getter: function() {
                            return height__;
                        }
                    };
                    if (horizontalMullions.length === 1) {
                        params.setter = function(val) {
                            this.model.setSectionMullionPosition(mul.id, this.model.getInMetric('height', 'mm') - val);
                        }.bind(this);
                    }
                    metric = this.createVerticalMetric(merticSize, height__ * this.ratio, params);
                    metric.position({
                        x: -merticSize,
                        y: pos * this.ratio
                    });
                    group.add(metric);
                }
            }.bind(this));

            var verticalWholeMertic = this.createVerticalMetric(merticSize, height, {
                setter: function(val) {
                    this.model.setInMetric('height', val, 'mm');
                }.bind(this),
                getter: function() {
                    return this.model.getInMetric('height', 'mm');
                }.bind(this)
            });
            verticalWholeMertic.position({
                x: -merticSize * (verticalRows + 1),
                y: 0
            });

            group.add(verticalWholeMertic);

            var horizontalWholeMertic = this.createHorizontalMetric(width, merticSize, {
               setter: function(val) {
                    this.model.setInMetric('width', val, 'mm');
                }.bind(this),
                getter: function() {
                    return this.model.getInMetric('width', 'mm');
                }.bind(this)
            });
            horizontalWholeMertic.position({
                x: 0,
                y: height + horizontalRows * merticSize
            });
            group.add(horizontalWholeMertic);



            return group;
        },
        createInput: function(params, pos, size) {
            var $wrap = $('<div>')
                .addClass('popup-wrap')
                .appendTo(this.$el)
                .on('click', function(e) {
                    if (e.target === $wrap.get(0)) {
                        $wrap.remove();
                    }
                });

            var containerPos = this.$('#drawing').position();

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
                .on('keyup', function(e) {
                    if (e.keyCode === 13) {  // enter
                        var inches = app.utils.parseFormat.dimension(this.value);
                        var mm = app.utils.convert.inches_to_mm(inches);
                        params.setter(mm);
                        $wrap.remove();
                    }
                    if (e.keyCode === 27) { // esc
                        $wrap.remove();
                    }
                })
                ;
        },
        showPopup: function(id, e) {
            // open modal only on left click
            if (e.evt.button !== 0) {
                return;
            }
            this.deselectAll();
            this.setState({
                selectedSashId: id
            });
            // this.sectionIdToChange = id;
            // var pos = this.stage.getPointerPosition();
            // var containerPos = this.$('#drawing').position();
            // var x = pos.x - 5 + containerPos.left;
            // var y = pos.y - 5 + containerPos.top;

            // this.$('.popup-wrap')
            //     .show()
            //     .find('.popup')
            //     .css({
            //         top: y,
            //         left: x
            //     });
        },
        updateCanvas: function() {
            this.layer.destroyChildren();

            var back = new Konva.Rect({
                width: this.stage.width(),
                height: this.stage.height()
            });
            this.layer.add(back);
            back.on('click tap', function() {
                this.setState({
                    selectedSashId: null
                });
            }.bind(this));
            var frameWidth = this.model.getInMetric('width', 'mm');
            var frameHeight = this.model.getInMetric('height', 'mm');

            var topOffset = 10 + 0.5;
            var wr = (this.stage.width() - merticSize * 2) / frameWidth;
            var hr = (this.stage.height() - merticSize * 2 - topOffset) / frameHeight;

            var ratio = Math.min(wr, hr) * 0.95;

            var frameOnScreenWidth = frameWidth * ratio;
            var frameOnScreenHeight = frameHeight * ratio;
            this.ratio = ratio;

            var group = new Konva.Group();

            // place unit on center
            group.x(Math.round(this.stage.width() / 2 - frameOnScreenWidth / 2 + merticSize) + 0.5);
            // and will small offset from top
            group.y(topOffset);

            this.layer.add(group);


            var frameGroup;
            if (this.model.profile.isThresholdPossible() && this.model.profile.get('low_threshold')) {
                frameGroup = this.createDoorFrame({
                    width: this.model.getInMetric('width', 'mm'),
                    height: this.model.getInMetric('height', 'mm'),
                    frameWidth: this.model.profile.get('frame_width')
                });
            } else {
                frameGroup = this.createFrame({
                    width: this.model.getInMetric('width', 'mm'),
                    height: this.model.getInMetric('height', 'mm'),
                    frameWidth: this.model.profile.get('frame_width')
                });
            }
            frameGroup.scale({x: ratio, y: ratio});
            group.add(frameGroup);


            var sectionsGroup = new Konva.Group();
            sectionsGroup.scale({x: ratio, y: ratio});
            group.add(sectionsGroup);

            var root;
            if (this.state.insideView) {
                root = this.model.generateFullRoot();
            } else {
                root = this.model.generateFullReversedRoot();
            }
            var sections = this.createSection(root);

            sectionsGroup.add.apply(sectionsGroup, sections);

            if (!this.state.insideView) {
                frameGroup.moveToTop();
            }

            var mullions;
            if (this.state.insideView) {
                mullions = this.model.getMullions();
            } else {
                mullions = this.model.getRevertedMullions();
            }
            var infoGroup = this.createInfo(mullions, frameOnScreenWidth, frameOnScreenHeight);
            group.add(infoGroup);


            this.layer.draw();
        },

        updateUI: function() {
            var buttonText = this.state.insideView ? 'Show outside view' : 'Show inside view';
            this.$('#change-view').text(buttonText);
            var titleText = this.state.insideView ? 'Inside view' : 'Outside view';
            this.ui.$title.text(titleText);

            var selectedSashId = this.state.selectedSashId;

            var selectedSash = this.model.getSection(selectedSashId);
            this.ui.$bars_control.toggle(!!selectedSashId && selectedSash.fillingType === 'glass');
            this.ui.$vertical_bars_number.val(selectedSash && selectedSash.vertical_bars_number || 0);
            this.ui.$horizontal_bars_number.val(selectedSash && selectedSash.horizontal_bars_number || 0);
            this.ui.$section_control.toggle(!!selectedSashId);
            this.$('.sash-types').toggle(selectedSashId && this.model.canAddSashToSection(selectedSashId));
            this.ui.$filling_select.val(selectedSash && selectedSash.fillingType);
        },

        splitSection: function(e) {
            this.$('.popup-wrap').hide();
            var divider = $(e.target).data('type');
            this.model.splitSection(this.state.selectedSashId, divider);
            this.deselectAll();
        },
        changeSashType: function(e) {
            this.$('.popup-wrap').hide();
            var type = $(e.target).data('type');

            // revirse sash type from right to left
            // or from left to right on onside view
            // UX will be better for this case
            if (!this.state.insideView) {
                if (type.indexOf('left') >= 0) {
                    type = type.replace('left', 'right');
                } else if (type.indexOf('right') >= 0) {
                    type = type.replace('right', 'left');
                }
            }
            this.model.setSectionSashType(this.state.selectedSashId, type);
        },
        changePanelType: function(e) {
            this.$('.popup-wrap').hide();
            var type = $(e.target).data('type');
            this.model.setPanelType(this.state.selectedSashId, type);
        }
    });

    app.preview = function(unitModel, options) {
        var result;
        var defaults = {
            width: 300,
            height: 300,
            mode: 'base64',
            position: 'inside'
        };

        options = _.defaults({}, options, defaults);

        var full_root_json_string = JSON.stringify(unitModel.generateFullRoot());
        var options_json_string = JSON.stringify(options);

        //  If we already got an image for the same full_root and same options,
        //  just return it from our preview cache
        if (
            unitModel.preview && unitModel.preview.result &&
            unitModel.preview.result[options_json_string] &&
            full_root_json_string === unitModel.preview.full_root_json_string
        ) {
            return unitModel.preview.result[options_json_string];
        }

        //  If full root changes, preview cache should be erased
        if (
            !unitModel.preview ||
            !unitModel.preview.result ||
            full_root_json_string !== unitModel.preview.full_root_json_string
        ) {
            unitModel.preview = {};
            unitModel.preview.result = {};
        }

        var view = new app.DrawingView({
            model: unitModel
        });

        view.render();
        view.updateSize(options.width, options.height);
        view.updateCanvas();

        if ( _.indexOf(['inside', 'outside'], options.position) !== -1 ) {
            view.setState({
                insideView: options.position === 'inside'
            });
        } else {
            view.destroy();
            view.remove();
            throw new Error('unrecognized position for preview: ' + options.position);
        }

        if (options.mode === 'canvas') {
            result = view.layer.canvas._canvas;
        } else if (options.mode === 'base64') {
            result = view.stage.toDataURL();
        } else if (options.mode === 'image') {
            result = new Image();
            result.src = view.stage.toDataURL();
        } else {
            view.destroy();
            view.remove();
            throw new Error('unrecognized mode for preview: ' + options.mode);
        }

        unitModel.preview.full_root_json_string = full_root_json_string;
        unitModel.preview.result[options_json_string] = result;

        // clean
        view.destroy();
        view.remove();
        return result;
    };

})();
