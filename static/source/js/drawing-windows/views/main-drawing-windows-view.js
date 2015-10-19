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
            this.active_drawing = new app.WindowDrawing();
            this.active_drawing.set({
                width: 1000,
                height: 2000
            });
            this.listenTo(this.active_drawing, 'all', this.updateCanvas);
        },
        events: {
            'click .add-vertical-million': 'addVerticalMullion',
            'click .add-horizontal-million': 'addHorizontalMullion',
            'click .popup-wrap': function(e) {
                var el = $(e.target);
                if (el.hasClass('popup-wrap')) {
                    el.hide();
                }
            }
        },

        onRender: function(){
            this.stage = new Konva.Stage({
                container: this.$('#drawing').get(0)
            });

            this.layer = new Konva.Layer();
            this.stage.add(this.layer);

            this.heightInput = this.$('.heightInput');
            this.widthInput = this.$('.widthInput')

            this.widthInput.on('change input', function() {
                this.active_drawing.set('width', parseInt(this.widthInput.val()))
            }.bind(this));

            this.heightInput.on('change input', function() {
                this.active_drawing.set('height', parseInt(this.heightInput.val()))
            }.bind(this));

            // set default value
            this.widthInput.val(this.active_drawing.get('width'));
            this.heightInput.val(this.active_drawing.get('height'));


            // do we have "afterRender" callback?!?
            setTimeout(function() {
                this.updateSize();
                this.updateCanvas();
            }.bind(this), 10);
        },
        onDestroy: function() {
            this.stage.destroy();
        },


        updateSize: function() {
            this.stage.width(this.el.offsetWidth);
            this.stage.height(this.el.offsetHeight);
        },
        createFrame: function(frameWidth, frameHeight) {
            var padding = 70;
            var group = new Konva.Group();
            var top = new Konva.Line({
                points: [
                    0, 0,
                    frameWidth, 0,
                    frameWidth - padding, padding,
                    padding, padding
                ]
            });

            var left = new Konva.Line({
                points: [
                    0, 0,
                    padding, padding,
                    padding, frameHeight - padding,
                    0, frameHeight
                ]
            });

            var bottom = new Konva.Line({
                points: [
                    0, frameHeight,
                    padding, frameHeight - padding,
                    frameWidth - padding, frameHeight - padding,
                    frameWidth, frameHeight
                ]
            });

            var right = new Konva.Line({
                points: [
                    frameWidth, 0,
                    frameWidth, frameHeight,
                    frameWidth - padding, frameHeight - padding,
                    frameWidth - padding, padding
                ]
            });

            var glass = new Konva.Rect({
                x: padding,
                y: padding,
                width: frameWidth - padding * 2,
                height: frameHeight - padding * 2,
                fill: 'lightblue'
            });


            glass.on('click', this.showPopup.bind(this));

            group.add(glass, top, left, bottom, right);

            group.find('Line')
                .closed(true)
                .stroke('black')
                .strokeWidth(1)
                .fill('white');

            // draw mullions
            var mullionWidth = 92;
            var mullion;
            if (this.active_drawing.get('verticalMullion')) {
                var x = this.active_drawing.get('verticalMullionX');
                mullion = new Konva.Rect({
                    x: Math.round(x - mullionWidth / 2),
                    y: padding,
                    width: mullionWidth,
                    height: frameHeight - padding * 2,
                    stroke: 'black',
                    fill: 'white',
                    strokeWidth: 1
                });
                group.add(mullion);
            } else if (this.active_drawing.get('horizontalMullion')) {
                var y = this.active_drawing.get('horizontalMullionY');
                console.log(y);
                mullion = new Konva.Rect({
                    x: padding,
                    y: Math.round(y - mullionWidth / 2),
                    width: frameWidth - padding * 2,
                    height: mullionWidth,
                    stroke: 'black',
                    fill: 'white',
                    strokeWidth: 1
                });
                group.add(mullion);
            }

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
                text: this.active_drawing.get(modelMetric) + 'mm',
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
                text: this.active_drawing.get(modelMetric) + 'mm',
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

            if (this.active_drawing.get('horizontalMullion')) {
                verticalWholeMertic.move({x: -merticSize});
                var height = this.active_drawing.get('horizontalMullionY') * this.ratio;
                var topMetric = this.createVerticalMetric(merticSize, height, 'horizontalMullionY');
                topMetric.position({
                    x: -merticSize,
                    y: 0
                });
                // var bottomMetric = this.createVerticalMetric(merticSize, frameHeight / 2, 'verticalMullionSubX');
                // bottomMetric.position({
                //     x: -merticSize,
                //     y: frameHeight / 2
                // });
                group.add(topMetric);

            }

            if (this.active_drawing.get('verticalMullion')) {
                horizontalWholeMertic.move({y: merticSize});
                var width = this.active_drawing.get('verticalMullionX') * this.ratio;
                var leftMetric = this.createHorizontalMetric(width, merticSize, 'verticalMullionX');
                leftMetric.position({
                    x: 0,
                    y: frameHeight
                });
                // var rightMetric = this.createHorizontalMetric(frameWidth / 2, merticSize);
                // rightMetric.position({
                //     x: frameWidth / 2,
                //     y: frameHeight
                // });
                group.add(leftMetric);
            }

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

            document.body.appendChild(wrap);
            wrap.addEventListener('click', function(e) {
                if (e.target === wrap) {
                    document.body.removeChild(wrap);
                }
            });

            return wrap;
        },
        createInput: function(metric, pos, size) {
            var wrap = this.createWrap();
            var input = document.createElement('input');
            input.type = 'number';

            // var similarInput = (metric === 'width' ? this.widthInput : this.heightInput);
            input.value = this.active_drawing.get(metric);

            input.style.position = 'absolute';
            input.style.top = pos.y + this.el.offsetTop + 3 + 'px';
            input.style.left = pos.x + this.el.offsetLeft + 'px';

            input.style.height = (size.height + 3) + 'px';
            input.style.width = (size.width + 3) + 'px';

            wrap.appendChild(input);

            input.addEventListener('change', function() {
                this.active_drawing.set(metric, input.value);
            }.bind(this));

            input.addEventListener('input', function() {
                this.active_drawing.set(metric, input.value);
            }.bind(this));



            input.addEventListener('keyup', function(e) {
                if (e.keyCode === 13) {
                    document.body.removeChild(wrap);
                }
            });
        },
        showPopup: function(e) {
            var pos = this.stage.getPointerPosition();
            var x = pos.x - 5;
            var y = pos.y - 5;

            var $popupWrap = this.$('.popup-wrap');
            $popupWrap
            .show()
            .find('.popup')
            .css({
                top: y,
                left: x
            });
        },
        updateCanvas: function() {
            this.layer.children.destroy();

            var frameWidth = this.active_drawing.get('width');
            var frameHeight = this.active_drawing.get('height');



            var wr = this.stage.width() / frameWidth;
            var hr = this.stage.height() / frameHeight;

            var ratio = Math.min(wr, hr) * 0.8;

            var frameOnScreenWidth = frameWidth * ratio;
            var frameOnScreenHeight = frameHeight * ratio;
            this.ratio = ratio;

            var group = new Konva.Group({
            });

            group.x(Math.round(this.stage.width() / 2 - frameOnScreenWidth / 2) + 0.5);
            group.y(Math.round(this.stage.height() / 2 - frameOnScreenHeight / 2) + 0.5);

            this.layer.add(group);

            var frameGroup = this.createFrame(frameWidth, frameHeight);
            frameGroup.scale({x: ratio, y: ratio});
            group.add(frameGroup);

            var infoGroup = this.createInfo(frameOnScreenWidth, frameOnScreenHeight);
            group.add(infoGroup);

            this.layer.draw();
        },

        addVerticalMullion: function() {
            console.log(this.active_drawing.get('width') / 2, '!!');
            this.active_drawing.set({
                verticalMullion: true,
                horizontalMullion: false,
                verticalMullionX: this.active_drawing.get('width') / 2
            });
            this.$('.mullion-wrap').hide();
        },
        addHorizontalMullion: function() {
            this.active_drawing.set({
                verticalMullion: false,
                horizontalMullion: true,
                horizontalMullionY: this.active_drawing.get('height') / 2
            });
            this.$('.mullion-wrap').hide();
        }
    });
})();
