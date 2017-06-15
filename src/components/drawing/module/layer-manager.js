import _ from 'underscore';
import Marionette from 'backbone.marionette';

import Drawers from './drawers';
import KonvaClipPatch from './konva-clip-patch';

// LayerManager is an important and required part of the DrawingModule,
// it's used for creating, storing and working with stage layers. Also, it
// tranfers keyboard events from view to drawers

export default Marionette.Object.extend({
    initialize(opts) {
        this.layers = {};

        this.trapezoid = opts.builder.get('model').isTrapezoid();
        this.createLayers(opts.layers);

        // Start listening update on builder
        this.listenTo(this.getOption('builder'), 'update', this.update);
    },
    // Create layers on init
    createLayers(layerOpts) {
        const defaultLayer = {
            zIndex: 0,
            visible: true,
            active: true,
        };

        const defaultLayers = {
            unit: {
                DrawerClass: (this.trapezoid) ? Drawers.TrapezoidUnitDrawer : Drawers.UnitDrawer,
                zIndex: 0,
                visible: true,
                active: true,
            },
            metrics: {
                DrawerClass: Drawers.MetricsDrawer,
                zIndex: 1,
                visible: true,
                active: true,
            },
        };

        const layers = _.defaults(layerOpts, defaultLayers);

        _.each(layerOpts, (layer, key) => {
            if (key in layers && layer.active === false) {
                delete layers[key];
            } else if (Object.prototype.hasOwnProperty.call(defaultLayers, key)) {
                _.defaults(layer, defaultLayers[key]);
            } else {
                _.defaults(layer, defaultLayer);
            }
        });

        this.addLayers(layers, this.getOption('stage'));
    },
    // Add/Remove/Get layers
    addLayer(name, opts, stage) {
        const data = opts;

        if (data.DrawerClass !== null) {
            data.layer = new KonvaClipPatch.Layer();
            stage.add(data.layer);

            data.name = name;
            data.drawer = new data.DrawerClass({
                layer: data.layer,
                stage: this.getOption('stage'),
                builder: this.getOption('builder'),
                metricSize: this.getOption('metricSize'),
                data: data.data,
            });
            this.layers[name] = data;
        } else {
            throw new Error(`You must specify DrawerClass for a new layer (layer name: ${name})`);
        }

        return data;
    },
    addLayers(layers, stage) {
        _.each(layers, (value, key) => {
            this.addLayer(key, value, stage);
        });

        return this.getLayers();
    },
    removeLayer(name) {
        if (name in this.layers) {
            delete this.layers[name];
        }

        return true;
    },
    getLayer(name) {
        let result = null;

        if (name in this.layers) {
            result = this.layers[name];
        }

        return result;
    },
    getLayers(asArray) {
        let result;

        if (asArray) {
            result = Array.from(this.layers);

            result.sort((a, b) => a.zIndex > b.zIndex);
        } else {
            result = this.layers;
        }

        return result;
    },
    // Iterate each layer
    each(callback) {
        _.each(this.layers, callback);
    },
    update() {
        const self = this;
        const isTrapezoidDrawer =
            this.getLayer('unit') &&
            this.getLayer('unit').drawer.constructor === Drawers.TrapezoidUnitDrawer;
        const isTrapezoid = this.getOption('builder').get('model').isTrapezoid();

        this.trapezoid = isTrapezoid;

        this.each((layer) => {
            if (layer.name === 'unit' && isTrapezoid && !isTrapezoidDrawer) {
                self.toTrapezoidDrawer();
            } else if (layer.name === 'unit' && !isTrapezoid && isTrapezoidDrawer) {
                self.toRegularDrawer();
            }

            if (layer.visible) {
                layer.drawer.render();
            }
        });
    },
    // Switch unit DrawerClass
    toDrawer(drawerType) {
        const unitLayer = this.getOption('layers').unit;
        const DrawerClass = (drawerType === 'trapezoid') ? Drawers.TrapezoidUnitDrawer : Drawers.UnitDrawer;

        unitLayer.drawer = new DrawerClass({
            layer: unitLayer.layer,
            stage: this.getOption('stage'),
            builder: this.getOption('builder'),
            metricSize: this.getOption('metricSize'),
            data: unitLayer,
        });
    },
    toTrapezoidDrawer() {
        this.toDrawer('trapezoid');
    },
    toRegularDrawer() {
        this.toDrawer('regular');
    },
    // Handler
    handleKeyEvents(event) {
        const eventHandler = {
            keydown: 'onKeyDown',
            keypress: 'onKeyPress',
            keyup: 'onKeyUp',
        }[event.type] || null;

        if (eventHandler !== null) {
            this.each((layer) => {
                if (typeof layer.drawer[eventHandler] === 'function') {
                    layer.drawer[eventHandler](event);
                }
            });
        }
    },
});
