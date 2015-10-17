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
        },
        onRender: function(){
            this.stage = new Konva.Stage({
                container: this.$('#drawing').get(0)
            });

            this.layer = new Konva.Layer();
            this.stage.add(this.layer);

            this.heightInput = this.$('.heightInput').get(0);
            this.widthInput = this.$('.widthInput').get(0);

            this.widthInput.addEventListener('change', this.updateCanvas.bind(this));
            this.widthInput.addEventListener('input', this.updateCanvas.bind(this));

            this.heightInput.addEventListener('change', this.updateCanvas.bind(this));
            this.heightInput.addEventListener('input', this.updateCanvas.bind(this));

            // set default value
            this.widthInput.value = 1000;
            this.heightInput.value = 2000;


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

            group.add(glass, top, left, bottom, right);

            group.find('Line')
                .closed(true)
                .stroke('black')
                .strokeWidth(1);

            return group;
        },

        createInfo: function(frameWidth, frameHeight) {
            var offset = 20;

            var arrowOffset = offset / 2;
            var arrowSize = 5;

            var group = new Konva.Group();
            var lines = new Konva.Shape({
                sceneFunc: function(ctx) {
                    ctx.fillStyle = 'grey';
                    ctx.lineWidth = 0.5;

                    ctx.moveTo(0, 0);
                    ctx.lineTo(-offset, 0);

                    ctx.moveTo(0, frameHeight);
                    ctx.lineTo(-offset, frameHeight);

                    ctx.moveTo(0, frameHeight);
                    ctx.lineTo(0, frameHeight + offset);

                    ctx.moveTo(frameWidth, frameHeight);
                    ctx.lineTo(frameWidth, frameHeight + offset);

                    ctx.stroke();
                }
            });

            var leftArrow = new Konva.Shape({
                sceneFunc: function(ctx) {
                    // top pointer
                    ctx.moveTo(-arrowOffset - arrowSize, arrowSize);
                    ctx.lineTo(-arrowOffset, 0);
                    ctx.lineTo(-arrowOffset + arrowSize, arrowSize);

                    // line
                    ctx.moveTo(-arrowOffset, 0);
                    ctx.lineTo(-arrowOffset, frameHeight);

                    // bottom pointer
                    ctx.moveTo(-arrowOffset - arrowSize, frameHeight - arrowSize);
                    ctx.lineTo(-arrowOffset, frameHeight);
                    ctx.lineTo(-arrowOffset + arrowSize, frameHeight - arrowSize);

                    ctx.strokeShape(this);
                },
                stroke: 'grey',
                strokeWidth: 0.5
            });

            var bottomArrow = new Konva.Shape({
                sceneFunc: function(ctx) {
                    // top pointer
                    ctx.translate(0, frameHeight + arrowOffset);
                    ctx.moveTo(arrowSize, -arrowSize);
                    ctx.lineTo(0, 0);
                    ctx.lineTo(arrowSize, arrowSize);

                    // line
                    ctx.moveTo(0, 0);
                    ctx.lineTo(frameWidth, 0);

                    // bottom pointer
                    ctx.moveTo(frameWidth - arrowSize, -arrowSize);
                    ctx.lineTo(frameWidth, 0);
                    ctx.lineTo(frameWidth - arrowSize, arrowSize);

                    ctx.strokeShape(this);
                },
                stroke: 'grey',
                strokeWidth: 0.5
            });

            // left text
            var leftLabel = new Konva.Label();

            leftLabel.add(new Konva.Tag({
                fill: 'white',
                stroke: 'grey'
            }));
            var leftText = new Konva.Text({
                text: this.heightInput.value + 'mm',
                padding: 2,
                fill: 'black'
            });

            leftLabel.add(leftText);
            leftLabel.position({
                x: -arrowOffset - leftText.width(),
                y: frameHeight / 2 - leftText.height() / 2
            });


            leftLabel.on('click tap', function() {
                this.createInput('height', leftLabel.getAbsolutePosition(), leftText.size());
            }.bind(this));

            // bottom text
            var bottomLabel = new Konva.Label();

            bottomLabel.add(new Konva.Tag({
                fill: 'white',
                stroke: 'grey'
            }));
            var bottomText = new Konva.Text({
                text: this.widthInput.value + 'mm',
                padding: 2,
                fill: 'black'
            });

            bottomLabel.add(bottomText);
            bottomLabel.position({
                x: frameWidth / 2 - bottomText.width() / 2,
                y: frameHeight + arrowOffset
            });

            bottomLabel.on('click tap', function() {
                this.createInput('width', bottomLabel.getAbsolutePosition(), bottomText.size());
            }.bind(this));

            group.add(lines, leftArrow, bottomArrow, leftLabel, bottomLabel);

            return group;
        },
        createInput: function(metric, pos, size) {
            var wrap = document.createElement('div');
            wrap.style.position = 'absolute';
            wrap.style.backgroundColor = 'rgba(0,0,0,0.1)';
            wrap.style.top = 0;
            wrap.style.left = 0;
            wrap.style.width = '100%';
            wrap.style.height = '100%';
            wrap.style.zIndex = 1000;

            document.body.appendChild(wrap);

            var input = document.createElement('input');
            input.type = 'number';

            var similarInput = (metric === 'width' ? this.widthInput : this.heightInput);
            input.value = similarInput.value;

            input.style.position = 'absolute';
            input.style.top = pos.y + this.el.offsetTop + 3 + 'px';
            input.style.left = pos.x + this.el.offsetLeft + 'px';

            input.style.height = (size.height + 3) + 'px';
            input.style.width = (size.width + 3) + 'px';

            wrap.appendChild(input);

            input.addEventListener('change', function() {
                similarInput.value = input.value;
                this.updateCanvas();
            }.bind(this));

            input.addEventListener('input', function() {
                similarInput.value = input.value;
                this.updateCanvas();
            }.bind(this));

            wrap.addEventListener('click', function(e) {
                if (e.target === wrap) {
                    document.body.removeChild(wrap);
                }
            });


            input.addEventListener('keyup', function(e) {
                if (e.keyCode === 13) {
                    document.body.removeChild(wrap);
                }
            });
        },

        updateCanvas: function() {
            this.layer.children.destroy();

            var frameWidth = parseInt(this.widthInput.value, 10);
            var frameHeight = parseInt(this.heightInput.value, 10);



            var wr = this.stage.width() / frameWidth;
            var hr = this.stage.height() / frameHeight;

            var ratio = Math.min(wr, hr) * 0.8;

            var frameOnScreenWidth = frameWidth * ratio;
            var frameOnScreenHeight = frameHeight * ratio;

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
        }
    });
})();
