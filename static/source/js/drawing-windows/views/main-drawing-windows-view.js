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

            this.disableContextMenu();
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

        // we have to disable context menu for canvas
        // as we need to enable right click
        disableContextMenu: function() {
            // Trigger action when the contexmenu is about to be shown
            $(document).bind('contextmenu', function (event) {
                var isOnDrawing = $(event.target).parents('#drawing').length > 0;
                if (!isOnDrawing) {
                    return;
                }
                // don't show native context menu
                event.preventDefault();
            });
        },

        createRootWindow: function() {
            var frameWidth = this.model.get('frameWidth');  // in mm
            var width = this.model.get('width');
            var height = this.model.get('height');

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

        createSection: function(rootSection, params) {
            var objects = [];
            if (rootSection.sections) {

                // find mullion position
                var position = rootSection.position;
                var mullionAttrs = {
                    x: null, y: null, width: null, height: null
                };
                if (rootSection.devider === 'vertical') {
                    mullionAttrs.x = params.x + position - this.model.get('mullionWidth') / 2;
                    mullionAttrs.y = params.y;
                    mullionAttrs.width = this.model.get('mullionWidth');
                    mullionAttrs.height = params.height;

                } else {
                    mullionAttrs.x = params.x;
                    mullionAttrs.y = params.y + position - this.model.get('mullionWidth') / 2;
                    mullionAttrs.width = params.width;
                    mullionAttrs.height = this.model.get('mullionWidth');
                }
                var mullion = new Konva.Rect({
                    stroke: 'black',
                    fill: 'white',
                    strokeWidth: 1
                });
                mullion.setAttrs(mullionAttrs);
                objects.push(mullion);

                // draw each child section
                rootSection.sections.forEach(function(sectionData, i) {
                    var sectionParams = {
                        x: null, y: null, width: null, height: null
                    };
                    if (rootSection.devider === 'vertical') {
                        sectionParams.x = params.x + position * i + this.model.get('mullionWidth') / 2 * i;
                        sectionParams.y = params.y;
                        if (i === 0) {
                            sectionParams.width = position - this.model.get('mullionWidth') / 2;
                        } else {
                            sectionParams.width = params.width - position - this.model.get('mullionWidth') / 2;
                        }
                        sectionParams.height = params.height;
                    } else {
                        sectionParams.x = params.x;
                        sectionParams.y = params.y + position * i + this.model.get('mullionWidth') / 2 * i;
                        sectionParams.width = params.width;
                        if (i === 0) {
                            sectionParams.height = position - this.model.get('mullionWidth') / 2;
                        } else {
                            sectionParams.height = params.height - position - this.model.get('mullionWidth') / 2;
                        }
                    }

                    objects = objects.concat(this.createSection(sectionData, sectionParams));
                }.bind(this));
            } else {
                var sash = this.createSash(rootSection, params);
                objects.push(sash);
            }

            return objects;
        },

        createSash: function(sectionData, params) {
            var group = new Konva.Group();
            var glass = new Konva.Rect({
                x: params.x,
                y: params.y,
                width: params.width,
                height: params.height,
                fill: 'lightblue',
                id: sectionData.id
            });
            group.add(glass);
            glass.on('click', this.showPopup.bind(this, sectionData.id));
            var type = sectionData.sashType;
            var directionLine = new Konva.Shape({
                stroke: 'black',
                x: params.x,
                y: params.y,
                sceneFunc: function(ctx) {
                    ctx.beginPath();
                    if (type.indexOf('left') >= 0) {
                        ctx.moveTo(params.width, params.height);
                        ctx.lineTo(0, params.height / 2);
                        ctx.lineTo(params.width, 0);
                    }
                    if (type.indexOf('right') >= 0) {
                        ctx.moveTo(0, 0);
                        ctx.lineTo(params.width, params.height / 2);
                        ctx.lineTo(0, params.height);
                    }
                    if (type.indexOf('top') >= 0) {
                        ctx.moveTo(0, params.height);
                        ctx.lineTo(params.width / 2, 0);
                        ctx.lineTo(params.width, params.height);
                    }
                    ctx.strokeShape(this);
                }
            });
            group.add(directionLine);
            return group;
        },
        createVerticalMetric: function(width, height, modelMetric) {
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
                text: this.model.get(modelMetric) + 'mm',
                padding: 2,
                fill: 'black'
            });

            label.add(text);
            label.position({
                x: -text.width() / 2,
                y: height / 2 - text.height() / 2
            });


            label.on('click tap', function() {
                this.createInput(modelMetric, label.getAbsolutePosition(), text.size());
            }.bind(this));

            group.add(lines, arrow, label);
            return group;
        },

        createHorizontalMetric: function(width, height, modelMetric) {
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
                text: this.model.get(modelMetric) + 'mm',
                padding: 2,
                fill: 'black'
            });

            label.add(text);
            label.position({
                x: width / 2 - text.width() / 2,
                y: arrowOffset
            });

            label.on('click tap', function() {
                this.createInput(modelMetric, label.getAbsolutePosition(), text.size());
            }.bind(this));

            group.add(lines, arrow, label);
            return group;
        },

        createInfo: function(frameWidth, frameHeight) {
            var merticSize = 30;
            var group = new Konva.Group();

            var verticalWholeMertic = this.createVerticalMetric(merticSize, frameHeight, 'height');
            verticalWholeMertic.position({
                x: -merticSize,
                y: 0
            });

            group.add(verticalWholeMertic);

            var horizontalWholeMertic = this.createHorizontalMetric(frameWidth, merticSize, 'width');
            horizontalWholeMertic.position({
                x: 0,
                y: frameHeight
            });
            group.add(horizontalWholeMertic);

            // if (this.model.get('horizontalMullion')) {
            //     verticalWholeMertic.move({x: -merticSize});
            //     var height = this.model.get('horizontalMullionY') * this.ratio;
            //     var topMetric = this.createVerticalMetric(merticSize, height, 'horizontalMullionY');
            //     topMetric.position({
            //         x: -merticSize,
            //         y: 0
            //     });
            //     // var bottomMetric = this.createVerticalMetric(merticSize, frameHeight / 2, 'verticalMullionSubX');
            //     // bottomMetric.position({
            //     //     x: -merticSize,
            //     //     y: frameHeight / 2
            //     // });
            //     group.add(topMetric);

            // }

            // if (this.model.get('verticalMullion')) {
            //     horizontalWholeMertic.move({y: merticSize});
            //     var width = this.model.get('verticalMullionX') * this.ratio;
            //     var leftMetric = this.createHorizontalMetric(width, merticSize, 'verticalMullionX');
            //     leftMetric.position({
            //         x: 0,
            //         y: frameHeight
            //     });
            //     // var rightMetric = this.createHorizontalMetric(frameWidth / 2, merticSize);
            //     // rightMetric.position({
            //     //     x: frameWidth / 2,
            //     //     y: frameHeight
            //     // });
            //     group.add(leftMetric);
            // }

            return group;
        },
        createWrap: function() {
            var wrap = document.createElement('div');
            wrap.style.position = 'absolute';
            wrap.style.backgroundColor = 'rgba(0,0,0,0.1)';
            wrap.style.top = 0;
            wrap.style.left = 0;
            wrap.style.width = '100%';
            wrap.style.height = '100%';
            wrap.style.zIndex = 1000;

            this.$el.append(wrap);
            wrap.addEventListener('click', function(e) {
                if (e.target === wrap) {
                    $(wrap).remove();
                }
            });

            return wrap;
        },
        createInput: function(metric, pos, size) {
            var wrap = this.createWrap();
            var input = document.createElement('input');
            input.type = 'number';
            input.value = this.model.get(metric);

            var padding = 3;
            input.style.position = 'absolute';
            input.style.top = (pos.y - padding) + 'px';
            input.style.left = (pos.x - padding) + 'px';

            input.style.height = (size.height + padding * 2) + 'px';
            input.style.width = (size.width + padding * 2) + 'px';
            input.style.fontSize = '12px';


            wrap.appendChild(input);
            input.focus();

            input.addEventListener('change', function() {
                this.model.set(metric, input.value);
            }.bind(this));

            input.addEventListener('input', function() {
                this.model.set(metric, input.value);
            }.bind(this));



            input.addEventListener('keyup', function(e) {
                if (e.keyCode === 13) {
                    document.body.removeChild(wrap);
                }
            });
        },
        showPopup: function(id, e) {
            this.sectionIdToChange = id;
            var popupType;
            if (e.evt.which === 3) {
                popupType = 'mullion';
            }
            if (e.evt.which === 1) {
                popupType = 'sash';
            }
            var pos = this.stage.getPointerPosition();
            var x = pos.x - 5;
            var y = pos.y - 5;

            this.$('.' + popupType + '-wrap')
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


            var frameGroup = this.createRootWindow(frameWidth, frameHeight);
            frameGroup.scale({x: ratio, y: ratio});
            group.add(frameGroup);


            var sectionsGroup = new Konva.Group();
            sectionsGroup.scale({x: ratio, y: ratio});
            group.add(sectionsGroup);

            var sections = this.createSection(this.model.get('rootSection'), {
                x: this.model.get('frameWidth'),
                y: this.model.get('frameWidth'),
                width: this.model.get('width') - this.model.get('frameWidth') * 2,
                height: this.model.get('height') - this.model.get('frameWidth') * 2
            });

            sectionsGroup.add.apply(sectionsGroup, sections);

            var infoGroup = this.createInfo(frameOnScreenWidth, frameOnScreenHeight);
            group.add(infoGroup);

            this.layer.draw();
        },

        splitSection: function(e) {
            this.$('.mullion-wrap').hide();
            var devider = $(e.target).data('type');
            this.model.splitSection(this.sectionIdToChange, devider);
        },
        changeSashType: function(e) {
            this.$('.sash-wrap').hide();
            var type = $(e.target).data('type');
            this.model.setSectionSashType(this.sectionIdToChange, type);
        }
    });
})();
