var app = app || {};

(function () {
    'use strict';

    var self;

    var module;
    var model;
    var ratio;

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
            var subunitsIndexesGroup = this.createSubunitsIndexes(subunitGroup);

            group.add(subunitGroup);
            group.add(connectorGroup);
            group.add(subunitsIndexesGroup);

            var center = module.get('center');
            // place unit on stage center
            group.position(center);

            connectorGroup.moveToTop();

            return group;
        },
        createSubunits: function () {
            var group = new Konva.Group({ name: 'subunits' });
            var tree = model.getSubunitsCoordinatesTree();

            model.subunitsTreeForEach(tree, function (node) {

                var previewImage = app.preview(node.unit, {
                    width: node.width * ratio,
                    height: node.height * ratio,
                    mode: 'image',
                    position: (module.getState('insideView')) ? 'inside' : 'outside',
                    metricSize: 0,
                    preview: true,
                    isMaximized: true,
                    drawIndexes: false
                });

                var konvaImage = new Konva.Image({
                    name: 'subunitPreview',
                    subunitId: node.unit.getId(),
                    image: previewImage,
                    x: node.x * ratio,
                    y: node.y * ratio
                });

                group.add(konvaImage);
            });

            return group;
        },
        createSubunitsIndexes: function () {
            var group = new Konva.Group({ name: 'subunit_indexes' });
            var tree = model.getSubunitsCoordinatesTree();
            var style = module.getStyle('subunit_indexes');

            model.subunitsTreeForEach(tree, function (node) {

                var subunitWidth = node.width * ratio;
                var subunitHeight = node.height * ratio;
                var subunitX = node.x * ratio;
                var subunitY = node.y * ratio;
                var label = new Konva.Label({ name: 'subunit_label' });

                label.add(new Konva.Tag({
                    fill: style.label.fill,
                    stroke: style.label.stroke,
                    strokeWidth: style.label.strokeWidth,
                    listening: false
                }));
                var text = new Konva.Text({
                    text: '1a',  // FIXME implement
                    padding: style.label.padding,
                    fill: style.label.color,
                    fontFamily: style.label.fontFamily,
                    fontSize: style.label.fontSize,
                    listening: false
                });
                label.add(text);

                label.position({
                    x: label.x() + subunitX + subunitWidth / 2 - label.width() / 2,
                    y: label.y() + subunitY + subunitHeight / 2 - label.height() / 2
                });

                group.add(label);
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
        createConnector: function (connector, options) {
            if (!connector) { return; }
            if (!(options && options.subunitKonvas)) { return; }

            var group = new Konva.Group({
                name: 'connector',
                connectorId: connector.id
            });

            // to millimetres
            var style = module.getStyle('frame').default;
            var parentSubunitId = model.getConnectorParentSubunitId(connector.id);

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
