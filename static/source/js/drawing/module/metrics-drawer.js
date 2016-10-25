var app = app || {};

(function () {
    'use strict';

    var module;
    var model;
    var metricSize;
    var controlSize;
    var ratio;

    app.Drawers = app.Drawers || {};
    app.Drawers.MetricsDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            module = params.builder;

            this.layer = params.layer;
            this.stage = params.stage;

            model = module.get('model');
            metricSize = params.metricSize;
            controlSize = metricSize / 4;
        },
        el: function () {
            var group = new Konva.Group();

            return group;
        },
        render: function () {
            ratio = module.get('ratio');

            // Clear all previous objects
            this.layer.destroyChildren();
            // Creating unit and adding it to layer
            this.layer.add( this.createMetrics() );
            // Draw layer
            this.layer.draw();

            // Detaching and attaching events
            this.undelegateEvents();
            this.delegateEvents();
        },
        events: {

        },
        createMetrics: function () {
            var group = new Konva.Group();
            var infoGroup;

            var frameWidth = model.getInMetric('width', 'mm');
            var frameHeight = model.getInMetric('height', 'mm');
            var frameOnScreenWidth = frameWidth * ratio;
            var frameOnScreenHeight = frameHeight * ratio;

            if (model.get('root_section').arched) {
                infoGroup = this.createArchedInfo(frameOnScreenWidth, frameOnScreenHeight);
            } else {
                var mullions;

                if (module.getState('openingView')) {
                    mullions = model.getMullions();
                } else {
                    mullions = model.getRevertedMullions();
                }

                infoGroup = this.createInfo(mullions, frameOnScreenWidth, frameOnScreenHeight);
            }

            group.add( infoGroup );

            // get stage center
            var center = module.get('center');
            // place unit on stage center
            group.position( center );

            return group;
        },
        createInfo: function (mullions, width, height) {
            var group = new Konva.Group();
            var measurements;
            var controls;

            // Get data for info layer
            mullions = this.sortMullions(mullions);
            measurements = this.getMeasurements(mullions);
            controls = this.getControls(mullions);

            // Draw mullion metrics
            group.add( this.createMullionMetrics(measurements, width, height) );

            // Draw whole metrics
            group.add( this.createWholeMetrics(measurements, width, height) );

            if (!module.getState('isPreview')) {
                // Draw mullion controls
                group.add( this.createMullionControls(controls, width, height) );
            }

            // Draw overlay metrics: GlassSize & OpeningSize
            group.add( this.createOverlayMetrics() );

            return group;
        },
        sortMullions: function (mullions) {
            var verticalMullions = [];
            var horizontalMullions = [];

            mullions.forEach(function (mul) {
                if (module.getState('selected:mullion') !== null && module.getState('selected:mullion') !== mul.id) {
                    return;
                }

                if (mul.type === 'vertical' || mul.type === 'vertical_invisible') {
                    verticalMullions.push(mul);
                } else {
                    horizontalMullions.push(mul);
                }
            });

            verticalMullions.sort(function (a, b) {return a.position - b.position; });
            horizontalMullions.sort(function (a, b) {return a.position - b.position; });

            return {
                vertical: verticalMullions,
                horizontal: horizontalMullions
            };
        },
        getMeasurements: function (mullions) {
            var view = this;
            var root_section = model.get('root_section');

            var result = {};
            var sizeAccordance = {
                vertical: 'width',
                horizontal: 'height'
            };
            var store_index_accordance = {
                frame: {
                    0: 0,
                    1: 1
                },
                mullion: {
                    0: 1,
                    1: 0
                }
            };

            function findParentByMeasurementType( section_, type_, key_, index_ ) {
                var result_ = {
                    section: section_,
                    index: index_
                };
                var parent_section_;
                var find_index = (key_ === 0) ? 1 : 0;
                var cur_index = index_;

                if (section_.parentId) {
                    if (
                        index_ !== find_index &&
                        !(
                            'mullion' in section_.measurements &&
                            type_ in section_.measurements.mullion
                        )
                    ) {
                        parent_section_ = model.getSection( section_.parentId );
                        cur_index = (parent_section_.sections[0].id === section_.id) ? 0 : 1;
                        result_ = findParentByMeasurementType( parent_section_, type_, key_, cur_index );
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

            /* eslint-disable max-nested-callbacks */
            _.each(mullions, function (mulGroup, type) {
                var pos = 0;
                var grouped = {};
                var saved_mullion = null;
                var invertedType = model.getInvertedDivider( type );

                result[type] = [];

                if ( mulGroup.length ) {
                    // smart hack to draw last measurement in a loop with rest of mullions
                    var lastMul = mulGroup[ mulGroup.length - 1];

                    mulGroup.push({
                        gap: true,
                        id: lastMul.id,
                        position: model.getInMetric( sizeAccordance[type], 'mm'),
                        sections: lastMul.sections
                    });
                }

                mulGroup.forEach(function (mullion) {
                    var current_section = model.getSection(mullion.id);
                    var index = (mullion.gap) ? 1 : 0;
                    var real_section = mullion.sections[index];
                    var edges = view.getMeasurementEdges( real_section.id, invertedType );
                    var size = (mullion.position - pos);

                    var data = {
                        section_id: mullion.id,
                        offset: pos,
                        size: size,
                        edges: [],
                        index: index
                    };
                    var loaded = false;

                    edges.forEach(function (edge, key) {
                        var store_index = store_index_accordance[edge][key];
                        var edge_section;
                        var edge_state;

                        if (edge === 'frame') {
                            if (key === 0 && saved_mullion !== null) {
                                edge = 'mullion';
                                edge_section = saved_mullion;
                                saved_mullion = null;
                                store_index = 1;
                            } else {
                                edge_section = root_section;
                            }
                        } else if ( edge === 'mullion' ) {
                            if ( index !== key ) {
                                edge_section = (saved_mullion) ? saved_mullion : current_section;
                                loaded = !!(saved_mullion);
                                saved_mullion = null;
                            } else {
                                if (saved_mullion !== null) {
                                    edge_section = saved_mullion;
                                    loaded = true;
                                    saved_mullion = null;
                                } else {
                                    edge_section = findParentByMeasurementType(
                                        current_section,
                                        invertedType,
                                        key,
                                        index
                                    );
                                    store_index = edge_section.index;
                                    edge_section = edge_section.section;
                                }
                            }
                        }

                        if (invertedType in edge_section.measurements[edge]) {
                            edge_state = edge_section.measurements[edge][invertedType][store_index];
                        } else {
                            edge_state = edge_section.measurements[edge][type][store_index];
                        }

                        // Change state for mullions if this is vertical mullion and it's outside view
                        if (edge === 'mullion' && type === 'vertical' && module.getState('openingView')) {
                            edge_state = (edge_state === 'min') ? 'max' :
                                         (edge_state === 'max') ? 'min' :
                                         'center';
                        }

                        data.edges[key] = {
                            section_id: edge_section.id,
                            state: edge_state,
                            type: edge,
                            index: store_index
                        };
                    });

                    pos = mullion.position;

                    if (current_section.sections.length && !loaded) {
                        saved_mullion = current_section;
                    }

                    result[type].push(data);

                    // Store resulted data to groups
                    if (mullion.position in grouped) {
                        grouped[mullion.position.toFixed(4)].push( data );
                    } else {
                        grouped[mullion.position.toFixed(4)] = [data];
                    }
                });

                result[type].forEach(function (mullion, i) {
                    var pos_ = (mullion.index === 1) ? mullion.offset : mullion.offset + mullion.size;

                    var siblings = grouped[pos_.toFixed(4)].filter(function (sibling) {
                            return (sibling.section_id !== mullion.section_id);
                        });

                    result[type][i].siblings = siblings;
                });
            });
            /* eslint-enable max-nested-callbacks */

            // Switch edges for frame dimension-point for vertical mullions if it's outside view
            if (module.getState('openingView') && result.vertical.length > 0) {
                var firstState = result.vertical[0].edges[0].state;
                var secondState = result.vertical[ result.vertical.length - 1 ].edges[1].state;

                result.vertical[0].edges[0].state = secondState;
                result.vertical[ result.vertical.length - 1 ].edges[1].state = firstState;
            }

            return result;
        },
        createMullionMetrics: function (mullions, width, height) {
            var view = this;
            var group = new Konva.Group();

            _.each(mullions, function (mulGroup, type) {
                // Draw measurements & controls
                mulGroup.forEach(function (mullion) {
                    var width_ = mullion.size;
                    var params = {};
                    var position = {};

                    if (width_ > 0) {

                        // Params
                        if (type === 'vertical' || type === 'vertical_invisible') {
                            params.width = (width_ * ratio);
                            params.height = (metricSize);
                            params.space = width_;
                            params.methods = {};

                            position = {
                                x: mullion.offset * ratio,
                                y: height
                            };
                        } else {
                            params.width = (metricSize);
                            params.height = (width_ * ratio);
                            params.space = width_;
                            params.methods = {};

                            position = {
                                x: -metricSize,
                                y: mullion.offset * ratio
                            };

                            if (model.isTrapezoid()) {
                                var heights = model.getTrapezoidHeights();

                                if (heights.right > heights.left) {
                                    position.x = width;
                                }
                            }
                        }

                        if (mullions[type].length === 2) {
                            params.setter = true;
                        }

                        var metric = view.createMetric( mullion, params, type);

                        metric.position(position);
                        group.add(metric);
                    }
                });
            });

            return group;
        },
        createMetric: function ( mullion, params, type ) {
            var view = this;
            var section = model.getSection( mullion.section_id );
            var group = new Konva.Group();
            var gap = (mullion.index === 1) ? '_gap' : '';
            var methodName = 'setter_' + type + gap;

            var correction = view.getTotalCorrection( mullion, type );
            var methods = {
                getter: function () {
                    return this.space;
                },
                setter_vertical: function (val) {
                    val -= correction.size;

                    if (!this.openingView) {
                        val = model.getInMetric('width', 'mm') - val;
                    }

                    model.setSectionMullionPosition(this.id, val);
                },
                setter_vertical_gap: function (val) {
                    val -= correction.size;

                    if (this.openingView) {
                        val = model.getInMetric('width', 'mm') - val;
                    }

                    model.setSectionMullionPosition(this.id, val);
                },
                setter_horizontal: function (val) {
                    val -= correction.size;
                    model.setSectionMullionPosition(this.id, val);
                },
                setter_horizontal_gap: function (val) {
                    val -= correction.size;
                    model.setSectionMullionPosition(this.id, model.getInMetric('height', 'mm') - val);
                }
            };
            var drawingAccordance = {
                vertical: 'createHorizontalMetric',
                horizontal: 'createVerticalMetric'
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
            params.methods.getter = methods.getter.bind({space: params.space});
            // Attach setter
            if (params.setter) {
                params.methods.setter = methods[methodName].bind({
                    openingView: module.getState('openingView'),
                    id: section.id,
                    model: model
                });
            }

            // Draw metrics
            var metric = view[ drawingAccordance[type] ](params.width, params.height, params.methods);
            // Apply corrections to position
            metric.position( params.position );

            // Add metric to the group:
            // We using group to make its position relative to the basic position
            group.add( metric );

            return group;
        },
        getCorrection: function () {
            return {
                frame_width: model.profile.get('frame_width'),
                mullion_width: model.profile.get('mullion_width') / 2,
                size: 0,
                pos: 0
            };
        },
        getControls: function (mullions) {
            var result = {};

            _.each(mullions, function (mGroup, type) {
                var siblings = {};

                result[type] = [];

                mGroup.forEach(function (mullion) {
                    if (mullion.gap) { return; }

                    if ( !(mullion.position in siblings) ) {
                        // Store mullion id into siblings array
                        siblings[mullion.position] = [mullion.id];

                        var mType = model.getInvertedDivider(type);
                        var section = model.getSection( mullion.id );
                        var state = section.measurements.mullion[mType][0];

                        // Change state if this is vertical control and it's outside view
                        if (type === 'vertical' && module.getState('openingView')) {
                            state = (state === 'min') ? 'max' :
                                    (state === 'max') ? 'min' :
                                    'center';
                        }

                        var data = {
                            position: mullion.position,
                            state: state,
                            kind: 'mullion',
                            type: mType,
                            sections: [mullion.id]
                        };

                        result[type].push(data);
                    } else {
                        // Store mullion id into siblings array and skip them
                        // If it has an unique id
                        if (siblings[mullion.position].indexOf( mullion.id ) === -1) {
                            siblings[mullion.position].push( mullion.id );
                        }
                    }
                });

                // Linking siblings
                result[type].forEach(function (mullion, i) {
                    result[type][i].sections = siblings[mullion.position];
                });

            });

            return result;
        },
        getMullionCorrection: function (type, value, index, correction) {
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
        getFrameCorrectionSum: function (type, correction) {
            var root_section = model.get('root_section');
            var measurementData = root_section.measurements.frame;

            if (type === 'horizontal' && module.getState('openingView')) {
                measurementData[type].reverse();
            }

            correction = correction || this.getCorrection();

            measurementData[type].forEach(function (value, i) {
                if (value === 'min') {
                    correction.size -= correction.frame_width;
                    correction.pos += (i === 0) ? correction.frame_width : 0;
                }
            });

            return correction;
        },
        getFrameCorrection: function (type) {
            var root_section = model.get('root_section');
            var measurementData = root_section.measurements.frame;
            var correction = [this.getCorrection(), this.getCorrection()];

            measurementData[type].forEach(function (value, i) {
                if (value === 'min') {
                    correction[i].size -= correction[i].frame_width;
                    correction[i].pos += (i === 0) ? correction[i].frame_width : 0;
                }
            });

            return correction;
        },
        getTotalCorrection: function (mullion) {
            var view = this;
            var correction = view.getCorrection();

            mullion.edges.forEach(function (edge) {
                correction = view.getMullionCorrection( edge.type, edge.state, edge.index, correction );
            });

            return correction;
        },
        createControl: function (width, height) {
            var view = this;
            var style = module.getStyle('measurements');
            var control = new Konva.Rect({
                width: width,
                height: height,
                fill: style.controls.normal.fill,
                opacity: style.controls.normal.opacity
            });

            control.on('mouseover', function () {
                control.fill(style.controls.hover.fill);
                view.updateLayer();
            });
            control.on('mouseout', function () {
                control.fill(style.controls.normal.fill);
                view.updateLayer();
            });

            return control;
        },
        createWholeControls: function (section_id, width, height, type) {
            var group = new Konva.Group();
            // prepare size and position
            var size_1 = 0;
            var size_2 = 0;
            var positions = [];

            if (type === 'vertical' || type === 'vertical_invisible') {
                size_1 = width;
                size_2 = controlSize;

                positions.push({});
                positions.push({y: height - controlSize});
            } else {
                size_1 = controlSize;
                size_2 = height;

                positions.push({});
                positions.push({x: width - controlSize});
            }

            // Make both controls recursively
            for (var i = 0; i < 2; i++) {
                // Create control
                var control = this.createControl( size_1, size_2 );
                var index = (!module.getState('openingView')) ? i : (i + 1) % 2;

                // Attach event
                control.on('click', this.createMeasurementSelectFrame.bind(this, section_id, 'frame', type, index));

                // Position right/bottom control
                control.position( positions[i] );

                group.add( control );
            }

            return group;
        },
        createMullionControls: function (controls, width, height) {
            var view = this;
            var group = new Konva.Group();

            /* eslint-disable max-nested-callbacks */
            var root_section = model.get('root_section');

            _.each(controls, function (cGroup, type) {

                cGroup.forEach(function (controlData) {
                    var position = { x: 0, y: 0 };
                    var correction = view.getCorrection();
                    var width_;
                    var height_;

                    if (controlData.state !== 'center') {
                        correction.size = (controlData.state === 'min') ?
                                        -correction.mullion_width : correction.mullion_width;
                    }

                    if (type === 'horizontal') {
                        position.y = 0 +
                            controlData.position * ratio +
                            correction.size * ratio -
                            controlSize / 2;
                        position.x = -metricSize;

                        if (model.isTrapezoid()) {
                            var heights = model.getTrapezoidHeights();

                            if (heights.right > heights.left) {
                                position.x = width;
                            }
                        }

                        width_ = metricSize;
                        height_ = controlSize;
                    } else {
                        position.x += 0 +
                            controlData.position * ratio +
                            correction.size * ratio -
                            controlSize / 2;
                        position.y = height;

                        width_ = controlSize;
                        height_ = metricSize;
                    }

                    var control = view.createControl( width_, height_ );
                    // Attach events
                    control.on('click', view.createMeasurementSelectMullion.bind(view, controlData)
                    );

                    control.position( position );
                    group.add(control);
                });

                // Draw controls for frame
                if (cGroup.length) {
                    var invertedType = model.getInvertedDivider( type );
                    var correction = view.getFrameCorrectionSum( invertedType );

                    var cor = {
                        size: correction.size,
                        pos: correction.pos
                    };

                    if (invertedType === 'horizontal') {
                        cor = {
                            size: correction.size,
                            pos: (!module.getState('openingView')) ?
                                    correction.pos :
                                    (correction.pos === 0) ?
                                    correction.size * -1 :
                                    (correction.pos * -1 === correction.size) ?
                                    correction.pos + correction.size :
                                    correction.pos
                        };
                    }

                    cor.size = cor.size * ratio;
                    cor.pos = cor.pos * ratio;

                    var params = {
                        width: (invertedType === 'vertical') ? metricSize : width + cor.size,
                        height: (invertedType === 'vertical') ? height + cor.size : metricSize,
                        position: {
                            x: (invertedType === 'vertical') ? metricSize * -1 : 0 + cor.pos,
                            y: (invertedType === 'vertical') ? 0 + cor.pos : height
                        }
                    };

                    if ( invertedType === 'vertical' && model.isTrapezoid() ) {
                        var heights = model.getTrapezoidHeights();

                        if (heights.right > heights.left) {
                            params.position.x = width;
                        }
                    }

                    var frameControls = view.createWholeControls(
                        root_section.id,
                        params.width,
                        params.height,
                        invertedType
                    );

                    frameControls.position( params.position );

                    group.add( frameControls );
                }

            });
            /* eslint-enable max-nested-callbacks */

            return group;
        },
        createMeasurementSelectUI: function (event, opts) {
            var view = this;
            var contolSize = metricSize / 4;
            var style = module.getStyle('measurements');

            var min = 'min';
            var max = 'max';

            if (opts.type !== 'vertical' && opts.kind === 'frame' && module.getState('openingView')) {
                min = 'max';
                max = 'min';
            }

            view.updateLayer();

            // View
            var target = event.target;
            var sign = (opts.kind === 'frame' && opts.index === 1) ? -1 : 1;
            var origPosition = target.getAbsolutePosition();
            var posParam = (opts.type === 'vertical') ? 'y' : 'x';
            var width = (opts.type === 'vertical') ? metricSize : contolSize;
            var height = (opts.type === 'vertical') ? contolSize : metricSize;
            var offset = (opts.kind === 'mullion') ?
                          view.getCorrection().mullion_width : view.getCorrection().frame_width;
            var posCorrection = (opts.type === 'vertical') ? target.height() : target.width();

            // Hide control for select a dimension point
            target.destroy();

            // First of all, we re checking current state and correct position of "zero point"
            // So "zero point" should be the same for any current state
            if (
                opts.kind === 'frame' && opts.state === min
            ) {
                var isMax = (opts.state === max) ? 1 : -1;

                origPosition[posParam] += posCorrection * sign * isMax;
            } else if (opts.kind === 'mullion' && opts.state !== 'center') {
                origPosition[posParam] += (opts.state === min) ? posCorrection : posCorrection * -1;
            }
            // Create controls
            opts.states.forEach(function (opt) {
                if (opt.value === opts.state) { return; }

                var value = opt.value;

                if (opts.type !== 'vertical' && opts.kind === 'mullion' && module.getState('openingView')) {
                    value = model.getInvertedMeasurementVal( opt.value );
                }

                var control = new Konva.Rect({
                    fill: style.select.normal.fill,
                    opacity: style.select.normal.opacity,
                    width: width,
                    height: height
                });
                var controlPosition = _.clone(origPosition);
                var correction = 0;

                // Correcting position of controls
                if (opts.kind === 'frame') {
                    correction = (opt.value === min) ? offset * sign : 0;
                } else if (opts.kind === 'mullion') {
                    controlPosition[posParam] += (opt.value === min) ? -1 * posCorrection / 2 :
                                                 (opt.value === max) ? posCorrection / 2 :
                                                 0;

                    correction = (opt.value === min) ? offset * -1 :
                                 (opt.value === max) ? offset :
                                 0;
                }

                controlPosition[posParam] += (correction * ratio);
                control.position( controlPosition );

                var secondArg = (opts.control) ? opts.control : opts.section.id;

                // Attach events
                control.on('click', function () {
                    opts.setter(value, secondArg);
                    view.updateLayer();
                });
                control.on('mouseover', function () {
                    control.opacity(style.select.hover.opacity);
                    view.updateLayer();
                });
                control.on('mouseout', function () {
                    control.opacity(style.select.normal.opacity);
                    view.updateLayer();
                });

                view.layer.add( control );
            });

            view.layer.draw();
        },
        createMeasurementSelectFrame: function (section_id, mType, type, index, event) {
            var view = this;
            var section = model.getSection( section_id );
            // Get available states
            var states = model.getMeasurementStates( mType );
            // Get current state of dimension-point
            var state = section.measurements[mType][type][index];

            var opts = {
                kind: 'frame',
                type: type,
                section: section,
                states: states,
                state: state,
                index: index,
                setter: function (val, id) {
                    section.measurements[mType][type][index] = val;

                    model.setSectionMeasurements( id, section.measurements );
                }
            };

            return view.createMeasurementSelectUI(event, opts);
        },
        createMeasurementSelectMullion: function (control, event) {
            var view = this;

            // Get available states
            var states = model.getMeasurementStates( 'mullion' );
            // Get current state of dimension-point
            var state = control.state;

            var opts = {
                kind: 'mullion',
                type: control.type,
                control: control,
                states: states,
                state: state,
                setter: function (val, control_) {
                    var invertedVal = model.getInvertedMeasurementVal( val );

                    _.each(control_.sections, function (section_id) {
                        var section = model.getSection( section_id );

                        section.measurements[control.kind][control.type][0] = val;
                        section.measurements[control.kind][control.type][1] = invertedVal;

                        model.setSectionMeasurements( section_id, section.measurements );
                    });
                }
            };

            return view.createMeasurementSelectUI(event, opts);
        },
        createWholeMetrics: function (mullions, width, height) {
            var group = new Konva.Group();
            var root_section = model.generateFullRoot();
            var rows = {
                vertical: mullions.vertical.length ? 1 : 0,
                horizontal: mullions.horizontal.length ? 1 : 0
            };

            // Correction parameters for metrics
            var vCorrection = this.getFrameCorrectionSum('vertical');
            var hCorrection = this.getFrameCorrectionSum('horizontal');

            // Vertical
            var vHeight = height + (vCorrection.size * ratio);

            var verticalWholeMertic = this.createVerticalMetric(metricSize, vHeight, {
                name: 'vertical_whole_metric',
                setter: function (val) {

                    if (_.isArray(val)) {
                        val = val.map(function (value) { return value - vCorrection.size; });
                        model.updateDimension('height', val, 'mm');
                    } else {
                        val -= vCorrection.size;
                        model.updateDimension('height_max', val, 'mm');
                    }
                },
                getter: function () {
                    return model.getInMetric('height', 'mm') + vCorrection.size;
                }
            });
            var vPosition = {
                x: -metricSize * (rows.horizontal + 1),
                y: 0 + (vCorrection.pos * ratio)
            };

            if (model.isTrapezoid()) {
                var heights = model.getTrapezoidHeights();
                var minHeight = (heights.right > heights.left) ? heights.left : heights.right;
                var maxHeight = (heights.right < heights.left) ? heights.left : heights.right;

                if (heights.right > heights.left) {
                    vPosition.x = metricSize * rows.horizontal + width;
                }

                // Second vertical whole metric for trapezoid
                var secondVerticalHeight = vHeight * ( ( minHeight / ( maxHeight / 100 ) ) / 100 );
                var secondVerticalWholeMertic = this.createVerticalMetric(metricSize, secondVerticalHeight, {
                    name: 'vertical_whole_metric',
                    setter: function (val) {

                        if (_.isArray(val)) {
                            val = val.map(function (value) { return value - vCorrection.size; });
                            model.updateDimension('height', val, 'mm');
                        } else {
                            val -= vCorrection.size;
                            model.updateDimension('height_min', val, 'mm');
                        }
                    },
                    getter: function () {
                        return minHeight + vCorrection.size;
                    }
                });
                var secondVerticalPosition = {
                    x: (heights.right > heights.left) ? -metricSize : width,
                    y: ( vCorrection.pos + maxHeight - minHeight ) * ratio
                };

                secondVerticalWholeMertic.position(secondVerticalPosition);
                group.add(secondVerticalWholeMertic);

                // Third vertical whole metric for trapezoid
                var thirdVerticalHeight = vHeight - secondVerticalHeight;
                var thirdVerticalWholeMertic = this.createVerticalMetric(metricSize, thirdVerticalHeight, {
                    name: 'vertical_whole_metric',
                    setter: function (val) {

                        if (_.isArray(val)) {
                            val = val.map(function (value) { return value - vCorrection.size; });
                            model.updateDimension('height', val, 'mm');
                        } else {
                            val -= vCorrection.size;
                            model.updateDimension('height_min', maxHeight - val, 'mm');
                        }
                    },
                    getter: function () {
                        return maxHeight - minHeight + vCorrection.size;
                    }
                });

                secondVerticalPosition.y = 0 + (vCorrection.pos * ratio);
                thirdVerticalWholeMertic.position(secondVerticalPosition);
                group.add(thirdVerticalWholeMertic);
            }

            verticalWholeMertic.position(vPosition);
            group.add(verticalWholeMertic);

            // Horizontal
            var hWidth = width + (hCorrection.size * ratio);
            var horizontalWholeMertic = this.createHorizontalMetric(hWidth, metricSize, {
                setter: function (val) {
                    val -= hCorrection.size;
                    model.updateDimension('width', val, 'mm');
                },
                getter: function () {
                    return model.getInMetric('width', 'mm') + hCorrection.size;
                }
            });

            var hPosition = {
                x: 0 + (hCorrection.pos * ratio),
                y: height + rows.vertical * metricSize
            };

            horizontalWholeMertic.position(hPosition);
            group.add(horizontalWholeMertic);

            // Create controls
            if (!module.getState('isPreview')) {
                var vControls = this.createWholeControls(root_section.id, metricSize, vHeight, 'vertical');
                var hControls = this.createWholeControls(root_section.id, hWidth, metricSize, 'horizontal');

                vControls.position(vPosition);
                hControls.position(hPosition);
                group.add(vControls, hControls);
            }

            return group;
        },
        createOverlayMetrics: function () {
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
            function findOverlay( section, results, level) {
                level = level || 0;

                if (
                    section.measurements.glass ||
                    section.sashType !== 'fixed_in_frame' && section.measurements.opening
                ) {
                    var type = (section.measurements.glass) ? 'glass' : 'opening';

                    results.push({
                        section_id: section.id,
                        type: type,
                        level: level,
                        params: section[type + 'Params']
                    });

                } else if ( section.sections.length ){
                    section.sections.forEach(function (child) {
                        level++;
                        findOverlay(child, results, level);
                    });
                }

                return results;
            }

            var view = this;
            var style = module.getStyle('overlay_measurements');
            var group = new Konva.Group();
            var root = (module.getState('openingView')) ? model.generateFullRoot() : model.generateFullReversedRoot();
            var results = [];

            findOverlay(root, results);

            results.forEach(function (metric) {
                var mSize = (metricSize / 2);
                var width = metric.params.width * ratio;
                var height = metric.params.height * ratio;
                var position = {
                    x: metric.params.x * ratio,
                    y: metric.params.y * ratio
                };
                var vertical = view.createVerticalMetric(
                                mSize / 2,
                                height,
                                {
                                    getter: function () {
                                        return metric.params.height;
                                    }
                                }, style.label);
                var horizontal = view.createHorizontalMetric(
                                width,
                                mSize / 2,
                                {
                                    getter: function () {
                                        return metric.params.width;
                                    }
                                }, style.label);

                vertical.position({
                    x: position.x + mSize,
                    y: position.y
                });
                horizontal.position({
                    x: position.x,
                    y: position.y + mSize
                });

                group.add( vertical, horizontal );
            });

            return group;
        },
        createArchedInfo: function (width, height) {
            var group = new Konva.Group();

            var vCorrection = this.getFrameCorrection('vertical');
            var vwCorrection = this.getFrameCorrectionSum('vertical');
            var hwCorrection = this.getFrameCorrectionSum('horizontal');

            var root_section = model.get('root_section');
            var archHeight = model.getArchedPosition() + vCorrection[0].size;
            var params = {
                getter: function () {
                    return archHeight;
                },
                setter: function (val) {
                    val = val - vCorrection[0].size;

                    var id = root_section.id;

                    model._updateSection(id, function (section) {
                        section.archPosition = val;
                    });
                }
            };

            var vHeight = (model.getInMetric('height', 'mm') +
                            vCorrection[0].size + vCorrection[1].size
                            ) * ratio;

            var vPosition = {
                x: -metricSize,
                y: vCorrection[0].pos * ratio
            };
            var metric = this.createVerticalMetric(metricSize, archHeight * ratio, params);
            var vControls = this.createWholeControls(root_section.id, metricSize * 2, vHeight, 'vertical');

            metric.position(vPosition);

            vPosition.x = vPosition.x * 2;
            vControls.position(vPosition);
            group.add(metric, vControls);

            var nonArchHeight = model.getInMetric('height', 'mm') - archHeight +
                                vCorrection[1].size;

            params = {
                getter: function () {
                    return nonArchHeight;
                },
                setter: function (val) {
                    val = val - vCorrection[1].size;

                    var id = model.get('root_section').id;
                    var archPosition = model.getInMetric('height', 'mm') - val;

                    model._updateSection(id, function (section) {
                        section.archPosition = archPosition;
                    });
                }
            };
            metric = this.createVerticalMetric(metricSize, (nonArchHeight + vCorrection[0].size) * ratio, params);
            metric.position({
                x: -metricSize,
                y: (archHeight + vCorrection[0].pos) * ratio
            });
            group.add(metric);

            var verticalWholeMertic = this.createVerticalMetric(metricSize,
                (height + (vwCorrection.size * ratio)),
                {
                    name: 'vertical_whole_metric',
                    setter: function (val) {

                        if (_.isArray(val)) {
                            val = val.map(function (value) { return value - vwCorrection.size; });
                            model.updateDimension('height', val, 'mm');
                        } else {
                            val -= vwCorrection.size;
                            model.updateDimension('height', val, 'mm');
                        }
                    },
                    getter: function () {
                        return ( model.getInMetric('height', 'mm') + vwCorrection.size);
                    }
                });

            verticalWholeMertic.position({
                x: -metricSize * 2,
                y: 0 + (vwCorrection.pos * ratio)
            });

            group.add(verticalWholeMertic);

            var hWidth = (width + (hwCorrection.size * ratio));
            var hControls = this.createWholeControls(root_section.id, hWidth, metricSize, 'horizontal');
            var hPosition = {
                x: 0 + (hwCorrection.pos * ratio),
                y: height
            };
            var horizontalWholeMertic = this.createHorizontalMetric( hWidth,
                metricSize,
                {
                    setter: function (val) {
                        val -= hwCorrection.size;
                        model.updateDimension('width', val, 'mm');
                    },
                    getter: function () {
                        return ( model.getInMetric('width', 'mm') + hwCorrection.size);
                    }
                });

            horizontalWholeMertic.position( hPosition);
            hControls.position( hPosition );

            group.add(horizontalWholeMertic, hControls);

            return group;
        },
        getMeasurementEdges: function (section_id, type) {
            var edges = model.getMeasurementEdges( section_id );
            var edgeTypes = [];

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
        createVerticalMetric: function (width, height, params, styles) {
            var arrowOffset = width / 2;
            var arrowSize = 5;
            var group = new Konva.Group({name: params.name});

            // Define styles
            styles = styles || {};
            styles = _.defaults(styles, this.getDefaultMetricStyles());

            var lines = new Konva.Shape({
                sceneFunc: function (ctx) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(width, 0);

                    ctx.moveTo(0, height);
                    ctx.lineTo(width, height);

                    ctx.stroke();
                },
                stroke: styles.arrows.stroke,
                strokeWidth: styles.arrows.strokeWidth
            });

            var arrow = new Konva.Shape({
                sceneFunc: function (ctx) {
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
                strokeWidth: styles.arrows.strokeWidth
            });

            // left text
            var labelMM = new Konva.Label();

            labelMM.add(new Konva.Tag({
                fill: styles.label.fill,
                stroke: styles.label.stroke,
                strokeWidth: styles.label.strokeWidth
            }));
            var textMM = new Konva.Text({
                text: app.utils.format.dimension_mm(params.getter()),
                padding: styles.label.padding,
                fontFamily: styles.label.fontFamily,
                fontSize: styles.label.fontSize,
                fill: styles.label.color
            });

            labelMM.add(textMM);
            labelMM.position({
                x: width / 2 - textMM.width() / 2,
                y: height / 2 + textMM.height() / 2
            });

            // left text
            var labelInches = new Konva.Label();

            labelInches.add(new Konva.Tag({
                fill: styles.label.fill,
                stroke: styles.label.stroke,
                strokeWidth: styles.label.strokeWidth
            }));
            var inches = app.utils.convert.mm_to_inches(params.getter());
            var val = app.utils.format.dimension(inches, 'fraction', module.getState('inchesDisplayMode'));
            var textInches = new Konva.Text({
                text: val,
                padding: styles.label.padding,
                fill: styles.label.color,
                fontFamily: styles.label.fontFamily,
                fontSize: styles.label.fontSize_big
            });

            labelInches.add(textInches);
            labelInches.position({
                x: width / 2 - textInches.width() / 2,
                y: height / 2 - textInches.height() / 2
            });

            if (params.setter) {
                labelInches.on('click tap', function () {
                    module.trigger('labelClicked', {
                        params: params,
                        pos: labelInches.getAbsolutePosition(),
                        size: textInches.size()
                    });
                });
            }

            group.add(lines, arrow, labelInches, labelMM);
            return group;
        },

        createHorizontalMetric: function (width, height, params, styles) {
            var arrowOffset = height / 2;
            var arrowSize = 5;
            var group = new Konva.Group();

            // Define styles
            styles = styles || {};
            styles = _.defaults(styles, this.getDefaultMetricStyles());

            var lines = new Konva.Shape({
                sceneFunc: function (ctx) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, height);

                    ctx.moveTo(width, 0);
                    ctx.lineTo(width, height);

                    ctx.stroke();
                },
                stroke: styles.arrows.stroke,
                strokeWidth: styles.arrows.strokeWidth
            });

            var arrow = new Konva.Shape({
                sceneFunc: function (ctx) {
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
                strokeWidth: styles.arrows.strokeWidth
            });

            var labelMM = new Konva.Label();

            labelMM.add(new Konva.Tag({
                fill: styles.label.fill,
                stroke: styles.label.stroke,
                strokeWidth: styles.label.strokeWidth
            }));
            var textMM = new Konva.Text({
                text: app.utils.format.dimension_mm(params.getter()),
                padding: styles.label.padding,
                fontFamily: styles.label.fontFamily,
                fontSize: styles.label.fontSize,
                fill: styles.label.color
            });

            labelMM.add(textMM);
            labelMM.position({
                x: width / 2 - textMM.width() / 2,
                y: arrowOffset + textMM.height() / 2
            });

            var labelInches = new Konva.Label();

            labelInches.add(new Konva.Tag({
                fill: styles.label.fill,
                stroke: styles.label.stroke,
                strokeWidth: styles.label.strokeWidth
            }));
            var inches = app.utils.convert.mm_to_inches(params.getter());
            var val = app.utils.format.dimension(inches, 'fraction', module.getState('inchesDisplayMode'));
            var textInches = new Konva.Text({
                text: val,
                padding: styles.label.padding,
                fill: styles.label.color,
                fontFamily: styles.label.fontFamily,
                fontSize: styles.label.fontSize_big
            });

            labelInches.add(textInches);
            labelInches.position({
                x: width / 2 - textInches.width() / 2,
                y: arrowOffset - labelInches.height() / 2
            });

            if (params.setter) {
                labelInches.on('click tap', function () {
                    module.trigger('labelClicked', {
                        params: params,
                        pos: labelInches.getAbsolutePosition(),
                        size: textInches.size()
                    });
                });
            }

            group.add(lines, arrow, labelInches, labelMM);
            return group;
        },
        getDefaultMetricStyles: function () {
            return module.getStyle('measurements');
        },
        updateLayer: function () {
            this.layer.draw();
        }
    });

})();
