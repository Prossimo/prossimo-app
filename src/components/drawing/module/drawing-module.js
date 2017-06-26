import _ from 'underscore';
import $ from 'jquery';
import Marionette from 'backbone.marionette';
import Backbone from 'backbone';
import Konva from 'konva';
import clone from 'clone';

import App from '../../../main';
import LayerManager from './layer-manager';
import { object, dom } from '../../../utils';

const DELAYED_HOVER_DEFAULT_DELAY = 400;
const SECTION_MENU_HOVER_DELAY = 100;

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
        this.on('state:any', () => {
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
        let shouldPreventUpdate = preventUpdate;

        if (typeof name === 'object') {
            shouldPreventUpdate = val;

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

                if (!shouldPreventUpdate) {
                    this.trigger(`state:${data.name}`, data);
                }
            }
        });

        if (!shouldPreventUpdate) {
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

        const defaultMetricSize = this.get('metricSize') || 50;
        const metricSize = (opts && 'metricSize' in opts) ? opts.metricSize : defaultMetricSize;

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
                    bladeWidth: 40,
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
                default: {
                    base: {
                        fill: 'white',
                        stroke: 'black',
                        strokeWidth: 1,
                    },
                    grip: {
                        fill: 'white',
                        stroke: 'black',
                        strokeWidth: 1,
                    },
                },
                under: {
                    base: {
                        dashLength: 3.5,
                        dashGap: 1.5,
                        opacity: 0.75,
                        backgroundOpacity: 0.5,
                    },
                    grip: {
                        dashLength: 3.5,
                        dashGap: 1.5,
                        opacity: 0.5,
                        backgroundOpacity: 0.5,
                    },
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
        const isEscape = event.key === 'Escape';
        const isPreview = this.getState('isPreview');
        const keysToElementsTable = this.getState('keysToElementsTable');
        const shortcutKeys = keysToElementsTable && Object.keys(keysToElementsTable);
        const isShortcutKey = shortcutKeys && _.contains(shortcutKeys, event.key);

        if (isEscape && this.isCloningFilling()) {
            this.cloneFillingDismiss();
        } else if (isEscape && this.isSyncingFilling()) {
            this.syncFillingDismiss();
        } else if (isShortcutKey) {
            this.handleShortcutKey(event.key);
        }

        if (!isPreview && this.layerManager) {
            this.layerManager.handleKeyEvents(event);
        }
    },
    handleShortcutKey(key) {
        if (!key) { return; }
        const boundElements = this.getState('keysToElementsTable')[key];
        if (!boundElements) { return; }

        const visibleElements = boundElements.filter(element => dom.isElementVisible(element));

        const lastVisible = _.last(visibleElements);
        if (lastVisible) { $(lastVisible).trigger('click'); }
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
    cloneFillingStart(sourceSashId) {
        const model = this.get('model');
        const selectedSash = model.getSection(sourceSashId);
        if (!selectedSash) { return; }

        this.setState({
            cloneFillingSource: {
                bars: selectedSash.bars,
                sashType: selectedSash.sashType,
                fillingType: selectedSash.fillingType,
                fillingName: selectedSash.fillingName,
            },
        });
    },
    cloneFillingFinish(targetSashId) {
        if (!targetSashId || !this.isCloningFilling()) { return; }
        const model = this.get('model');
        const sourceBars = this.state.cloneFillingSource.bars;
        const sourceSashType = this.state.cloneFillingSource.sashType;
        const sourceFillingType = this.state.cloneFillingSource.fillingType;
        const sourceFillingName = this.state.cloneFillingSource.fillingName;

        if (sourceBars) { model.setSectionBars(targetSashId, sourceBars); }
        if (sourceSashType) { model.setSectionSashType(targetSashId, sourceSashType); }
        if (sourceFillingType && sourceFillingName) {
            model.setFillingType(targetSashId, sourceFillingType, sourceFillingName);
        }

        this.cloneFillingDismiss();
    },
    cloneFillingDismiss() {
        this.deselectAll();
        this.setState({ cloneFillingSource: null });
    },
    isCloningFilling() {
        return !!this.state.cloneFillingSource;
    },
    syncFillingStart(sourceSashId) {
        const model = this.get('model');
        const selectedSash = model.getSection(sourceSashId);
        if (!selectedSash) { return; }

        this.setState({ syncFillingSource: { id: sourceSashId, bars: selectedSash.bars } });
    },
    syncFillingFinish(targetSashId) {
        if (!targetSashId || !this.isSyncingFilling()) { return; }
        const model = this.get('model');
        const sourceSashId = this.state.syncFillingSource.id;
        const sourceBars = this.state.syncFillingSource.bars;
        const emptyBars = { horizontal: [], vertical: [] };
        const hasSourceBars = model.hasSectionBars(sourceSashId);
        let hasTargetBars = model.hasSectionBars(targetSashId);

        // Copy or erase bars as necessary
        if (hasSourceBars && !hasTargetBars) {
            model.setSectionBars(targetSashId, sourceBars);
            hasTargetBars = true;
        } else if (!hasSourceBars && hasTargetBars) {
            model.setSectionBars(targetSashId, emptyBars);
            hasTargetBars = false;
        }

        // Adjust bar positions
        if (hasSourceBars && hasTargetBars) {
            model.adjustBars(targetSashId, { referenceSectionId: sourceSashId, flipBarsX: !this.state.insideView });
        }

        this.syncFillingDismiss();
    },
    syncFillingDismiss() {
        this.deselectAll();
        this.setState({ syncFillingSource: null });
    },
    isSyncingFilling() {
        return !!this.state.syncFillingSource;
    },
    enableDelayedHover() {
        this.setState('delayedHoverDisabled', false, true);
    },
    disableDelayedHover() {
        this.setState('delayedHoverDisabled', true, true);
    },
    startDelayedHover(func, options) {
        if (!func) { return; }
        const delay = (options && _.isNumber(options.delay)) ? options.delay : DELAYED_HOVER_DEFAULT_DELAY;
        if (this.getState('delayedHover') || this.getState('delayedHoverDisabled')) { return; }

        const handle = setTimeout(() => {
            if (!this.getState('delayedHoverDisabled')) { func(); }
            this.stopDelayedHover();
        }, delay);
        this.setState('delayedHover', { func, delay, handle }, true);
    },
    restartDelayedHover() {
        const delayedHover = this.getState('delayedHover');
        if (!delayedHover) { return; }

        this.stopDelayedHover();
        this.startDelayedHover(delayedHover.func, { delay: delayedHover.delay });
    },
    stopDelayedHover() {
        const delayedHover = this.getState('delayedHover');
        if (!delayedHover) { return; }

        clearTimeout(delayedHover.handle);
        this.setState('delayedHover', null, true);
    },
    startSectionMenuHover(options) {
        const sectionId = options && options.sectionId;
        if (!sectionId) { return; }

        const sectionMenuOpener = () => {
            this.openSectionHoverMenu();
            this.setState('selected:sash', sectionId, true);
            this.disableDelayedHover();  // Prevent menu open calls while open

            // On menu close
            this.once('state:sectionHoverMenuOpen', (event) => {
                const doClose = !event.newValue;
                if (doClose) {
                    this.deselectAll();
                    this.enableDelayedHover();
                }
            });
        };

        this.startDelayedHover(sectionMenuOpener, { delay: SECTION_MENU_HOVER_DELAY });
    },
    restartSectionMenuHover() {
        this.restartDelayedHover();
    },
    stopSectionMenuHover() {
        this.stopDelayedHover();
    },
    openSectionHoverMenu() {
        this.setState('sectionHoverMenuOpen', true);
    },
    closeSectionHoverMenu() {
        this.setState('sectionHoverMenuOpen', false);
    },
});

