var app = app || {};

// LayerManager is a important and required part for DrawingModule
// It creates, stores and working with layers into stage
// And transfer keyboard events from view to drawers

(function () {
    'use strict';

    app.LayerManager = Marionette.Object.extend({
        initialize: function (opts) {
            this.layers = {};

            this.createLayers( opts );

            // Start listening update on builder
            this.listenTo( this.getOption('builder'), 'update', this.update);
        },
        // Create layers on init
        createLayers: function (layerOpts) {
            var layers = {
                unit: {
                    name: 'unit',
                    DrawerClass: app.Drawers.UnitDrawer,
                    zIndex: 0
                },
                metrics: {
                    name: 'metrics',
                    DrawerClass: app.Drawers.MetricsDrawer,
                    zIndex: 1
                }
            };

            _.each(layerOpts, function (value, key) {
                if (key in layers) {
                    layers[key].isVisible = value;
                }
            });

            this.addLayers(layers, this.getOption('stage'));
        },
        // Add/Remove/Get layers
        addLayer: function (opts, stage) {
            var defaultLayer = {
                name: 'UnknownLayer',
                DrawerClass: null,      // Backbone.KonvaView class
                zIndex: 0,
                isVisible: true
                // Will be setted automatically in the addLayer method:
                // layer: null,         // new Konva.Layer
                // drawer: null         // new drawerClass({layer: layer})
            };
            var data = _.defaults(opts, defaultLayer);

            if (data.DrawerClass !== null) {
                data.layer = new Konva.Layer();
                stage.add( data.layer );

                data.drawer = new data.DrawerClass({
                    layer: data.layer,
                    stage: this.getOption('stage'),
                    builder: this.getOption('builder'),
                    metricSize: this.getOption('metricSize')
                });
                this.layers[opts.name] = data;
            } else {
                throw new Error('You must specify DrawerClass for a new layer (layer name: ' + data.name + ')');
            }

            return data;
        },
        addLayers: function (layers, stage) {
            _.each(layers, function (value) {
                this.addLayer(value, stage);
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
                if (layer.isVisible) {
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
