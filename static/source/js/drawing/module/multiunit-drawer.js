var app = app || {};

(function () {
    'use strict';

    app.Drawers = app.Drawers || {};
    app.Drawers.MultiunitDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            var self = this;

            this._module = params.builder;
            this._model = this._module.get('model');
            this._isInside = this._module.getState('insideView');

            this.layer = params.layer;
            this.stage = params.stage;
        },
        el: function () {
            var group = new Konva.Group();

            return group;
        },
        render: function () {
            this._ratio = this._module.get('ratio');
            this._isInside = this._module.getState('insideView');

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
            'click .subunitOverlay': 'onSubunitOverlayClick',
            'tap .subunitOverlay': 'onSubunitOverlayClick',

            'click #back': 'onBackClick',
            'tap #back': 'onBackClick'
        },
        // Handlers
        onSubunitOverlayClick: function (event) {
            this.setSelection(event, 'subunit', 'subunit');
        },
        onBackClick: function () {
            this.deselectAll();
        },

        // Keyboards handlers
        onKeyDown: function (e) {
            if (e.keyCode === 46 || e.keyCode === 8) {  // DEL or BACKSPACE
                e.preventDefault();
                this.removeSelected();
            }
        },

        // Selections
        setSelection: function (event, type) {
            var origin = event.target;
            this.deselectAll();

            if (type === 'subunit') {
                this._module.setState('selected:subunit', origin.attrs.subunitId, false);
            }
        },
        deselectAll: function (preventUpdate) {
            this._module.deselectAll(preventUpdate);
        },
        removeSelected: function () {
            var selectedSubunitId = this._module.getState('selected:subunit');
            var selectedSubunit;

            if (selectedSubunitId) {
                selectedSubunit = this._model.getSubunitById(selectedSubunitId);
                this._model.removeSubunit(selectedSubunit);
            }

            this.deselectAll();
        },

        createMultiunit: function () {
            var group = this.el;

            var subunitGroup = this.createSubunits();
            var connectorGroup = this.createConnectors(subunitGroup);
            var subunitsIndexesGroup = this.createSubunitsIndexes(subunitGroup);
            var subunitsOverlaysGroup = this.createSubunitsOverlays(subunitGroup);

            group.add(this.createBack());
            group.add(subunitGroup);
            group.add(connectorGroup);
            group.add(subunitsIndexesGroup);
            group.add(subunitsOverlaysGroup);

            var center = this._module.get('center');
            // place unit on stage center
            group.position(center);

            connectorGroup.moveToTop();

            return group;
        },
        createSubunits: function () {
            var module = this._module;
            var ratio = this._ratio;
            var isInside = this._isInside;
            var group = new Konva.Group({ name: 'subunits' });
            var tree = this._model.getSubunitsCoordinatesTree({ flipX: isInside });

            this._model.subunitsTreeForEach(tree, function (node) {
                var subunitGroup = node.unit.getPreview({
                    width: node.width * ratio,
                    height: node.height * ratio,
                    mode: 'group',
                    position: (isInside) ? 'inside' : 'outside',
                    metricSize: 0,
                    preview: true,
                    isMaximized: true,
                    drawIndexes: false,
                    isSelected: (module.getState('selected:subunit') === node.unit.id)
                });

                subunitGroup.setAttrs({
                    name: 'subunit',
                    subunitId: node.unit.id,
                    x: node.x * ratio,
                    y: node.y * ratio
                });

                group.add(subunitGroup);
            });

            return group;
        },
        // Create transparent background to detect click on empty space
        createBack: function () {
            var back = new Konva.Rect({
                id: 'back',
                width: this.stage.width(),
                height: this.stage.height()
            });

            return back;
        },
        createConnectors: function (subunitGroup) {
            if (!subunitGroup) { return; }

            var self = this;
            var model = this._model;
            var isInside = this._isInside;
            var group = new Konva.Group({ name: 'connectors' });

            var nonOriginSubunits = _.tail(subunitGroup.getChildren());
            var connectorsKonvas = nonOriginSubunits.map(function (subunit) {
                var parentConnector = model.getParentConnector(subunit.getAttr('subunitId'));
                var connectorKonva = self.createConnector(parentConnector, {
                    subunitKonvas: subunitGroup.getChildren(),
                    flipX: isInside
                });
                return connectorKonva;
            });
            if (connectorsKonvas.length > 0) {
                group.add.apply(group, connectorsKonvas);
            }

            return group;
        },
        createConnector: function (connector, options) {
            if (!connector) { return; }
            if (!(options && options.subunitKonvas)) { return; }

            var ratio = this._ratio;
            var flipX = options && options.flipX;
            var group = new Konva.Group({
                name: 'connector',
                connectorId: connector.id
            });

            // to millimetres
            var style = this._module.getStyle('frame').default;
            var parentSubunitId = this._model.getConnectorParentSubunitId(connector.id);

            var parentKonva = options.subunitKonvas.filter(function (konva) {
                return (konva.getAttr('subunitId') === parentSubunitId);
            })[0];
            var parentWidth = parentKonva.getClientRect().width / ratio;
            var parentHeight = parentKonva.getClientRect().height / ratio;
            var parentX = parentKonva.x() / ratio;
            var parentY = parentKonva.y() / ratio;
            var side = connector.side;
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
                drawingX = (flipX) ?
                    parentX + parentWidth - length :
                    parentX;
                drawingY = parentY - width - faceOverlap;
            } else if (side === 'right') {
                drawingWidth = facewidth;
                drawingHeight = length;
                drawingX = (flipX) ?
                    parentX - width - faceOverlap :
                    parentX + parentWidth - faceOverlap;
                drawingY = parentY;
            } else if (side === 'bottom') {
                drawingWidth = length;
                drawingHeight = facewidth;
                drawingX = (flipX) ?
                    parentX + parentWidth - length :
                    parentX;
                drawingY = parentY + parentHeight - faceOverlap;
            } else if (side === 'left') {
                drawingWidth = facewidth;
                drawingHeight = length;
                drawingX = (flipX) ?
                    parentX + parentWidth - faceOverlap :
                    parentX - width - faceOverlap;
                drawingY = parentY;
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
        },
        createSubunitsIndexes: function () {
            var ratio = this._ratio;
            var group = new Konva.Group({ name: 'subunit_indexes' });
            var tree = this._model.getSubunitsCoordinatesTree({ flipX: this._isInside });
            var style = this._module.getStyle('subunit_indexes');

            this._model.subunitsTreeForEach(tree, function (node) {

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
                    text: node.unit.getRefNum(),
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
        createSubunitsOverlays: function (subunitGroup) {
            if (!subunitGroup) { return; }

            var group = new Konva.Group({ name: 'subunitOverlays' });

            var subunitsKonvas = subunitGroup.getChildren();
            var overlaysKonvas = subunitsKonvas.map(function (subunit) {
                return new Konva.Rect({
                    name: 'subunitOverlay',
                    subunitId: subunit.getAttr('subunitId'),
                    x: subunit.x(),
                    y: subunit.y(),
                    width: subunit.getClientRect().width,
                    height: subunit.getClientRect().height
                });
            });
            if (overlaysKonvas.length > 0) {
                group.add.apply(group, overlaysKonvas);
            }

            return group;
        }
    });
})();
