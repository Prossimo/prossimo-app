import _ from 'underscore';
import Backbone from 'backbone';
import clone from 'clone';
import Konva from '../konva-clip-patch';

import { format, convert } from '../../../../utils';

let module;
let model;
let metricSize;
let controlSize;
let ratio;

export default Backbone.KonvaView.extend({
    initialize(params) {
        module = params.builder;

        this.layer = params.layer;
        this.stage = params.stage;

        model = module.get('model');
        metricSize = params.metricSize;
        controlSize = metricSize / 4;
    },
    el() {
        const group = new Konva.Group();

        return group;
    },
    render() {
        ratio = module.get('ratio');

        // Clear all previous objects
        this.layer.destroyChildren();
        // Creating unit and adding it to layer
        this.layer.add(this.createMetrics());
        // Draw layer
        this.layer.draw();

        // Detaching and attaching events
        this.undelegateEvents();
        this.delegateEvents();
    },
    events: {},
    createMetrics() {
        const group = new Konva.Group();
        let infoGroup;

        const frameWidth = model.getInMetric('width', 'mm');
        const frameHeight = model.getInMetric('height', 'mm');
        const frameOnScreenWidth = frameWidth * ratio;
        const frameOnScreenHeight = frameHeight * ratio;

        if (model.get('root_section').arched) {
            infoGroup = this.createArchedInfo(frameOnScreenWidth, frameOnScreenHeight);
        } else {
            let mullions;

            if (module.getState('openingView')) {
                mullions = model.getMullions();
            } else {
                mullions = model.getRevertedMullions();
            }

            infoGroup = this.createInfo(mullions, frameOnScreenWidth, frameOnScreenHeight);
        }

        group.add(infoGroup);

        // get stage center
        const center = module.get('center');
        // place unit on stage center
        group.position(center);

        return group;
    },
    createInfo(mullions, width, height) {
        const group = new Konva.Group();

        // Get data for info layer
        mullions = this.sortMullions(mullions);

        const measurements = this.getMeasurements(mullions);
        const controls = this.getControls(mullions);

        // Draw mullion metrics
        group.add(this.createMullionMetrics(measurements, width, height));

        // Draw whole metrics
        group.add(this.createWholeMetrics(measurements, width, height));

        if (!module.getState('isPreview')) {
            // Draw mullion controls
            group.add(this.createMullionControls(controls, width, height));
        }

        // Draw overlay metrics: GlassSize & OpeningSize
        group.add(this.createOverlayMetrics());

        return group;
    },
    sortMullions(mullions) {
        const verticalMullions = [];
        const horizontalMullions = [];

        mullions.forEach((mul) => {
            if (module.getState('selected:mullion') !== null && module.getState('selected:mullion') !== mul.id) {
                return;
            }

            if (mul.type === 'vertical' || mul.type === 'vertical_invisible') {
                verticalMullions.push(mul);
            } else {
                horizontalMullions.push(mul);
            }
        });

        verticalMullions.sort((a, b) => a.position - b.position);
        horizontalMullions.sort((a, b) => a.position - b.position);

        return {
            vertical: verticalMullions,
            horizontal: horizontalMullions,
        };
    },
    getMeasurements(mullions) {
        const view = this;
        const root_section = model.get('root_section');

        const result = {};
        const sizeAccordance = {
            vertical: 'width',
            horizontal: 'height',
        };
        const store_index_accordance = {
            frame: {
                0: 0,
                1: 1,
            },
            mullion: {
                0: 1,
                1: 0,
            },
        };

        function findParentByMeasurementType(section_, type_, key_, index_) {
            let result_ = {
                section: section_,
                index: index_,
            };
            let parent_section_;
            const find_index = (key_ === 0) ? 1 : 0;
            let cur_index = index_;

            if (section_.parentId) {
                if (
                    index_ !== find_index && !(
                        'mullion' in section_.measurements &&
                        type_ in section_.measurements.mullion
                    )
                ) {
                    parent_section_ = model.getSection(section_.parentId);
                    cur_index = (parent_section_.sections[0].id === section_.id) ? 0 : 1;
                    result_ = findParentByMeasurementType(parent_section_, type_, key_, cur_index);
                }
            }

            return result_;
        }

        //        How that algorithm works:
        //        We're easily get basic information: section_id (for setters), offset and size.
        //        Also we have to get information about edges of metrics: top (left) and bottom (right).
        //        There is steps to do it (in a loop for each edge, IND = key):
        //        1. Get REAL_SECTION (for default it's 0 index of section.sections)
        //        2. Get edge TYPE from real section (frame / mullion).
        //        3. Get STORE_INDEX (index that stores data about edge state):
        //              - frame+top = 0
        //              - frame+bottom = 1
        //              - mullion+bottom = 0
        //              - mullion+top = 0
        //        4. Find section that stores data about dimension point (STORE_SECTION):
        //              a). if TYPE === frame, it's easy: get root_section
        //              b). if TYPE === mullion
        //                     and (IND === 0 && edge === bottom)
        //                     or (IND === 1 && edge === top)
        //                  STORE_SECTION = CURRENT_SECTION (mullion.id)
        //              c). else we have to find store section looking over parents.
        //                  We can use algorithm from findParentByMeasurementType function.
        //
        //        Finally, we get an object for each Mullion with structure:
        //        {
        //          section_id: 105, // Id, that will be used by setters to change position of mullion
        //          offset: 0,       // Offset in mm, that used in positioning of measurement
        //          size: 0,         // Size in mm, that used in getters and drawing measurement
        //          index: 0,        // (0/1), that describes that is normal measurement or "gap" (last one)
        //          edges: [         // Array that coints only two objects (two edges of measurement)
        //                  {
        //                      section_id: 158,  // Id, that will be used to store position of dimension point
        //                      type: 'frame',    // Type of edge: frame / mullion
        //                      state: 'max',     // State of current dimension point
        //                      index: 0          // (0/1), points at index of array element,
        //                                                  that stores position of dimension point
        //                  }
        //                  ]
        //        }
        //
        //        When array is completely composed — draw metrics and controls.
        //
        //        This is a small specification, which is better not to push into production,
        //        but I think we'd better to save it somewhere. :-)
        _.each(mullions, (mulGroup, type) => {
            let pos = 0;
            const grouped = {};
            let saved_mullion = null;
            const invertedType = model.getInvertedDivider(type);

            result[type] = [];

            if (mulGroup.length) {
                // smart hack to draw last measurement in a loop with rest of mullions
                const lastMul = mulGroup[mulGroup.length - 1];

                mulGroup.push({
                    gap: true,
                    id: lastMul.id,
                    position: model.getInMetric(sizeAccordance[type], 'mm'),
                    sections: lastMul.sections,
                });
            }

            mulGroup.forEach((mullion) => {
                const current_section = model.getSection(mullion.id);
                const index = (mullion.gap) ? 1 : 0;
                const real_section = mullion.sections[index];
                const edges = view.getMeasurementEdges(real_section.id, invertedType);
                const size = (mullion.position - pos);

                const data = {
                    section_id: mullion.id,
                    offset: pos,
                    size,
                    edges: [],
                    index,
                };
                let loaded = false;

                edges.forEach((edge, key) => {
                    let store_index = store_index_accordance[edge][key];
                    let edge_section;
                    let edge_state;

                    if (edge === 'frame') {
                        if (key === 0 && saved_mullion !== null) {
                            edge = 'mullion';
                            edge_section = saved_mullion;
                            saved_mullion = null;
                            store_index = 1;
                        } else {
                            edge_section = root_section;
                        }
                    } else if (edge === 'mullion') {
                        if (index !== key) {
                            edge_section = (saved_mullion) || current_section;
                            loaded = !!(saved_mullion);
                            saved_mullion = null;
                        } else if (saved_mullion !== null) {
                            edge_section = saved_mullion;
                            loaded = true;
                            saved_mullion = null;
                        } else {
                            edge_section = findParentByMeasurementType(
                                    current_section,
                                    invertedType,
                                    key,
                                    index,
                                );
                            store_index = edge_section.index;
                            edge_section = edge_section.section;
                        }
                    }

                    if (invertedType in edge_section.measurements[edge]) {
                        edge_state = edge_section.measurements[edge][invertedType][store_index];
                    } else {
                        edge_state = edge_section.measurements[edge][type][store_index];
                    }

                    // Change state for mullions if this is vertical mullion and it's outside view
                    if (edge === 'mullion' && type === 'vertical' && module.getState('openingView')) {
                        edge_state = _.contains(['max', 'min'], edge_state) ? { max: 'min', min: 'max' }[edge_state] : 'center';
                    }

                    data.edges[key] = {
                        section_id: edge_section.id,
                        state: edge_state,
                        type: edge,
                        index: store_index,
                    };
                });

                pos = mullion.position;

                if (current_section.sections.length && !loaded) {
                    saved_mullion = current_section;
                }

                result[type].push(data);

                // Store resulted data to groups
                if (mullion.position in grouped) {
                    grouped[mullion.position.toFixed(4)].push(data);
                } else {
                    grouped[mullion.position.toFixed(4)] = [data];
                }
            });

            result[type].forEach((mullion, i) => {
                const pos_ = (mullion.index === 1) ? mullion.offset : mullion.offset + mullion.size;

                const siblings = grouped[pos_.toFixed(4)].filter(sibling => (sibling.section_id !== mullion.section_id));

                result[type][i].siblings = siblings;
            });
        });

        // Switch edges for frame dimension-point for vertical mullions if it's outside view
        if (module.getState('openingView') && result.vertical.length > 0) {
            const firstState = result.vertical[0].edges[0].state;
            const secondState = result.vertical[result.vertical.length - 1].edges[1].state;

            result.vertical[0].edges[0].state = secondState;
            result.vertical[result.vertical.length - 1].edges[1].state = firstState;
        }

        return result;
    },
    createMullionMetrics(mullions, width, height) {
        const view = this;
        const group = new Konva.Group();

        _.each(mullions, (mulGroup, type) => {
            // Draw measurements & controls
            mulGroup.forEach((mullion) => {
                const width_ = mullion.size;
                const params = {};
                let position = {};

                if (width_ > 0) {
                    // Params
                    if (type === 'vertical' || type === 'vertical_invisible') {
                        params.width = (width_ * ratio);
                        params.height = (metricSize);
                        params.space = width_;
                        params.methods = {};

                        position = {
                            x: mullion.offset * ratio,
                            y: height,
                        };
                    } else {
                        params.width = (metricSize);
                        params.height = (width_ * ratio);
                        params.space = width_;
                        params.methods = {};

                        position = {
                            x: -metricSize,
                            y: mullion.offset * ratio,
                        };

                        if (model.isTrapezoid()) {
                            const heights = model.getTrapezoidHeights();

                            if (heights.right > heights.left) {
                                position.x = width;
                            }
                        }
                    }

                    if (mullions[type].length === 2) {
                        params.setter = true;
                    }

                    const metric = view.createMetric(mullion, params, type);

                    metric.position(position);
                    group.add(metric);
                }
            });
        });

        return group;
    },
    createMetric(mullion, params, type) {
        const view = this;
        const section = model.getSection(mullion.section_id);
        const group = new Konva.Group();
        const gap = (mullion.index === 1) ? '_gap' : '';
        const methodName = `setter_${type}${gap}`;

        const correction = view.getTotalCorrection(mullion, type);
        const methods = {
            getter() {
                return this.space;
            },
            setter_vertical(val) {
                val -= correction.size;

                if (!this.openingView) {
                    val = model.getInMetric('width', 'mm') - val;
                }

                model.setSectionMullionPosition(this.id, val);
            },
            setter_vertical_gap(val) {
                val -= correction.size;

                if (this.openingView) {
                    val = model.getInMetric('width', 'mm') - val;
                }

                model.setSectionMullionPosition(this.id, val);
            },
            setter_horizontal(val) {
                val -= correction.size;
                model.setSectionMullionPosition(this.id, val);
            },
            setter_horizontal_gap(val) {
                val -= correction.size;
                model.setSectionMullionPosition(this.id, model.getInMetric('height', 'mm') - val);
            },
        };
        const drawingAccordance = {
            vertical: 'createHorizontalMetric',
            horizontal: 'createVerticalMetric',
        };

        // Apply corrections to sizes
        params.space += correction.size;
        params.position = {};

        if (type === 'vertical') {
            params.width += correction.size * ratio;
            params.position.x = correction.pos * ratio;
        } else {
            params.height += correction.size * ratio;
            params.position.y = correction.pos * ratio;
        }

        // Attach getter
        params.methods.getter = methods.getter.bind({ space: params.space });
        // Attach setter
        if (params.setter) {
            params.methods.setter = methods[methodName].bind({
                openingView: module.getState('openingView'),
                id: section.id,
                model,
            });
        }

        // Draw metrics
        const metric = view[drawingAccordance[type]](params.width, params.height, params.methods);
        // Apply corrections to position
        metric.position(params.position);

        // Add metric to the group:
        // We using group to make its position relative to the basic position
        group.add(metric);

        return group;
    },
    getCorrection() {
        return {
            frame_width: model.profile.get('frame_width'),
            mullion_width: model.profile.get('mullion_width') / 2,
            size: 0,
            pos: 0,
        };
    },
    getControls(mullions) {
        const result = {};

        _.each(mullions, (mGroup, type) => {
            const siblings = {};

            result[type] = [];

            mGroup.forEach((mullion) => {
                if (mullion.gap) {
                    return;
                }

                if (!(mullion.position in siblings)) {
                    // Store mullion id into siblings array
                    siblings[mullion.position] = [mullion.id];

                    const mType = model.getInvertedDivider(type);
                    const section = model.getSection(mullion.id);
                    let state = section.measurements.mullion[mType][0];

                    // Change state if this is vertical control and it's outside view
                    if (type === 'vertical' && module.getState('openingView')) {
                        state = _.contains(['max', 'min'], state) ? { max: 'min', min: 'max' }[state] : 'center';
                    }

                    const data = {
                        position: mullion.position,
                        state,
                        kind: 'mullion',
                        type: mType,
                        sections: [mullion.id],
                    };

                    result[type].push(data);
                // Store mullion id into siblings array and skip them
                // If it has an unique id
                } else if (siblings[mullion.position].indexOf(mullion.id) === -1) {
                    siblings[mullion.position].push(mullion.id);
                }
            });

            // Linking siblings
            result[type].forEach((mullion, i) => {
                result[type][i].sections = siblings[mullion.position];
            });
        });

        return result;
    },
    getMullionCorrection(type, value, index, correction) {
        value = value || 0;
        correction = correction || this.getCorrection();

        if (type === 'frame') {
            if (value === 'min') {
                correction.size -= correction.frame_width;
                correction.pos += (index === 0) ? correction.frame_width : 0;
            }

            // Max is default
        } else {
            if (value === 'min') {
                correction.size -= correction.mullion_width;
                correction.pos += (index === 1) ? correction.mullion_width : 0;
            }

            if (value === 'max') {
                correction.size += correction.mullion_width;
                correction.pos -= (index === 1) ? correction.mullion_width : 0;
            }

            // Center is default
        }

        return correction;
    },
    getFrameCorrectionSum(type, correction) {
        const root_section = model.get('root_section');
        const measurementData = root_section.measurements.frame;

        if (type === 'horizontal' && module.getState('openingView')) {
            measurementData[type].reverse();
        }

        correction = correction || this.getCorrection();

        measurementData[type].forEach((value, i) => {
            if (value === 'min') {
                correction.size -= correction.frame_width;
                correction.pos += (i === 0) ? correction.frame_width : 0;
            }
        });

        return correction;
    },
    getFrameCorrection(type) {
        const root_section = model.get('root_section');
        const measurementData = root_section.measurements.frame;
        const correction = [this.getCorrection(), this.getCorrection()];

        measurementData[type].forEach((value, i) => {
            if (value === 'min') {
                correction[i].size -= correction[i].frame_width;
                correction[i].pos += (i === 0) ? correction[i].frame_width : 0;
            }
        });

        return correction;
    },
    getTotalCorrection(mullion) {
        const view = this;
        let correction = view.getCorrection();

        mullion.edges.forEach((edge) => {
            correction = view.getMullionCorrection(edge.type, edge.state, edge.index, correction);
        });

        return correction;
    },
    createControl(width, height) {
        const view = this;
        const style = module.getStyle('measurements');
        const control = new Konva.Rect({
            width,
            height,
            fill: style.controls.normal.fill,
            opacity: style.controls.normal.opacity,
        });

        control.on('mouseover', () => {
            control.fill(style.controls.hover.fill);
            view.updateLayer();
        });
        control.on('mouseout', () => {
            control.fill(style.controls.normal.fill);
            view.updateLayer();
        });

        return control;
    },
    createWholeControls(section_id, width, height, type) {
        const group = new Konva.Group();
        // prepare size and position
        let size_1 = 0;
        let size_2 = 0;
        const positions = [];

        if (type === 'vertical' || type === 'vertical_invisible') {
            size_1 = width;
            size_2 = controlSize;

            positions.push({});
            positions.push({ y: height - controlSize });
        } else {
            size_1 = controlSize;
            size_2 = height;

            positions.push({});
            positions.push({ x: width - controlSize });
        }

        // Make both controls recursively
        for (let i = 0; i < 2; i += 1) {
            // Create control
            const control = this.createControl(size_1, size_2);
            const index = (!module.getState('openingView')) ? i : (i + 1) % 2;

            // Attach event
            control.on('click', this.createMeasurementSelectFrame.bind(this, section_id, 'frame', type, index));

            // Position right/bottom control
            control.position(positions[i]);

            group.add(control);
        }

        return group;
    },
    createMullionControls(controls, width, height) {
        const view = this;
        const group = new Konva.Group();

        const root_section = model.get('root_section');

        _.each(controls, (cGroup, type) => {
            cGroup.forEach((controlData) => {
                const position = { x: 0, y: 0 };
                const correction = view.getCorrection();
                let width_;
                let height_;

                if (controlData.state !== 'center') {
                    correction.size = (controlData.state === 'min') ?
                        -correction.mullion_width : correction.mullion_width;
                }

                if (type === 'horizontal') {
                    position.y = (0 + (controlData.position * ratio) + (correction.size * ratio)) - (controlSize / 2);
                    position.x = -metricSize;

                    if (model.isTrapezoid()) {
                        const heights = model.getTrapezoidHeights();

                        if (heights.right > heights.left) {
                            position.x = width;
                        }
                    }

                    width_ = metricSize;
                    height_ = controlSize;
                } else {
                    position.x += (0 + (controlData.position * ratio) + (correction.size * ratio)) - (controlSize / 2);
                    position.y = height;

                    width_ = controlSize;
                    height_ = metricSize;
                }

                const control = view.createControl(width_, height_);
                // Attach events
                control.on('click', view.createMeasurementSelectMullion.bind(view, controlData),
                );

                control.position(position);
                group.add(control);
            });

            // Draw controls for frame
            if (cGroup.length) {
                const invertedType = model.getInvertedDivider(type);
                const correction = view.getFrameCorrectionSum(invertedType);

                let cor = {
                    size: correction.size,
                    pos: correction.pos,
                };

                if (invertedType === 'horizontal') {
                    let pos = correction.pos;

                    if (!module.getState('openingView')) {
                        pos = correction.pos;
                    } else if (correction.pos === 0) {
                        pos = correction.size * -1;
                    } else if (correction.pos * -1 === correction.size) {
                        pos = correction.pos + correction.size;
                    }

                    cor = {
                        size: correction.size,
                        pos,
                    };
                }

                cor.size *= ratio;
                cor.pos *= ratio;

                const params = {
                    width: (invertedType === 'vertical') ? metricSize : width + cor.size,
                    height: (invertedType === 'vertical') ? height + cor.size : metricSize,
                    position: {
                        x: (invertedType === 'vertical') ? metricSize * -1 : 0 + cor.pos,
                        y: (invertedType === 'vertical') ? 0 + cor.pos : height,
                    },
                };

                if (invertedType === 'vertical' && model.isTrapezoid()) {
                    const heights = model.getTrapezoidHeights();

                    if (heights.right > heights.left) {
                        params.position.x = width;
                    }
                }

                const frameControls = view.createWholeControls(
                    root_section.id,
                    params.width,
                    params.height,
                    invertedType,
                );

                frameControls.position(params.position);

                group.add(frameControls);
            }
        });

        return group;
    },
    createMeasurementSelectUI(event, opts) {
        const view = this;
        const contolSize = metricSize / 4;
        const style = module.getStyle('measurements');

        let min = 'min';
        let max = 'max';

        if (opts.type !== 'vertical' && opts.kind === 'frame' && module.getState('openingView')) {
            min = 'max';
            max = 'min';
        }

        view.updateLayer();

        // View
        const target = event.target;
        const sign = (opts.kind === 'frame' && opts.index === 1) ? -1 : 1;
        const origPosition = target.getAbsolutePosition();
        const posParam = (opts.type === 'vertical') ? 'y' : 'x';
        const width = (opts.type === 'vertical') ? metricSize : contolSize;
        const height = (opts.type === 'vertical') ? contolSize : metricSize;
        const offset = (opts.kind === 'mullion') ?
            view.getCorrection().mullion_width : view.getCorrection().frame_width;
        const posCorrection = (opts.type === 'vertical') ? target.height() : target.width();

        // Hide control for select a dimension point
        target.destroy();

        // First of all, we re checking current state and correct position of "zero point"
        // So "zero point" should be the same for any current state
        if (
            opts.kind === 'frame' && opts.state === min
        ) {
            const isMax = (opts.state === max) ? 1 : -1;

            origPosition[posParam] += posCorrection * sign * isMax;
        } else if (opts.kind === 'mullion' && opts.state !== 'center') {
            origPosition[posParam] += (opts.state === min) ? posCorrection : posCorrection * -1;
        }
        // Create controls
        opts.states.forEach((opt) => {
            if (opt.value === opts.state) {
                return;
            }

            let value = opt.value;

            if (opts.type !== 'vertical' && opts.kind === 'mullion' && module.getState('openingView')) {
                value = model.getInvertedMeasurementVal(opt.value);
            }

            const control = new Konva.Rect({
                fill: style.select.normal.fill,
                opacity: style.select.normal.opacity,
                width,
                height,
            });
            const controlPosition = clone(origPosition);
            let correction = 0;

            // Correcting position of controls
            if (opts.kind === 'frame') {
                correction = (opt.value === min) ? offset * sign : 0;
            } else if (opts.kind === 'mullion') {
                correction = 0;

                if (opt.value === min) {
                    controlPosition[posParam] += (-1 * posCorrection) / 2;
                    correction = offset * -1;
                } else if (opt.value === max) {
                    controlPosition[posParam] += posCorrection / 2;
                    correction = offset;
                }
            }

            controlPosition[posParam] += (correction * ratio);
            control.position(controlPosition);

            const secondArg = (opts.control) ? opts.control : opts.section.id;

            // Attach events
            control.on('click', () => {
                opts.setter(value, secondArg);
                view.updateLayer();
            });
            control.on('mouseover', () => {
                control.opacity(style.select.hover.opacity);
                view.updateLayer();
            });
            control.on('mouseout', () => {
                control.opacity(style.select.normal.opacity);
                view.updateLayer();
            });

            view.layer.add(control);
        });

        view.layer.draw();
    },
    createMeasurementSelectFrame(section_id, mType, type, index, event) {
        const view = this;
        const section = model.getSection(section_id);
        // Get available states
        const states = model.getMeasurementStates(mType);
        // Get current state of dimension-point
        const state = section.measurements[mType][type][index];

        const opts = {
            kind: 'frame',
            type,
            section,
            states,
            state,
            index,
            setter(val, id) {
                section.measurements[mType][type][index] = val;

                model.setSectionMeasurements(id, section.measurements);
            },
        };

        return view.createMeasurementSelectUI(event, opts);
    },
    createMeasurementSelectMullion(control, event) {
        const view = this;

        // Get available states
        const states = model.getMeasurementStates('mullion');
        // Get current state of dimension-point
        const state = control.state;

        const opts = {
            kind: 'mullion',
            type: control.type,
            control,
            states,
            state,
            setter(val, control_) {
                const invertedVal = model.getInvertedMeasurementVal(val);

                _.each(control_.sections, (section_id) => {
                    const section = model.getSection(section_id);

                    section.measurements[control.kind][control.type][0] = val;
                    section.measurements[control.kind][control.type][1] = invertedVal;

                    model.setSectionMeasurements(section_id, section.measurements);
                });
            },
        };

        return view.createMeasurementSelectUI(event, opts);
    },
    createWholeMetrics(mullions, width, height) {
        const group = new Konva.Group();
        const root_section = model.generateFullRoot();
        const rows = {
            vertical: mullions.vertical.length ? 1 : 0,
            horizontal: mullions.horizontal.length ? 1 : 0,
        };

        // Correction parameters for metrics
        const vCorrection = this.getFrameCorrectionSum('vertical');
        const hCorrection = this.getFrameCorrectionSum('horizontal');

        // Vertical
        const vHeight = height + (vCorrection.size * ratio);

        const verticalWholeMertic = this.createVerticalMetric(metricSize, vHeight, {
            name: 'vertical_whole_metric',
            setter(val) {
                if (_.isArray(val)) {
                    val = val.map(value => value - vCorrection.size);
                    model.updateDimension('height', val, 'mm');
                } else {
                    val -= vCorrection.size;
                    model.updateDimension('height_max', val, 'mm');
                }
            },
            getter() {
                return model.getInMetric('height', 'mm') + vCorrection.size;
            },
        });
        const vPosition = {
            x: -metricSize * (rows.horizontal + 1),
            y: 0 + (vCorrection.pos * ratio),
        };

        if (model.isTrapezoid()) {
            const heights = model.getTrapezoidHeights();
            const minHeight = (heights.right > heights.left) ? heights.left : heights.right;
            const maxHeight = (heights.right < heights.left) ? heights.left : heights.right;

            if (heights.right > heights.left) {
                vPosition.x = (metricSize * rows.horizontal) + width;
            }

            // Second vertical whole metric for trapezoid
            const secondVerticalHeight = vHeight * ((minHeight / (maxHeight / 100)) / 100);
            const secondVerticalWholeMertic = this.createVerticalMetric(metricSize, secondVerticalHeight, {
                name: 'vertical_whole_metric',
                setter(val) {
                    if (_.isArray(val)) {
                        val = val.map(value => value - vCorrection.size);
                        model.updateDimension('height', val, 'mm');
                    } else {
                        val -= vCorrection.size;
                        model.updateDimension('height_min', val, 'mm');
                    }
                },
                getter() {
                    return minHeight + vCorrection.size;
                },
            });
            const secondVerticalPosition = {
                x: (heights.right > heights.left) ? -metricSize : width,
                y: (vCorrection.pos + (maxHeight - minHeight)) * ratio,
            };

            secondVerticalWholeMertic.position(secondVerticalPosition);
            group.add(secondVerticalWholeMertic);

            // Third vertical whole metric for trapezoid
            const thirdVerticalHeight = vHeight - secondVerticalHeight;
            const thirdVerticalWholeMertic = this.createVerticalMetric(metricSize, thirdVerticalHeight, {
                name: 'vertical_whole_metric',
                setter(val) {
                    if (_.isArray(val)) {
                        val = val.map(value => value - vCorrection.size);
                        model.updateDimension('height', val, 'mm');
                    } else {
                        val -= vCorrection.size;
                        model.updateDimension('height_min', maxHeight - val, 'mm');
                    }
                },
                getter() {
                    return (maxHeight - minHeight) + vCorrection.size;
                },
            });

            secondVerticalPosition.y = 0 + (vCorrection.pos * ratio);
            thirdVerticalWholeMertic.position(secondVerticalPosition);
            group.add(thirdVerticalWholeMertic);
        }

        verticalWholeMertic.position(vPosition);
        group.add(verticalWholeMertic);

        // Horizontal
        const hWidth = width + (hCorrection.size * ratio);
        const horizontalWholeMertic = this.createHorizontalMetric(hWidth, metricSize, {
            setter(val) {
                val -= hCorrection.size;
                model.updateDimension('width', val, 'mm');
            },
            getter() {
                return model.getInMetric('width', 'mm') + hCorrection.size;
            },
        });

        const hPosition = {
            x: 0 + (hCorrection.pos * ratio),
            y: height + (rows.vertical * metricSize),
        };

        horizontalWholeMertic.position(hPosition);
        group.add(horizontalWholeMertic);

        // Create controls
        if (!module.getState('isPreview')) {
            const vControls = this.createWholeControls(root_section.id, metricSize, vHeight, 'vertical');
            const hControls = this.createWholeControls(root_section.id, hWidth, metricSize, 'horizontal');

            vControls.position(vPosition);
            hControls.position(hPosition);
            group.add(vControls, hControls);
        }

        return group;
    },
    createOverlayMetrics() {
        // Algorithm:
        // 1. Get a full root
        // 2. Recursively look at each child section:
        // 3. If it's measurenets.glass value equal TRUE — draw GlassSizeMetrics
        // 4. If it's sashType !== fixed_in_frame — it should have an opening size
        //    so we're looking for measurements.openingSize value,
        //    if its equal TRUE — draw OpeningSizeMetrics
        //
        // Interesting moments:
        // 1. If user selected to show opening/glass size in one of sections
        //    and then selected to show opening/glass size of its parents —
        //    show only parents (use flags to each of metrics type).

        // Function to find overlay metrics recursively
        function findOverlay(section, results, level) {
            level = level || 0;

            if (
                section.measurements.glass ||
                (section.sashType !== 'fixed_in_frame' && section.measurements.opening)
            ) {
                const type = (section.measurements.glass) ? 'glass' : 'opening';

                results.push({
                    section_id: section.id,
                    type,
                    level,
                    params: section[`${type}Params`],
                });
            } else if (section.sections.length) {
                section.sections.forEach((child) => {
                    level += 1;
                    findOverlay(child, results, level);
                });
            }

            return results;
        }

        const view = this;
        const style = module.getStyle('overlay_measurements');
        const group = new Konva.Group();
        const root = (module.getState('openingView')) ? model.generateFullRoot() : model.generateFullReversedRoot();
        const results = [];

        findOverlay(root, results);

        results.forEach((metric) => {
            const mSize = (metricSize / 2);
            const width = metric.params.width * ratio;
            const height = metric.params.height * ratio;
            const position = {
                x: metric.params.x * ratio,
                y: metric.params.y * ratio,
            };
            const vertical = view.createVerticalMetric(
                mSize / 2,
                height,
                {
                    getter() {
                        return metric.params.height;
                    },
                }, style.label);
            const horizontal = view.createHorizontalMetric(
                width,
                mSize / 2,
                {
                    getter() {
                        return metric.params.width;
                    },
                }, style.label);

            vertical.position({
                x: position.x + mSize,
                y: position.y,
            });
            horizontal.position({
                x: position.x,
                y: position.y + mSize,
            });

            group.add(vertical, horizontal);
        });

        return group;
    },
    createArchedInfo(width, height) {
        const group = new Konva.Group();

        const vCorrection = this.getFrameCorrection('vertical');
        const vwCorrection = this.getFrameCorrectionSum('vertical');
        const hwCorrection = this.getFrameCorrectionSum('horizontal');

        const root_section = model.get('root_section');
        const archHeight = model.getArchedPosition() + vCorrection[0].size;
        let params = {
            getter() {
                return archHeight;
            },
            setter(val) {
                val -= vCorrection[0].size;

                const id = root_section.id;

                model._updateSection(id, (section) => {
                    section.archPosition = val;
                });
            },
        };

        const vHeight = (model.getInMetric('height', 'mm') +
                vCorrection[0].size + vCorrection[1].size
            ) * ratio;

        const vPosition = {
            x: -metricSize,
            y: vCorrection[0].pos * ratio,
        };
        let metric = this.createVerticalMetric(metricSize, archHeight * ratio, params);
        const vControls = this.createWholeControls(root_section.id, metricSize * 2, vHeight, 'vertical');

        metric.position(vPosition);

        vPosition.x *= 2;
        vControls.position(vPosition);
        group.add(metric, vControls);

        const nonArchHeight = (model.getInMetric('height', 'mm') - archHeight) + vCorrection[1].size;

        params = {
            getter() {
                return nonArchHeight;
            },
            setter(val) {
                val -= vCorrection[1].size;

                const id = model.get('root_section').id;
                const archPosition = model.getInMetric('height', 'mm') - val;

                model._updateSection(id, (section) => {
                    section.archPosition = archPosition;
                });
            },
        };
        metric = this.createVerticalMetric(metricSize, (nonArchHeight + vCorrection[0].size) * ratio, params);
        metric.position({
            x: -metricSize,
            y: (archHeight + vCorrection[0].pos) * ratio,
        });
        group.add(metric);

        const verticalWholeMertic = this.createVerticalMetric(metricSize,
            (height + (vwCorrection.size * ratio)),
            {
                name: 'vertical_whole_metric',
                setter(val) {
                    if (_.isArray(val)) {
                        val = val.map(value => value - vwCorrection.size);
                        model.updateDimension('height', val, 'mm');
                    } else {
                        val -= vwCorrection.size;
                        model.updateDimension('height', val, 'mm');
                    }
                },
                getter() {
                    return (model.getInMetric('height', 'mm') + vwCorrection.size);
                },
            });

        verticalWholeMertic.position({
            x: -metricSize * 2,
            y: 0 + (vwCorrection.pos * ratio),
        });

        group.add(verticalWholeMertic);

        const hWidth = (width + (hwCorrection.size * ratio));
        const hControls = this.createWholeControls(root_section.id, hWidth, metricSize, 'horizontal');
        const hPosition = {
            x: 0 + (hwCorrection.pos * ratio),
            y: height,
        };
        const horizontalWholeMertic = this.createHorizontalMetric(hWidth,
            metricSize,
            {
                setter(val) {
                    val -= hwCorrection.size;
                    model.updateDimension('width', val, 'mm');
                },
                getter() {
                    return (model.getInMetric('width', 'mm') + hwCorrection.size);
                },
            });

        horizontalWholeMertic.position(hPosition);
        hControls.position(hPosition);

        group.add(horizontalWholeMertic, hControls);

        return group;
    },
    getMeasurementEdges(section_id, type) {
        const edges = model.getMeasurementEdges(section_id);
        let edgeTypes = [];

        if (type === 'horizontal') {
            edgeTypes = [edges.left, edges.right];

            if (!module.getState('insideView')) {
                edgeTypes.reverse();
            }
        } else {
            edgeTypes = [edges.top, edges.bottom];
        }

        return edgeTypes;
    },
    createVerticalMetric(width, height, params, styles) {
        const arrowOffset = width / 2;
        const arrowSize = 5;
        const group = new Konva.Group({ name: params.name });

        // Define styles
        styles = styles || {};
        styles = _.defaults(styles, this.getDefaultMetricStyles());

        const lines = new Konva.Shape({
            sceneFunc(ctx) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(width, 0);

                ctx.moveTo(0, height);
                ctx.lineTo(width, height);

                ctx.stroke();
            },
            stroke: styles.arrows.stroke,
            strokeWidth: styles.arrows.strokeWidth,
        });

        const arrow = new Konva.Shape({
            sceneFunc(ctx) {
                ctx.translate(arrowOffset, 0);

                ctx.beginPath();
                // top pointer
                ctx.moveTo(-arrowSize, arrowSize);
                ctx.lineTo(0, 0);
                ctx.lineTo(arrowSize, arrowSize);

                // line
                ctx.moveTo(0, 0);
                ctx.lineTo(0, height);

                // bottom pointer
                ctx.moveTo(-arrowSize, height - arrowSize);
                ctx.lineTo(0, height);
                ctx.lineTo(arrowSize, height - arrowSize);

                ctx.strokeShape(this);
            },
            stroke: styles.arrows.stroke,
            strokeWidth: styles.arrows.strokeWidth,
        });

        // left text
        const labelMM = new Konva.Label();

        labelMM.add(new Konva.Tag({
            fill: styles.label.fill,
            stroke: styles.label.stroke,
            strokeWidth: styles.label.strokeWidth,
        }));
        const textMM = new Konva.Text({
            text: format.dimension_mm(params.getter()),
            padding: styles.label.padding,
            fontFamily: styles.label.fontFamily,
            fontSize: styles.label.fontSize,
            fill: styles.label.color,
        });

        labelMM.add(textMM);
        labelMM.position({
            x: (width / 2) - (textMM.width() / 2),
            y: (height / 2) + (textMM.height() / 2),
        });

        // left text
        const labelInches = new Konva.Label();

        labelInches.add(new Konva.Tag({
            fill: styles.label.fill,
            stroke: styles.label.stroke,
            strokeWidth: styles.label.strokeWidth,
        }));
        const inches = convert.mm_to_inches(params.getter());
        const val = format.dimension(inches, 'fraction', module.getState('inchesDisplayMode'));
        const textInches = new Konva.Text({
            text: val,
            padding: styles.label.padding,
            fill: styles.label.color,
            fontFamily: styles.label.fontFamily,
            fontSize: styles.label.fontSize_big,
        });

        labelInches.add(textInches);
        labelInches.position({
            x: (width / 2) - (textInches.width() / 2),
            y: (height / 2) - (textInches.height() / 2),
        });

        if (params.setter) {
            labelInches.on('click tap', () => {
                module.trigger('labelClicked', {
                    params,
                    pos: labelInches.getAbsolutePosition(),
                    size: textInches.size(),
                });
            });
        }

        group.add(lines, arrow, labelInches, labelMM);
        return group;
    },

    createHorizontalMetric(width, height, params, styles) {
        const arrowOffset = height / 2;
        const arrowSize = 5;
        const group = new Konva.Group();

        // Define styles
        styles = styles || {};
        styles = _.defaults(styles, this.getDefaultMetricStyles());

        const lines = new Konva.Shape({
            sceneFunc(ctx) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, height);

                ctx.moveTo(width, 0);
                ctx.lineTo(width, height);

                ctx.stroke();
            },
            stroke: styles.arrows.stroke,
            strokeWidth: styles.arrows.strokeWidth,
        });

        const arrow = new Konva.Shape({
            sceneFunc(ctx) {
                // top pointer
                ctx.translate(0, arrowOffset);

                ctx.beginPath();
                ctx.moveTo(arrowSize, -arrowSize);
                ctx.lineTo(0, 0);
                ctx.lineTo(arrowSize, arrowSize);

                // line
                ctx.moveTo(0, 0);
                ctx.lineTo(width, 0);

                // bottom pointer
                ctx.moveTo(width - arrowSize, -arrowSize);
                ctx.lineTo(width, 0);
                ctx.lineTo(width - arrowSize, arrowSize);

                ctx.strokeShape(this);
            },
            stroke: styles.arrows.stroke,
            strokeWidth: styles.arrows.strokeWidth,
        });

        const labelMM = new Konva.Label();

        labelMM.add(new Konva.Tag({
            fill: styles.label.fill,
            stroke: styles.label.stroke,
            strokeWidth: styles.label.strokeWidth,
        }));
        const textMM = new Konva.Text({
            text: format.dimension_mm(params.getter()),
            padding: styles.label.padding,
            fontFamily: styles.label.fontFamily,
            fontSize: styles.label.fontSize,
            fill: styles.label.color,
        });

        labelMM.add(textMM);
        labelMM.position({
            x: (width / 2) - (textMM.width() / 2),
            y: arrowOffset + (textMM.height() / 2),
        });

        const labelInches = new Konva.Label();

        labelInches.add(new Konva.Tag({
            fill: styles.label.fill,
            stroke: styles.label.stroke,
            strokeWidth: styles.label.strokeWidth,
        }));
        const inches = convert.mm_to_inches(params.getter());
        const val = format.dimension(inches, 'fraction', module.getState('inchesDisplayMode'));
        const textInches = new Konva.Text({
            text: val,
            padding: styles.label.padding,
            fill: styles.label.color,
            fontFamily: styles.label.fontFamily,
            fontSize: styles.label.fontSize_big,
        });

        labelInches.add(textInches);
        labelInches.position({
            x: (width / 2) - (textInches.width() / 2),
            y: arrowOffset - (labelInches.height() / 2),
        });

        if (params.setter) {
            labelInches.on('click tap', () => {
                module.trigger('labelClicked', {
                    params,
                    pos: labelInches.getAbsolutePosition(),
                    size: textInches.size(),
                });
            });
        }

        group.add(lines, arrow, labelInches, labelMM);
        return group;
    },
    getDefaultMetricStyles() {
        return module.getStyle('measurements');
    },
    updateLayer() {
        this.layer.draw();
    },
});
