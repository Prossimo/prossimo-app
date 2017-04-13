import $ from 'jquery';
import _ from 'underscore';
import Marionette from 'backbone.marionette';
import Konva from '../module/konva-clip-patch';

import App from '../../../main';
import { parseFormat, format, convert } from '../../../utils';
import UndoManager from '../../../utils/undomanager';
import DrawingModule from '../module/drawing-module';
import DrawingGlazingPopup from './drawing-glazing-view';
import template from '../templates/drawing-view.hbs';

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

export default Marionette.View.extend({
    tagName: 'div',
    template,
    initialize(opts) {
        const project_settings = App.settings.getProjectSettings();

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
            inputFocused: false,
        };

        this.groups = {};

        this.undo_manager = new UndoManager({
            register: this.model,
            track: true,
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
        $metrics_opening_input: '#additional-metrics-opening',
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
        'change @ui.$metrics_glass_input': 'handleAdditionalMetricsChange',
        'change @ui.$metrics_opening_input': 'handleAdditionalMetricsChange',
    },
    keyShortcuts: {
        'ctrl+z': 'handleUndoClick',
        'command+z': 'handleUndoClick',
        'ctrl+shift+z': 'handleRedoClick',
        'command+shift+z': 'handleRedoClick',
        'ctrl+y': 'handleRedoClick',
        'command+y': 'handleRedoClick',
    },
    setGlobalInsideView(value) {
        this.options.parent_view.setGlobalInsideView(value);
    },
    isInsideView() {
        return this.options.parent_view.getGlobalInsideView();
    },
    // Are we looking at unit from the opening side?
    isOpeningView() {
        return (!this.isInsideView() && this.model.isOpeningDirectionOutward()) ||
            (this.isInsideView() && !this.model.isOpeningDirectionOutward());
    },
    handleUndoClick() {
        return this.undo_manager.handler.undo();
    },
    handleRedoClick() {
        return this.undo_manager.handler.redo();
    },
    handleCanvasKeyDown(e) {
        if (this.module && !this.state.inputFocused) {
            this.module.handleKeyEvents(e);
        }
    },
    handleAdditionalMetricsChange(evt) {
        if (!this.state.selectedSashId) {
            return;
        }

        const type = (evt.target.id === 'additional-metrics-glass') ? 'glass' : 'opening';
        const reversedType = (type === 'glass') ? 'opening' : 'glass';
        const value = (evt.target.checked);
        const section = this.model.getSection(this.state.selectedSashId);
        const measurements = section.measurements;

        measurements[type] = value;

        if (value) {
            measurements[reversedType] = false;
        }

        this.model.setSectionMeasurements(this.state.selectedSashId, measurements);
    },
    handleChangeView() {
        this.setGlobalInsideView(!this.isInsideView());

        this.setState({
            insideView: this.isInsideView(),
            openingView: this.isOpeningView(),
        });

        this.module.setState({
            insideView: this.isInsideView(),
            openingView: this.isOpeningView(),
        });
    },
    handleGlazingBarsPopupClick() {
        if (!this.glazing_view) {
            this.createGlazingPopup();
        }

        this.glazing_view
            .setSection(this.state.selectedSashId)
            .showModal();
    },
    handleFillingTypeChange() {
        let filling_type;

        if (App.settings) {
            filling_type = App.settings.filling_types.getById(this.ui.$filling_select.val());
            this.model.setFillingType(this.state.selectedSashId,
                filling_type.get('type'), filling_type.get('name'));
        }
    },
    handleArchedClick() {
        if (!this.state.selectedSashId) {
            console.warn('no sash selected');
            return;
        }

        this.model._updateSection(this.state.selectedSashId, (section) => {
            section.arched = !section.arched;

            if (this.model.isRootSection(section.id)) {
                const width = this.model.getInMetric('width', 'mm');
                const height = this.model.getInMetric('height', 'mm');

                section.archPosition = Math.min(width / 2, height);
            }
        });
    },
    handleCircularClick() {
        if (!this.state.selectedSashId) {
            console.warn('no sash selected');
            return;
        }

        this.model.toggleCircular(this.state.selectedSashId);
    },
    handleClearFrameClick() {
        this.deselectAll();
        this.model.clearFrame();
    },
    handleSplitSectionClick(e) {
        this.$('.popup-wrap').hide();
        const divider = $(e.target).data('type');

        this.model.splitSection(this.state.selectedSashId, divider);
        this.deselectAll();
        this.module.deselectAll();
    },
    handleChangeSashTypeClick(e) {
        this.$('.popup-wrap').hide();
        let type = $(e.target).data('type');

        // if Unit is Outward opening, reverse sash type
        // from right to left or from left to right
        if (
            (this.state.hingeIndicatorMode === 'european' && !this.state.openingView) ||
            (this.state.hingeIndicatorMode === 'american' && this.state.openingView)
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
    handleObjectClick(id, e) {
        // select on left click only
        if (e.evt.button !== 0) {
            return;
        }

        this.deselectAll();
        this.setState({
            selectedSashId: id,
        });
    },

    // Marrionente lifecycle method
    onRender() {
        this.changeIcons();

        this.stage = new Konva.Stage({
            container: this.$('#drawing').get(0),
        });

        this.layer = new Konva.Layer();

        this.stage.add(this.layer);

        this.ui.$filling_select.selectpicker({
            style: 'btn-xs',
            showSubtext: true,
            size: 10,
        });

        this.module = new DrawingModule({
            model: this.model,
            stage: this.stage,
            layers: {},
            metricSize: this.metric_size,
        });

        this.module.setState({
            insideView: this.isInsideView(),
            openingView: this.isOpeningView(),
        });

        // To show debug info, just uncomment it:
        // this.module.set('debug', true);

        this.bindModuleEvents();
    },
    // Marrionente lifecycle method
    onBeforeDestroy() {
        this.stage.destroy();
        this.unbindModuleEvents();

        if (this.glazing_view) {
            this.glazing_view.destroy();
        }

        if (this.module) {
            this.module.destroy();
        }
    },

    // Change icons for american / european style
    changeIcons() {
        const tilt_turn_left = this.ui.$sash_types.filter('[data-type=tilt_turn_left]');
        const tilt_turn_right = this.ui.$sash_types.filter('[data-type=tilt_turn_right]');
        const tilt_only = this.ui.$sash_types.filter('[data-type=tilt_only]');

        function toAmerican($el) {
            $el.attr('src', $el.attr('src').replace('.png', '_american.png'));
        }

        function toEuropean($el) {
            $el.attr('src', $el.attr('src').replace('_american.png', '.png'));
        }

        if (this.state.hingeIndicatorMode === 'american') {
            toAmerican(tilt_turn_left);
            toAmerican(tilt_turn_right);
            toAmerican(tilt_only);
        } else {
            toEuropean(tilt_turn_left);
            toEuropean(tilt_turn_right);
            toEuropean(tilt_only);
        }

        return true;
    },

    bindModuleEvents() {
        this.listenTo(this.module, 'state:selected:mullion', function (data) {
            this.deselectAll();
            this.setState({
                selectedMullionId: data.newValue,
            });
        });
        this.listenTo(this.module, 'state:selected:sash', function (data) {
            this.deselectAll();
            this.setState({
                selectedSashId: data.newValue,
            });
        });
        this.listenTo(this.module, 'labelClicked', function (data) {
            this.createInput(data.params, data.pos, data.size);
        });
        this.listenTo(this.module, 'mullionNumericInput', function (data) {
            this.createMullionInput(data.mullionId);
        });
    },
    unbindModuleEvents() {
        this.stopListening(this.module);
    },

    templateContext() {
        let available_filling_types = [];
        const profile_id = this.model.profile && this.model.profile.id;

        if (App.settings && profile_id) {
            available_filling_types = App.settings.filling_types.getAvailableForProfile(profile_id);
        }

        return {
            filling_types: _.map(available_filling_types, item => ({
                cid: item.cid,
                name: item.get('name'),
                type: item.getBaseTypeTitle(),
            })),
        };
    },
    createGlazingPopup() {
        this.glazing_view = new DrawingGlazingPopup({
            model: this.model,
            parent: this,
        });
    },

    createInput(params, pos, size) {
        const view = this;
        const module = this.module;
        const container = $(module.get('stage').container());
        const $wrap = $('<div>')
            .addClass('popup-wrap')
            .appendTo(container)
            .on('click', (e) => {
                if (e.target === $wrap.get(0)) {
                    $wrap.remove();
                }
            });

        const padding = 3;
        const valInInches = convert.mm_to_inches(params.getter());
        const val = format.dimension(valInInches, 'fraction');

        const containerPos = (container.css('position') === 'relative') ? { top: 0, left: 0 } : container.position();

        function closeWrap() {
            if (view.setState) {
                view.setState({
                    inputFocused: false,
                });
            }

            $wrap.remove();
        }

        $('<input>')
            .val(val)
            .css({
                position: 'absolute',
                top: `${pos.y - (padding + containerPos.top)}px`,
                left: `${pos.x - (padding + containerPos.left)}px`,
                height: `${size.height + (padding * 2)}px`,
                width: `${size.width + 20 + (padding * 2)}px`,
                fontSize: '12px',
            })
            .appendTo($wrap)
            .on('focus', () => {
                if (view.state) {
                    view.state.inputFocused = true;
                }
            })
            .focus()
            .select()
            .on('keyup', function (e) {
                if (e.keyCode === 13) {  // enter
                    let _value = this.value;
                    let sign = 1;

                    if (_value[0] === '-') {
                        sign = (params.canBeNegative) ? -1 : 1;
                        _value = _value.slice(1);
                    }

                    const splitHeightsRequested = _value.indexOf('|') !== -1;
                    const isVerticalWholeMetric = params.name === 'vertical_whole_metric';
                    const attr = (splitHeightsRequested && isVerticalWholeMetric) ? 'height' : 'width';
                    const inches = parseFormat.dimensions(_value, attr);

                    const mm = _.isArray(inches) ?
                        inches.map(value => convert.inches_to_mm(value) * sign) :
                        convert.inches_to_mm(inches) * sign;

                    params.setter(mm, view);

                    closeWrap();
                }

                if (e.keyCode === 27) { // esc
                    closeWrap();
                }
            })
            .on('blur', closeWrap);
    },
    createMullionInput(mullionId) {
        if (!mullionId) {
            return;
        }

        const self = this;
        const module = this.module;
        const model = this.model;
        const ratio = module.get('ratio');
        const style = module.getStyle('mullion_input');
        const isInside = this.isInsideView();
        const isOutside = !isInside;
        const unitLayer = module.getLayer('unit').layer;
        const mullion = model.getMullion(mullionId);
        const mullionRect = unitLayer.findOne(`#mullion-${mullionId}`).getClientRect();
        const mullionX = (mullionRect.x * ratio) + unitLayer.getClientRect().x;
        const mullionY = (mullionRect.y * ratio) + unitLayer.getClientRect().y;
        const mullionCenterX = mullionX + ((mullionRect.width * ratio) / 2);
        const mullionCenterY = mullionY + ((mullionRect.height * ratio) / 2);
        const inputX = mullionCenterX - (style.width / 2);
        const inputY = mullionCenterY - (style.height / 2);
        const isVertical = mullion.type === 'vertical' || mullion.type === 'vertical_invisible';
        const isHorizontal = mullion.type === 'horizontal' || mullion.type === 'horizontal_invisible';
        const container = $(module.get('stage').container());
        const containerPosition = (container.css('position') === 'relative') ? { top: 0, left: 0 } : container.position();
        const $wrap = $('<div>')
            .addClass('popup-wrap')
            .appendTo(container)
            .on('click', (e) => {
                if (e.target === $wrap.get(0)) {
                    $wrap.remove();
                }
            });
        const closeWrap = function () {
            if (self.setState) {
                self.setState({ inputFocused: false });
            }

            $wrap.remove();
        };

        $('<input>')
            .css({
                position: 'absolute',
                top: `${inputY - (style.padding + containerPosition.top)}px`,
                left: `${inputX - (style.padding + containerPosition.left)}px`,
                height: `${style.height + (style.padding * 2)}px`,
                width: `${style.width + (style.padding * 2)}px`,
                fontSize: `${style.fontSize}px`,
            })
            .appendTo($wrap)
            .on('focus', () => {
                if (self.state) {
                    self.state.inputFocused = true;
                }
            })
            .focus()
            .select()
            .on('keydown', function (e) {
                const input = e.target;
                const attr = (isVertical) ? 'width' : 'height';
                const newValue = parseFormat.dimensions(this.value, attr);
                const newValueMm = _.isArray(newValue) ?
                    newValue.map(value => convert.inches_to_mm(value)) :
                    convert.inches_to_mm(newValue);
                const isKeyUp = e.key === 'ArrowUp' || e.key === 'w';
                const isKeyRight = e.key === 'ArrowRight' || e.key === 'd';
                const isKeyDown = e.key === 'ArrowDown' || e.key === 's';
                const isKeyLeft = e.key === 'ArrowLeft' || e.key === 'a';
                const isKeyEscape = e.key === 'Escape';
                const isKeyEnter = e.key === 'Enter';

                // Cancel
                if (isKeyEscape) {
                    closeWrap();
                // Set first subsection dimension
                } else if (
                    (isVertical && isInside && isKeyLeft) ||
                    (isVertical && isOutside && isKeyRight) ||
                    (isVertical && isInside && isKeyEnter) ||
                    (isHorizontal && isKeyUp) ||
                    (isHorizontal && isKeyEnter)
                ) {
                    model.setSectionMullionPosition(mullionId, newValueMm);
                    closeWrap();
                // Set second subsection dimension
                } else if (
                    (isVertical && isInside && isKeyRight) ||
                    (isVertical && isOutside && isKeyLeft) ||
                    (isVertical && isOutside && isKeyEnter) ||
                    (isHorizontal && isKeyDown)
                ) {
                    const containerDimension = isVertical ?
                        model.getSizes().frame.width :
                        model.getSizes().frame.height;

                    model.setSectionMullionPosition(mullionId, containerDimension - newValueMm);
                    closeWrap();
                // Move cursor left
                } else if (
                    (isVertical && isKeyUp) ||
                    (isHorizontal && isKeyLeft)
                ) {
                    input.selectionStart -= 1;
                    input.selectionEnd -= 1;
                    e.preventDefault();
                // Move cursor right
                } else if (
                    (isVertical && isKeyDown) ||
                    (isHorizontal && isKeyRight)
                ) {
                    input.selectionStart += 1;
                    input.selectionEnd += 1;
                    e.preventDefault();
                }
            })
            .on('blur', closeWrap);
    },
    updateUI() {
        // here we have to hide and should some elements in toolbar
        const buttonText = this.isInsideView() ? 'Show outside view' : 'Show inside view';
        const titleText = this.isInsideView() ? 'Inside view' : 'Outside view';

        this.$('#change-view-button').text(buttonText);
        this.ui.$title.text(titleText);

        const selectedSashId = this.state.selectedSashId;
        const selectedSash = this.model.getSection(selectedSashId);
        const hasFrame = selectedSash && selectedSash.sashType !== 'fixed_in_frame';
        const isArched = selectedSash && selectedSash.arched;
        const isCircular = selectedSash && selectedSash.circular;

        this.ui.$bars_control.toggle(
            !isArched &&
            selectedSash &&
            selectedSash.fillingType === 'glass',
        );

        this.ui.$section_control.toggle(!!selectedSash);

        this.$('.sash-types').toggle(
            !isArched &&
            selectedSash &&
            this.model.canAddSashToSection(selectedSashId),
        );

        this.$('.split').toggle(
            !isArched,
        );

        const selectedFillingType = selectedSash && selectedSash.fillingName &&
            App.settings && App.settings.filling_types.getByName(selectedSash.fillingName);

        if (selectedFillingType) {
            this.ui.$filling_select.val(selectedFillingType.cid);
        } else {
            this.ui.$filling_select.val('');
        }

        this.ui.$filling_select.selectpicker('render');

        // Toggle arched controls
        this.$('.toggle-arched').toggle(
            selectedSash &&
            this.model.isArchedPossible(selectedSashId),
        );
        this.$('.remove-arched').toggle(!!isArched && !isCircular);
        this.$('.add-arched').toggle(!isArched && !isCircular);

        // Toggle circular controls
        this.$('.toggle-circular').toggle(
            selectedSash &&
            this.model.isCircularPossible(selectedSashId),
        );
        this.$('.remove-circular').toggle(!!isCircular && !isArched);
        this.$('.add-circular').toggle(!isCircular && !isArched);

        // Undo/Redo: Register buttons once!
        if (!this.undo_manager.registered) {
            this.undo_manager.registerButton('undo', this.ui.$undo);
            this.undo_manager.registerButton('redo', this.ui.$redo);
            this.undo_manager.registered = true;
        }

        // Additional overlay metrics
        if (selectedSash) {
            this.ui.$metrics_glass_input.prop('checked', selectedSash.measurements.glass);
            this.ui.$metrics_opening_input.prop('checked', selectedSash.measurements.opening);
            this.ui.$metrics_glass.toggle(selectedSash.sections.length === 0);
            this.ui.$metrics_opening.toggle(hasFrame);
            this.ui.$metrics.toggle(
                this.ui.$metrics_glass.is('[style!="display: none;"]') ||
                this.ui.$metrics_opening.is('[style!="display: none;"]'),
            );
        }
    },

    updateSize(width, height) {
        this.stage.width(width || this.$('#drawing').get(0).offsetWidth);
        this.stage.height(height || this.$('#drawing').get(0).offsetHeight);
    },

    updateRenderedScene() {
        this.updateUI();
        this.updateSize();
        this.$('#drawing').focus();
    },
    updateSection(sectionId, type) {
        const view = this;
        const section = this.model.getSection(sectionId);

        type = type || section.divider;

        if (type === 'both') {
            view.updateSection(sectionId, 'vertical');
            view.updateSection(sectionId, 'horizontal');
        }

        // If section has children — update them recursively
        if (section.sections && section.sections.length) {
            section.sections.forEach((child) => {
                view.updateSection(child.id, type);
            });
        }
    },

    setState(state) {
        this.state = _.assign(this.state, state);
        this.updateUI();
        this.$('#drawing').focus();
        this.trigger('onSetState');
    },
    deselectAll() {
        this.setState({
            selectedMullionId: null,
            selectedSashId: null,
        });
    },
});
