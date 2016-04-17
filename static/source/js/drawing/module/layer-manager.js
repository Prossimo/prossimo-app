var app = app || {};

(function () {
    'use strict';

    var defaultLayer = {
        // Should be defined by user:
        name: 'UnknownLayer',
        DrawerClass: null,      // Backbone.KonvaView class
        zIndex: 0,
        isVisible: true
        // Will be setted automatically in the addLayer method:
        // layer: null,         // new Konva.Layer
        // drawer: null         // new drawerClass({layer: layer})
    };
    var parent = app.App.module('DrawingModule.Composer');
    var module = Marionette.Module.extend({
        // Module common functions
        initialize: function () {
            // Make an object for holding layers
            this.layers = {};
        },
        onStart: function () {
            this.parent = parent;
            this.parent.on('update', this.update);
        },
        onStop: function () {
            this.parent.off('update', this.update);
            this.each(function (layer) {
                layer.drawer.remove();
            });
        },
        // Add/Remove/Get layers
        addLayer: function (opts, stage) {
            var data = _.defaults(opts, defaultLayer);

            if (data.DrawerClass !== null) {
                data.layer = new Konva.Layer();
                stage.add( data.layer );

                data.drawer = new data.DrawerClass({
                    layer: data.layer,
                    metricSize: 50
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
        }
    });

    app.App.module('DrawingModule.Composer.LayerManager', module);

})();
