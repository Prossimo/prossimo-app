var app = app || {};

(function () {
    'use strict';

    var self;

    var module;
    var model;
    var ratio;

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
            ratio = module.get('ratio');

            // Clear all previous objects
            this.layer.destroyChildren();
            // Creating unit and adding it to layer
            this.layer.add(this.createMultiunit());
            // Draw layer
            this.layer.draw();

            // Detaching and attaching events
            this.undelegateEvents();
            this.delegateEvents();
        },
        events: {
            'click #back': 'onBackClick',
            'tap #back': 'onBackClick'
        },
        createMultiunit: function () {
            var group = this.el;

            var subunitGroup = this.createSubunits();
            // var connectorGroup = this.createConnectors();

            group.add(subunitGroup);
            // group.add(connectorGroup);

            var center = module.get('center');
            // place unit on stage center
            group.position(center);

            // connectorGroup.moveToTop();

            return group;
        },
        createSubunits: function () {
            var group = new Konva.Group({ name: 'subunits' });
            var subunitIds = model.get('multiunit_subunits');

            subunitIds.forEach(function (id, index) {
                var subunit = model.subunits.getById(id);
                var isOrigin = (index === 0);
                var previewImage;
                var parentId;
                var parentKonva;
                var side;
                var gap;
                var offset;

                if (!isOrigin) {
                    var parentConnector = model.getParentConnector(id);
                    parentId = model.getParentSubunit(parentConnector.id);
                    side = parentConnector.side;
                    gap = parentConnector.width;
                    offset = parentConnector.offsets[1] + parentConnector.offsets[0];
                    parentKonva = group.getChildren(function (konvaImage) {
                        return (konvaImage.getAttr('subunitId') === parentId);
                    })[0];
                }

                previewImage = app.preview(subunit, {
                    width: subunit.getInMetric('width', 'mm') * module.get('ratio'),
                    height: subunit.getInMetric('height', 'mm') * module.get('ratio'),
                    mode: 'image',
                    position: (module.getState('insideView')) ? 'inside' : 'outside',
                    metricSize: 0,
                    preview: true,
                    isMaximized: true
                });

                var positionedPreview = self.positionPreview(previewImage, {
                    subunitId: id,
                    isOrigin: isOrigin,
                    parentKonva: parentKonva,
                    side: side,
                    gap: gap,
                    offset: offset,
                    opacity: previewOpacity
                });

                group.add(positionedPreview);
                // if (parentConnector) {
                //     var connector = this.createConnector(parentConnector);
                // }
            });

            return group;
        },
        createConnectors: function () {
            var group = new Konva.Group({ name: 'connectors' });

            // FIXME implement
        },
        positionPreview: function (image, options) {
            var adjustedX;
            var adjustedY;
            var stageCenterX = this.stage.width() / 2;
            var stageCenterY = this.stage.height() / 2;
            var width = image.width;
            var height = image.height;

            if (options.isOrigin) {
                adjustedX = stageCenterX - width / 2;
                adjustedY = stageCenterY - height / 2;
            } else if (options.parentKonva) {
                var parentKonva = options.parentKonva;
                var parentX = parentKonva.x();
                var parentY = parentKonva.y();
                var parentWidth = parentKonva.width();
                var parentHeight = parentKonva.height();
                var gap = options.gap * ratio || 0;
                var offset = options.offset * ratio || 0;

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
                name: 'subunitPreview',
                subunitId: options.subunitId,
                image: image,
                x: adjustedX,
                y: adjustedY,
                opacity: options.opacity
            });

            return konvaImage;
        },
        createConnector: function (connector) {
            if (!connector) { return; }

            var style = module.getStyle('frame').default;
            var width;  // in mm
            var height;

            if (connector.side === 'top' || connector.side === 'bottom') {
                width = connector.length;
                height = (connector.facewidth) ? connector.facewidth : connector.width;
            } else if (connector.side === 'right' || connector.side === 'left') {
                width = (connector.facewidth) ? connector.facewidth : connector.width;
                height = connector.length;
            } else { return; }

            var group = new Konva.Group({
                name: 'connector',
                connectorId: connector.id
            });

            var connectorFace = new Konva.Line({
                points: [
                    0, 0,
                    width, 0,
                    width, height,
                    0, height
                ]
            });

            group.add(connectorFace);

            group.children
                .closed(true)
                .stroke(style.stroke)
                .strokeWidth(style.strokeWidth)
                .fill(style.fill);

            return group;
        }
    });
})();
