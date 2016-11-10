var app = app || {};

(function () {
    'use strict';

    var self;

    var module;
    var model;
    var previewOpacity = 1;

    app.Drawers = app.Drawers || {};
    app.Drawers.MultiunitDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            self = this;

            module = params.builder;
            model = module.get('model');

            this.layer = params.layer;
            this.stage = params.stage;
        },
        el: function () {
            var group = new Konva.Group();

            return group;
        },
        render: function () {
            var subunitIds = model.get('multiunit_subunits');
            var previewImages = {};

            subunitIds.forEach(function (id, index) {
                var subunit = model.subunits.getById(id);
                var isOrigin = (index === 0);
                var parentId;
                var side;
                var gap;
                var offset;

                if (!isOrigin) {
                    var parentConnector = model.getParentConnector(id);
                    parentId = model.getParentSubunit(parentConnector.id);
                    side = parentConnector.side;
                    gap = parentConnector.width;
                    offset = parentConnector.offsets[1] + parentConnector.offsets[0];
                }

                previewImages[id] = app.preview(subunit, {
                    width: subunit.getInMetric('width', 'mm') * module.get('ratio'),
                    height: subunit.getInMetric('height', 'mm') * module.get('ratio'),
                    mode: 'image',
                    position: (module.getState('insideView')) ? 'inside' : 'outside',
                    metricSize: 0,
                    preview: true,
                    isMaximized: true
                });

                self.addPreview(previewImages[id], {
                    isOrigin: isOrigin,
                    parentImage: previewImages[parentId],
                    side: side,
                    gap: gap,
                    offset: offset,
                    opacity: previewOpacity
                });
            });


            // FIXME implement
        },
        events: {
            'click #back': 'onBackClick',
            'tap #back': 'onBackClick'
        },
        addPreview: function (image, options) {
            var adjustedX;
            var adjustedY;
            var stageCenterX = this.stage.width() / 2;
            var stageCenterY = this.stage.height() / 2;
            var width = image.width;
            var height = image.height;

            if (options.isOrigin) {
                adjustedX = stageCenterX - width / 2;
                adjustedY = stageCenterY - height / 2;
            } else if (options.parentImage) {
                // FIXME implement
                var parentKonva = this.getKonvaImage(options.parentImage);
                var parentX = parentKonva.getAttr('x');
                var parentY = parentKonva.getAttr('y');
                var parentWidth = options.parentImage.width;
                var parentHeight = options.parentImage.height;
                var gap = options.gap || 0;
                var offset = options.offset || 0;

                if (options.side && options.side === 'top') {
                    adjustedX = parentX + offset;
                    adjustedY = parentY - gap - height;
                } else if (options.side && options.side === 'right') {
                    adjustedX = parentX + parentWidth + gap;
                    adjustedY = parentY + offset;
                } else if (options.side && options.side === 'bottom') {
                    adjustedX = parentX + offset;
                    adjustedY = parentY + parentHeight + gap;
                } else if (options.side && options.side === 'left') {
                    adjustedX = parentX - gap - width;
                    adjustedY = parentY + offset;
                } else { return; }
            }

            var konvaImage = new Konva.Image({
                image: image,
                x: adjustedX,
                y: adjustedY,
                opacity: options.opacity
            });
            this.layer.add(konvaImage);
            this.layer.draw();

            // FIXME implement
        },
        getKonvaImage: function (image) {
            return this.layer.getChildren().filter(function (konvaImage) {
                return (konvaImage.getAttr('image') === image);
            })[0];
        }
    });
})();
