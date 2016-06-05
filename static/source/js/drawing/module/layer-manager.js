var app = app || {};

// LayerManager is a important and required part for DrawingModule
// It creates, stores and working with layers into stage
// And transfer keyboard events from view to drawers

(function () {
    'use strict';

    app.LayerManager = Marionette.Object.extend({
        initialize: function (opts) {
            this.layers = {};

            this.createLayers( opts.layers );

            // Start listening update on builder
            this.listenTo( this.getOption('builder'), 'update', this.update);
        },
        // Create layers on init
        createLayers: function (layerOpts) {
            var defaultLayer = {
                zIndex: 0,
                visible: true,
                active: true
            };

            var defaultLayers = {
                unit: {
                    DrawerClass: app.Drawers.UnitDrawer,
                    zIndex: 0,
                    visible: true,
                    active: true
                },
                metrics: {
                    DrawerClass: app.Drawers.MetricsDrawer,
                    zIndex: 1,
                    visible: true,
                    active: true
                },
                trapezoidControls: {
                    DrawerClass: app.Drawers.TrapezoidControlsDrawer,
                    zIndex: 2,
                    visible: true,
                    active: true
                }
            };

            var layers = _.defaults(layerOpts, defaultLayers);

            _.each(layerOpts, function (layer, key) {
                if (key in layers && layer.active === false) {
                    delete layers[key];
                } else if (defaultLayers.hasOwnProperty(key)){
                    _.defaults(layer, defaultLayers[key]);
                } else {
                    _.defaults(layer, defaultLayer);
                }
            });

            this.addLayers(layers, this.getOption('stage'));
        },
        // Add/Remove/Get layers
        addLayer: function (name, opts, stage) {
            var data = opts;

            if (data.DrawerClass !== null) {
                data.layer = new Konva.Layer();
                stage.add( data.layer );

                data.name = name;
                data.drawer = new data.DrawerClass({
                    layer: data.layer,
                    stage: this.getOption('stage'),
                    builder: this.getOption('builder'),
                    metricSize: this.getOption('metricSize'),
                    data: data.data
                });
                this.layers[name] = data;
            } else {
                throw new Error('You must specify DrawerClass for a new layer (layer name: ' + name + ')');
            }

            return data;
        },
        addLayers: function (layers, stage) {
            _.each(layers, function (value, key) {
                this.addLayer(key, value, stage);
            }.bind(this));

            return this.getLayers();
        },
        removeLayer: function (name) {
            if (name in this.layers) {
                delete this.layers[name];
            }

            return true;
        },
        getLayer: function (name) {
            var result = null;

            if (name in this.layers) {
                result = this.layers[name];
            }

            return result;
        },
        getLayers: function (asArray) {
            var result;

            if (asArray) {
                result = Array.from(this.layers);

                result.sort(function (a, b) {
                    return a.zIndex > b.zIndex;
                });
            } else {
                result = this.layers;
            }

            return result;
        },
        // Itterate each layer
        each: function (callback) {
            _.each(this.layers, callback);
        },
        update: function () {
            this.each(function (layer) {
                if (layer.visible) {
                    layer.drawer.render();
                }
            });
        },
        // Handler
        handleKeyEvents: function (event) {
            var eventHandler = (event.type === 'keydown') ? 'onKeyDown' :
                               (event.type === 'keyup') ? 'onKeyUp' :
                               (event.type === 'keypress') ? 'onKeyPress' :
                               null;

            if (eventHandler !== null) {
                this.each(function (layer) {
                    if (typeof layer.drawer[eventHandler] === 'function') {
                        layer.drawer[eventHandler](event);
                    }
                });
            }
        }
    });

})();
