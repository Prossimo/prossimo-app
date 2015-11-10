var app = app || {};

(function () {
    'use strict';

    app.DrawingView = Marionette.ItemView.extend({
        tagName: 'div',
        template: app.templates['drawing-windows/drawing-view'],
        initialize: function () {
            this.listenTo(this.model, 'all', this.updateCanvas);
            this.listenTo(this.options.parent_view, 'attach', this.onAttach);
            this.state = {};
        },

        events: {
            'click .split-section': 'splitSection',
            'click .change-sash-type': 'changeSashType',
            'click .popup-wrap': function(e) {
                var el = $(e.target);
                if (el.hasClass('popup-wrap')) {
                    el.hide();
                }
            },
            'keydown #drawing': 'onKeyUp'
        },

        onRender: function(){
            this.stage = new Konva.Stage({
                container: this.$('#drawing').get(0)
            });

            this.layer = new Konva.Layer();
            this.stage.add(this.layer);
        },
        onAttach: function() {
            this.updateSize();
            this.updateCanvas();
            this.$('#drawing').focus();
        },
        onDestroy: function() {
            this.stage.destroy();
        },

        onKeyUp: function(e) {
            if (e.keyCode === 46 || e.keyCode === 8) {  // DEL or BACKSPACE
                e.preventDefault();
                this.model.removeMullion(this.state.selectedMullionId);
                this.setState({
                    selectedMullionId: null
                });
            }
        },
        setState: function(state) {
            this.state = _.assign(this.state, state);
            this.updateCanvas();
            this.$('#drawing').focus();
        },
        updateSize: function() {
            this.stage.width(this.el.offsetWidth);
            this.stage.height(this.el.offsetHeight);
        },

        createFrame: function(params) {

            var frameWidth = params.frameWidth;  // in mm
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
        deselectAll: function() {
            this.setState({
                selectedMullionId: null
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
                    mullion.addName('selected');
                    mullion.fill('red');
                }
                mullion.on('click', function() {
                    this.setState({
                        selectedMullionId: rootSection.id
                    });
                }.bind(this));
                objects.push(mullion);

                // draw each child section
                rootSection.sections.forEach(function(sectionData) {
                    objects = objects.concat(this.createSection(sectionData));
                }.bind(this));
            } else {
                var sash = this.createSash(rootSection);
                objects.push(sash);
            }

            return objects;
        },

        createSash: function(sectionData) {
            var params = sectionData.params;
            // params of HOLE
            var hasFrame = sectionData.sashType && (sectionData.sashType !== 'none');
            var overlap = hasFrame ? 34 : 0;
            var width = params.width + overlap * 2;
            var height = params.height + overlap * 2;
            var x = params.x - overlap;
            var y = params.y - overlap;
            var frameWidth = hasFrame ? this.model.profile.get('sashFrameWidth') : 0;

            var group = new Konva.Group({
                x: x,
                y: y
            });

            var glassX = frameWidth;
            var glassY = frameWidth;
            var glassWidth = width - frameWidth * 2;
            var glassHeight = height - frameWidth * 2;

            var glass = new Konva.Rect({
                x: glassX,
                y: glassY,
                width: glassWidth,
                height: glassHeight,
                fill: 'lightblue',
                id: sectionData.id
            });
            group.add(glass);
            glass.on('click', this.showPopup.bind(this, sectionData.id));
            var type = sectionData.sashType;

            var directionLine = new Konva.Shape({
                stroke: 'black',
                x: glassX,
                y: glassY,
                sceneFunc: function(ctx) {
                    ctx.beginPath();
                    if (type.indexOf('left') >= 0 && (type.indexOf('slide') === -1)) {
                        ctx.moveTo(glassWidth, glassHeight);
                        ctx.lineTo(0, glassHeight / 2);
                        ctx.lineTo(glassWidth, 0);
                    }
                    if (type.indexOf('right') >= 0 && (type.indexOf('slide') === -1)) {
                        ctx.moveTo(0, 0);
                        ctx.lineTo(glassWidth, glassHeight / 2);
                        ctx.lineTo(0, glassHeight);
                    }
                    if (type.indexOf('top') >= 0 || type.indexOf('slide') >= 0) {
                        ctx.moveTo(0, glassHeight);
                        ctx.lineTo(glassWidth / 2, 0);
                        ctx.lineTo(glassWidth, glassHeight);
                    }
                    ctx.strokeShape(this);
                }
            });
            group.add(directionLine);

            if (type !== 'none' && type) {
                var frameGroup = this.createFrame({
                    width: width,
                    height: height,
                    frameWidth: frameWidth
                });
                group.add(frameGroup);
                if (type.indexOf('left') >= 0 || type.indexOf('right') >= 0 || type.indexOf('top') >= 0) {
                    var offset = frameWidth / 2;
                    var pos = {
                        x: null,
                        y: null,
                        rotation: 0
                    };
                    if (type === 'top-left' || type === 'left' || type === 'slide-right') {
                        pos.x = offset;
                        pos.y = height / 2;
                    }
                    if (type === 'top-right' || type === 'right' || type === 'slide-left') {
                        pos.x = width - offset;
                        pos.y = height / 2;
                    }
                    if (type === 'top') {
                        pos.x = width / 2;
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
                text: params.getter() + 'mm',
                padding: 2,
                fill: 'black'
            });

            labelMM.add(textMM);
            labelMM.position({
                x: -textMM.width() / 2,
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
                x: -textInches.width() / 2,
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
                text: params.getter() + 'mm',
                padding: 2,
                fill: 'black'
            });

            labelMM.add(textMM);
            labelMM.position({
                x: width / 2 - textMM.width() / 2,
                y: arrowOffset + textMM.height()
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
                y: arrowOffset
            });

            if (params.setter) {
                labelInches.on('click tap', function() {
                    this.createInput(params, labelInches.getAbsolutePosition(), textInches.size());
                }.bind(this));
            }

            group.add(lines, arrow, labelInches, labelMM);
            return group;
        },

        createInfo: function(width, height) {
            var merticSize = 30;
            var group = new Konva.Group();
            var verticalRows = 0;
            var horizontalRows = 0;
            var verticalMullions = [];
            var horizontalMullions = [];

            this.model.getMullions().forEach(function(mul) {
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
                var params = {
                    getter: function() {
                        return width_;
                    }
                };
                if (verticalMullions.length === 1) {
                    params.setter = function(val) {
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
                if ( i === verticalMullions.length - 1) {
                    horizontalRows += 1;
                    width_ = this.model.getInMetric('width', 'mm') - pos;
                    params = {
                        getter: function() {
                            return width_;
                        }
                    };
                    if (verticalMullions.length === 1) {
                        params.setter = function(val) {
                            this.model.setSectionMullionPosition(mul.id, this.model.getInMetric('width', 'mm') - val);
                        }.bind(this);
                    }
                    metric = this.createHorizontalMetric(width_ * this.ratio, merticSize, params);
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
                if ( i === horizontalMullions.length - 1) {
                    verticalRows += 1;
                    height_ = this.model.getInMetric('height', 'mm') - pos;
                    params = {
                        getter: function() {
                            return height_;
                        }
                    };
                    if (horizontalMullions.length === 1) {
                        params.setter = function(val) {
                            this.model.setSectionMullionPosition(mul.id, this.model.getInMetric('height', 'mm') - val);
                        }.bind(this);
                    }
                    metric = this.createVerticalMetric(merticSize, height_ * this.ratio, params);
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
                .addClass('.popup-wrap')
                .appendTo(this.$el)
                .on('click', function(e) {
                    if (e.target === $wrap.get(0)) {
                        $wrap.remove();
                    }
                });

            var padding = 3;
            var valInInches = app.utils.convert.mm_to_inches(params.getter());
            $('<input type="number">')
                .val(valInInches)
                .css({
                    position: 'absolute',
                    top: (pos.y - padding) + 'px',
                    left: (pos.x - padding) + 'px',
                    height: (size.height + padding * 2) + 'px',
                    width: (size.width + 20 + padding * 2) + 'px',
                    fontSize: '12px'
                })
                .appendTo($wrap)
                .focus()
                .on('keyup', function(e) {
                    if (e.keyCode === 13) {
                        var valInMM = app.utils.convert.inches_to_mm(this.value);
                        params.setter(valInMM);
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
            this.sectionIdToChange = id;
            var pos = this.stage.getPointerPosition();
            var x = pos.x - 5;
            var y = pos.y - 5;

            this.$('.popup-wrap')
                .show()
                .find('.popup')
                .css({
                    top: y,
                    left: x
                });
        },
        updateCanvas: function() {
            this.layer.children.destroy();

            var frameWidth = this.model.getInMetric('width', 'mm');
            var frameHeight = this.model.getInMetric('height', 'mm');

            var wr = this.stage.width() / frameWidth;
            var hr = this.stage.height() / frameHeight;

            var ratio = Math.min(wr, hr) * 0.7;

            var frameOnScreenWidth = frameWidth * ratio;
            var frameOnScreenHeight = frameHeight * ratio;
            this.ratio = ratio;

            var group = new Konva.Group();

            // place window on center
            group.x(Math.round(this.stage.width() / 2 - frameOnScreenWidth / 2) + 0.5);
            // and will small offset from top
            group.y(10 + 0.5);

            this.layer.add(group);


            var frameGroup = this.createFrame({
                width: this.model.getInMetric('width', 'mm'),
                height: this.model.getInMetric('height', 'mm'),
                frameWidth: this.model.profile.get('frameWidth')
            });
            frameGroup.scale({x: ratio, y: ratio});
            group.add(frameGroup);


            var sectionsGroup = new Konva.Group();
            sectionsGroup.scale({x: ratio, y: ratio});
            group.add(sectionsGroup);

            var sections = this.createSection(this.model.generateFullRoot()/*, {
                x: this.model.profile.get('frameWidth'),
                y: this.model.profile.get('frameWidth'),
                width: this.model.getInMetric('width', 'mm') - this.model.profile.get('frameWidth') * 2,
                height: this.model.getInMetric('height', 'mm') - this.model.profile.get('frameWidth') * 2
            }*/);

            sectionsGroup.add.apply(sectionsGroup, sections);

            var infoGroup = this.createInfo(frameOnScreenWidth, frameOnScreenHeight);
            group.add(infoGroup);

            this.layer.draw();
        },

        splitSection: function(e) {
            this.$('.popup-wrap').hide();
            var devider = $(e.target).data('type');
            this.model.splitSection(this.sectionIdToChange, devider);
        },
        changeSashType: function(e) {
            this.$('.popup-wrap').hide();
            var type = $(e.target).data('type');
            this.model.setSectionSashType(this.sectionIdToChange, type);
        }
    });
})();