export default DrawingModule;

export const preview = function generatePreview(unitModel, options) {
    const defaults = {
        width: 300,
        height: 300,
        mode: 'base64',
        position: 'inside',
        metricSize: 50,
        preview: true,
    };
    const currentModel = unitModel;
    const currentOptions = _.defaults({}, clone(options), defaults, { model: currentModel });
    let result;

    const full_root_json_string = JSON.stringify(currentModel.generateFullRoot());
    const options_json_string = JSON.stringify(currentOptions);

    //  If we already got an image for the same full_root and same options,
    //  just return it from our preview cache
    if (
        currentModel.preview && currentModel.preview.result &&
        currentModel.preview.result[options_json_string] &&
        full_root_json_string === currentModel.preview.full_root_json_string
    ) {
        return currentModel.preview.result[options_json_string];
    }

    //  If full root changes, preview cache should be erased
    if (
        !currentModel.preview ||
        !currentModel.preview.result ||
        full_root_json_string !== currentModel.preview.full_root_json_string
    ) {
        currentModel.preview = {};
        currentModel.preview.result = {};
    }

    const module = new DrawingModule(currentOptions);

    if (_.indexOf(['inside', 'outside'], currentOptions.position) !== -1) {
        module.setState({
            insideView: currentOptions.position === 'inside',
            openingView: (currentOptions.position === 'inside' && !currentModel.isOpeningDirectionOutward()) ||
                (currentOptions.position === 'outside' && currentModel.isOpeningDirectionOutward()),
            inchesDisplayMode: currentOptions.inchesDisplayMode,
            hingeIndicatorMode: currentOptions.hingeIndicatorMode,
        }, false);
    }

    if (currentOptions.width && currentOptions.height) {
        module.updateSize(currentOptions.width, currentOptions.height);
    }

    if (currentOptions.mode === 'canvas') {
        result = module.getCanvas();
    } else if (currentOptions.mode === 'base64') {
        result = module.getBase64();
    } else if (currentOptions.mode === 'image') {
        result = module.getImage();
    }

    module.destroy();

    currentModel.preview.full_root_json_string = full_root_json_string;
    currentModel.preview.result[options_json_string] = result;

    return result;
};
