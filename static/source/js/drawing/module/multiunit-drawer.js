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
            var connectorGroup = this.createConnectors(subunitGroup);

            group.add(subunitGroup);
            group.add(connectorGroup);

            var center = module.get('center');
            // place unit on stage center
            group.position(center);

            connectorGroup.moveToTop();

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
                    width: subunit.getInMetric('width', 'mm') * ratio,
                    height: subunit.getInMetric('height', 'mm') * ratio,
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
            });

            return group;
        },
        createConnectors: function (subunitGroup) {
            if (!subunitGroup) { return; }

            var group = new Konva.Group({ name: 'connectors' });

            var nonOriginSubunits = _.tail(subunitGroup.getChildren());
            var connectorsKonvas = nonOriginSubunits.map(function (subunit) {
                var parentConnector = model.getParentConnector(subunit.getAttr('subunitId'));
                var connectorKonva = self.createConnector(parentConnector, { subunitKonvas: subunitGroup.getChildren() });
                return connectorKonva;
            });
            group.add.apply(group, connectorsKonvas);

            return group;
        },
        positionPreview: function (image, options) {
            var previewX;
            var previewY;
            // var stageCenterX = this.stage.width() / 2;
            // var stageCenterY = this.stage.height() / 2;
            var width = image.width;
            var height = image.height;

            if (options.isOrigin) {
                // previewX = stageCenterX - width / 2;
                // previewY = stageCenterY - height / 2;
                previewX = 0;
                previewY = 0;
            } else if (options.parentKonva) {
                var parentKonva = options.parentKonva;
                var parentX = parentKonva.x();
                var parentY = parentKonva.y();
                var parentWidth = parentKonva.width();
                var parentHeight = parentKonva.height();
                var gap = options.gap * ratio || 0;
                var offset = options.offset * ratio || 0;

                if (options.side && options.side === 'top') {
                    previewX = parentX + offset;
                    previewY = parentY - gap - height;
                } else if (options.side && options.side === 'right') {
                    previewX = parentX + parentWidth + gap;
                    previewY = parentY + offset;
                } else if (options.side && options.side === 'bottom') {
                    previewX = parentX + offset;
                    previewY = parentY + parentHeight + gap;
                } else if (options.side && options.side === 'left') {
                    previewX = parentX - gap - width;
                    previewY = parentY + offset;
                } else { return; }
            }

            var konvaImage = new Konva.Image({
                name: 'subunitPreview',
                subunitId: options.subunitId,
                image: image,
                x: previewX,
                y: previewY,
                opacity: options.opacity
            });

            return konvaImage;
        },
        createConnector: function (connector, options) {
            if (!connector) { return; }
            if (!(options && options.subunitKonvas)) { return; }

            var group = new Konva.Group({
                name: 'connector',
                connectorId: connector.id
            });

            // to millimetres
            var style = module.getStyle('frame').default;
            var parentSubunitId = model.getParentSubunit(connector.id);
            var parentKonva = options.subunitKonvas.filter(function (konva) {
                return (konva.getAttr('subunitId') === parentSubunitId);
            })[0];
            var parentWidth = parentKonva.width() / ratio;
            var parentHeight = parentKonva.height() / ratio;
            var parentX = parentKonva.x() / ratio;
            var parentY = parentKonva.y() / ratio;
            var side = connector.side;
            var offset = connector.offsets[0];
            var width = connector.width;
            var facewidth = (connector.facewidth) ? connector.facewidth : connector.width;
            var faceOverlap = (facewidth - width) / 2;
            var length = connector.length;
            var drawingWidth;
            var drawingHeight;
            var drawingX;
            var drawingY;

            if (side === 'top') {
                drawingWidth = length;
                drawingHeight = facewidth;
                drawingX = parentX + offset;
                drawingY = parentY - width - faceOverlap;
            } else if (side === 'right') {
                drawingWidth = facewidth;
                drawingHeight = length;
                drawingX = parentX + parentWidth - faceOverlap;
                drawingY = parentY + offset;
            } else if (side === 'bottom') {
                drawingWidth = length;
                drawingHeight = facewidth;
                drawingX = parentX + offset;
                drawingY = parentY + parentHeight - faceOverlap;
            } else if (side === 'left') {
                drawingWidth = facewidth;
                drawingHeight = length;
                drawingX = parentX - width - faceOverlap;
                drawingY = parentY + offset;
            } else { return; }

            var drawingFace = new Konva.Line({
                points: [
                    0, 0,
                    drawingWidth, 0,
                    drawingWidth, drawingHeight,
                    0, drawingHeight
                ]
            });

            group.add(drawingFace);
            group.children
                .closed(true)
                .stroke(style.stroke)
                .strokeWidth(style.strokeWidth)
                .fill(style.fill)
                .scale({ x: ratio, y: ratio })  // to pixels
                .position({ x: drawingX * ratio, y: drawingY * ratio });

            return group;
        }
    });
})();
