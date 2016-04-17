var app = app || {};

(function () {
    'use strict';

    var module = Marionette.Module.extend({
        startWithParent: false,

        // Module common functions
        initialize: function () {
            // Make an object for holding data
            this.data = {};
        },
        define: function (opts) {
            var stage;

            // Assign model
            if ('model' in opts) {
                this.assignModel( opts.model );
            }

            // Assign Konva.Stage
            if ('stage' in opts) {
                stage = opts.stage;
            } else {
                stage = this.createStage();
            }

            this.set('stage', stage);

            console.log( this.moduleName + ' was defined!' );
            console.log( this );

            // After defining vriables — start child modules
            app.App.module('DrawingModule.Composer').start();

        },
        onStart: function (opts) {
            console.log( this.moduleName + ' has been started!' );
            this.define( opts );
        },
        onStop: function () {
            console.log( this.moduleName + ' was stoped!' );

        },

        // Define setter/getter
        set: function (name, val) {
            this.data[name] = val;
        },
        get: function (name) {
            return (name in this.data) ? this.data[name] : null;
        },

        // Helpers
        assignModel: function (model) {
            if (this.get('model') !== null) {
                this.stopListening( this.get('model') );
            }

            this.set('model', model);
            this.listenTo(model, 'change', this.update);
        },
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

        // Logic
        update: function () {
            console.log('! UPDATE !');
            this.trigger('update');
        }
    });

    app.DrawingModule = app.App.module('DrawingModule', module);

})();
