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

            // Assign project settings
            var project_settings = app.settings && app.settings.getProjectSettings();

            this.setState({
                hingeIndicatorMode: project_settings && project_settings.get('hinge_indicator_mode'),
                inchesDisplayMode: project_settings && project_settings.get('inches_display_mode')
            }, false);

            // Default styles
            var styles = {
                frames: {

                },
                mullions: {

                },
                fillings: {

                },
                measurements: {
                    label: {
                        fill: 'white',
                        stroke: 'grey',
                        strokeWidth: 0.5,
                        padding: 4,
                        color: 'black',
                        fontSize: 11,
                        fontSize_big: 12,
                        fontFamily: 'pt-sans'
                    },
                    arrows: {
                        stroke: 'grey',
                        strokeWidth: 0.5
                    }
                },
                indexes: {
                    align: 'center',
                    fontFamily: 'pt-sans',
                    fontSize: 15
                }
            };
            // Assign styles
            _.extend(styles, opts.styles);
            _.each(styles, function (style, name) {
                this.set('style:' + name, style);
            }.bind(this));

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
        setState: function (name, val, preventUpdate) {
            var eventData = [];

            if (typeof name === 'object') {
                preventUpdate = val;

                _.each(name, function (value, key) {
                    eventData.push({
                        name: key,
                        oldValue: this.getState(key),
                        newValue: value
                    });
                }.bind(this));
            } else if (typeof name === 'string') {
                eventData.push({
                    name: name,
                    oldValue: this.getState(name),
                    newValue: val
                });
            }

            _.each(eventData, function (data) {
                if (data.oldValue !== data.newValue) {
                    this.state[data.name] = data.newValue;

                    if (!preventUpdate) {
                        this.trigger('state:' + data.name, data);
                    }
                }
            }.bind(this));

            if (!preventUpdate) {
                this.trigger('state:any', eventData);
            }

            return eventData;
        },
        getState: function (name) {
            return (name in this.state) ? this.state[name] : null;
        },
        // Get style
        getStyle: function (name) {
            var style = this.get('style:' + name);

            if (!style) { style = {}; }

            return style;
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
        deselectAll: function (preventUpdate) {
            this.setState('selected:mullion', null, preventUpdate);
            this.setState('selected:sash', null, preventUpdate);
        }
    });

    app.DrawingModule = app.App.module('DrawingModule', module);

})();
