var app = app || {};

// This module starts manually with required parameters:
// new app.DrawingModule({
//     model: model,                // link to the model
//     stage: stage,                // link to the Konva.Stage or null
//                                  // if it's not defined — Module should create
//                                  // his own Konva.Stage and append it into
//                                  // invisible area on the page
//     layers: {                    // options of layers. Unit and Metrics layers is a default.
//         unit: {
//              visible: false,     // but it can be turned into invisible (it won't be rendered)
//              active: false       // or it can be removed from layers list at all
//         },
//         metrics: {
//              DrawerClass: app.Drawers.CustomMetricsDrawer, // also you can specify custom drawers
//              zIndex: 10          // and specify zIndex (order of layers)
//         },
//         customLayer: {
//              DrawerClass: app.Drawers.Custom // also you can add any number of custom layers
//                                              // but it should have a unique key in layers object
//                                              // and should have a link to any Drawer
//         }
//     },
//     styles: {},                  // you can define custom styles. See assignDefaultStyles method.
//     preview: false,              // use when you want to disable controls on metrics
//     metricSize: 50               // define a custom metricSize
// });

(function () {
    'use strict';

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
            .then(this.assignDefaultStates.bind(this, opts))
            // Assign styles
            .then(this.assignDefaultStyles.bind(this, opts))
            // Assign sizes
            .then(this.assignSizes.bind(this, opts))
            // Create an instance of layerManager
            .then(this.createLayerManager.bind(this, opts))
            // Render
            .done(this.update.bind(this, opts));

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
            var is_stage_predefined = false;

            // Check for defined stage in opts
            if ('stage' in opts && 'nodeType' in opts.stage && opts.stage.nodeType === 'Stage') {
                stage = opts.stage;
                is_stage_predefined = true;
            } else {
                // Or create a private stage
                stage = this.createStage();
            }

            // Assign stage
            this.set('stage', stage);
            this.set('is_stage_predefined', is_stage_predefined);

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
        updateSize: function (width, height) {
            var stage = this.get('stage');

            stage.width(width);
            stage.height(height);
        },
        // Calculate ratio, screen size and left-top point for position a unit to the center of stage
        assignSizes: function (opts) {
            var stage = this.get('stage');
            var model = this.get('model');

            if (opts && opts.width && opts.height) {
                this.updateSize(opts.width, opts.height);
            }

            var metricSize = ( opts && 'metricSize' in opts) ? opts.metricSize :
                             ( this.get('metricSize') ) ? this.get('metricSize') :
                             50;

            var frameWidth = model.getInMetric('width', 'mm');
            var frameHeight = model.getInMetric('height', 'mm');

            var isTrapezoid = model.isTrapezoid();
            var isInsideView = this.state.insideView;
            var topOffset = 10 + 0.5; // we will add 0.5 pixel offset for better strokes
            var wr = (stage.width() - metricSize * 2) / frameWidth;
            var hr = (stage.height() - metricSize * ((isTrapezoid) ? 3 : 2) - topOffset) / frameHeight;

            var ratio = (Math.min(wr, hr) * 0.95);

            var frameOnScreenWidth = frameWidth * ratio;
            var frameOnScreenHeight = frameHeight * ratio;

            // Shift drawing right or left depending on metrics displayed
            // Duplicates logic from MetricsDrawer /static/source/js/drawing/module/metrics-drawer.js
            var metricShiftX = 0 - (2 - model.leftMetricCount(isInsideView)) * metricSize / 2;

            if (model.rightMetricCount() > 1) {
                metricShiftX -= (model.rightMetricCount(isInsideView) - 1) * metricSize / 2;
            }

            var sizes = {
                ratio: ratio,
                screen: {
                    width: frameOnScreenWidth,
                    height: frameOnScreenHeight
                },
                center: {
                    x: Math.round(
                        stage.width() / 2 - frameOnScreenWidth / 2
                        + ((isTrapezoid) ? metricSize / 2 : metricSize)
                        + metricShiftX
                    ) + 0.5,
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
                flush_frame: {
                    fill: 'lightgrey',
                    stroke: 'black',
                    strokeWidth: 1
                },
                frame: {
                    fill: 'white',
                    stroke: 'black',
                    strokeWidth: 1
                },
                door_bottom: {
                    fill: 'grey',
                    stroke: 'black',
                    strokeWidth: 1
                },
                mullions: {
                    default: {
                        fill: 'white',
                        stroke: 'black',
                        strokeWidth: 1
                    },
                    default_selected: {
                        fill: 'lightgrey'
                    },
                    hidden: {
                        fill: 'lightgreen',
                        opacity: 0.5
                    },
                    hidden_selected: {
                        fill: '#4E993F',
                        opacity: 0.7
                    }
                },
                selection: {
                    fill: 'rgba(0,0,0,0.2)'
                },
                fillings: {
                    glass: {
                        fill: 'lightblue'
                    },
                    louver: {
                        stroke: 'black'
                    },
                    others: {
                        fill: 'lightgrey'
                    }
                },
                bars: {
                    normal: {
                        fill: 'white'
                    },
                    selected: {
                        fill: 'yellow'
                    }
                },
                handle: {
                    fill: 'white',
                    stroke: 'black'
                },
                direction_line: {
                    stroke: 'black'
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
                    },
                    controls: {
                        normal: {
                            fill: '#66B6E3',
                            opacity: 0.5
                        },
                        hover: {
                            fill: '#1A8BEF'
                        }
                    },
                    select: {
                        normal: {
                            fill: '#33CE10',
                            opacity: 0.5
                        },
                        hover: {
                            opacity: 0.75
                        }
                    }
                },
                overlay_measurements: {
                    label: {
                        fill: 'white',
                        stroke: 'grey',
                        color: '#444',
                        strokeWidth: 0.5,
                        padding: 3,
                        fontSize: 9,
                        fontSize_big: 10
                    }
                },
                indexes: {
                    align: 'center',
                    fontFamily: 'pt-sans',
                    fontSize: 15
                },
                glazing_controls: {
                    bound: {
                        fill: 'green',
                        radius: 3,
                        normal: {
                            opacity: 0.7
                        },
                        hover: {
                            opacity: 0.3
                        }
                    }
                }
            };

            styles = app.utils.object.deep_extend(styles, opts.styles);

            // Assign styles
            _.each(styles, function (style, name) {
                this.set('style:' + name, style);
            }.bind(this));

            return opts;
        },
        createLayerManager: function (opts) {
            var params = {
                stage: this.get('stage'),
                metricSize: this.get('metricSize'),
                builder: this,
                layers: {}
            };

            _.extend(params.layers, opts.layers);

            this.layerManager = new app.LayerManager(params);

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
                id: 'drawing-module-container'
            });

            var stage = new Konva.Stage({
                width: window.screen.width,
                height: window.screen.height,
                container: container[0]
            });

            return stage;
        },

        // Events
        update: function (opts) {
            this.assignSizes(opts);
            this.trigger('update');
        },
        // Actions
        deselectAll: function (preventUpdate) {
            this.setState('selected:mullion', null, preventUpdate);
            this.setState('selected:sash', null, preventUpdate);
        },
        // Get layer to work directly with drawer, for example
        getLayer: function (name) {
            if (this.layerManager) {
                return this.layerManager.getLayer(name);
            }

            return false;
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
        },
        onDestroy: function () {
            var stage = this.get('stage');
            var is_predefined = this.get('is_stage_predefined');

            if ( stage && is_predefined === false ) {
                stage.destroy();
            }

            this.stopListening();
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

        if (options.width && options.height) {
            module.updateSize( options.width, options.height );
        }

        if (options.mode === 'canvas') {
            result = module.getCanvas();
        } else if (options.mode === 'base64') {
            result = module.getBase64();
        } else if (options.mode === 'image') {
            result = module.getImage();
        }

        module.destroy();

        unitModel.preview.full_root_json_string = full_root_json_string;
        unitModel.preview.result[options_json_string] = result;

        return result;
    };

})();
