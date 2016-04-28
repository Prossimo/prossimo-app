var app = app || {};

(function () {
    'use strict';

    var composer;
    var module;
    var model;
    var metricSize;
    var ratio;

    app.Drawers = app.Drawers || {};
    app.Drawers.MetricsDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            module = app.DrawingModule;

            this.layer = params.layer;
            this.stage = module.get('stage');

            model = module.get('model');
            metricSize = params.metricSize;
            composer = app.App.module('DrawingModule.Composer');
        },
        el: function () {
            var group = new Konva.Group();

            return group;
        },
        render: function () {
            // Get fresh raio from composer module
            ratio = composer.getSizes().ratio;

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
            var sizes = composer.getSizes();
            var center = sizes.center;
            // place unit on stage center
            group.position( center );

            return group;
        },
        createInfo: function (mullions, width, height) {
            var group = new Konva.Group();

            console.log(1, mullions);

            // Draw mullion metrics
            mullions = this.sortMullions(mullions);

            console.log(2, mullions);

            mullions = this.getMeasurements(mullions);

            console.log(3, mullions);

            group.add( this.createMullionMetrics(mullions, height) );

            // Draw whole metrics
            group.add( this.createWholeMetrics(mullions, width, height) );

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
                        !(
                            index_ === find_index &&
                            !(
                                'mullion' in section_.measurements &&
                                type_ in section_.measurements.mullion
                            )
                        )
                    ) {
                        parent_section_ = model.getSection( section_.parentId );
                        cur_index = (parent_section_.sections[0].id === section_.id) ? 0 : 1;
                        result_ = findParentByMeasurementType( parent_section_, type_, key_, cur_index );
                    } else {
                        result_ = {
                            section: model.getSection( section_.parentId ),
                            index: find_index
                        };
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

                    var data = {
                        section_id: mullion.id,
                        offset: pos,
                        size: (mullion.position - pos),
                        edges: [],
                        index: index
                    };

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
                                edge_section = current_section;
                            } else {
                                edge_section = findParentByMeasurementType(current_section, invertedType, key, index);
                                edge_section = edge_section.section;
                            }
                        }

                        if (invertedType in edge_section.measurements[edge]) {
                            edge_state = edge_section.measurements[edge][invertedType][store_index];
                        } else {
                            edge_state = edge_section.measurements[edge][type][store_index];
                        }

                        data.edges[key] = {
                            section_id: edge_section.id,
                            state: edge_state,
                            type: edge,
                            index: store_index
                        };
                    });

                    pos = mullion.position;

                    if (current_section.sections.length) {
                        saved_mullion = current_section;
                    }

                    result[type].push(data);
                });
            });
            /* eslint-enable max-nested-callbacks */

            return result;
        },
        createMullionMetrics: function (mullions, height) {
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
            // Draw controls
            var controls = view.createMullionControls( mullion, params.width, params.height, type );

            // Apply corrections to position
            metric.position( params.position );
            controls.position( params.position );

            // Add metric to the group:
            // We using group to make its position relative to the basic position
            group.add( metric, controls );

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
            var control = new Konva.Rect({
                width: width,
                height: height,
                fill: '#66B6E3',
                opacity: 0.5
            });

            control.on('mouseover', function () {
                control.fill('#1A8BEF');
                view.updateLayer();
            });
            control.on('mouseout', function () {
                control.fill('#66B6E3');
                view.updateLayer();
            });

            return control;
        },
        createWholeControls: function (section_id, width, height, type) {
            var group = new Konva.Group();

            if (!module.getState('preview')) {
                var controlSize = metricSize / 4;

                // prepare size and position
                var size_1 = 0;
                var size_2 = 0;
                var position = {};

                if (type === 'vertical' || type === 'vertical_invisible') {
                    size_1 = width;
                    size_2 = controlSize;

                    position.y = height - controlSize;
                } else {
                    size_1 = controlSize;
                    size_2 = height;

                    position.x = width - controlSize;
                }

                // Make both controls recursively
                for (var i = 0; i < 2; i++) {
                    // Create control
                    var control = this.createControl( size_1, size_2 );

                    // Attach event
                    control.on('click', this.createMeasurementSelectFrame.bind(this, section_id, 'frame', type, i));

                    // Position right/bottom control
                    if ( i === 1 ) {
                        control.position( position );
                    }

                    group.add( control );
                }
            }

            return group;
        },
        createMullionControls: function (mullion, width, height, type) {
            var view = this;
            var group = new Konva.Group();

            if (!module.getState('preview')) {
                var controlSize = metricSize / 4;
                var position = { x: 0, y: 0 };

                if (type === 'horizontal') {
                    position.y += height - controlSize;
                    height = controlSize;
                } else {
                    position.x += width - controlSize;
                    width = controlSize;
                }

                mullion.edges.forEach(function (edge, i) {
                    var control = view.createControl( width, height );
                    // Attach event
                    control.on('click', view.createMeasurementSelectMullion.bind(view, mullion, type, i));

                    if (i === 1) {
                        control.position( position );
                    }

                    group.add(control);
                });

            }

            return group;
        },
        createMeasurementSelectUI: function (event, section, states, state, setter) {
            // Two variables to fasten drop to default value if nothing selected
            var anyStateSelected = false;
            var defaultState = null;

            // View
            var $wrap = $('<div>', {class: 'dimension-point-wrapper'});
            var container = $(module.get('stage').container());
            var containerPos = container.position();

            $wrap
                .css({
                    position: 'absolute',
                    top: event.target.getAbsolutePosition().y + containerPos.top,
                    left: event.target.getAbsolutePosition().x + containerPos.left
                })
                .appendTo(container);

            console.log('!', $wrap);

            states.forEach(function (opt) {
                var selected = false;

                if (state === opt.value) {
                    selected = true;
                    anyStateSelected = true;
                }

                if (opt.default) {
                    defaultState = opt;
                }

                var $label = $('<label>', {text: opt.viewname}).appendTo($wrap);

                $('<input>', {
                    type: 'radio',
                    name: 'dimension-point-' + section.id,
                    id: 'dimension-point-' + section.id + '-' + opt.value,
                    value: opt.value,
                    checked: selected
                })
                .prependTo($label)
                .on('change', function () {
                    setter( $(this).val() );
                    // We should save data in another form...
                    model.setSectionMeasurements( section.id, section.measurements );
                    $wrap.remove();
                });
            });

            // If no option wasn't selected вАФ select default option
            if (anyStateSelected === false && defaultState !== null) {
                setter( defaultState.value );
                model.setSectionMeasurements( section.id, section.measurements );

                $('#dimension-point-' + section.id + '-' + defaultState.value).prop('checked', true);
            }

            // Close it with click everywhere
            function cancelIt( evt ) {
                if (
                    evt.keyCode === 27 ||
                    $(evt.target).hasClass('dimension-point-wrapper') === false &&
                    $(evt.target).parents('.dimension-point-wrapper').length === 0
                ) {
                    $wrap.remove();
                    $('body').off('click', cancelIt);
                }
            }

            // hack to prevent
            setTimeout( function () {
                $('body').on('click tap keyup', cancelIt);
            }, 50);
        },
        createMeasurementSelectFrame: function (section_id, mType, type, index, event) {
            var view = this;
            var section = model.getSection( section_id );
            // Get available states
            var states = model.getMeasurementStates( mType );
            // Get current state of dimension-point
            var state = section.measurements[mType][type][index];

            return view.createMeasurementSelectUI(event, section, states, state, function (val) {
                section.measurements[mType][type][index] = val;
            });
        },
        createMeasurementSelectMullion: function (mullion, type, i, event) {
            var view = this;
            var edge = mullion.edges[i];
            var section = model.getSection( edge.section_id );
            // Get available states
            var states = model.getMeasurementStates( edge.type );
            // Get current state of dimension-point
            var state = edge.state;
            var invertedType = model.getInvertedDivider( type );

            return view.createMeasurementSelectUI(event, section, states, state, function (val) {
                section.measurements[edge.type][invertedType][edge.index] = val;
            });
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
                setter: function (val) {
                    val -= vCorrection.size;
                    model.setInMetric('height', val, 'mm');
                },
                getter: function () {
                    return model.getInMetric('height', 'mm') + vCorrection.size;
                }
            });
            var vPosition = {
                x: -metricSize * (rows.horizontal + 1),
                y: 0 + (vCorrection.pos * ratio)
            };
            var vControls = this.createWholeControls(root_section.id, metricSize, vHeight, 'vertical');

            verticalWholeMertic.position(vPosition);
            vControls.position(vPosition);
            group.add(verticalWholeMertic, vControls);

            // Horizontal
            var hWidth = width + (hCorrection.size * ratio);
            var horizontalWholeMertic = this.createHorizontalMetric(hWidth, metricSize, {
                setter: function (val) {
                    val -= hCorrection.size;
                    model.setInMetric('width', val, 'mm');
                }.bind(this),
                getter: function () {
                    return model.getInMetric('width', 'mm') + hCorrection.size;
                }.bind(this)
            });
            var hPosition = {
                x: 0 + (hCorrection.pos * ratio),
                y: height + rows.vertical * metricSize
            };
            var hControls = this.createWholeControls(root_section.id, hWidth, metricSize, 'horizontal');

            horizontalWholeMertic.position(hPosition);
            hControls.position(hPosition);
            group.add(horizontalWholeMertic, hControls);

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
                var style = {
                    label: {
                        fill: 'white',
                        stroke: 'grey',
                        color: '#444',
                        strokeWidth: 0.5,
                        padding: 3,
                        fontSize: 9,
                        fontSize_big: 10
                    }
                };
                var vertical = view.createVerticalMetric(
                                mSize / 2,
                                height,
                                {
                                    getter: function () {
                                        return metric.params.height;
                                    }
                                }, style);
                var horizontal = view.createHorizontalMetric(
                                width,
                                mSize / 2,
                                {
                                    getter: function () {
                                        return metric.params.width;
                                    }
                                }, style);

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
                    setter: function (val) {
                        val -= vwCorrection.size;
                        model.setInMetric('height', val, 'mm');
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
                        model.setInMetric('width', val, 'mm');
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
        createInput: function (params, pos, size) {
            var container = $(module.get('stage').container());
            var $wrap = $('<div>')
                .addClass('popup-wrap')
                .appendTo(container)
                .on('click', function (e) {
                    if (e.target === $wrap.get(0)) {
                        $wrap.remove();
                    }
                });

            var padding = 3;
            var valInInches = app.utils.convert.mm_to_inches(params.getter());
            var val = app.utils.format.dimension(valInInches, 'fraction', module.getState('inchesDisplayMode'));

            $('<input>')
                .val(val)
                .css({
                    position: 'absolute',
                    top: (pos.y - padding) + 'px',
                    left: (pos.x - padding) + 'px',
                    height: (size.height + padding * 2) + 'px',
                    width: (size.width + 20 + padding * 2) + 'px',
                    fontSize: '12px'
                })
                .appendTo($wrap)
                .focus()
                .select()
                .on('keyup', function (e) {
                    if (e.keyCode === 13) {  // enter
                        var inches = app.utils.parseFormat.dimension(this.value);
                        var mm = app.utils.convert.inches_to_mm(inches);

                        params.setter(mm);
                        $wrap.remove();
                    }

                    if (e.keyCode === 27) { // esc
                        $wrap.remove();
                    }
                });
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
            var group = new Konva.Group();

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
                    this.createInput(params, labelInches.getAbsolutePosition(), textInches.size());
                }.bind(this));
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
                    this.createInput(params, labelInches.getAbsolutePosition(), textInches.size());
                }.bind(this));
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
