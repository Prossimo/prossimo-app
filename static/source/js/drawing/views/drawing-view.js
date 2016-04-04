var app = app || {};

(function () {
    'use strict';

    // This view is orginized in React-like aproach
    // but with several source of state
    // as we have
    // 1. this.model - unit this.model.profile - profile data
    //
    // 2. this.state - UI state of view.
    // Take a look to constructor to see what is possible in state
    //
    // 3. and globalInsideView variable. This variable is not part of this.state
    // as we need to keep it the same for any view

    // starting point of all drawing is "renderCanvas" function

    // main pattern for methods name
    // this.handleSomeAction - callback on some user UI action
    // this.createSomeObject - pure function that create some canvas UI elements
    // TODO: as this functions are pure, so it is better to move them into separete files
    // something like "components" directory

    // global params
    var globalInsideView = false;
    var metricSize = 50;
    var fontFamily = 'pt-sans';

    app.DrawingView = Marionette.ItemView.extend({
        tagName: 'div',
        template: app.templates['drawing/drawing-view'],
        initialize: function (opts) {
            var project_settings = app.settings.getProjectSettings();

            this.listenTo(this.model, 'all', this.updateRenderedScene);
            this.on('update_rendered', this.updateRenderedScene, this);

            this.createGlazingPopup();

            this.state = {
                isPreview: ('isPreview' in opts && opts.isPreview),
                insideView: this.isInsideView(),
                openingView: this.isOpeningView(),
                selectedSashId: null,
                selectedMullionId: null,
                inchesDisplayMode: project_settings && project_settings.get('inches_display_mode'),
                hingeIndicatorMode: project_settings && project_settings.get('hinge_indicator_mode')
            };
        },
        ui: {
            $flush_panels: '[data-type="flush-turn-right"], [data-type="flush-turn-left"]',
            $title: '#drawing-view-title',
            $bars_control: '#bars-control',
            $section_control: '#section_control',
            $filling_select: '#filling-select',
            $metrics_glass: '#additional-metrics-glass',
            $metrics_opening: '#additional-metrics-opening'
        },
        events: {
            'click .split-section': 'handleSplitSectionClick',
            'click .change-sash-type': 'handleChangeSashTypeClick',
            'click #clear-frame': 'handleClearFrameClick',
            'keydown #drawing': 'handleCanvasKeyDown',
            'click #change-view-button': 'handleChangeView',
            'click .toggle-arched': 'handleArchedClick',
            'change #vertical-bars-number': 'handleBarNumberChange',
            'input #vertical-bars-number': 'handleBarNumberChange',
            'change #horizontal-bars-number': 'handleBarNumberChange',
            'input #horizontal-bars-number': 'handleBarNumberChange',
            'change #filling-select': 'handleFillingTypeChange',
            'click #glazing-bars-popup': 'handleGlazingBarsPopupClick',
            'change @ui.$metrics_glass': 'handleAdditionalMetricsChange',
            'change @ui.$metrics_opening': 'handleAdditionalMetricsChange'
        },
        isInsideView: function () {
            return globalInsideView;
        },
        // Are we looking at unit from the opening side?
        isOpeningView: function () {
            return !globalInsideView && this.model.isOpeningDirectionOutward() ||
                globalInsideView && !this.model.isOpeningDirectionOutward();
        },
        handleCanvasKeyDown: function (e) {
            if (e.keyCode === 46 || e.keyCode === 8) {  // DEL or BACKSPACE
                e.preventDefault();

                if (this.state.selectedMullionId) {
                    this.model.removeMullion(this.state.selectedMullionId);
                }

                if (this.state.selectedSashId) {
                    this.model.removeSash(this.state.selectedSashId);
                }

                this.deselectAll();
            }
        },
        handleAdditionalMetricsChange: function (evt) {
            if ( !this.state.selectedSashId ) { return; }

            var type = (evt.target.id === 'additional-metrics-glass') ? 'glass' : 'opening';
            var reversedType = (type === 'glass') ? 'opening' : 'glass';
            var value = (evt.target.checked);
            var section = this.model.getSection( this.state.selectedSashId );
            var measurements = section.measurements;

            measurements[type] = value;

            if (value) {
                measurements[ reversedType ] = false;
            }

            this.model.setSectionMeasurements( this.state.selectedSashId, measurements );
        },
        handleChangeView: function () {
            globalInsideView = !globalInsideView;

            this.setState({
                insideView: this.isInsideView(),
                openingView: this.isOpeningView()
            });
        },
        handleGlazingBarsPopupClick: function () {
            if ( !this.glazing_view ) {
                this.createGlazingPopup();
            }

            this.glazing_view
                    .setSection( this.state.selectedSashId )
                    .showModal();
        },
        handleFillingTypeChange: function () {
            var filling_type;

            if ( app.settings ) {
                filling_type = app.settings.getFillingTypeById(this.ui.$filling_select.val());
                this.model.setFillingType(this.state.selectedSashId,
                    filling_type.get('type'), filling_type.get('name'));
            }
        },
        handleArchedClick: function () {
            if (!this.state.selectedSashId) {
                console.warn('no sash selected');
                return;
            }

            this.model._updateSection(this.state.selectedSashId, function (section) {
                section.arched = !section.arched;

                if (this.model.isRootSection(section.id)) {
                    var width = this.model.getInMetric('width', 'mm');
                    var height = this.model.getInMetric('height', 'mm');

                    section.archPosition = Math.min(width / 2, height);
                }
            }.bind(this));
        },
        handleClearFrameClick: function () {
            this.deselectAll();
            this.model.clearFrame();
        },
        handleSplitSectionClick: function (e) {
            this.$('.popup-wrap').hide();
            var divider = $(e.target).data('type');

            this.model.splitSection(this.state.selectedSashId, divider);
            this.deselectAll();
        },
        handleChangeSashTypeClick: function (e) {
            this.$('.popup-wrap').hide();
            var type = $(e.target).data('type');

            // if Unit is Outward opening, reverse sash type
            // from right to left or from left to right
            if ( this.state.hingeIndicatorMode === 'european' && !this.state.openingView ||
                this.state.hingeIndicatorMode === 'american' && this.state.openingView
            ) {
                if (type.indexOf('left') >= 0) {
                    type = type.replace('left', 'right');
                } else if (type.indexOf('right') >= 0) {
                    type = type.replace('right', 'left');
                }
            }

            this.model.setSectionSashType(this.state.selectedSashId, type);

            this.updateSection(this.state.selectedSashId, 'both');
        },
        handleObjectClick: function (id, e) {
            // select on left click only
            if (e.evt.button !== 0) {
                return;
            }

            this.deselectAll();
            this.setState({
                selectedSashId: id
            });
        },

        // Marrionente lifecycle method
        onRender: function () {
            this.stage = new Konva.Stage({
                container: this.$('#drawing').get(0)
            });

            this.layer = new Konva.Layer();
            this.stage.add(this.layer);

            this.ui.$filling_select.selectpicker({
                style: 'btn-xs',
                showSubtext: true,
                size: 10
            });
        },

        // Marrionente lifecycle method
        onDestroy: function () {
            this.stage.destroy();

            if ( this.glazing_view ) {
                this.glazing_view.destroy();
            }
        },

        serializeData: function () {
            return {
                filling_types: !app.settings ? [] :
                    app.settings.getAvailableFillingTypes().map(function (item) {
                        return {
                            cid: item.cid,
                            name: item.get('name'),
                            type: item.getBaseTypeTitle(item.get('type'))
                        };
                    })
            };
        },
        createGlazingPopup: function () {
            this.glazing_view = new app.DrawingGlazingPopup({
                parent_view: this,
                model: this.model
            });
        },
        // common case frame
        // almost all sashes build via this frame
        // it draw just "edges"
        createFrame: function (params) {
            var frameWidth = params.frameWidth;  // in mm
            var width = params.width;
            var height = params.height;

            var group = new Konva.Group();
            var top = new Konva.Line({
                points: [
                    0, 0,
                    width, 0,
                    width - frameWidth, frameWidth,
                    frameWidth, frameWidth
                ]
            });

            var left = new Konva.Line({
                points: [
                    0, 0,
                    frameWidth, frameWidth,
                    frameWidth, height - frameWidth,
                    0, height
                ]
            });

            var bottom = new Konva.Line({
                points: [
                    0, height,
                    frameWidth, height - frameWidth,
                    width - frameWidth, height - frameWidth,
                    width, height
                ]
            });

            var right = new Konva.Line({
                points: [
                    width, 0,
                    width, height,
                    width - frameWidth, height - frameWidth,
                    width - frameWidth, frameWidth
                ]
            });

            group.add(top, left, bottom, right);

            // add styles for borders
            group.children
                .closed(true)
                .stroke('black')
                .strokeWidth(1)
                .fill('white');

            var sectionId = params.sectionId;

            if ( params.nobind !== true ) {
                group.on('click', this.handleObjectClick.bind(this, sectionId));
            }

            return group;
        },

        // like common frame above but fully filled
        createFlushFrame: function (params) {
            var width = params.width;
            var height = params.height;

            var group = new Konva.Group();
            var rect = new Konva.Rect({
                width: width,
                height: height,
                fill: 'lightgrey',
                stroke: 'black',
                strokeWidth: 1
            });

            var sectionId = params.sectionId;

            group.add(rect);
            group.on('click', this.handleObjectClick.bind(this, sectionId));

            return group;
        },

        // door frame have special case for threshold drawing
        createDoorFrame: function (params) {
            var frameWidth = params.frameWidth;  // in mm
            var thresholdWidth = this.model.profile.get('threshold_width');
            var width = params.width;
            var height = params.height;

            var group = new Konva.Group();
            var top = new Konva.Line({
                points: [
                    0, 0,
                    width, 0,
                    width - frameWidth, frameWidth,
                    frameWidth, frameWidth
                ]
            });

            var left = new Konva.Line({
                points: [
                    0, 0,
                    frameWidth, frameWidth,
                    frameWidth, height - thresholdWidth,
                    0, height - thresholdWidth
                ]
            });

            var right = new Konva.Line({
                points: [
                    width, 0,
                    width, height - thresholdWidth,
                    width - frameWidth, height - thresholdWidth,
                    width - frameWidth, frameWidth
                ]
            });

            group.add(top, left, right);

            group.children
                .closed(true)
                .stroke('black')
                .strokeWidth(1)
                .fill('white');

            var bottom = new Konva.Line({
                points: [
                    0, height - thresholdWidth,
                    width, height - thresholdWidth,
                    width, height,
                    0, height
                ],
                closed: true,
                stroke: 'black',
                strokeWidth: 1,
                fill: 'grey'
            });

            group.add(bottom);

            return group;
        },

        // arched frame have special case for arched part
        createArchedFrame: function (params) {
            var frameWidth = params.frameWidth;
            var width = params.width;
            var height = params.height;
            var archHeight = params.archHeight;

            var group = new Konva.Group();
            var top = new Konva.Shape({
                stroke: 'black',
                strokeWidth: 1,
                fill: 'white',
                sceneFunc: function (ctx) {
                    ctx.beginPath();
                    var scale = (width / 2) / archHeight;

                    ctx.save();
                    ctx.scale(scale, 1);
                    var radius = archHeight;

                    ctx._context.arc(
                        radius, radius, radius,
                        0, Math.PI, true);
                    ctx.restore();
                    ctx.translate(width / 2, archHeight);
                    ctx.scale(
                        (width / 2 - frameWidth) / archHeight,
                        (archHeight - frameWidth) / archHeight
                    );
                    ctx._context.arc(
                        0, 0,
                        radius,
                        Math.PI, 0
                    );
                    ctx.closePath();
                    ctx.fillStrokeShape(this);
                }
            });

            var left = new Konva.Line({
                points: [
                    0, archHeight,
                    frameWidth, archHeight,
                    frameWidth, height - frameWidth,
                    0, height
                ]
            });

            var bottom = new Konva.Line({
                points: [
                    0, height,
                    frameWidth, height - frameWidth,
                    width - frameWidth, height - frameWidth,
                    width, height
                ]
            });

            var right = new Konva.Line({
                points: [
                    width, archHeight,
                    width, height,
                    width - frameWidth, height - frameWidth,
                    width - frameWidth, archHeight
                ]
            });

            group.add(left, right, bottom, top);

            group.find('Line')
                .closed(true)
                .stroke('black')
                .strokeWidth(1)
                .fill('white');

            return group;
        },

        createMullion: function (section) {
            var mullion = new Konva.Rect({
                stroke: 'black',
                fill: 'white',
                strokeWidth: 1
            });

            mullion.setAttrs(section.mullionParams);
            var isVerticalInvisible = (
                section.divider === 'vertical_invisible'
            );
            var isHorizontalInvisible = (
                section.divider === 'horizontal_invisible'
            );
            var isSelected = this.state.selectedMullionId === section.id;

            // do not show mullion for type vertical_invisible
            // and sash is added for both right and left sides
            var hideVerticalMullion =
                (section.divider === 'vertical_invisible') &&
                (section.sections[0].sashType !== 'fixed_in_frame') &&
                (section.sections[1].sashType !== 'fixed_in_frame') && !isSelected;

            var hideHorizontalMullion =
                (section.divider === 'horizontal_invisible') &&
                (section.sections[0].sashType === 'fixed_in_frame') &&
                (section.sections[1].sashType === 'fixed_in_frame') && !isSelected;

            if (isVerticalInvisible && !isSelected) {
                mullion.fill('lightgreen');
                mullion.opacity(0.5);
            } else if ((isVerticalInvisible || isHorizontalInvisible) && isSelected) {
                mullion.opacity(0.7);
                mullion.fill('#4E993F');
            } else if (isSelected) {
                mullion.fill('lightgrey');
            }

            if (hideVerticalMullion) {
                mullion.opacity(0.01);
            }

            if (hideHorizontalMullion) {
                mullion.fill('lightblue');
            }

            mullion.on('click', function () {
                this.deselectAll();
                this.setState({
                    selectedMullionId: section.id
                });
            }.bind(this));
            return mullion;
        },
        createSections: function (rootSection) {
            var objects = [];

            if (rootSection.sections && rootSection.sections.length) {
                var mullion = this.createMullion(rootSection);

                if (this.state.openingView) {
                    objects.push(mullion);
                }

                // draw each child section
                rootSection.sections.forEach(function (sectionData) {
                    objects = objects.concat(this.createSections(sectionData));
                }.bind(this));

                if (!this.state.openingView) {
                    objects.push(mullion);
                }
            }

            var sash = this.createSash(rootSection);

            objects.push(sash);

            return objects;
        },

        // special shape on top of sash to hightlight selection
        // it is simple to draw shape with alpha on top
        // then change styles of selected object
        createSelectionShape: function (section, params) {
            var fillX = params.x;
            var fillY = params.y;
            var fillWidth = params.width;
            var fillHeight = params.height;
            // usual rect
            if (!section.arched) {
                return new Konva.Rect({
                    width: section.sashParams.width,
                    height: section.sashParams.height,
                    fill: 'rgba(0,0,0,0.2)'
                });
            }

            // arched shape
            var arcPos = this.model.getArchedPosition();

            return new Konva.Shape({
                x: fillX,
                y: fillY,
                fill: 'rgba(0,0,0,0.2)',
                sceneFunc: function (ctx) {
                    ctx.beginPath();
                    ctx.moveTo(0, fillHeight);
                    ctx.lineTo(0, arcPos);
                    ctx.quadraticCurveTo(0, 0, fillWidth / 2, 0);
                    ctx.quadraticCurveTo(fillWidth, 0, fillWidth, arcPos);
                    ctx.lineTo(fillWidth, fillHeight);
                    ctx.closePath();
                    ctx.fillStrokeShape(this);
                }
            });
        },

        createFilling: function (section, params) {
            var fillX = params.x;
            var fillY = params.y;
            var fillWidth = params.width;
            var fillHeight = params.height;
            var filling;

            if (!section.arched) {
                filling = new Konva.Shape({
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight,
                    fill: 'lightblue',
                    sceneFunc: function (ctx) {
                        ctx.beginPath();
                        ctx.rect(0, 0, this.width(), this.height());
                        // draw louver lines
                        if (section.fillingType === 'louver') {
                            var offset = 40;

                            for (var i = 0; i < this.height() / offset; i++) {
                                ctx.moveTo(0, i * offset);
                                ctx.lineTo(this.width(), i * offset);
                            }
                        }

                        ctx.fillStrokeShape(this);
                    }
                });

                if (section.fillingType === 'louver') {
                    filling.stroke('black');
                }
            } else if (true) {
                var arcPos = this.model.getArchedPosition();

                filling = new Konva.Shape({
                    x: fillX,
                    y: fillY,
                    fill: 'lightblue',
                    sceneFunc: function (ctx) {
                        ctx.beginPath();
                        ctx.moveTo(0, fillHeight);
                        ctx.lineTo(0, arcPos);
                        ctx.quadraticCurveTo(0, 0, fillWidth / 2, 0);
                        ctx.quadraticCurveTo(fillWidth, 0, fillWidth, arcPos);
                        ctx.lineTo(fillWidth, fillHeight);
                        ctx.closePath();
                        ctx.fillStrokeShape(this);
                    }
                });
            }

            if (section.fillingType && section.fillingType !== 'glass') {
                filling.fill('lightgrey');
            }

            filling.on('click', this.handleObjectClick.bind(this, section.id));
            return filling;
        },
        createBars: function (section, params) {
            var fillX = params.x;
            var fillY = params.y;
            var fillWidth = params.width;
            var fillHeight = params.height;

            var group = new Konva.Group();
            var bar;

            var hBarCount = section.bars.horizontal.length;
            var vBarCount = section.bars.vertical.length;
            var glazing_bar_width = this.model.get('glazing_bar_width');
            var space;

            for (var i = 0; i < vBarCount; i++) {
                space = section.bars.vertical[i].position;

                bar = new Konva.Rect({
                    x: fillX + space - (glazing_bar_width / 2), y: fillY,
                    width: glazing_bar_width, height: fillHeight,
                    fill: 'white', listening: false
                });
                group.add(bar);
            }

            for (i = 0; i < hBarCount; i++) {
                space = section.bars.horizontal[i].position;

                bar = new Konva.Rect({
                    x: fillX, y: fillY + space - (glazing_bar_width / 2),
                    width: fillWidth, height: glazing_bar_width,
                    fill: 'white', listening: false
                });
                group.add(bar);
            }

            return group;
        },
        getBarsWithSpaces: function ( section ) {
            var bars = JSON.parse( JSON.stringify( section.bars ) );

            _.each(bars, function ( group ) {
                var spaceUsed = 0;

                group.forEach(function ( bar ) {
                    bar.space = bar.position - spaceUsed;
                    spaceUsed += bar.space;
                });
            });

            return bars;
        },
        createHandle: function (section, params) {
            var type = section.sashType;
            var offset = params.frameWidth / 2;
            var pos = {
                x: null,
                y: null,
                rotation: 0
            };

            if (type === 'tilt_turn_right' || type === 'turn_only_right' ||
                type === 'slide-right' || type === 'flush-turn-right'
            ) {
                pos.x = offset;
                pos.y = section.sashParams.height / 2;
            }

            if (type === 'tilt_turn_left' || type === 'turn_only_left' ||
                type === 'slide-left' || type === 'flush-turn-left'
            ) {
                pos.x = section.sashParams.width - offset;
                pos.y = section.sashParams.height / 2;
            }

            if (type === 'tilt_only') {
                pos.x = section.sashParams.width / 2;
                pos.y = offset;
                pos.rotation = 90;
            }

            var handle = new Konva.Shape({
                x: pos.x,
                y: pos.y,
                rotation: pos.rotation,
                stroke: 'black',
                fill: 'rgba(0,0,0,0.2)',
                sceneFunc: function (ctx) {
                    ctx.beginPath();
                    ctx.rect(-23, -23, 46, 55);
                    ctx.rect(-14, -5, 28, 90);
                    ctx.fillStrokeShape(this);
                }
            });

            return handle;
        },
        createDirectionLine: function (section) {
            var type = section.sashType;
            var directionLine = new Konva.Shape({
                stroke: 'black',
                x: section.glassParams.x - section.sashParams.x,
                y: section.glassParams.y - section.sashParams.y,
                sceneFunc: function (ctx) {
                    ctx.beginPath();
                    var width = section.glassParams.width;
                    var height = section.glassParams.height;

                    if (type.indexOf('right') >= 0 && (type.indexOf('slide') === -1)) {
                        ctx.moveTo(width, height);
                        ctx.lineTo(0, height / 2);
                        ctx.lineTo(width, 0);
                    }

                    if (type.indexOf('left') >= 0 && (type.indexOf('slide') === -1)) {
                        ctx.moveTo(0, 0);
                        ctx.lineTo(width, height / 2);
                        ctx.lineTo(0, height);
                    }

                    if (type.indexOf('tilt_turn_') >= 0 || type.indexOf('slide') >= 0 || type === 'tilt_only') {
                        ctx.moveTo(0, height);
                        ctx.lineTo(width / 2, 0);
                        ctx.lineTo(width, height);
                    }

                    if (type === 'tilt_only_top_hung') {
                        ctx.moveTo(0, 0);
                        ctx.lineTo(width / 2, height);
                        ctx.lineTo(width, 0);
                    }

                    ctx.strokeShape(this);
                }
            });

            if ((type.indexOf('_hinge_hidden_latch') !== -1)) {
                directionLine.dash([10 / this.ratio, 10 / this.ratio]);
            }

            // #192: Reverse hinge indicator for outside view
            if ( this.state.hingeIndicatorMode === 'american' ) {
                directionLine.scale({
                    x: -1
                });
                directionLine.move({
                    x: section.glassParams.width
                });
            }

            return directionLine;
        },
        createSash: function (sectionData) {
            var hasFrame = (sectionData.sashType !== 'fixed_in_frame');
            var frameWidth = hasFrame ? this.model.profile.get('sash_frame_width') : 0;

            var group = new Konva.Group({
                x: sectionData.sashParams.x,
                y: sectionData.sashParams.y
            });

            var fillX;
            var fillY;
            var fillWidth;
            var fillHeight;

            if (_.includes(['full-flush-panel', 'exterior-flush-panel'], sectionData.fillingType) &&
                !this.state.openingView
            ) {
                fillX = sectionData.openingParams.x - sectionData.sashParams.x;
                fillY = sectionData.openingParams.y - sectionData.sashParams.y;
                fillWidth = sectionData.openingParams.width;
                fillHeight = sectionData.openingParams.height;
            } else if (_.includes(['full-flush-panel', 'interior-flush-panel'], sectionData.fillingType) &&
                        this.state.openingView
            ) {
                fillX = 0;
                fillY = 0;
                fillWidth = sectionData.sashParams.width;
                fillHeight = sectionData.sashParams.height;
            } else {
                fillX = sectionData.glassParams.x - sectionData.sashParams.x;
                fillY = sectionData.glassParams.y - sectionData.sashParams.y;
                fillWidth = sectionData.glassParams.width;
                fillHeight = sectionData.glassParams.height;
            }

            var hasSubSections = sectionData.sections && sectionData.sections.length;
            var isFlushType = sectionData.fillingType &&
                sectionData.fillingType.indexOf('flush') >= 0;

            var frameGroup;

            if (isFlushType && !hasSubSections) {
                frameGroup = this.createFlushFrame({
                    width: sectionData.sashParams.width,
                    height: sectionData.sashParams.height,
                    sectionId: sectionData.id
                });
                group.add(frameGroup);
            }

            if (sectionData.sashType !== 'fixed_in_frame') {

                frameGroup = this.createFrame({
                    width: sectionData.sashParams.width,
                    height: sectionData.sashParams.height,
                    frameWidth: frameWidth,
                    sectionId: sectionData.id
                });

                group.add(frameGroup);
            }

            var shouldDrawFilling =
                !hasSubSections && !isFlushType ||
                !hasSubSections && this.model.isRootSection(sectionData.id) && isFlushType;

            if (shouldDrawFilling) {
                var filling = this.createFilling(sectionData, {
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight
                });

                group.add(filling);
            }

            var shouldDrawBars = shouldDrawFilling &&
                !sectionData.fillingType || sectionData.fillingType === 'glass';

            if (shouldDrawBars) {
                var bars = this.createBars(sectionData, {
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight
                });

                group.add(bars);
            }

            var type = sectionData.sashType;
            var shouldDrawHandle = this.shouldDrawHandle(type);

            if (shouldDrawHandle) {
                var handle = this.createHandle(sectionData, {
                    frameWidth: frameWidth
                });

                group.add(handle);
            }

            var shouldDrawDirectionLine = sectionData.sashType !== 'fixed_in_frame';

            if (shouldDrawDirectionLine) {
                var directionLine = this.createDirectionLine(sectionData);

                group.add(directionLine);
            }

            var sashList = this.model.getSashList();
            var index = _.findIndex(sashList, function (s) {
                return s.id === sectionData.id;
            });

            if (index >= 0) {
                var indexes = this.createSectionIndexes(sectionData, {main: index, add: null});

                group.add( this.createIndexes(indexes) );
            }

            var isSelected = (this.state.selectedSashId === sectionData.id);

            if (isSelected) {
                var selection = this.createSelectionShape(sectionData, {
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight
                });

                group.add(selection);
            }

            return group;
        },
        createSectionIndexes: function (mainSection, indexes, i) {
            var view = this;
            var result = [];

            indexes = indexes || {
                main: 0,
                add: null,
                parent: null
            };

            i = i || 0;

            // If section have a children — create Indexes for them recursively
            if (mainSection.sections.length) {

                if (this.state.insideView && mainSection.divider === 'vertical') {
                    mainSection.sections.reverse();
                }

                mainSection.sections.forEach(function (section, j) {

                    if (mainSection.sashType !== 'fixed_in_frame') {
                        indexes.parent = mainSection;
                    }

                    if (!section.sections.length) {
                        indexes.add += 1;

                    }

                    result = result.concat( view.createSectionIndexes(section, indexes, j) );
                });

            // If section haven't a children sections — create Index for it
            } else {
                var text = (indexes.main + 1);
                var position = {
                    x: (
                        mainSection.glassParams.x - mainSection.sashParams.x
                    ),
                    y: (
                        mainSection.glassParams.y - mainSection.sashParams.y
                    )
                };
                var size = {
                    width: mainSection.glassParams.width,
                    height: mainSection.glassParams.height
                };

                if (indexes.add !== null) {
                    text += '.' + indexes.add;

                    if (indexes.parent) {

                        position = {
                            x: (
                                mainSection.glassParams.x - indexes.parent.sashParams.x
                            ),
                            y: (
                                mainSection.glassParams.y - indexes.parent.sashParams.y
                            )
                        };
                        size = {
                            width: size.width,
                            height: size.height
                        };
                    }
                }

                result.push({
                    text: text,
                    position: position,
                    size: size,
                    id: mainSection.id
                });

            }

            return result;
        },
        createIndexes: function (indexes) {
            var view = this;
            var group = new Konva.Group();
            var number;

            indexes.forEach(function (section) {
                number = new Konva.Text({
                        width: section.size.width,
                        align: 'center',
                        text: section.text + '(' + section.id + ')',
                        fontFamily: fontFamily,
                        fontSize: 15 / view.ratio,
                        listening: false
                    });
                number.position( section.position );
                number.y( number.y() + section.size.height / 2 - number.height() / 2 );
                group.add( number );
            });

            return group;
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
                fontFamily: fontFamily,
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
            var val = app.utils.format.dimension(inches, 'fraction', this.state && this.state.inchesDisplayMode);
            var textInches = new Konva.Text({
                text: val,
                padding: styles.label.padding,
                fill: styles.label.color,
                fontFamily: fontFamily,
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
                fontFamily: fontFamily,
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
            var val = app.utils.format.dimension(inches, 'fraction', this.state && this.state.inchesDisplayMode);
            var textInches = new Konva.Text({
                text: val,
                padding: styles.label.padding,
                fill: styles.label.color,
                fontFamily: fontFamily,
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
            return {
                label: {
                    fill: 'white',
                    stroke: 'grey',
                    strokeWidth: 0.5,
                    padding: 4,
                    color: 'black',
                    fontSize: 11,
                    fontSize_big: 12
                },
                arrows: {
                    stroke: 'grey',
                    strokeWidth: 0.5
                }
            };
        },

        sortMullions: function (mullions) {
            var verticalMullions = [];
            var horizontalMullions = [];

            mullions.forEach(function (mul) {
                if (this.state.selectedMullionId && this.state.selectedMullionId !== mul.id) {
                    return;
                }

                if (mul.type === 'vertical' || mul.type === 'vertical_invisible') {
                    verticalMullions.push(mul);
                } else {
                    horizontalMullions.push(mul);
                }
            }.bind(this));

            verticalMullions.sort(function (a, b) {return a.position - b.position; });
            horizontalMullions.sort(function (a, b) {return a.position - b.position; });

            return {
                vertical: verticalMullions,
                horizontal: horizontalMullions
            };
        },
        getMeasurements: function (mullions) {
            var view = this;
            var root_section = this.model.get('root_section');

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
                        parent_section_ = view.model.getSection( section_.parentId );
                        cur_index = (parent_section_.sections[0].id === section_.id) ? 0 : 1;
                        result_ = findParentByMeasurementType( parent_section_, type_, key_, cur_index );
                    } else {
                        result_ = {
                            section: view.model.getSection( section_.parentId ),
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
                var invertedType = view.model.getInvertedDivider( type );

                result[type] = [];

                if ( mulGroup.length ) {
                    // smart hack to draw last measurement in a loop with rest of mullions
                    var lastMul = mulGroup[ mulGroup.length - 1];

                    mulGroup.push({
                        gap: true,
                        id: lastMul.id,
                        position: view.model.getInMetric( sizeAccordance[type], 'mm'),
                        sections: lastMul.sections
                    });
                }

                mulGroup.forEach(function (mullion) {
                    var current_section = view.model.getSection(mullion.id);
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
                                store_index = edge_section.index;
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
                            params.width = (width_ * view.ratio);
                            params.height = (metricSize);
                            params.space = width_;
                            params.methods = {};

                            position = {
                                x: mullion.offset * view.ratio,
                                y: height
                            };
                        } else {
                            params.width = (metricSize);
                            params.height = (width_ * view.ratio);
                            params.space = width_;
                            params.methods = {};

                            position = {
                                x: -metricSize,
                                y: mullion.offset * view.ratio
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
            var section = view.model.getSection( mullion.section_id );
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
                        val = this.model.getInMetric('width', 'mm') - val;
                    }

                    this.model.setSectionMullionPosition(this.id, val);
                },
                setter_vertical_gap: function (val) {
                    val -= correction.size;

                    if (this.openingView) {
                        val = this.model.getInMetric('width', 'mm') - val;
                    }

                    this.model.setSectionMullionPosition(this.id, val);
                },
                setter_horizontal: function (val) {
                    val -= correction.size;
                    this.model.setSectionMullionPosition(this.id, val);
                },
                setter_horizontal_gap: function (val) {
                    val -= correction.size;
                    this.model.setSectionMullionPosition(this.id, this.model.getInMetric('height', 'mm') - val);
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
                params.width += correction.size * view.ratio;
                params.position.x = correction.pos * view.ratio;
            } else {
                params.height += correction.size * view.ratio;
                params.position.y = correction.pos * view.ratio;
            }

            // Attach getter
            params.methods.getter = methods.getter.bind({space: params.space});
            // Attach setter
            if (params.setter) {
                params.methods.setter = methods[methodName].bind({
                    openingView: view.state.openingView,
                    id: section.id,
                    model: view.model
                });
            }

            // Draw metrics
            var metric = view[ drawingAccordance[type] ](params.width, params.height, params.methods);
            // Draw controls
            // var controls = view.createMullionControls( mullion, params.width, params.height, type );

            // Apply corrections to position
            metric.position( params.position );
            // controls.position( params.position );

            // Add metric to the group:
            // We using group to make its position relative to the basic position
            group.add( metric );
            // group.add( controls );

            return group;
        },
        getCorrection: function () {
            return {
                frame_width: this.model.profile.get('frame_width'),
                mullion_width: this.model.profile.get('mullion_width') / 2,
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
            var root_section = this.model.get('root_section');
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
            var root_section = this.model.get('root_section');
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
        getTotalCorrectionControls: function (mullion) {
            var view = this;
            var correction = view.getCorrection();

            mullion.edges.forEach(function (edge) {
                if (edge.type !== 'frame') {
                    correction = view.getMullionCorrection( edge.type, edge.state, edge.index, correction );
                }
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

            if (!this.state.isPreview) {
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

            if (!this.state.isPreview) {
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
                    // Attach events
                    control.on('click', view.createMeasurementSelectMullion.bind(view, mullion, type, i));

                    if (i === 1) {
                        control.position( position );
                    }

                    group.add(control);
                });
            }

            return group;
        },
        createMullionControlsNew: function (mullions, measurements, width, height) {
            var view = this;
            var group = new Konva.Group();
            var controlSize = metricSize / 4;

            /* eslint-disable max-nested-callbacks */
            if (!this.state.isPreview) {
                var root_section = this.model.get('root_section');

                _.each(mullions, function (mulGroup, type) {
                    mulGroup.forEach( function (mullion, i) {
                        if (!mullion.gap) {
                            var measurement = measurements[type][i];
                            var position = { x: 0, y: 0 };
                            var correction = view.getTotalCorrectionControls( measurement, type );
                            var width_;
                            var height_;

                            if (type === 'horizontal') {
                                position.y = 0 +
                                    mullion.position * view.ratio +
                                    correction.size * view.ratio +
                                    correction.pos * view.ratio -
                                    controlSize / 2;
                                position.x = -metricSize;

                                width_ = metricSize;
                                height_ = controlSize;
                            } else {
                                position.x += 0 +
                                    mullion.position * view.ratio +
                                    correction.size * view.ratio +
                                    correction.pos * view.ratio -
                                    controlSize / 2;
                                position.y = height;

                                width_ = controlSize;
                                height_ = metricSize;
                            }

                            var control = view.createControl( width_, height_ );
                            // Attach events
                            // @TODO: Change onClick event
                            control.on('click', view.createMeasurementSelectMullionNew.bind(
                                view,
                                measurement,
                                mullion.id,
                                type,
                                (i + 1) % 2) // тут какая-то хуйня
                            );

                            control.position( position );
                            group.add(control);

                        }
                    });

                    // Draw controls for frame
                    if (mulGroup.length) {
                        var invertedType = view.model.getInvertedDivider( type );
                        var correction = view.getFrameCorrectionSum( invertedType );

                        correction.size = correction.size * view.ratio;
                        correction.pos = correction.pos * view.ratio;

                        var params = {
                            width: (invertedType === 'vertical') ? metricSize : width + correction.size,
                            height: (invertedType === 'vertical') ? height + correction.size : metricSize,
                            position: {
                                x: (invertedType === 'vertical') ? metricSize * -1 : 0 + correction.pos,
                                y: (invertedType === 'vertical') ? 0 + correction.pos : height
                            }
                        };
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
            }
            /* eslint-enable max-nested-callbacks */

            return group;
        },
        createMeasurementSelectUI: function (event, section, states, state, setter) {
            var view = this;
            // Two variables to fasten drop to default value if nothing selected
            var anyStateSelected = false;
            var defaultState = null;

            // View
            var $wrap = $('<div>', {class: 'dimension-point-wrapper'});
            var containerPos = this.$('#drawing').position();

            $wrap
                .css({
                    position: 'absolute',
                    top: event.target.getAbsolutePosition().y + containerPos.top,
                    left: event.target.getAbsolutePosition().x + containerPos.left
                })
                .appendTo(this.$el);

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
                    view.model.setSectionMeasurements( section.id, section.measurements );
                    $wrap.remove();
                });
            });

            // If no option wasn't selected вАФ select default option
            if (anyStateSelected === false && defaultState !== null) {
                setter( defaultState.value );
                view.model.setSectionMeasurements( section.id, section.measurements );

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
            var section = this.model.getSection( section_id );
            // Get available states
            var states = this.model.getMeasurementStates( mType );
            // Get current state of dimension-point
            var state = section.measurements[mType][type][index];

            return view.createMeasurementSelectUI(event, section, states, state, function (val) {
                section.measurements[mType][type][index] = val;
            });
        },
        createMeasurementSelectMullionNew: function (mullion, id, type, i, event) {
            var view = this;

            var edge = mullion.edges.filter(function (edge_) {
                return ( edge_.section_id === id && edge_.type === 'mullion');
            })[0];

            var section = this.model.getSection( edge.section_id );
            var invertedType = view.model.getInvertedDivider( type );

            // Get available states
            var states = this.model.getMeasurementStates( edge.type );
            // Get current state of dimension-point
            var state = edge.state;
            var invertedIndex = (edge.index + 1) % 2;

            return view.createMeasurementSelectUI(event, section, states, state, function (val) {
                var invertedVal = view.model.getInvertedMeasurementVal( val );

                section.measurements[edge.type][invertedType][edge.index] = val;
                section.measurements[edge.type][invertedType][invertedIndex] = invertedVal;
            });
        },
        createMeasurementSelectMullion: function (mullion, type, i, event) {
            var view = this;
            var edge = mullion.edges[i];
            var section = this.model.getSection( edge.section_id );

            // Get available states
            var states = this.model.getMeasurementStates( edge.type );
            // Get current state of dimension-point
            var state = edge.state;

            var invertedType = view.model.getInvertedDivider( type );

            return view.createMeasurementSelectUI(event, section, states, state, function (val) {
                section.measurements[edge.type][invertedType][edge.index] = val;
            });
        },
        createWholeMetrics: function (mullions, width, height) {
            var group = new Konva.Group();
            var root_section = this.model.generateFullRoot();
            var rows = {
                vertical: mullions.vertical.length ? 1 : 0,
                horizontal: mullions.horizontal.length ? 1 : 0
            };

            // Correction parameters for metrics
            var vCorrection = this.getFrameCorrectionSum('vertical');
            var hCorrection = this.getFrameCorrectionSum('horizontal');

            // Vertical
            var vHeight = height + (vCorrection.size * this.ratio);
            var verticalWholeMertic = this.createVerticalMetric(metricSize, vHeight, {
                setter: function (val) {
                    val -= vCorrection.size;
                    this.model.setInMetric('height', val, 'mm');
                }.bind(this),
                getter: function () {
                    return this.model.getInMetric('height', 'mm') + vCorrection.size;
                }.bind(this)
            });
            var vPosition = {
                x: -metricSize * (rows.horizontal + 1),
                y: 0 + (vCorrection.pos * this.ratio)
            };
            var vControls = this.createWholeControls(root_section.id, metricSize, vHeight, 'vertical');

            verticalWholeMertic.position(vPosition);
            vControls.position(vPosition);
            group.add(verticalWholeMertic, vControls);

            // Horizontal
            var hWidth = width + (hCorrection.size * this.ratio);
            var horizontalWholeMertic = this.createHorizontalMetric(hWidth, metricSize, {
                setter: function (val) {
                    val -= hCorrection.size;
                    this.model.setInMetric('width', val, 'mm');
                }.bind(this),
                getter: function () {
                    return this.model.getInMetric('width', 'mm') + hCorrection.size;
                }.bind(this)
            });
            var hPosition = {
                x: 0 + (hCorrection.pos * this.ratio),
                y: height + rows.vertical * metricSize
            };
            var hControls = this.createWholeControls(root_section.id, hWidth, metricSize, 'horizontal');

            horizontalWholeMertic.position(hPosition);
            hControls.position(hPosition);
            group.add(horizontalWholeMertic, hControls);

            return group;
        },
        createInfo: function (mullions, width, height) {
            var group = new Konva.Group();
            var mullions_;

            // Draw mullion metrics
            mullions = this.sortMullions(mullions);
            mullions_ = this.getMeasurements(mullions);
            group.add( this.createMullionMetrics(mullions_, height) );

            // Draw mullion controls
            group.add( this.createMullionControlsNew(mullions, mullions_, width, height) );

            // Draw whole metrics
            group.add( this.createWholeMetrics(mullions_, width, height) );

            // Draw overlay metrics: GlassSize & OpeningSize
            group.add( this.createOverlayMetrics() );

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
            var root = (this.state.openingView) ? this.model.generateFullRoot() : this.model.generateFullReversedRoot();
            var results = [];

            findOverlay(root, results);

            results.forEach(function (metric) {
                var mSize = (metricSize / 2);
                var width = metric.params.width * view.ratio;
                var height = metric.params.height * view.ratio;
                var position = {
                    x: metric.params.x * view.ratio,
                    y: metric.params.y * view.ratio
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

            var root_section = this.model.get('root_section');
            var archHeight = this.model.getArchedPosition() + vCorrection[0].size;
            var params = {
                getter: function () {
                    return archHeight;
                },
                setter: function (val) {
                    val = val - vCorrection[0].size;

                    var id = root_section.id;

                    this.model._updateSection(id, function (section) {
                        section.archPosition = val;
                    });
                }.bind(this)
            };

            var vHeight = (this.model.getInMetric('height', 'mm') +
                            vCorrection[0].size + vCorrection[1].size
                            ) * this.ratio;

            var vPosition = {
                x: -metricSize,
                y: vCorrection[0].pos * this.ratio
            };
            var metric = this.createVerticalMetric(metricSize, archHeight * this.ratio, params);
            var vControls = this.createWholeControls(root_section.id, metricSize * 2, vHeight, 'vertical');

            metric.position(vPosition);

            vPosition.x = vPosition.x * 2;
            vControls.position(vPosition);
            group.add(metric, vControls);

            var nonArchHeight = this.model.getInMetric('height', 'mm') - archHeight +
                                vCorrection[1].size;

            params = {
                getter: function () {
                    return nonArchHeight;
                },
                setter: function (val) {
                    val = val - vCorrection[1].size;

                    var id = this.model.get('root_section').id;
                    var archPosition = this.model.getInMetric('height', 'mm') - val;

                    this.model._updateSection(id, function (section) {
                        section.archPosition = archPosition;
                    });
                }.bind(this)
            };
            metric = this.createVerticalMetric(metricSize, (nonArchHeight + vCorrection[0].size) * this.ratio, params);
            metric.position({
                x: -metricSize,
                y: (archHeight + vCorrection[0].pos) * this.ratio
            });
            group.add(metric);

            var verticalWholeMertic = this.createVerticalMetric(metricSize,
                (height + (vwCorrection.size * this.ratio)),
                {
                    setter: function (val) {
                        val -= vwCorrection.size;
                        this.model.setInMetric('height', val, 'mm');
                    }.bind(this),
                    getter: function () {
                        return ( this.model.getInMetric('height', 'mm') + vwCorrection.size);
                    }.bind(this)
                });

            verticalWholeMertic.position({
                x: -metricSize * 2,
                y: 0 + (vwCorrection.pos * this.ratio)
            });

            group.add(verticalWholeMertic);

            var hWidth = (width + (hwCorrection.size * this.ratio));
            var hControls = this.createWholeControls(root_section.id, hWidth, metricSize, 'horizontal');
            var hPosition = {
                x: 0 + (hwCorrection.pos * this.ratio),
                y: height
            };
            var horizontalWholeMertic = this.createHorizontalMetric( hWidth,
                metricSize,
                {
                    setter: function (val) {
                        val -= hwCorrection.size;
                        this.model.setInMetric('width', val, 'mm');
                    }.bind(this),
                    getter: function () {
                        return ( this.model.getInMetric('width', 'mm') + hwCorrection.size);
                    }.bind(this)
                });

            horizontalWholeMertic.position( hPosition);
            hControls.position( hPosition );

            group.add(horizontalWholeMertic, hControls);

            return group;
        },
        createInput: function (params, pos, size) {
            var $wrap = $('<div>')
                .addClass('popup-wrap')
                .appendTo(this.$el)
                .on('click', function (e) {
                    if (e.target === $wrap.get(0)) {
                        $wrap.remove();
                    }
                });

            var containerPos = this.$('#drawing').position();

            var padding = 3;
            var valInInches = app.utils.convert.mm_to_inches(params.getter());
            var val = app.utils.format.dimension(valInInches, 'fraction', this.state.inchesDisplayMode);

            $('<input>')
                .val(val)
                .css({
                    position: 'absolute',
                    top: (pos.y - padding + containerPos.top) + 'px',
                    left: (pos.x - padding + containerPos.left) + 'px',
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
                })
                ;
        },
        updateLayer: function () {
            this.layer.draw();
        },
        updateCanvas: function () {
            // clear all previous objects
            this.layer.destroyChildren();

            // transparent background to detect click on empty space
            var back = new Konva.Rect({
                width: this.stage.width(),
                height: this.stage.height()
            });

            this.layer.add(back);
            back.on('click tap', function () {
                this.deselectAll();
            }.bind(this));

            var frameWidth = this.model.getInMetric('width', 'mm');
            var frameHeight = this.model.getInMetric('height', 'mm');

            // we will add 0.5 pixel offset for better strokes
            var topOffset = 10 + 0.5;
            var wr = (this.stage.width() - metricSize * 2) / frameWidth;
            var hr = (this.stage.height() - metricSize * 2 - topOffset) / frameHeight;

            // scale ratio
            var ratio = Math.min(wr, hr) * 0.95;

            var frameOnScreenWidth = frameWidth * ratio;
            var frameOnScreenHeight = frameHeight * ratio;

            this.ratio = ratio;

            var group = new Konva.Group();

            // place unit on center
            group.x(Math.round(this.stage.width() / 2 - frameOnScreenWidth / 2 + metricSize) + 0.5);
            // and will small offset from top
            group.y(topOffset);

            this.layer.add(group);

            var root;

            if (this.state.openingView) {
                root = this.model.generateFullRoot();
            } else {
                root = this.model.generateFullReversedRoot();
            }

            var frameGroup;
            var isDoorFrame =
                this.model.profile.isThresholdPossible() &&
                this.model.profile.get('low_threshold');

            var isArchedWindow = (this.model.getArchedPosition() !== null);

            // create main frame
            if (isDoorFrame) {
                frameGroup = this.createDoorFrame({
                    sectionId: root.id,
                    width: this.model.getInMetric('width', 'mm'),
                    height: this.model.getInMetric('height', 'mm'),
                    frameWidth: this.model.profile.get('frame_width')
                });
            } else if (isArchedWindow) {
                frameGroup = this.createArchedFrame({
                    sectionId: root.id,
                    width: this.model.getInMetric('width', 'mm'),
                    height: this.model.getInMetric('height', 'mm'),
                    frameWidth: this.model.profile.get('frame_width'),
                    archHeight: this.model.getArchedPosition()
                });
            } else {
                frameGroup = this.createFrame({
                    sectionId: root.id,
                    width: this.model.getInMetric('width', 'mm'),
                    height: this.model.getInMetric('height', 'mm'),
                    frameWidth: this.model.profile.get('frame_width')
                });
            }

            frameGroup.scale({x: ratio, y: ratio});
            group.add(frameGroup);

            // group for all nested elements
            var sectionsGroup = new Konva.Group();

            sectionsGroup.scale({x: ratio, y: ratio});
            group.add(sectionsGroup);

            // create sections(sashes) recursively
            var sections = this.createSections(root);

            sectionsGroup.add.apply(sectionsGroup, sections);

            // if we are not looking from opening view
            // we should see MAIN frame first
            if (!this.state.openingView) {
                // so we move it to top
                frameGroup.moveToTop();
            }

            // infoGroup is group for displaying dimension information
            var infoGroup;

            if (this.model.get('root_section').arched) {
                infoGroup = this.createArchedInfo(frameOnScreenWidth, frameOnScreenHeight);
            } else {
                var mullions;

                if (this.state.openingView) {
                    mullions = this.model.getMullions();
                } else {
                    mullions = this.model.getRevertedMullions();
                }

                infoGroup = this.createInfo(mullions, frameOnScreenWidth, frameOnScreenHeight);
            }

            group.add(infoGroup);

            this.layer.draw();
        },

        updateUI: function () {
            // here we have to hide and should some elements in toolbar
            var buttonText = globalInsideView ? 'Show outside view' : 'Show inside view';

            this.$('#change-view-button').text(buttonText);

            var titleText = globalInsideView ? 'Inside view' : 'Outside view';

            this.ui.$title.text(titleText);

            var selectedSashId = this.state.selectedSashId;
            var selectedSash = this.model.getSection(selectedSashId);
            var isArched = selectedSash && selectedSash.arched;

            this.ui.$bars_control.toggle(
                !isArched &&
                !!selectedSashId &&
                selectedSash.fillingType === 'glass'
            );

            this.ui.$section_control.toggle(!!selectedSashId);

            this.$('.sash-types').toggle(
                !isArched &&
                selectedSashId &&
                this.model.canAddSashToSection(selectedSashId)
            );

            this.$('.split').toggle(
                !isArched
            );

            var selectedFillingType = selectedSash && selectedSash.fillingName &&
                app.settings && app.settings.getFillingTypeByName(selectedSash.fillingName);

            if ( selectedFillingType ) {
                this.ui.$filling_select.val(selectedFillingType.cid);
            } else {
                this.ui.$filling_select.val('');
            }

            this.ui.$filling_select.selectpicker('render');

            this.$('.toggle-arched').toggle(
                selectedSashId &&
                this.model.isArchedPossible(selectedSashId)
            );

            this.$('.remove-arched').toggle(!!isArched);
            this.$('.add-arched').toggle(!isArched);

            // Additional overlay metrics
            if ( selectedSash ) {
                this.ui.$metrics_glass.prop('checked', selectedSash.measurements.glass );
                this.ui.$metrics_opening.prop('checked', selectedSash.measurements.opening );

                if ( selectedSash.sashType !== 'fixed_in_frame' ) {
                    this.$('#additional-metrics-opening--label').show();
                } else {
                    this.$('#additional-metrics-opening--label').hide();
                }
            }
        },

        updateSize: function (width, height) {
            this.stage.width(width || this.$('#drawing').get(0).offsetWidth);
            this.stage.height(height || this.$('#drawing').get(0).offsetHeight);
        },
        updateSection: function (sectionId, type) {
            var view = this;
            var section = this.model.getSection(sectionId);

            type = type || section.divider;

            if (type === 'both') {
                view.updateSection( sectionId, 'vertical');
                view.updateSection( sectionId, 'horizontal');
            }

            // Update glazing bars
            if ( section.bars && section.bars[type] && section.bars[type].length ) {
                view.glazing_view
                    .setSection( section.id )
                    .handleBarsNumberChange( type );
            }

            // If section has children — update them recursively
            if ( section.sections && section.sections.length ) {
                section.sections.forEach(function (child) {
                    view.updateSection( child.id, type );
                });
            }
        },

        updateRenderedScene: function () {
            this.updateUI();
            this.updateSize();
            this.updateCanvas();
            this.$('#drawing').focus();
        },
        setState: function (state) {
            this.state = _.assign(this.state, state);
            this.updateUI();
            this.updateCanvas();
            this.$('#drawing').focus();
            this.trigger('onSetState');
        },
        deselectAll: function () {
            this.setState({
                selectedMullionId: null,
                selectedSashId: null
            });
        },

        shouldDrawHandle: function (type) {
            var result = false;
            var typeResult = false;

            if (
                    type !== 'fixed_in_frame' &&
                    (
                        type.indexOf('left') >= 0 ||
                        type.indexOf('right') >= 0 ||
                        type === 'tilt_only'
                    ) &&
                    (type.indexOf('_hinge_hidden_latch') === -1)
            ) {
                typeResult = true;
            }

            // Draw handle if:
            // 1). type of sash has handle
            // 2a). it's inside view
            // 2b). it's outside view & profile hasOutsideHandle (for example, door)
            result = (
                        typeResult &&
                        (
                            (this.state.insideView) ||
                            (!this.state.insideView && this.model.profile.hasOutsideHandle())
                        )
                );

            return result;
        },

        getMeasurementEdges: function (section_id, type) {
            var edges = this.model.getMeasurementEdges( section_id );
            var edgeTypes = [];

            if (type === 'horizontal') {
                edgeTypes = [edges.left, edges.right];

                if (!this.state.insideView) {
                    edgeTypes.reverse();
                }

            } else {
                edgeTypes = [edges.top, edges.bottom];
            }

            return edgeTypes;
        }
    });

    app.preview = function (unitModel, options) {
        var result;
        var project_settings = app.settings && app.settings.getProjectSettings();
        var defaults = {
            width: 300,
            height: 300,
            mode: 'base64',
            position: 'inside',
            inchesDisplayMode: project_settings && project_settings.get('inches_display_mode'),
            hingeIndicatorMode: project_settings && project_settings.get('hinge_indicator_mode')
        };

        options = _.defaults({}, options, defaults);

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

        var view = new app.DrawingView({
            model: unitModel,
            isPreview: true
        });

        view.render();
        view.updateSize(options.width, options.height);
        view.updateCanvas();

        if ( _.indexOf(['inside', 'outside'], options.position) !== -1 ) {
            view.setState({
                insideView: options.position === 'inside',
                openingView: options.position === 'inside' && !unitModel.isOpeningDirectionOutward() ||
                    options.position === 'outside' && unitModel.isOpeningDirectionOutward(),
                inchesDisplayMode: options.inchesDisplayMode,
                hingeIndicatorMode: options.hingeIndicatorMode
            });
        } else {
            view.destroy();
            view.remove();
            throw new Error('unrecognized position for preview: ' + options.position);
        }

        if (options.mode === 'canvas') {
            result = view.layer.canvas._canvas;
        } else if (options.mode === 'base64') {
            result = view.stage.toDataURL();
        } else if (options.mode === 'image') {
            result = new Image();
            result.src = view.stage.toDataURL();
        } else {
            view.destroy();
            view.remove();
            throw new Error('unrecognized mode for preview: ' + options.mode);
        }

        unitModel.preview.full_root_json_string = full_root_json_string;
        unitModel.preview.result[options_json_string] = result;

        // clean
        view.destroy();
        view.remove();
        return result;
    };

})();
