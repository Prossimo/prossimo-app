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

            // Calculate sizes: ratio, screenSize, centerPosition
            // Get sizes
            var sizes = this.getSizes();
            // Assign sizes
            this.set('ratio', sizes.ratio );
            this.set('center', sizes.center);
            this.set('screen', sizes.screen);

            this.createLayers( opts );
            // @TODO: Remove this ugly crutch :)
            setTimeout(this.update, 1);
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
        // Calculate ratio
        getSizes: function () {
            var model = parent.get('model');
            var stage = parent.get('stage');
            var metricSize = parent.get('metricSize');

            var frameWidth = model.getInMetric('width', 'mm');
            var frameHeight = model.getInMetric('height', 'mm');

            var topOffset = 10 + 0.5; // we will add 0.5 pixel offset for better strokes
            var wr = (stage.width() - metricSize * 2) / frameWidth;
            var hr = (stage.height() - metricSize * 2 - topOffset) / frameHeight;

            var ratio = (Math.min(wr, hr) * 0.95);

            var frameOnScreenWidth = frameWidth * ratio;
            var frameOnScreenHeight = frameHeight * ratio;

            return {
                ratio: ratio,
                screen: {
                    width: frameOnScreenWidth,
                    height: frameOnScreenHeight
                },
                center: {
                    x: Math.round(stage.width() / 2 - frameOnScreenWidth / 2 + metricSize) + 0.5,
                    y: topOffset
                }
            };
        },
        update: function () {
            // Update each layer
            layerManager.update();
        }
    });

    app.App.module('DrawingModule.Composer', module);

})();
