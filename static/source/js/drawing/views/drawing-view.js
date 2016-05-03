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

            this.groups = {};

            this.undoManager = new app.UndoManager({
                register: this.model,
                track: true
            });

            //  TODO: this is a hack, we'll need to have a more hight-level
            //  way to persist any models on undo / redo event
            this.listenTo(this.model, 'undo redo', function () {
                if ( !this.model.isNew() ) {
                    this.model.sync('update', this.model, {});
                }
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
            'click @ui.$undo': 'handleUndoClick',
            'click @ui.$redo': 'handleRedoClick',
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
        handleUndoClick: function () {
            return this.undoManager.handler.undo();
        },
        handleRedoClick: function () {
            return this.undoManager.handler.redo();
        },
        handleCanvasKeyDown: function (e) {
            e.preventDefault();

            if (this.module) {
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
            globalInsideView = !globalInsideView;

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
                metricSize: metricSize
            });

            this.bindModuleEvents();
        },

        // Marrionente lifecycle method
        onDestroy: function () {
            this.stage.destroy();
            this.unbindModuleEvents();

            if ( this.glazing_view ) {
                this.glazing_view.destroy();
            }

            delete this.module;
        },

        bindModuleEvents: function () {
            this.module.on('state:selected:mullion', function (data) {
                this.deselectAll();
                this.setState({
                    selectedMullionId: data.newValue
                });
            }.bind(this));
            this.module.on('state:selected:sash', function (data) {
                this.deselectAll();
                this.setState({
                    selectedSashId: data.newValue
                });
            }.bind(this));
        },
        unbindModuleEvents: function () {
            this.module.off('state:selected:mullion');
            this.module.off('state:selected:sash');
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
                model: this.model
            });
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

            this.$('.toggle-arched').toggle(
                selectedSash &&
                this.model.isArchedPossible(selectedSashId)
            );

            this.$('.remove-arched').toggle(!!isArched);
            this.$('.add-arched').toggle(!isArched);

            // Undo/Redo: Register buttons once!
            if (!this.undoManager.registered) {
                this.undoManager.registerButton('undo', this.ui.$undo);
                this.undoManager.registerButton('redo', this.ui.$redo);
                this.undoManager.registered = true;
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

        setState: function (state) {
            this.state = _.assign(this.state, state);
            this.updateUI();
            // this.updateCanvas();
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
