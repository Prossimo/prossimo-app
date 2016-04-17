var app = app || {};

// This module starts manually with required parameters:
// app.DrawingModule.start({
//     model: model,            // link to the model
//     stage: stage,            // link to the Konva.Stage or null
//                              // if it's not defined — Module should create
//                              // his own Konva.Stage and append it into
//                              // invisible area on the page
//     layers: {                // options of layer visibility
//         unit: true,
//         metrics: true,
//         controls: false
//     },
//     metricSize: 50          // define a custom metricSize
// });
//
// To end module:
// app.DrawingModule.stop();    // it should unbind events and etc

(function () {
    'use strict';

    var module = Marionette.Module.extend({
        startWithParent: false,

        // Module common functions
        initialize: function () {
            // Make an object for holding data
            this.data = {};
            // Make an object for holding states
            this.state = {};
        },
        define: function (opts) {
            var stage;

            // Assign model
            if ('model' in opts) {
                this.assignModel( opts.model );
            }
            // Check for Konva.Stage or create it
            if ('stage' in opts && 'nodeType' in opts.stage && opts.stage.nodeType === 'Stage') {
                stage = opts.stage;
            } else {
                stage = this.createStage();
            }
            // Assign Konva.Stage
            this.set('stage', stage);
            // Assign metricSize
            this.set('metricSize', ('metricSize' in opts) ? opts.metricSize : 50 );

            // Bind events
            this.on('state:any', function () { this.update(); });

            // After defining vriables — start Composer module
            app.App.module('DrawingModule.Composer').start( opts.layers );

        },
        onStart: function (opts) {
            this.define( opts );
        },
        onStop: function () {
            this.unbindModel();
        },

        // Define setter/getter for data
        set: function (name, val) {
            this.data[name] = val;
        },
        get: function (name) {
            return (name in this.data) ? this.data[name] : null;
        },
        // Define setter/getter for state
        setState: function (name, val) {
            var eventData = {
                name: name,
                oldValue: this.getState(name),
                newValue: val
            };

            if (eventData.oldValue !== eventData.newValue) {
                this.trigger('state:any', eventData);
                this.trigger('state:' + name, eventData);
                this.state[name] = val;
            }
        },
        getState: function (name) {
            return (name in this.state) ? this.state[name] : null;
        },

        // Assign/bind/unbind model
        assignModel: function (model) {
            this.unbindModel();

            this.bindModel(model);
        },
        unbindModel: function () {
            if (this.get('model') !== null) {
                this.stopListening( this.get('model') );
            }

            this.set('model', null);
        },
        bindModel: function (model) {
            this.set('model', model);
            this.listenTo(model, 'change', this.update);
        },
        // Create virtual Konva.Stage (if it wasn't defined)
        createStage: function () {
            var container = $('<div>', {
                id: 'drawing-module-container',
                css: {
                    overflow: 'hidden',
                    width: '0px',
                    height: '0px',
                    position: 'absolute',
                    top: '-10px',
                    left: '-10px'
                }
            }).prependTo('body');

            var stage = new Konva.Stage({
                width: window.screen.width,
                height: window.screen.height,
                container: container[0]
            });

            return stage;
        },

        // Events
        update: function () {
            this.trigger('update');
        },
        // Actions
        deselectAll: function () {
            this.setState('selected:mullion', null);
            this.setState('selected:sash', null);
        }
    });

    app.DrawingModule = app.App.module('DrawingModule', module);

})();
