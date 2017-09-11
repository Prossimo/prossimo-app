import _ from 'underscore';
import Backbone from 'backbone';
import Konva from '../konva-clip-patch';

import {
    KEY_BACKSPACE,
    KEY_DELETE,
} from '../../../../constants';

export default Backbone.KonvaView.extend({
    initialize(params) {
        this._builder = params.builder;
        this._model = this._builder.get('model');
        this._isInside = this._builder.getState('insideView');
        this._ratio = this._builder.get('ratio');

        this.layer = params.layer;
        this.stage = params.stage;
    },
    el() {
        const group = new Konva.Group();

        return group;
    },
    render() {
        this._ratio = this._builder.get('ratio');
        this._isInside = this._builder.getState('insideView');

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
        'tap #back': 'onBackClick',
    },
    // Handlers
    onSubunitOverlayClick(event) {
        this.setSelection(event, 'subunit', 'subunit');
    },
    onBackClick() {
        this.deselectAll();
    },
    // Keyboards handlers
    onKeyDown(e) {
        if (e.keyCode === KEY_BACKSPACE || e.keyCode === KEY_DELETE) {
            e.preventDefault();
            this.removeSelected();
        }
    },
    // Selections
    setSelection(event, type) {
        const origin = event.target;

        this.deselectAll(true);

        if (type === 'subunit') {
            this._builder.setState('selected:subunit', origin.attrs.subunitId, false);
        }
    },
    deselectAll(preventUpdate) {
        this._builder.deselectAll(preventUpdate);
    },
    removeSelected() {
        const selectedSubunitId = this._builder.getState('selected:subunit');
        let selectedSubunit;

        if (selectedSubunitId) {
            selectedSubunit = this._model.getSubunitLinkedUnitById(selectedSubunitId);
            this._model.removeSubunit(selectedSubunit);
        }

        this.deselectAll();
    },
    createMultiunit() {
        const group = this.el;

        const subunitGroup = this.createSubunits();
        const connectorGroup = this.createConnectors(subunitGroup);
        const subunitsIndexesGroup = this.createSubunitsIndexes(subunitGroup);
        const subunitsOverlaysGroup = this.createSubunitsOverlays(subunitGroup);

        group.add(this.createBack());
        group.add(subunitGroup);
        group.add(connectorGroup);
        group.add(subunitsIndexesGroup);
        group.add(subunitsOverlaysGroup);

        const center = this._builder.get('center');
        // place unit on stage center
        group.position(center);

        connectorGroup.moveToTop();

        return group;
    },
    createSubunits() {
        const ratio = this._ratio;
        const isInside = this._isInside;
        const group = new Konva.Group({ name: 'subunits' });
        const tree = this._model.getSubunitsCoordinatesTree({ flipX: isInside });

        this._model.subunitsTreeForEach(tree, (node) => {
            const subunitGroup = node.unit.getPreview({
                width: node.width * ratio,
                height: node.height * ratio,
                mode: 'group',
                position: (isInside) ? 'inside' : 'outside',
                metricSize: 0,
                preview: true,
                isMaximized: true,
                drawIndexes: false,
                isSelected: (this._builder.getState('selected:subunit') === node.unit.id),
            });

            subunitGroup.setAttrs({
                name: 'subunit',
                subunitId: node.unit.id,
                x: node.x * ratio,
                y: node.y * ratio,
            });

            group.add(subunitGroup);
        });

        return group;
    },
    // Create transparent background to detect click on empty space
    createBack() {
        const back = new Konva.Rect({
            id: 'back',
            width: this.stage.width(),
            height: this.stage.height(),
        });

        return back;
    },
    createConnectors(subunitGroup) {
        if (!subunitGroup) {
            return undefined;
        }

        const self = this;
        const model = this._model;
        const isInside = this._isInside;
        const group = new Konva.Group({ name: 'connectors' });

        const nonOriginSubunits = _.tail(subunitGroup.getChildren());

        const connectorsKonvas = nonOriginSubunits.map((subunit) => {
            const parentConnector = model.getParentConnector(subunit.getAttr('subunitId'));
            const connectorKonva = self.createConnector(parentConnector, {
                subunitKonvas: subunitGroup.getChildren(),
                flipX: isInside,
            });
            return connectorKonva;
        });

        if (connectorsKonvas.length > 0) {
            group.add(...connectorsKonvas);
        }

        return group;
    },
    createConnector(connector, options) {
        if (!connector) { return undefined; }
        if (!(options && options.subunitKonvas)) { return undefined; }

        const ratio = this._ratio;
        const flipX = options && options.flipX;
        const group = new Konva.Group({
            name: 'connector',
            connectorId: connector.id,
        });

        // to millimetres
        const style = this._builder.getStyle('frame').default;
        const parentSubunitId = this._model.getConnectorParentSubunitId(connector.id);

        const parentKonva = options.subunitKonvas.filter(konva =>
            (konva.getAttr('subunitId') === parentSubunitId),
        )[0];
        const parentWidth = parentKonva.getClientRect().width / ratio;
        const parentHeight = parentKonva.getClientRect().height / ratio;
        const parentX = parentKonva.x() / ratio;
        const parentY = parentKonva.y() / ratio;
        const side = connector.side;
        const width = connector.width;
        const facewidth = (connector.facewidth) ? connector.facewidth : connector.width;
        const faceOverlap = (facewidth - width) / 2;
        const length = connector.length;
        let drawingWidth;
        let drawingHeight;
        let drawingX;
        let drawingY;

        if (side === 'top') {
            drawingWidth = length;
            drawingHeight = facewidth;
            drawingX = (flipX) ?
                (parentX + parentWidth) - length :
                parentX;
            drawingY = parentY - width - faceOverlap;
        } else if (side === 'right') {
            drawingWidth = facewidth;
            drawingHeight = length;
            drawingX = (flipX) ? parentX - width - faceOverlap : (parentX + parentWidth) - faceOverlap;
            drawingY = parentY;
        } else if (side === 'bottom') {
            drawingWidth = length;
            drawingHeight = facewidth;
            drawingX = (flipX) ? (parentX + parentWidth) - length : parentX;
            drawingY = (parentY + parentHeight) - faceOverlap;
        } else if (side === 'left') {
            drawingWidth = facewidth;
            drawingHeight = length;
            drawingX = (flipX) ? (parentX + parentWidth) - faceOverlap : parentX - width - faceOverlap;
            drawingY = parentY;
        } else {
            return undefined;
        }

        const drawingFace = new Konva.Line({
            points: [
                0, 0,
                drawingWidth, 0,
                drawingWidth, drawingHeight,
                0, drawingHeight,
            ],
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
    createSubunitsIndexes() {
        const ratio = this._ratio;
        const group = new Konva.Group({ name: 'subunit_indexes' });
        const tree = this._model.getSubunitsCoordinatesTree({ flipX: this._isInside });
        const style = this._builder.getStyle('subunit_indexes');

        this._model.subunitsTreeForEach(tree, (node) => {
            const subunitWidth = node.width * ratio;
            const subunitHeight = node.height * ratio;
            const subunitX = node.x * ratio;
            const subunitY = node.y * ratio;
            const label = new Konva.Label({ name: 'subunit_label' });

            label.add(new Konva.Tag({
                fill: style.label.fill,
                stroke: style.label.stroke,
                strokeWidth: style.label.strokeWidth,
                listening: false,
            }));

            const text = new Konva.Text({
                text: node.unit.getRefNum(),
                padding: style.label.padding,
                fill: style.label.color,
                fontFamily: style.label.fontFamily,
                fontSize: style.label.fontSize,
                listening: false,
            });
            label.add(text);

            label.position({
                x: (label.x() + subunitX + (subunitWidth / 2)) - (label.width() / 2),
                y: (label.y() + subunitY + (subunitHeight / 2)) - (label.height() / 2),
            });

            group.add(label);
        });

        return group;
    },
    createSubunitsOverlays(subunitGroup) {
        if (!subunitGroup) { return undefined; }

        const group = new Konva.Group({ name: 'subunitOverlays' });

        const subunitsKonvas = subunitGroup.getChildren();
        const overlaysKonvas = subunitsKonvas.map(subunit =>
            new Konva.Rect({
                name: 'subunitOverlay',
                subunitId: subunit.getAttr('subunitId'),
                x: subunit.x(),
                y: subunit.y(),
                width: subunit.getClientRect().width,
                height: subunit.getClientRect().height,
            }),
        );

        if (overlaysKonvas.length > 0) {
            group.add(...overlaysKonvas);
        }

        return group;
    },
});
