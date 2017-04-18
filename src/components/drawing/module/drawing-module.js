import _ from 'underscore';
import $ from 'jquery';
import Marionette from 'backbone.marionette';
import Backbone from 'backbone';
import Konva from 'konva';

import App from '../../../main';
import LayerManager from './layer-manager';
import { object } from '../../../utils';

// This module starts manually with required parameters:
// new DrawingModule({
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
//              DrawerClass: App.Drawers.CustomMetricsDrawer, // also you can specify custom drawers
//              zIndex: 10          // and specify zIndex (order of layers)
//         },
//         customLayer: {
//              DrawerClass: App.Drawers.Custom // also you can add any number of custom layers
//                                              // but it should have a unique key in layers object
//                                              // and should have a link to any Drawer
//         }
//     },
//     styles: {},                  // you can define custom styles. See assignDefaultStyles method.
//     preview: false,              // use when you want to disable controls on metrics
//     metricSize: 50               // define a custom metricSize
// });

const DrawingModule = Marionette.Object.extend({
    initialize(opts) {
        const builder = this;
        const chain = Backbone.$.Deferred();

        this.data = {};
        this.state = {};
        this.status = 'initializing';

        // Assign model
        if ('model' in opts) {
            this.assignModel(opts.model);
        } else {
            throw new Error('DrawingModule can\'t start without defined Model!');
        }

        // Bind events
        this.on('state:any', function () {
            this.update();
        });

        // Assign stage
        this.assignStage(opts);

        //  TODO: rewrite this deferred part, it prevents us from upgrading
        //  to jQuery v3. See "Example: async vs sync" here:
        //  https://blog.jquery.com/2016/06/09/jquery-3-0-final-released/
        chain
            .then(this.assignDefaultStates.bind(this, opts)) // Assign project settings
            .then(this.assignDefaultStyles.bind(this, opts))  // Assign styles
            .then(this.assignSizes.bind(this, opts)) // Assign sizes
            .then(this.createLayerManager.bind(this, opts)) // Create an instance of layerManager
            .done(this.update.bind(this, opts)); // Render

        // Let's wait until canvas will be painted in the browser
        (function start() {
            if (builder.get('stage') && builder.get('stage').width() > 0) {
                chain.resolve(opts);
            } else {
                setTimeout(start, 1);
            }
        }());
    },

    // Define setter/getter for data
    set(name, val) {
        this.data[name] = val;
    },
    get(name) {
        return (name in this.data) ? this.data[name] : null;
    },
    // Define setter/getter for state
    setState(name, val, preventUpdate) {
        const eventData = [];

        if (typeof name === 'object') {
            preventUpdate = val;

            _.each(name, (value, key) => {
                eventData.push({
                    name: key,
                    oldValue: this.getState(key),
                    newValue: value,
                });
            });
        } else if (typeof name === 'string') {
            eventData.push({
                name,
                oldValue: this.getState(name),
                newValue: val,
            });
        }

        _.each(eventData, (data) => {
            if (data.oldValue !== data.newValue) {
                this.state[data.name] = data.newValue;

                if (!preventUpdate) {
                    this.trigger(`state:${data.name}`, data);
                }
            }
        });

        if (!preventUpdate) {
            this.trigger('state:any', eventData);
        }

        return eventData;
    },
    getState(name) {
        return (name in this.state) ? this.state[name] : null;
    },

    // Apply options to the object & initialize the object
    assignStage(opts) {
        let stage;
        let is_stage_predefined = false;

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
    assignDefaultStates(opts) {
        const project_settings = App.settings && App.settings.getProjectSettings();

        this.setState({
            type: ('type' in opts && opts.type) ? opts.type : 'unit',
            hingeIndicatorMode: project_settings && project_settings.get('hinge_indicator_mode'),
            inchesDisplayMode: project_settings && project_settings.get('inches_display_mode'),
            isPreview: ('preview' in opts && opts.preview) ? opts.preview : false,
        }, false);

        return opts;
    },
    updateSize(width, height) {
        const stage = this.get('stage');

        stage.width(width);
        stage.height(height);
    },
    // Calculate ratio, screen size and left-top point for position a unit to the center of stage
    assignSizes(opts) {
        const stage = this.get('stage');
        const model = this.get('model');

        if (opts && opts.width && opts.height) {
            this.updateSize(opts.width, opts.height);
        }

        const metricSize = (opts && 'metricSize' in opts) ? opts.metricSize :
            (this.get('metricSize')) ? this.get('metricSize') :
                50;

        const frameWidth = model.getInMetric('width', 'mm');
        const frameHeight = model.getInMetric('height', 'mm');

        const isTrapezoid = model.isTrapezoid();
        const isInsideView = this.state.insideView;
        const topOffset = 10 + 0.5; // we will add 0.5 pixel offset for better strokes
        const wr = (stage.width() - (metricSize * 2)) / frameWidth;
        const hr = (stage.height() - (metricSize * ((isTrapezoid) ? 3 : 2)) - topOffset) / frameHeight;

        const ratio = (Math.min(wr, hr) * 0.95);

        const frameOnScreenWidth = frameWidth * ratio;
        const frameOnScreenHeight = frameHeight * ratio;

        // Shift drawing right or left depending on metrics displayed
        // Duplicates logic from MetricsDrawer /static/source/js/drawing/module/metrics-drawer.js
        let metricShiftX = 0 - ((2 - model.leftMetricCount(isInsideView)) * (metricSize / 2));

        if (model.rightMetricCount() > 1) {
            metricShiftX -= (model.rightMetricCount(isInsideView) - 1) * (metricSize / 2);
        }

        const sizes = {
            ratio,
            screen: {
                width: frameOnScreenWidth,
                height: frameOnScreenHeight,
            },
            center: {
                x: Math.round(
                    ((stage.width() / 2) - (frameOnScreenWidth / 2)) +
                    ((isTrapezoid) ? metricSize / 2 : metricSize) +
                    metricShiftX,
                ) + 0.5,
                y: topOffset,
            },
        };

        this.set('metricSize', metricSize);
        this.set('ratio', sizes.ratio);
        this.set('center', sizes.center);
        this.set('screen', sizes.screen);

        return opts;
    },
    assignDefaultStyles(opts) {
        // Default styles
        let styles = {
            flush_frame: {
                fill: 'lightgrey',
                stroke: 'black',
                strokeWidth: 1,
            },
            frame: {
                fill: 'white',
                stroke: 'black',
                strokeWidth: 1,
            },
            door_bottom: {
                fill: 'grey',
                stroke: 'black',
                strokeWidth: 1,
            },
            mullions: {
                default: {
                    fill: 'white',
                    stroke: 'black',
                    strokeWidth: 1,
                },
                default_selected: {
                    fill: 'lightgrey',
                },
                hidden: {
                    fill: 'lightgreen',
                    opacity: 0.5,
                },
                hidden_selected: {
                    fill: '#4E993F',
                    opacity: 0.7,
                },
            },
            selection: {
                fill: 'rgba(0,0,0,0.2)',
            },
            fillings: {
                glass: {
                    fill: 'lightblue',
                },
                louver: {
                    stroke: 'black',
                },
                others: {
                    fill: 'lightgrey',
                },
            },
            bars: {
                normal: {
                    fill: 'white',
                },
                selected: {
                    fill: 'yellow',
                },
            },
            handle: {
                fill: 'white',
                stroke: 'black',
                sunk: {
                    opacity: 0.75,
                },
            },
            direction_line: {
                stroke: 'black',
                latchOffset: 10,
                dashLength: 10,
                dashGap: 10,
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
                    fontFamily: 'pt-sans',
                },
                arrows: {
                    stroke: 'grey',
                    strokeWidth: 0.5,
                },
                controls: {
                    normal: {
                        fill: '#66B6E3',
                        opacity: 0.5,
                    },
                    hover: {
                        fill: '#1A8BEF',
                    },
                },
                select: {
                    normal: {
                        fill: '#33CE10',
                        opacity: 0.5,
                    },
                    hover: {
                        opacity: 0.75,
                    },
                },
            },
            overlay_measurements: {
                label: {
                    fill: 'white',
                    stroke: 'grey',
                    color: '#444',
                    strokeWidth: 0.5,
                    padding: 3,
                    fontSize: 9,
                    fontSize_big: 10,
                },
            },
            mullion_input: {
                width: 48,
                height: 20,
                padding: 3,
                fontSize: 12,
            },
            indexes: {
                align: 'center',
                fontFamily: 'pt-sans',
                fontSize: 15,
            },
            glazing_controls: {
                bound: {
                    fill: 'green',
                    radius: 3,
                    normal: {
                        opacity: 0.7,
                    },
                    hover: {
                        opacity: 0.3,
                    },
                },
            },
        };

        styles = object.deep_extend(styles, opts.styles);

        // Assign styles
        _.each(styles, (style, name) => {
            this.set(`style:${name}`, style);
        });

        return opts;
    },
    createLayerManager(opts) {
        const params = {
            stage: this.get('stage'),
            metricSize: this.get('metricSize'),
            builder: this,
            layers: {},
        };

        _.extend(params.layers, opts.layers);

        this.layerManager = new LayerManager(params);

        return opts;
    },
    // Get style
    getStyle(name) {
        let style = this.get(`style:${name}`);

        if (!style) {
            style = {};
        }

        return style;
    },
    // Assign/bind/unbind model
    assignModel(model) {
        this.unbindModel();
        this.bindModel(model);
    },
    unbindModel() {
        if (this.get('model') !== null) {
            this.stopListening(this.get('model'));
        }

        this.set('model', null);
    },
    bindModel(model) {
        this.set('model', model);
        this.listenTo(model, 'change', this.update);
    },
    // Handler
    handleKeyEvents(event) {
        if (this.getState('isPreview') === false && this.layerManager) {
            this.layerManager.handleKeyEvents(event);
        }
    },
    // Create private Konva.Stage (if it wasn't defined in options)
    createStage() {
        const container = $('<div>', {
            id: 'drawing-module-container',
        });

        const stage = new Konva.Stage({
            width: window.screen.width,
            height: window.screen.height,
            container: container[0],
        });

        return stage;
    },

    // Events
    update(opts) {
        this.assignSizes(opts);
        this.trigger('update');
    },
    // Actions
    deselectAll(preventUpdate) {
        this.setState('selected:mullion', null, preventUpdate);
        this.setState('selected:sash', null, preventUpdate);
    },
    // Get layer to work directly with drawer, for example
    getLayer(name) {
        if (this.layerManager) {
            return this.layerManager.getLayer(name);
        }

        return false;
    },
    // Get result for preview method: canvas / base64 / image
    getCanvas() {
        return this.get('stage').container();
    },
    getBase64() {
        return this.get('stage').toDataURL();
    },
    getImage() {
        const img = new Image();

        img.src = this.get('stage').toDataURL();

        return img;
    },
    onBeforeDestroy() {
        const stage = this.get('stage');
        const is_predefined = this.get('is_stage_predefined');

        if (stage && is_predefined === false) {
            stage.destroy();
        }

        this.stopListening();
    },
});

export default DrawingModule;

export const preview = function (unitModel, options) {
    let result;
    const defaults = {
        width: 300,
        height: 300,
        mode: 'base64',
        position: 'inside',
        metricSize: 50,
        preview: true,
    };

    options = _.defaults({}, options, defaults, { model: unitModel });

    const full_root_json_string = JSON.stringify(unitModel.generateFullRoot());
    const options_json_string = JSON.stringify(options);

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

    const module = new DrawingModule(options);

    if (_.indexOf(['inside', 'outside'], options.position) !== -1) {
        module.setState({
            insideView: options.position === 'inside',
            openingView: (options.position === 'inside' && !unitModel.isOpeningDirectionOutward()) ||
                (options.position === 'outside' && unitModel.isOpeningDirectionOutward()),
            inchesDisplayMode: options.inchesDisplayMode,
            hingeIndicatorMode: options.hingeIndicatorMode,
        }, false);
    }

    if (options.width && options.height) {
        module.updateSize(options.width, options.height);
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
