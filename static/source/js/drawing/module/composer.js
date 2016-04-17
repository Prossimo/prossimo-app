var app = app || {};

(function () {
    'use strict';

    var parent = app.DrawingModule;
    var layerManager; // onStart = app.App.module('DrawingModule.Composer.LayerManager');

    var module = Marionette.Module.extend({
        startWithParent: false,

        // Module common functions
        initialize: function () {},
        onStart: function ( opts ) {
            layerManager = app.App.module('DrawingModule.Composer.LayerManager');

            this.parent = parent;
            this.parent.on('update', this.update);

            this.createLayers( opts );
            // First draw:
            this.update();
        },
        onStop: function () {
            this.parent.off('update', this.update);
        },

        // Define setter/getter
        set: function (name, val) {
            this.parent.set(name, val);
        },
        get: function (name) {
            return this.parent.get(name);
        },

        // Logic
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
                },
                controls: {
                    name: 'controls',
                    DrawerClass: app.Drawers.ControlsDrawer,
                    zIndex: 2
                }
            };

            _.each(layerOpts, function (value, key) {
                if (key in layers) {
                    layers[key].isVisible = value;
                }
            });

            layerManager.addLayers(layers, this.get('stage'));
        },
        update: function () {
            // Update each layer
            layerManager.each(function (layer) {
                if (layer.isVisible) {
                    layer.drawer.render();
                }
            });
        }
    });

    app.App.module('DrawingModule.Composer', module);

})();
