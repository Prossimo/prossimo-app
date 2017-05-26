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

const HELP_SQUARES_KEYPRESS_DELAY = 800;

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
        $drawing_area: '#drawing-area',
        $popup_wrap: '.popup-wrap',
        $flush_panels: '[data-type="flush-turn-right"], [data-type="flush-turn-left"]',
        $drawing_view_title: '#drawing-view-title',
        $drawing_controls: '#drawing-controls',
        $section_controls: '#section-controls',
        $sash_controls: '#sash-controls',
        $section_split_controls: '#section-split-controls',
        $bar_controls: '#bar-controls',
        $filling_type_controls: '#filling-type-controls',
        $arched_controls: '#arched-controls',
        $add_arched: '#add-arched',
        $remove_arched: '#remove-arched',
        $circular_controls: '#circular-controls',
        $add_circular: '#add-circular',
        $remove_circular: '#remove-circular',
        $filling_select: '#filling-select',
        $filling_tool_controls: '#filling-tool-controls',
        $filling_clone: '#filling-clone',
        $filling_sync: '#filling-sync',
        $clear_frame: '#clear-frame',
        $sash_types: '.change-sash-type',
        $metric_controls: '.metric-controls',
        $metrics_glass: '[for="additional-metrics-glass"]',
        $metrics_glass_input: '#additional-metrics-glass',
        $metrics_opening: '[for="additional-metrics-opening"]',
        $metrics_opening_input: '#additional-metrics-opening',
        $hovering_drawing_controls: '#hovering-drawing-controls',
        $hovering_section_controls: '#hovering-section-controls',
        $help_squares: '.help-squares',
        $shortcuts: '[data-key]',
        $undo: '#undo',
        $redo: '#redo',
        $multiunit_controls: '#multiunit-controls',
        $subunit_menu: '.drawing-controls .subunit.menu',
        $add_connector_buttons: '.drawing-controls .add-connector .button',
        $add_connector_enabled_buttons: '.drawing-controls .add-connector .button:not(.disabled)',
        $add_connector_top_button: '.drawing-controls .add-connector .top.button',
        $add_connector_right_button: '.drawing-controls .add-connector .right.button',
        $add_connector_bottom_button: '.drawing-controls .add-connector .bottom.button',
        $add_connector_left_button: '.drawing-controls .add-connector .left.button',
        $remove_subunit_button: '.drawing-controls .remove-subunit.button',
    },
    events: {
        // Click
        'click @ui.$drawing_area': 'handleCanvasClick',
        'contextmenu @ui.$drawing_area': 'handleCanvasClick',
        'click @ui.$hovering_section_controls': 'handleHoveringSectionControlsClickThrough',
        'click @ui.$hovering_section_controls .button': 'handleHoveringSectionControlsClick',  // Keep before button events
        'click .split-section': 'handleSplitSectionClick',
        'click @ui.$sash_types': 'handleChangeSashTypeClick',
        'click @ui.$clear_frame': 'handleClearFrameClick',
        'click #change-view-button': 'handleChangeView',
        'click @ui.$arched_controls': 'handleArchedClick',
        'click @ui.$circular_controls': 'handleCircularClick',
        'click #glazing-bars-popup': 'handleGlazingBarsPopupClick',
        'click @ui.$filling_clone': 'handleFillingCloneClick',
        'click @ui.$filling_sync': 'handleFillingSyncClick',
        'click @ui.$undo': 'handleUndoClick',
        'click @ui.$redo': 'handleRedoClick',
        'click @ui.$add_connector_enabled_buttons': 'handleAddConnectorClick',
        'click @ui.$remove_subunit_button': 'handleRemoveSubunitClick',
        // Tap
        'tap @ui.$hovering_section_controls': 'handleHoveringSectionControlsClickThrough',
        'tap @ui.$hovering_section_controls .button': 'handleHoveringSectionControlsClick',  // Keep before button events
        'tap .split-section': 'handleSplitSectionClick',
        'tap @ui.$sash_types': 'handleChangeSashTypeClick',
        'tap @ui.$clear_frame': 'handleClearFrameClick',
        'tap #change-view-button': 'handleChangeView',
        'tap @ui.$arched_controls': 'handleArchedClick',
        'tap @ui.$circular_controls': 'handleCircularClick',
        'tap #glazing-bars-popup': 'handleGlazingBarsPopupClick',
        'tap @ui.$filling_clone': 'handleFillingCloneClick',
        'tap @ui.$filling_sync': 'handleFillingSyncClick',
        'tap @ui.$undo': 'handleUndoClick',
        'tap @ui.$redo': 'handleRedoClick',
        'tap @ui.$add_connector_enabled_buttons': 'handleAddConnectorClick',
        'tap @ui.$remove_subunit_button': 'handleRemoveSubunitClick',
        // Others
        'keydown @ui.$drawing_area': 'handleCanvasKeyDown',
        'change #vertical-bars-number': 'handleBarNumberChange',
        'input #vertical-bars-number': 'handleBarNumberChange',
        'change #horizontal-bars-number': 'handleBarNumberChange',
        'input #horizontal-bars-number': 'handleBarNumberChange',
        'change #filling-select': 'handleFillingTypeChange',
        'change @ui.$metrics_glass_input': 'handleAdditionalMetricsChange',
        'change @ui.$metrics_opening_input': 'handleAdditionalMetricsChange',
        'mouseleave @ui.$hovering_section_controls': 'handleHoveringSectionControlsLeave',
    },
    keyShortcuts: {
        'ctrl+z': 'handleUndoClick',
        'command+z': 'handleUndoClick',
        'ctrl+shift+z': 'handleRedoClick',
        'command+shift+z': 'handleRedoClick',
        'ctrl+y': 'handleRedoClick',
        'command+y': 'handleRedoClick',
        'ctrl:keydown': 'handleHelpSquaresShow',
        'ctrl:keyup': 'handleHelpSquaresHide',
        'command:keydown': 'handleHelpSquaresShow',
        'command:keyup': 'handleHelpSquaresHide',
        'shift:keydown': 'handleHelpSquaresShow',
        'shift:keyup': 'handleHelpSquaresHide',
        'alt:keydown': 'handleHelpSquaresShow',
        'alt:keyup': 'handleHelpSquaresHide',
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
    handleCanvasClick(e) {
        if (this.module.isCloningFilling()) {
            this.module.cloneFillingDismiss();
            e.preventDefault();
        } else if (this.module.isSyncingFilling()) {
            this.module.syncFillingDismiss();
            e.preventDefault();
        }
        this.closeSectionHoverMenu();
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
    handleFillingCloneClick() {
        if (this.state.selectedSashId) {
            this.module.cloneFillingStart(this.state.selectedSashId);
        }
        // Continues at this.bindModuleEvents()
    },
    handleFillingSyncClick() {
        if (this.state.selectedSashId) {
            this.module.syncFillingStart(this.state.selectedSashId);
        }
        // Continues at this.bindModuleEvents()
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
        this.ui.$popup_wrap.hide();
        const divider = $(e.target).data('type');

        this.model.splitSection(this.state.selectedSashId, divider);

        this.deselectAll();
        this.module.deselectAll();
        this.closeSectionHoverMenu();
    },
    handleChangeSashTypeClick(e) {
        this.ui.$popup_wrap.hide();
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
        this.closeSectionHoverMenu();
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
    handleHoveringSectionControlsClick() {
        this.setState({ selectedSashId: this.module.getState('selected:sash') }, true);
    },
    handleHoveringSectionControlsClickThrough() {
        const selectedSashId = this.module.getState('selected:sash');
        this.closeSectionHoverMenu();
        this.module.setState('selected:sash', selectedSashId);
    },
    handleHoveringSectionControlsLeave() {
        this.closeSectionHoverMenu();
    },
    handleHelpSquaresShow() {
        const timeoutHandle = setTimeout(() => {
            this.ui.$help_squares.toggleClass('help-visible', true);
        }, HELP_SQUARES_KEYPRESS_DELAY);
        this.setState({ helpSquaresTimeoutHandle: timeoutHandle }, true);
    },
    handleHelpSquaresHide() {
        const handle = this.state.helpSquaresTimeoutHandle;
        if (handle) { clearTimeout(handle); }
        this.ui.$help_squares.toggleClass('help-visible', false);
    },
    handleAddConnectorClick(event) {
        const connectorSide = $(event.target).data().side;
        const relation = this.model.getRelation();
        let multiunit;
        let modelId;

        if (relation === 'subunit') {
            multiunit = this.model.getParentMultiunit();
            modelId = this.model.id;
        } else if (relation === 'loneunit') {
            multiunit = this.model.toMultiunit();
            multiunit.persist({}, {
                validate: true,
                parse: true,
            });
            modelId = this.model.id;
        } else if (relation === 'multiunit') {
            multiunit = this.model;
            modelId = this.module.getState('selected:subunit');
        }

        if (modelId && connectorSide) {
            multiunit.addConnector({
                connects: [modelId],
                side: connectorSide,
                success: () => {
                    this.options.parent_view.sidebar_view.render();
                    this.selectUnit(multiunit);
                },
            });
        }
    },
    handleRemoveSubunitClick() {
        let subunit;

        if (this.model.isSubunit()) {
            subunit = this.model;
        } else if (this.model.isMultiunit()) {
            subunit = this.model.getSubunitLinkedUnitById(this.module.getState('selected:subunit'));
        }

        if (!subunit) { return; }

        const multiunit = subunit.getParentMultiunit();

        if (multiunit && multiunit.isSubunitRemovable(subunit.id || subunit.cid)) {
            multiunit.removeSubunit(subunit);
            this.selectUnit(multiunit);
        }
    },
    onRender() {
        this.changeIcons();

        this.stage = new Konva.Stage({
            container: this.ui.$drawing_area.get(0),
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
        this.elementsToShortcuts(this.ui.$shortcuts);
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
            if (data.newValue) {
                this.module.disableDelayedHover();
            } else {
                this.module.enableDelayedHover();
            }
            this.deselectAll();
            this.setState({ selectedMullionId: data.newValue });
        });
        this.listenTo(this.module, 'state:selected:sash', function (data) {
            const sourceSashId = data.oldValue;
            const targetSashId = data.newValue;

            if (targetSashId) {
                this.module.disableDelayedHover();
            } else {
                this.module.enableDelayedHover();
            }

            if (!targetSashId || targetSashId === sourceSashId) { this.deselectAll(); return; }

            if (this.module.isCloningFilling()) {
                this.module.cloneFillingFinish(targetSashId);
            } else if (this.module.isSyncingFilling()) {
                this.module.syncFillingFinish(targetSashId);
            } else {
                this.deselectAll();
                this.setState({ selectedSashId: targetSashId });
            }
        });
        this.listenTo(this.module, 'state:selected:unit', function (data) {
            this.deselectAll();
            this.setState({
                isFrameSelected: data.newValue,
            });
        });
        this.listenTo(this.module, 'state:selected:subunit', function (data) {
            this.deselectAll();
            this.setState({
                selectedSubunitId: data.newValue,
            });
        });
        this.listenTo(this.module, 'labelClicked', function (data) {
            this.createInput(data.params, data.pos, data.size);
        });
        this.listenTo(this.module, 'mullionNumericInput', function (data) {
            this.createMullionInput(data.mullionId);
        });
        this.listenTo(this.module, 'state:cloneFillingSource state:syncFillingSource', function () {
            this.updateUI();
            this.$('#drawing').focus();
        });
        this.listenTo(this.module, 'state:sectionHoverMenuOpen', function (data) {
            const pointerPosition = this.stage.getPointerPosition();
            const x = pointerPosition && pointerPosition.x;
            const y = pointerPosition && pointerPosition.y;
            const doOpen = data.newValue;
            if (doOpen) {
                this.openSectionHoverMenu({ x, y });
            } else {
                this.closeSectionHoverMenu();
            }
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
        const $container = $(module.get('stage').container());
        const $wrap = $('<div>')
            .addClass('popup-wrap')
            .appendTo($container)
            .on('click', (e) => {
                if (e.target === $wrap.get(0)) {
                    $wrap.remove();
                }
            });

        const padding = 3;
        const valInInches = convert.mm_to_inches(params.getter());
        const val = format.dimension(valInInches, 'fraction');

        const containerPos = ($container.css('position') === 'relative') ? { top: 0, left: 0 } : $container.position();

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
                top: `${(pos.y - padding) + containerPos.top}px`,
                left: `${(pos.x - padding) + containerPos.left}px`,
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
        const $container = $(module.get('stage').container());
        const containerPosition = ($container.css('position') === 'relative') ? { top: 0, left: 0 } : $container.position();
        const $wrap = $('<div>')
            .addClass('popup-wrap')
            .appendTo($container)
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
                top: `${(inputY - style.padding) + containerPosition.top}px`,
                left: `${(inputX - style.padding) + containerPosition.left}px`,
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
    toggleSectionHoverMenu(newState, options) {
        const oldState = this.ui.$hovering_section_controls.hasClass('open');
        newState = (!_.isUndefined(newState)) ? newState : !oldState;
        if (newState === oldState) { return; }
        const x = options && options.x;
        const y = options && options.y;

        this.ui.$hovering_section_controls.toggleClass('open', newState);
        if (!_.isUndefined(x)) { this.ui.$hovering_section_controls.css('left', `${x}px`); }
        if (!_.isUndefined(y)) { this.ui.$hovering_section_controls.css('top', `${y}px`); }
        this.module.setState('sectionHoverMenuOpen', newState);
    },
    openSectionHoverMenu(options) {
        this.toggleSectionHoverMenu(true, options);
    },
    closeSectionHoverMenu() {
        this.toggleSectionHoverMenu(false);
    },
    // Here we hide or show various elements in toolbar
    updateUI() {
        const selectedSashId = this.state.selectedSashId;
        const selectedSash = (this.model.getSection) ? this.model.getSection(selectedSashId) : undefined;
        const isSashSelected = !!selectedSash;
        const isLeafSash = isSashSelected && selectedSash.sections.length === 0;
        const hasFrame = isSashSelected && selectedSash.sashType !== 'fixed_in_frame';
        const isMultiunit = this.model.isMultiunit();
        const isSubunit = this.model.isSubunit();
        const isSubunitSelected = !!(this.state.isFrameSelected || this.state.selectedSubunitId);
        const isArched = !!(isSashSelected && selectedSash.arched);
        const isCircular = !!(isSashSelected && selectedSash.circular);
        const selectedFillingType = isSashSelected && selectedSash.fillingName &&
            App.settings && App.settings.filling_types.getByName(selectedSash.fillingName);
        let isSubunitTopConnected;
        let isSubunitRightConnected;
        let isSubunitBottomConnected;
        let isSubunitLeftConnected;
        let isSubunitRemovable;

        // View title
        const buttonText = this.isInsideView() ? 'Show outside view' : 'Show inside view';
        const titleText = this.isInsideView() ? 'Inside view' : 'Outside view';

        this.$('#change-view-button').text(buttonText);
        this.ui.$drawing_view_title.text(titleText);

        if (isSubunitSelected) {
            let subunit;
            let multiunit;
            let subunitId;

            if (this.state.isFrameSelected) {
                subunit = this.model;
            } else if (this.state.selectedSubunitId) {
                subunit = this.model.getSubunitLinkedUnitById(this.state.selectedSubunitId);
            }

            if (subunit) {
                multiunit = subunit.getParentMultiunit();
                subunitId = subunit.id;
            }

            if (multiunit && subunitId) {
                isSubunitTopConnected = _.contains(multiunit.getConnectedSides(subunitId), 'top');
                isSubunitRightConnected = _.contains(multiunit.getConnectedSides(subunitId), 'right');
                isSubunitBottomConnected = _.contains(multiunit.getConnectedSides(subunitId), 'bottom');
                isSubunitLeftConnected = _.contains(multiunit.getConnectedSides(subunitId), 'left');
                isSubunitRemovable = multiunit.isSubunitRemovable(subunitId);
            }
        }

        // Mouse pointer
        if (this.module.isCloningFilling() || this.module.isSyncingFilling()) {
            document.body.style.cursor = 'copy';
        } else {
            document.body.style.cursor = 'auto';
        }

        //
        // Section controls
        //
        this.ui.$filling_tool_controls.toggle(isSashSelected && isLeafSash && !isSubunitSelected);
        this.ui.$bar_controls.toggle(!isArched && !isSubunitSelected && isSashSelected && selectedSash.fillingType === 'glass');
        this.ui.$section_controls.toggle(isSashSelected || isSubunitSelected);
        this.ui.$sash_controls.toggle(!isArched && !isSubunitSelected && isSashSelected && this.model.canAddSashToSection(selectedSashId));
        this.ui.$section_split_controls.toggle(isSashSelected && !isSubunitSelected && !isArched);

        if (selectedFillingType) {
            this.ui.$filling_select.val(selectedFillingType.cid);
        } else {
            this.ui.$filling_select.val('');
        }

        this.ui.$filling_select.selectpicker('render');

        this.ui.$filling_type_controls.toggle(isSashSelected && !isSubunitSelected);

        // Arched controls
        this.ui.$arched_controls.toggle(isSashSelected && !isSubunitSelected && this.model.isArchedPossible(selectedSashId));
        this.ui.$remove_arched.toggle(isArched && !isCircular && !isSubunitSelected);
        this.ui.$add_arched.toggle(!isArched && !isCircular && !isSubunitSelected);

        // Circular controls
        this.ui.$circular_controls.toggle(isSashSelected && !isSubunitSelected && this.model.isCircularPossible(selectedSashId));
        this.ui.$remove_circular.toggle(isCircular && !isArched && !isSubunitSelected);
        this.ui.$add_circular.toggle(!isCircular && !isArched && !isSubunitSelected);

        // Multiunit controls
        this.ui.$multiunit_controls.toggle(isSubunitSelected);
        this.ui.$subunit_menu.toggle((isSubunit || isMultiunit) && isSubunitSelected);

        // Enable if
        this.ui.$add_connector_top_button.toggleClass('disabled', !(!isSubunitTopConnected));
        this.ui.$add_connector_right_button.toggleClass('disabled', !(!isSubunitRightConnected));
        this.ui.$add_connector_bottom_button.toggleClass('disabled', !(!isSubunitBottomConnected));
        this.ui.$add_connector_left_button.toggleClass('disabled', !(!isSubunitLeftConnected));
        this.ui.$remove_subunit_button.toggleClass('disabled', !(isSubunitRemovable));

        // Undo, Redo buttons
        if (!this.undo_manager.registered) {
            // Register buttons once!
            this.undo_manager.registerButton('undo', this.ui.$undo);
            this.undo_manager.registerButton('redo', this.ui.$redo);
            this.undo_manager.registered = true;
        }

        // Clear frame button
        this.ui.$clear_frame.toggle(!isMultiunit);

        // Additional overlay metrics
        this.ui.$metric_controls.toggle(!isMultiunit && !isSubunitSelected);

        if (isSashSelected) {
            this.ui.$metrics_glass_input.prop('checked', selectedSash.measurements.glass);
            this.ui.$metrics_opening_input.prop('checked', selectedSash.measurements.opening);
            this.ui.$metrics_glass.toggle(selectedSash.sections.length === 0);
            this.ui.$metrics_opening.toggle(hasFrame);
            this.ui.$metric_controls.toggle(
                this.ui.$metrics_glass.is('[style!="display: none;"]') ||
                this.ui.$metrics_opening.is('[style!="display: none;"]'),
            );
        }
    },
    updateSize(width, height) {
        this.stage.width(width || this.ui.$drawing_area.get(0).offsetWidth);
        this.stage.height(height || this.ui.$drawing_area.get(0).offsetHeight);
    },
    updateRenderedScene() {
        this.updateUI();
        this.updateSize();
        this.ui.$drawing_area.focus();
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
    setState(state, preventUpdate) {
        this.state = _.assign(this.state, state);

        if (!preventUpdate) {
            this.updateRenderedScene();
            this.trigger('onSetState');
        }
    },
    deselectAll() {
        this.setState({
            selectedMullionId: null,
            selectedSashId: null,
        });
    },
    selectUnit(model) {
        this.options.parent_view.sidebar_view.selectUnit(model);
    },
    elementsToShortcuts(elements) {
        if (!elements) { return; }
        if (elements instanceof window.jQuery) { elements = elements.toArray(); }

        const keysToElementsTable = {};
        elements.forEach((element) => {
            const key = element.dataset.key;
            keysToElementsTable[key] = keysToElementsTable[key] || [];
            keysToElementsTable[key].push(element);
        });

        this.module.setState('keysToElementsTable', keysToElementsTable);
    },
});
