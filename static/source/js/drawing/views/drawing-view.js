var app = app || {};

(function () {
    'use strict';

    // This view is organized in React-like approach but with multiple sources
    // of state as we have:
    //
    // 1. this.model - unit this.model.profile - profile data
    //
    // 2. this.state - UI state of view.
    // Take a look to constructor to see what is possible in state
    //
    // 3. and globalInsideView variable. This variable is not part of this.state
    // as we need to keep it the same for any view
    //
    // starting point of all drawing is "renderCanvas" function
    //
    // main pattern for methods name
    // this.handleSomeAction - callback on some user UI action
    // this.createSomeObject - pure function that create some canvas UI elements

    app.DrawingView = Marionette.View.extend({
        tagName: 'div',
        template: app.templates['drawing/drawing-view'],
        initialize: function (opts) {
            var project_settings = app.settings.getProjectSettings();

            this.listenTo(this.model, 'all', this.updateRenderedScene);
            this.on('update_rendered', this.updateRenderedScene, this);

            this.createGlazingPopup();

            this.metric_size = 50;

            this.state = {
                isPreview: ('isPreview' in opts && opts.isPreview),
                insideView: this.isInsideView(),
                openingView: this.isOpeningView(),
                selectedSashId: null,
                selectedMullionId: null,
                inchesDisplayMode: project_settings && project_settings.get('inches_display_mode'),
                hingeIndicatorMode: project_settings && project_settings.get('hinge_indicator_mode'),
                inputFocused: false
            };

            this.groups = {};

            this.undo_manager = new app.UndoManager({
                register: this.model,
                track: true
            });
        },
        ui: {
            $flush_panels: '[data-type="flush-turn-right"], [data-type="flush-turn-left"]',
            $title: '#drawing-view-title',
            $bars_control: '#bars-control',
            $section_control: '#section_control',
            $filling_select: '#filling-select',
            $undo: '#undo',
            $redo: '#redo',
            $sash_types: '.change-sash-type',
            $metrics: '.additional-metrics',
            $metrics_glass: '[for="additional-metrics-glass"]',
            $metrics_glass_input: '#additional-metrics-glass',
            $metrics_opening: '[for="additional-metrics-opening"]',
            $metrics_opening_input: '#additional-metrics-opening'
        },
        events: {
            // Click
            'click #drawing': 'handleCanvasClick',
            'contextmenu #drawing': 'handleCanvasClick',
            'click .split-section': 'handleSplitSectionClick',
            'click @ui.$sash_types': 'handleChangeSashTypeClick',
            'click #clear-frame': 'handleClearFrameClick',
            'click #change-view-button': 'handleChangeView',
            'click .toggle-arched': 'handleArchedClick',
            'click .toggle-circular': 'handleCircularClick',
            'click #glazing-bars-popup': 'handleGlazingBarsPopupClick',
            'click #sash-clone': 'handleSashCloneClick',
            'click @ui.$undo': 'handleUndoClick',
            'click @ui.$redo': 'handleRedoClick',
            // Tap
            'tap .split-section': 'handleSplitSectionClick',
            'tap @ui.$sash_types': 'handleChangeSashTypeClick',
            'tap #clear-frame': 'handleClearFrameClick',
            'tap #change-view-button': 'handleChangeView',
            'tap .toggle-arched': 'handleArchedClick',
            'tap .toggle-circular': 'handleCircularClick',
            'tap #glazing-bars-popup': 'handleGlazingBarsPopupClick',
            'tap #sash-clone': 'handleSashCloneClick',
            'tap @ui.$undo': 'handleUndoClick',
            'tap @ui.$redo': 'handleRedoClick',
            // Others
            'keydown #drawing': 'handleCanvasKeyDown',
            'change #vertical-bars-number': 'handleBarNumberChange',
            'input #vertical-bars-number': 'handleBarNumberChange',
            'change #horizontal-bars-number': 'handleBarNumberChange',
            'input #horizontal-bars-number': 'handleBarNumberChange',
            'change #filling-select': 'handleFillingTypeChange',
            'change @ui.$metrics_glass_input': 'handleAdditionalMetricsChange',
            'change @ui.$metrics_opening_input': 'handleAdditionalMetricsChange'
        },
        keyShortcuts: {
            'ctrl+z': 'handleUndoClick',
            'command+z': 'handleUndoClick',
            'ctrl+shift+z': 'handleRedoClick',
            'command+shift+z': 'handleRedoClick',
            'ctrl+y': 'handleRedoClick',
            'command+y': 'handleRedoClick'
        },
        setGlobalInsideView: function (value) {
            this.options.parent_view.setGlobalInsideView(value);
        },
        isInsideView: function () {
            return this.options.parent_view.getGlobalInsideView();
        },
        // Are we looking at unit from the opening side?
        isOpeningView: function () {
            return !this.isInsideView() && this.model.isOpeningDirectionOutward() ||
                this.isInsideView() && !this.model.isOpeningDirectionOutward();
        },
        handleUndoClick: function () {
            return this.undo_manager.handler.undo();
        },
        handleRedoClick: function () {
            return this.undo_manager.handler.redo();
        },
        handleCanvasClick: function (e) {
            if (this.isCloningFilling()) {
                this.cloneSashDismiss();
                e.preventDefault();
            }
        },
        handleCanvasKeyDown: function (e) {
            if (e.key === 'Escape' && this.isCloningFilling()) {
                this.cloneSashDismiss();
            }

            if (this.module && !this.state.inputFocused) {
                this.module.handleKeyEvents(e);
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
            this.setGlobalInsideView(!this.isInsideView());

            this.setState({
                insideView: this.isInsideView(),
                openingView: this.isOpeningView()
            });

            this.module.setState({
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
        handleSashCloneClick: function () {
            if (this.state.selectedSashId) {
                this.cloneSashStart(this.state.selectedSashId);
            }
            // Continues at this.bindModuleEvents()
        },
        handleFillingTypeChange: function () {
            var filling_type;

            if ( app.settings ) {
                filling_type = app.settings.filling_types.getById(this.ui.$filling_select.val());
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
        handleCircularClick: function () {
            if (!this.state.selectedSashId) {
                console.warn('no sash selected');
                return;
            }

            this.model.toggleCircular( this.state.selectedSashId );
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
            this.module.deselectAll();
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
            this.changeIcons();

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

            this.module = new app.DrawingModule({
                model: this.model,
                stage: this.stage,
                layers: {},
                metricSize: this.metric_size
            });

            this.module.setState({
                insideView: this.isInsideView(),
                openingView: this.isOpeningView()
            });

            // To show debug info, just uncomment it:
            // this.module.set('debug', true);

            this.bindModuleEvents();
        },
        // Marrionente lifecycle method
        onBeforeDestroy: function () {
            this.stage.destroy();
            this.unbindModuleEvents();

            if ( this.glazing_view ) {
                this.glazing_view.destroy();
            }

            if ( this.module ) {
                this.module.destroy();
            }
        },

        // Change icons for american / european style
        changeIcons: function () {
            var tilt_turn_left = this.ui.$sash_types.filter('[data-type=tilt_turn_left]');
            var tilt_turn_right = this.ui.$sash_types.filter('[data-type=tilt_turn_right]');
            var tilt_only = this.ui.$sash_types.filter('[data-type=tilt_only]');

            function toAmerican( $el ) {
                $el.attr('src', $el.attr('src').replace('.png', '_american.png') );
            }

            function toEuropean( $el ) {
                $el.attr('src', $el.attr('src').replace('_american.png', '.png') );
            }

            if (this.state.hingeIndicatorMode === 'american') {
                toAmerican( tilt_turn_left );
                toAmerican( tilt_turn_right );
                toAmerican( tilt_only );
            } else {
                toEuropean( tilt_turn_left );
                toEuropean( tilt_turn_right );
                toEuropean( tilt_only );
            }

            return true;
        },

        bindModuleEvents: function () {
            this.listenTo(this.module, 'state:selected:mullion', function (data) {
                this.deselectAll();
                this.setState({
                    selectedMullionId: data.newValue
                });
            });
            this.listenTo(this.module, 'state:selected:sash', function (data) {
                var sourceSashId = data.oldValue;
                var targetSashId = data.newValue;
                if (!targetSashId || targetSashId === sourceSashId) { this.deselectAll(); return; }

                if (this.isCloningFilling()) {
                    this.cloneSashFinish(targetSashId);
                } else {
                    this.deselectAll();
                    this.setState({ selectedSashId: data.newValue });
                }
            });
            this.listenTo(this.module, 'labelClicked', function (data) {
                this.createInput(data.params, data.pos, data.size);
            });
            this.listenTo(this.module, 'mullionNumericInput', function (data) {
                this.createMullionInput(data.mullionId);
            });
        },
        unbindModuleEvents: function () {
            this.stopListening(this.module);
        },

        templateContext: function () {
            var available_filling_types = [];
            var profile_id = this.model.profile && this.model.profile.id;

            if ( app.settings && profile_id ) {
                available_filling_types = app.settings.filling_types.getAvailableForProfile(profile_id);
            }

            return {
                filling_types: _.map(available_filling_types, function (item) {
                    return {
                        cid: item.cid,
                        name: item.get('name'),
                        type: item.getBaseTypeTitle()
                    };
                })
            };
        },
        createGlazingPopup: function () {
            this.glazing_view = new app.DrawingGlazingPopup({
                model: this.model,
                parent: this
            });
        },

        createInput: function (params, pos, size) {
            var view = this;
            var module = this.module;
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
            var val = app.utils.format.dimension(valInInches, 'fraction');

            var containerPos = (container.css('position') === 'relative') ? {top: 0, left: 0} : container.position();

            function closeWrap() {
                if (view.setState) {
                    view.setState({
                        inputFocused: false
                    });
                }

                $wrap.remove();
            }

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
                .on('focus', function () {
                    if (view.state) {
                        view.state.inputFocused = true;
                    }
                })
                .focus()
                .select()
                .on('keyup', function (e) {
                    if (e.keyCode === 13) {  // enter
                        var _value = this.value;
                        var sign = 1;
                        var mm;

                        if (_value[0] === '-') {
                            sign = (params.canBeNegative) ? -1 : 1;
                            _value = _value.slice(1);
                        }

                        var splitHeightsRequested = _value.indexOf('|') !== -1;
                        var isVerticalWholeMetric = params.name === 'vertical_whole_metric';
                        var attr = (splitHeightsRequested && isVerticalWholeMetric) ? 'height' : 'width';
                        var inches = app.utils.parseFormat.dimensions(_value, attr);

                        mm = (_.isArray(inches)) ?
                               inches.map(function (value) { return app.utils.convert.inches_to_mm(value) * sign; })
                             : app.utils.convert.inches_to_mm(inches) * sign;

                        params.setter(mm, view);

                        closeWrap();
                    }

                    if (e.keyCode === 27) { // esc
                        closeWrap();
                    }
                })
                .on('blur', closeWrap);
        },
        createMullionInput: function (mullionId) {
            if (!mullionId) { return; }

            var self = this;
            var module = this.module;
            var model = this.model;
            var ratio = module.get('ratio');
            var style = module.getStyle('mullion_input');
            var isInside = this.isInsideView();
            var isOutside = !isInside;
            var unitLayer = module.getLayer('unit').layer;
            var mullion = model.getMullion(mullionId);
            var mullionRect = unitLayer.findOne('#mullion-' + mullionId).getClientRect();
            var mullionX = mullionRect.x * ratio + unitLayer.getClientRect().x;
            var mullionY = mullionRect.y * ratio + unitLayer.getClientRect().y;
            var mullionCenterX = mullionX + mullionRect.width * ratio / 2;
            var mullionCenterY = mullionY + mullionRect.height * ratio / 2;
            var inputX = mullionCenterX - style.width / 2;
            var inputY = mullionCenterY - style.height / 2;
            var isVertical = mullion.type === 'vertical' || mullion.type === 'vertical_invisible';
            var isHorizontal = mullion.type === 'horizontal' || mullion.type === 'horizontal_invisible';
            var container = $(module.get('stage').container());
            var containerPosition = (container.css('position') === 'relative') ? {top: 0, left: 0} : container.position();
            var $wrap = $('<div>')
                .addClass('popup-wrap')
                .appendTo(container)
                .on('click', function (e) {
                    if (e.target === $wrap.get(0)) { $wrap.remove(); }
                });
            var closeWrap = function () {
                if (self.setState) {
                    self.setState({ inputFocused: false });
                }
                $wrap.remove();
            };

            $('<input>')
                .css({
                    position: 'absolute',
                    top: (inputY - style.padding + containerPosition.top) + 'px',
                    left: (inputX - style.padding + containerPosition.left) + 'px',
                    height: (style.height + style.padding * 2) + 'px',
                    width: (style.width + style.padding * 2) + 'px',
                    fontSize: style.fontSize + 'px'
                })
                .appendTo($wrap)
                .on('focus', function () {
                    if (self.state) {
                        self.state.inputFocused = true;
                    }
                })
                .focus()
                .select()
                .on('keydown', function (e) {
                    var input = e.target;
                    var attr = (isVertical) ? 'width' : 'height';
                    var newValue = app.utils.parseFormat.dimensions(this.value, attr);
                    var newValueMm = (_.isArray(newValue)) ?
                        newValue.map(function (value) { return app.utils.convert.inches_to_mm(value); }) :
                        app.utils.convert.inches_to_mm(newValue);
                    var isKeyUp = e.key === 'ArrowUp' || e.key === 'w';
                    var isKeyRight = e.key === 'ArrowRight' || e.key === 'd';
                    var isKeyDown = e.key === 'ArrowDown' || e.key === 's';
                    var isKeyLeft = e.key === 'ArrowLeft' || e.key === 'a';
                    var isKeyEscape = e.key === 'Escape';
                    var isKeyEnter = e.key === 'Enter';

                    // Cancel
                    if (isKeyEscape) {
                        closeWrap();

                    // Set first subsection dimension
                    } else if (isVertical && isInside && isKeyLeft ||
                               isVertical && isOutside && isKeyRight ||
                               isVertical && isInside && isKeyEnter ||
                               isHorizontal && isKeyUp ||
                               isHorizontal && isKeyEnter) {
                        model.setSectionMullionPosition(mullionId, newValueMm);
                        closeWrap();

                    // Set second subsection dimension
                    } else if (isVertical && isInside && isKeyRight ||
                               isVertical && isOutside && isKeyLeft ||
                               isVertical && isOutside && isKeyEnter ||
                               isHorizontal && isKeyDown) {
                        var containerDimension = (isVertical) ? model.getSizes().frame.width :
                                                                model.getSizes().frame.height;
                        model.setSectionMullionPosition(mullionId, containerDimension - newValueMm);
                        closeWrap();

                    // Move cursor left
                    } else if (isVertical && isKeyUp ||
                               isHorizontal && isKeyLeft) {
                        input.selectionStart = input.selectionEnd -= 1;
                        e.preventDefault();

                    // Move cursor right
                    } else if (isVertical && isKeyDown ||
                               isHorizontal && isKeyRight) {
                        input.selectionStart = input.selectionEnd += 1;
                        e.preventDefault();
                    }
                })
                .on('blur', closeWrap);
        },

        updateUI: function () {
            // here we have to hide and should some elements in toolbar
            var buttonText = this.isInsideView() ? 'Show outside view' : 'Show inside view';
            var titleText = this.isInsideView() ? 'Inside view' : 'Outside view';

            this.$('#change-view-button').text(buttonText);
            this.ui.$title.text(titleText);

            var selectedSashId = this.state.selectedSashId;
            var selectedSash = this.model.getSection(selectedSashId);
            var hasFrame = selectedSash && selectedSash.sashType !== 'fixed_in_frame';
            var isArched = selectedSash && selectedSash.arched;
            var isCircular = selectedSash && selectedSash.circular;

            if (this.isCloningFilling()) {
                document.body.style.cursor = 'copy';
            } else {
                document.body.style.cursor = 'auto';
            }

            this.ui.$bars_control.toggle(
                !isArched &&
                selectedSash &&
                selectedSash.fillingType === 'glass'
            );

            this.ui.$section_control.toggle(!!selectedSash);

            this.$('.sash-types').toggle(
                !isArched &&
                selectedSash &&
                this.model.canAddSashToSection(selectedSashId)
            );

            this.$('.split').toggle(
                !isArched
            );

            var selectedFillingType = selectedSash && selectedSash.fillingName &&
                app.settings && app.settings.filling_types.getByName(selectedSash.fillingName);

            if ( selectedFillingType ) {
                this.ui.$filling_select.val(selectedFillingType.cid);
            } else {
                this.ui.$filling_select.val('');
            }

            this.ui.$filling_select.selectpicker('render');

            // Toggle arched controls
            this.$('.toggle-arched').toggle(
                selectedSash &&
                this.model.isArchedPossible(selectedSashId)
            );
            this.$('.remove-arched').toggle(!!isArched && !isCircular);
            this.$('.add-arched').toggle(!isArched && !isCircular);

            // Toggle circular controls
            this.$('.toggle-circular').toggle(
                selectedSash &&
                this.model.isCircularPossible(selectedSashId)
            );
            this.$('.remove-circular').toggle(!!isCircular && !isArched);
            this.$('.add-circular').toggle(!isCircular && !isArched);

            // Undo/Redo: Register buttons once!
            if ( !this.undo_manager.registered ) {
                this.undo_manager.registerButton('undo', this.ui.$undo);
                this.undo_manager.registerButton('redo', this.ui.$redo);
                this.undo_manager.registered = true;
            }

            // Additional overlay metrics
            if ( selectedSash ) {
                this.ui.$metrics_glass_input.prop('checked', selectedSash.measurements.glass );
                this.ui.$metrics_opening_input.prop('checked', selectedSash.measurements.opening );
                this.ui.$metrics_glass.toggle(selectedSash.sections.length === 0);
                this.ui.$metrics_opening.toggle(hasFrame);
                this.ui.$metrics.toggle(
                    this.ui.$metrics_glass.is('[style!="display: none;"]') ||
                    this.ui.$metrics_opening.is('[style!="display: none;"]')
                );
            }
        },

        updateSize: function (width, height) {
            this.stage.width(width || this.$('#drawing').get(0).offsetWidth);
            this.stage.height(height || this.$('#drawing').get(0).offsetHeight);
        },

        updateRenderedScene: function () {
            this.updateUI();
            this.updateSize();
            this.$('#drawing').focus();
        },
        updateSection: function (sectionId, type) {
            var view = this;
            var section = this.model.getSection(sectionId);

            type = type || section.divider;

            if (type === 'both') {
                view.updateSection( sectionId, 'vertical');
                view.updateSection( sectionId, 'horizontal');
            }

            // If section has children — update them recursively
            if ( section.sections && section.sections.length ) {
                section.sections.forEach(function (child) {
                    view.updateSection( child.id, type );
                });
            }
        },

        setState: function (state) {
            this.state = _.assign(this.state, state);
            this.updateUI();
            this.$('#drawing').focus();
            this.trigger('onSetState');
        },
        deselectAll: function () {
            this.setState({
                selectedMullionId: null,
                selectedSashId: null
            });
        },
        cloneSashStart: function (sourceSashId) {
            var selectedSash = this.model.getSection(this.state.selectedSashId);
            if (!selectedSash) { return; }

            this.setState({
                cloneSashSource: {
                    bars: selectedSash.bars,
                    sashType: selectedSash.sashType,
                    fillingType: selectedSash.fillingType,
                    fillingName: selectedSash.fillingName
                }
            });
        },
        cloneSashFinish: function (targetSashId) {
            if (!targetSashId || !this.isCloningFilling()) { return; }
            var bars = this.state.cloneSashSource.bars;
            var sashType = this.state.cloneSashSource.sashType;
            var fillingType = this.state.cloneSashSource.fillingType;
            var fillingName = this.state.cloneSashSource.fillingName;

            if (bars) {
                this.model.setSectionBars(targetSashId, bars);
            }
            if (sashType) {
                this.model.setSectionSashType(targetSashId, sashType);
            }
            if (fillingType && fillingName) {
                this.model.setFillingType(targetSashId, fillingType, fillingName);
            }

            this.cloneSashDismiss();
        },
        cloneSashDismiss: function () {
            this.deselectAll();
            this.module.deselectAll();
            this.setState({ cloneSashSource: null });
        },
        isCloningFilling: function () {
            return !!this.state.cloneSashSource;
        }
    });
})();
