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

    var LayerManager = Marionette.Object.extend({
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

    app.DrawingModule = Marionette.Object.extend({
        initialize: function (opts) {
            var builder = this;
            var chain = Backbone.$.Deferred();

            this.data = {};
            this.state = {};
            this.status = 'initializing';

            // Assign model
            if ('model' in opts) {
                this.assignModel( opts.model );
            } else {
                throw new Error('DrawingModule can\'t start without defined Model!');
            }

            // Bind events
            this.on('state:any', function () { this.update(); });

            // Assign stage
            this.assignStage( opts );

            chain
            // Assign project settings
            .then(this.assignDefaultStates.bind(this))
            // Assign styles
            .then(this.assignDefaultStyles.bind(this))
            // Assign sizes
            .then(this.assignSizes.bind(this))
            // Create an instance of layerManager
            .then(this.createLayerManager.bind(this))
            // Render
            .done(this.update.bind(this));

            // Let's wait until canvas will be painted in the browser
            (function start() {
                if (builder.get('stage') && builder.get('stage').width() > 0) {
                    chain.resolve( opts );
                } else {
                    setTimeout(start, 1);
                }
            })();
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

        // Apply options to the object & initialize the object
        assignStage: function (opts) {

            var stage;
            // Check for defined stage in opts
            if ('stage' in opts && 'nodeType' in opts.stage && opts.stage.nodeType === 'Stage') {
                stage = opts.stage;
            } else {
                // Or create a private stage
                stage = this.createStage();
            }
            // Assign stage
            this.set('stage', stage);

            return opts;
        },
        assignDefaultStates: function (opts) {
            var project_settings = app.settings && app.settings.getProjectSettings();

            this.setState({
                type: ('type' in opts && opts.type) ? opts.type : 'unit',
                hingeIndicatorMode: project_settings && project_settings.get('hinge_indicator_mode'),
                inchesDisplayMode: project_settings && project_settings.get('inches_display_mode'),
                isPreview: ('preview' in opts && opts.preview) ? opts.preview : false
            }, false);

            return opts;
        },
        // Calculate ratio, screen size and left-top point for position a unit to the center of stage
        assignSizes: function (opts) {
            var stage = this.get('stage');
            var model = this.get('model');
            var metricSize = ( opts && 'metricSize' in opts) ? opts.metricSize :
                             ( this.get('metricSize') ) ? this.get('metricSize') :
                             50;

            var frameWidth = model.getInMetric('width', 'mm');
            var frameHeight = model.getInMetric('height', 'mm');

            var topOffset = 10 + 0.5; // we will add 0.5 pixel offset for better strokes
            var wr = (stage.width() - metricSize * 2) / frameWidth;
            var hr = (stage.height() - metricSize * 2 - topOffset) / frameHeight;

            var ratio = (Math.min(wr, hr) * 0.95);

            var frameOnScreenWidth = frameWidth * ratio;
            var frameOnScreenHeight = frameHeight * ratio;

            var sizes = {
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

            this.set('metricSize', metricSize);
            this.set('ratio', sizes.ratio );
            this.set('center', sizes.center);
            this.set('screen', sizes.screen);

            return opts;
        },
        assignDefaultStyles: function (opts) {
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

            return opts;
        },
        createLayerManager: function (opts) {
            var params = {
                stage: this.get('stage'),
                metricSize: this.get('metricSize'),
                builder: this
            };

            _.extend(params, opts.layers);

            this.layerManager = new LayerManager(params);

            return opts;
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
        // Handler
        handleKeyEvents: function (event) {
            if (this.getState('isPreview') === false && this.layerManager) {
                this.layerManager.handleKeyEvents( event );
            }
        },
        // Create private Konva.Stage (if it wasn't defined in options)
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
            this.assignSizes();
            this.trigger('update');
        },
        // Actions
        deselectAll: function (preventUpdate) {
            this.setState('selected:mullion', null, preventUpdate);
            this.setState('selected:sash', null, preventUpdate);
        },
        // Get result for preview method: canvas / base64 / image
        getCanvas: function () {
            return this.get('stage').container();
        },
        getBase64: function () {
            return this.get('stage').toDataURL();
        },
        getImage: function () {
            var img = new Image();

            img.src = this.get('stage').toDataURL();

            return img;
        }
    });

    app.preview = function (unitModel, options) {
        var result;
        var defaults = {
            width: 300,
            height: 300,
            mode: 'base64',
            position: 'inside',
            metricSize: 50,
            preview: true
        };

        options = _.defaults({}, options, defaults, {model: unitModel});

        var full_root_json_string = JSON.stringify(unitModel.generateFullRoot());
        var options_json_string = JSON.stringify(options);

        //  If we already got an image for the same full_root and same options,
        //  just return it from our preview cache
        if (
            unitModel.preview && unitModel.preview.result &&
            unitModel.preview.result[options_json_string] &&
            full_root_json_string === unitModel.preview.full_root_json_string
        ) {
            return unitModel.preview.result[options_json_string];
        }

        //  If full root changes, preview cache should be erased
        if (
            !unitModel.preview ||
            !unitModel.preview.result ||
            full_root_json_string !== unitModel.preview.full_root_json_string
        ) {
            unitModel.preview = {};
            unitModel.preview.result = {};
        }

        var module = new app.DrawingModule(options);

        if ( _.indexOf(['inside', 'outside'], options.position) !== -1 ) {
            module.setState({
                insideView: options.position === 'inside',
                openingView: options.position === 'inside' && !unitModel.isOpeningDirectionOutward() ||
                    options.position === 'outside' && unitModel.isOpeningDirectionOutward(),
                inchesDisplayMode: options.inchesDisplayMode,
                hingeIndicatorMode: options.hingeIndicatorMode
            }, false);
        }

        if (options.mode === 'canvas') {
            result = module.getCanvas();
        } else if (options.mode === 'base64') {
            result = module.getBase64();
        } else if (options.mode === 'image') {
            result = module.getImage();
        }

        unitModel.preview.full_root_json_string = full_root_json_string;
        unitModel.preview.result[options_json_string] = result;

        return result;
    };

})();
