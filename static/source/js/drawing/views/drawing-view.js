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
    // 3. and insideView variable. This variable is not part of this.state
    // as we need to keep it the same for any view

    // starting point of all drawing is "renderCanvas" function

    // main pattern for methods name
    // this.handleSomeAction - callback on some user UI action
    // this.createSomeObject - pure function that create some canvas UI elements
    // TODO: as this functions are pure, so it is better to move them into separete files
    // something like "components" directory

    // global params
    var insideView = false;
    var metricSize = 50;

    app.DrawingView = Marionette.ItemView.extend({
        tagName: 'div',
        template: app.templates['drawing/drawing-view'],
        initialize: function () {
            this.listenTo(this.model, 'all', this.updateRenderedScene);
            this.on('update_rendered', this.updateRenderedScene, this);

            // is we a looking to unit from opening side?
            // so for windows it is usually true for inside view
            // but some door are opening outward
            // so if we are looking into such door from outside openingView will be true
            var openingView =
                !insideView && this.model.isOpeningDirectionOutward()
                ||
                insideView && !this.model.isOpeningDirectionOutward();

            this.state = {
                openingView: openingView,
                selectedSashId: null,
                selectedMullionId: null
            };
        },

        ui: {
            $flush_panels: '[data-type="flush-turn-right"], [data-type="flush-turn-left"]',
            $title: '#drawing-view-title',
            $bars_control: '#bars-control',
            $section_control: '#section_control',
            $filling_select: '#filling-select'
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
            'click #glazing-bars-popup': 'handleGlazingBarsPopupClick'
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
        handleChangeView: function () {
            insideView = !insideView;
            var openingView =
                !insideView && this.model.isOpeningDirectionOutward() ||
                insideView && !this.model.isOpeningDirectionOutward();

            this.setState({
                openingView: openingView
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

            // if Unit is Outward opening or it's outside view:
            // reverse sash type
            // from right to left or from left to right
            if ( !this.state.openingView || this.model.isOpeningDirectionOutward() ) {
                if (type.indexOf('left') >= 0) {
                    type = type.replace('left', 'right');
                } else if (type.indexOf('right') >= 0) {
                    type = type.replace('right', 'left');
                }
            }

            this.model.setSectionSashType(this.state.selectedSashId, type);
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
            var view = this;
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
            if ( view.state.openingView && this.model.isOpeningDirectionOutward() ) {
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
            var shouldDrawHandle =
                sectionData.sashType !== 'fixed_in_frame' &&
                ((this.state.openingView &&
                    (type.indexOf('left') >= 0 || type.indexOf('right') >= 0 || type === 'tilt_only')
                ) &&
                (type.indexOf('_hinge_hidden_latch') === -1)
                || (!this.state.openingView && this.model.profile.hasOutsideHandle()));

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
                var number = new Konva.Text({
                    x: sectionData.openingParams.x - sectionData.sashParams.x,
                    y: sectionData.openingParams.y,
                    width: sectionData.openingParams.width,
                    align: 'center',
                    text: index + 1,
                    fontSize: 15 / this.ratio,
                    listening: false
                });

                number.y(
                    sectionData.openingParams.y - sectionData.sashParams.y +
                    sectionData.openingParams.height / 2 - number.height() / 2
                );
                group.add(number);
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
        createVerticalMetric: function (width, height, params) {
            var arrowOffset = width / 2;
            var arrowSize = 5;
            var group = new Konva.Group();

            var lines = new Konva.Shape({
                sceneFunc: function (ctx) {
                    ctx.fillStyle = 'grey';
                    ctx.lineWidth = 0.5;

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(width, 0);

                    ctx.moveTo(0, height);
                    ctx.lineTo(width, height);

                    ctx.stroke();
                }
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
                stroke: 'grey',
                strokeWidth: 0.5
            });

            // left text
            var labelMM = new Konva.Label();

            labelMM.add(new Konva.Tag({
                fill: 'white',
                stroke: 'grey'
            }));
            var textMM = new Konva.Text({
                text: app.utils.format.dimension_mm(params.getter()),
                padding: 2,
                fontSize: 11,
                fill: 'black'
            });

            labelMM.add(textMM);
            labelMM.position({
                x: width - textMM.width() - 5,
                y: height / 2 + textMM.height() / 2
            });

            // left text
            var labelInches = new Konva.Label();

            labelInches.add(new Konva.Tag({
                fill: 'white',
                stroke: 'grey'
            }));
            var inches = app.utils.convert.mm_to_inches(params.getter());
            var val = app.utils.format.dimension(inches, 'fraction');
            var textInches = new Konva.Text({
                text: val,
                padding: 2,
                fill: 'black'
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

        createHorizontalMetric: function (width, height, params) {
            var arrowOffset = height / 2;
            var arrowSize = 5;
            var group = new Konva.Group();

            var lines = new Konva.Shape({
                sceneFunc: function (ctx) {
                    ctx.fillStyle = 'grey';
                    ctx.lineWidth = 0.5;

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, height);

                    ctx.moveTo(width, 0);
                    ctx.lineTo(width, height);

                    ctx.stroke();
                }
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
                stroke: 'grey',
                strokeWidth: 0.5
            });

            var labelMM = new Konva.Label();

            labelMM.add(new Konva.Tag({
                fill: 'white',
                stroke: 'grey'
            }));
            var textMM = new Konva.Text({
                text: app.utils.format.dimension_mm(params.getter()),
                padding: 2,
                fontSize: 11,
                fill: 'black'
            });

            labelMM.add(textMM);
            labelMM.position({
                x: width / 2 - textMM.width() / 2,
                y: arrowOffset + textMM.height() / 2
            });

            var labelInches = new Konva.Label();

            labelInches.add(new Konva.Tag({
                fill: 'white',
                stroke: 'grey'
            }));
            var inches = app.utils.convert.mm_to_inches(params.getter());
            var val = app.utils.format.dimension(inches, 'fraction');
            var textInches = new Konva.Text({
                text: val,
                padding: 2,
                fill: 'black'
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

        createInfo: function (mullions, width, height) {
            var group = new Konva.Group();
            var verticalRows = 0;
            var horizontalRows = 0;
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

            var pos = 0;

            verticalMullions.forEach(function (mul, i) {
                var width_ = mul.position - pos;
                // do not draw very small dimension
                if (width_ > 0) {
                    var params = {
                        getter: function () {
                            return width_;
                        }
                    };

                    if (verticalMullions.length === 1) {
                        params.setter = function (val) {
                            if (!this.state.openingView) {
                                val = this.model.getInMetric('width', 'mm') - val;
                            }

                            this.model.setSectionMullionPosition(mul.id, val);
                        }.bind(this);
                    }

                    var metric = this.createHorizontalMetric(width_ * this.ratio, metricSize, params);

                    metric.position({
                        x: pos * this.ratio,
                        y: height
                    });
                    pos = mul.position;
                    group.add(metric);
                }

                if ( i === verticalMullions.length - 1) {
                    horizontalRows += 1;
                    var width__ = this.model.getInMetric('width', 'mm') - pos;

                    params = {
                        getter: function () {
                            return width__;
                        }
                    };

                    if (verticalMullions.length === 1) {
                        params.setter = function (val) {
                            if (this.state.openingView) {
                                val = this.model.getInMetric('width', 'mm') - val;
                            }

                            this.model.setSectionMullionPosition(mul.id, val);
                        }.bind(this);
                    }

                    metric = this.createHorizontalMetric(width__ * this.ratio, metricSize, params);
                    metric.position({
                        x: pos * this.ratio,
                        y: height
                    });
                    group.add(metric);
                }
            }.bind(this));

            pos = 0;
            horizontalMullions.forEach(function (mul, i) {
                var height_ = mul.position - pos;

                if (height_ > 0) {
                    var params = {
                        getter: function () {
                            return height_;
                        }
                    };

                    if (horizontalMullions.length === 1) {
                        params.setter = function (val) {
                            this.model.setSectionMullionPosition(mul.id, val);
                        }.bind(this);
                    }

                    var metric = this.createVerticalMetric(metricSize, height_ * this.ratio, params);

                    metric.position({
                        x: -metricSize,
                        y: pos * this.ratio
                    });
                    pos = mul.position;
                    group.add(metric);
                }

                if ( i === horizontalMullions.length - 1) {
                    verticalRows += 1;
                    var height__ = this.model.getInMetric('height', 'mm') - pos;

                    params = {
                        getter: function () {
                            return height__;
                        }
                    };

                    if (horizontalMullions.length === 1) {
                        params.setter = function (val) {
                            this.model.setSectionMullionPosition(mul.id, this.model.getInMetric('height', 'mm') - val);
                        }.bind(this);
                    }

                    metric = this.createVerticalMetric(metricSize, height__ * this.ratio, params);
                    metric.position({
                        x: -metricSize,
                        y: pos * this.ratio
                    });
                    group.add(metric);
                }
            }.bind(this));

            var verticalWholeMertic = this.createVerticalMetric(metricSize, height, {
                setter: function (val) {
                    this.model.setInMetric('height', val, 'mm');
                }.bind(this),
                getter: function () {
                    return this.model.getInMetric('height', 'mm');
                }.bind(this)
            });

            verticalWholeMertic.position({
                x: -metricSize * (verticalRows + 1),
                y: 0
            });

            group.add(verticalWholeMertic);

            var horizontalWholeMertic = this.createHorizontalMetric(width, metricSize, {
                setter: function (val) {
                    this.model.setInMetric('width', val, 'mm');
                }.bind(this),
                getter: function () {
                    return this.model.getInMetric('width', 'mm');
                }.bind(this)
            });

            horizontalWholeMertic.position({
                x: 0,
                y: height + horizontalRows * metricSize
            });
            group.add(horizontalWholeMertic);

            return group;
        },
        createArchedInfo: function (width, height) {
            var group = new Konva.Group();

            var archHeight = this.model.getArchedPosition();
            var params = {
                getter: function () {
                    return archHeight;
                },
                setter: function (val) {
                    var id = this.model.get('root_section').id;

                    this.model._updateSection(id, function (section) {
                        section.archPosition = val;
                    });
                }.bind(this)
            };
            var metric = this.createVerticalMetric(metricSize, archHeight * this.ratio, params);

            metric.position({
                x: -metricSize
            });
            group.add(metric);

            var nonArchHeight = this.model.getInMetric('height', 'mm') - archHeight;

            params = {
                getter: function () {
                    return nonArchHeight;
                },
                setter: function (val) {
                    var id = this.model.get('root_section').id;
                    var archPosition = this.model.getInMetric('height', 'mm') - val;

                    this.model._updateSection(id, function (section) {
                        section.archPosition = archPosition;
                    });
                }.bind(this)
            };
            metric = this.createVerticalMetric(metricSize, nonArchHeight * this.ratio, params);
            metric.position({
                x: -metricSize,
                y: archHeight * this.ratio
            });
            group.add(metric);

            var verticalWholeMertic = this.createVerticalMetric(metricSize, height, {
                setter: function (val) {
                    this.model.setInMetric('height', val, 'mm');
                }.bind(this),
                getter: function () {
                    return this.model.getInMetric('height', 'mm');
                }.bind(this)
            });

            verticalWholeMertic.position({
                x: -metricSize * 2,
                y: 0
            });

            group.add(verticalWholeMertic);

            var horizontalWholeMertic = this.createHorizontalMetric(width, metricSize, {
                setter: function (val) {
                    this.model.setInMetric('width', val, 'mm');
                }.bind(this),
                getter: function () {
                    return this.model.getInMetric('width', 'mm');
                }.bind(this)
            });

            horizontalWholeMertic.position({
                x: 0,
                y: height
            });
            group.add(horizontalWholeMertic);

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
            var val = app.utils.format.dimension(valInInches, 'fraction');

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
            var buttonText = insideView ? 'Show outside view' : 'Show inside view';

            this.$('#change-view-button').text(buttonText);

            var titleText = insideView ? 'Inside view' : 'Outside view';

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
        },

        updateSize: function (width, height) {
            this.stage.width(width || this.$('#drawing').get(0).offsetWidth);
            this.stage.height(height || this.$('#drawing').get(0).offsetHeight);
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
        }
    });

    app.preview = function (unitModel, options) {
        var result;
        var defaults = {
            width: 300,
            height: 300,
            mode: 'base64',
            position: 'inside'
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
            model: unitModel
        });

        view.render();
        view.updateSize(options.width, options.height);
        view.updateCanvas();

        if ( _.indexOf(['inside', 'outside'], options.position) !== -1 ) {
            view.setState({
                openingView: options.position === 'inside'
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
