var app = app || {};

(function () {
    'use strict';

    app.MainDrawingWindowsView = Marionette.ItemView.extend({
        tagName: 'div',
        template: app.templates['drawing-windows/main-drawing-windows-view'],
        initialize: function () {
            //  README: This is for development purposes. In real app we would
            //  probably use a top-level instance of `WindowCollection`
            //  containing collection of `Window` models, and each instance of
            //  `Window` would probably have a `WindowDrawing` stored inside
            this.model = new app.WindowDrawing();

            this.listenTo(this.model, 'all', this.updateCanvas);
            this.listenTo(this.model, 'change:width change:height', this.updateInputs);
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
            'change .heightInput': 'updateModel',
            'input .heightInput': 'updateModel',
            'change .widthInput': 'updateModel',
            'input .widthInput': 'updateModel'
        },

        onRender: function(){
            this.stage = new Konva.Stage({
                container: this.$('#drawing').get(0)
            });

            this.layer = new Konva.Layer();
            this.stage.add(this.layer);
            this.updateInputs();
        },
        onAttach: function() {
            this.updateSize();
            this.updateCanvas();
        },
        onDestroy: function() {
            this.stage.destroy();
        },

        // update inputs on model change
        updateInputs: function() {
            this.$('.widthInput').val(this.model.get('width'));
            this.$('.heightInput').val(this.model.get('height'));
        },

        // update model on input change
        updateModel: function() {
             this.model.set({
                width: parseInt(this.$('.widthInput').val()),
                height: parseInt(this.$('.heightInput').val())
            });
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

        createSection: function(rootSection) {
            var objects = [];
            if (rootSection.sections && rootSection.sections.length) {
                var mullion = new Konva.Rect({
                    stroke: 'black',
                    fill: 'white',
                    strokeWidth: 1
                });
                mullion.setAttrs(rootSection.mullionParams);
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
            var frameWidth = hasFrame ? this.model.get('sashFrameWidth') : 0;

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
                    if (type.indexOf('left') >= 0) {
                        ctx.moveTo(glassWidth, glassHeight);
                        ctx.lineTo(0, glassHeight / 2);
                        ctx.lineTo(glassWidth, 0);
                    }
                    if (type.indexOf('right') >= 0) {
                        ctx.moveTo(0, 0);
                        ctx.lineTo(glassWidth, glassHeight / 2);
                        ctx.lineTo(0, glassHeight);
                    }
                    if (type.indexOf('top') >= 0) {
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
                if (type.indexOf('left') >= 0 || type.indexOf('right') >= 0) {
                    var offset = frameWidth / 2;
                    var pos = {
                        x: null,
                        y: height / 2
                    };
                    if (type.indexOf('left') >= 0) {
                        pos.x = offset;
                    }
                    if (type.indexOf('right') >= 0) {
                        pos.x = width - offset;
                    }
                    var handle = new Konva.Shape({
                        x: pos.x,
                        y: pos.y,
                        stroke: 'black',
                        fill: 'rgba(0,0,0,0.2)',
                        sceneFunc: function(ctx) {
                            ctx.beginPath();
                            ctx.rect(-20, -20, 40, 50);
                            ctx.rect(-10, -5, 20, 70);
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
            var label = new Konva.Label();

            label.add(new Konva.Tag({
                fill: 'white',
                stroke: 'grey'
            }));
            var text = new Konva.Text({
                text: params.getter() + 'mm',
                padding: 2,
                fill: 'black'
            });

            label.add(text);
            label.position({
                x: -text.width() / 2,
                y: height / 2 - text.height() / 2
            });


            label.on('click tap', function() {
                this.createInput(params, label.getAbsolutePosition(), text.size());
            }.bind(this));

            group.add(lines, arrow, label);
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

            var label = new Konva.Label();

            label.add(new Konva.Tag({
                fill: 'white',
                stroke: 'grey'
            }));
            var text = new Konva.Text({
                text: params.getter() + 'mm',
                padding: 2,
                fill: 'black'
            });

            label.add(text);
            label.position({
                x: width / 2 - text.width() / 2,
                y: arrowOffset
            });

            label.on('click tap', function() {
                this.createInput(params, label.getAbsolutePosition(), text.size());
            }.bind(this));

            group.add(lines, arrow, label);
            return group;
        },

        createInfo: function(width, height) {
            var merticSize = 30;
            var group = new Konva.Group();
            var verticalRows = 0;
            var horizontalRows = 0;
            this.model.getMullions().forEach(function(mul) {
                var metric;
                if (mul.type === 'vertical') {
                    metric = this.createHorizontalMetric(mul.position * this.ratio, merticSize, {
                        setter: function(val) {
                            this.model.setSectionMullionPosition(mul.id, val);
                        }.bind(this),
                        getter: function() {
                            return mul.position;
                        }
                    });
                    metric.position({
                        x: 0,
                        y: height + horizontalRows * merticSize
                    });
                    group.add(metric);
                    horizontalRows += 1;
                } else {
                    metric = this.createVerticalMetric(merticSize, mul.position * this.ratio, {
                        setter: function(val) {
                            this.model.setSectionMullionPosition(mul.id, val);
                        }.bind(this),
                        getter: function() {
                            return mul.position;
                        }
                    });
                    metric.position({
                        x: -merticSize * (verticalRows + 1),
                        y: 0
                    });
                    group.add(metric);
                    verticalRows += 1;
                }
            }.bind(this));

            var verticalWholeMertic = this.createVerticalMetric(merticSize, height, {
                setter: function(val) {
                    this.model.set('height', val);
                }.bind(this),
                getter: function() {
                    return this.model.get('height');
                }.bind(this)
            });
            verticalWholeMertic.position({
                x: -merticSize * (verticalRows + 1),
                y: 0
            });

            group.add(verticalWholeMertic);

            var horizontalWholeMertic = this.createHorizontalMetric(width, merticSize, {
               setter: function(val) {
                    this.model.set('width', val);
                }.bind(this),
                getter: function() {
                    return this.model.get('width');
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
            $('<input type="number">')
                .val(params.getter())
                .css({
                    position: 'absolute',
                    top: (pos.y - padding) + 'px',
                    left: (pos.x - padding) + 'px',
                    height: (size.height + padding * 2) + 'px',
                    width: (size.width + padding * 2) + 'px',
                    fontSize: '12px'
                })
                .appendTo($wrap)
                .select()
                .on('keyup', function(e) {
                    if (e.keyCode === 13) {
                        params.setter(this.value);
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

            var frameWidth = this.model.get('width');
            var frameHeight = this.model.get('height');

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
            group.y(45.5);

            this.layer.add(group);


            var frameGroup = this.createFrame({
                width: this.model.get('width'),
                height: this.model.get('height'),
                frameWidth: this.model.get('frameWidth')
            });
            frameGroup.scale({x: ratio, y: ratio});
            group.add(frameGroup);


            var sectionsGroup = new Konva.Group();
            sectionsGroup.scale({x: ratio, y: ratio});
            group.add(sectionsGroup);

            var sections = this.createSection(this.model.generateFullRoot()/*, {
                x: this.model.get('frameWidth'),
                y: this.model.get('frameWidth'),
                width: this.model.get('width') - this.model.get('frameWidth') * 2,
                height: this.model.get('height') - this.model.get('frameWidth') * 2
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
