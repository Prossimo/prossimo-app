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

    app.DrawingView = Marionette.ItemView.extend({
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
            $metrics_glass: '#additional-metrics-glass',
            $metrics_opening: '#additional-metrics-opening'
        },
        events: {
            // Click
            'click .split-section': 'handleSplitSectionClick',
            'click @ui.$sash_types': 'handleChangeSashTypeClick',
            'click #clear-frame': 'handleClearFrameClick',
            'click #change-view-button': 'handleChangeView',
            'click .toggle-arched': 'handleArchedClick',
            'click .toggle-circular': 'handleCircularClick',
            'click #glazing-bars-popup': 'handleGlazingBarsPopupClick',
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
            'tap @ui.$undo': 'handleUndoClick',
            'tap @ui.$redo': 'handleRedoClick',
            // Others
            'keydown #drawing': 'handleCanvasKeyDown',
            'change #vertical-bars-number': 'handleBarNumberChange',
            'input #vertical-bars-number': 'handleBarNumberChange',
            'change #horizontal-bars-number': 'handleBarNumberChange',
            'input #horizontal-bars-number': 'handleBarNumberChange',
            'change #filling-select': 'handleFillingTypeChange',
            'change @ui.$metrics_glass': 'handleAdditionalMetricsChange',
            'change @ui.$metrics_opening': 'handleAdditionalMetricsChange'
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
        handleCanvasKeyDown: function (e) {
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
        onDestroy: function () {
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
                this.deselectAll();
                this.setState({
                    selectedSashId: data.newValue
                });
            });
            this.listenTo(this.module, 'labelClicked', function (data) {
                this.createInput( data.params, data.pos, data.size );
            });
        },
        unbindModuleEvents: function () {
            this.stopListening(this.module);
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

        updateUI: function () {
            // here we have to hide and should some elements in toolbar
            var buttonText = this.isInsideView() ? 'Show outside view' : 'Show inside view';
            var titleText = this.isInsideView() ? 'Inside view' : 'Outside view';

            this.$('#change-view-button').text(buttonText);
            this.ui.$title.text(titleText);

            var selectedSashId = this.state.selectedSashId;
            var selectedSash = this.model.getSection(selectedSashId);
            var isArched = selectedSash && selectedSash.arched;
            var isCircular = selectedSash && selectedSash.circular;

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
                app.settings && app.settings.getFillingTypeByName(selectedSash.fillingName);

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
        }
    });
})();
