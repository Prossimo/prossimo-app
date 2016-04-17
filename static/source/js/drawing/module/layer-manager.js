var app = app || {};

(function () {
    'use strict';

    var defaultLayer = {
        layer: null, // new Konva.Layer
        name: 'UnknownLayer',
        zIndex: 0,
        isVisible: true,
        isActive: true
    };
    var parent = app.App.module('DrawingModule.Composer');
    var module = Marionette.Module.extend({
        // Module common functions
        initialize: function () {
            // Make an object for holding layers
            this.layers = {};
        },
        define: function () {
            console.log( this.moduleName + ' has been defined!' );
        },
        onStart: function () {
            console.log( this.moduleName + ' has been started!' );
        },
        onStop: function () {
            console.log( this.moduleName + ' was stoped!' );
        },

        // Define setter/getter
        set: function (name, val) {
            parent.set(name, val);
        },
        get: function (name) {
            return parent.get(name);
        },

        // Add/Remove/Get layers
        addLayer: function (opts) {
            var layer = _.defaults(opts, defaultLayer);

            layer.layer = new Konva.Layer();
            this.layers[opts.name] = layer;

            return layer;
        },
        // Get layers as array
        // asArray: function () {

        // },
        // Events
        update: function () {

        }
    });

    app.App.module('DrawingModule.Composer.LayerManager', module);

})();
