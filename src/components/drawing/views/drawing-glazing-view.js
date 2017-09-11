import $ from 'jquery';
import _ from 'underscore';
import clone from 'clone';
import Marionette from 'backbone.marionette';
import Konva from '../builder/konva-clip-patch';

import DrawingBuilder from '../builder/drawing-builder';
import Drawers from '../builder/drawers';
import template from '../templates/drawing-glazing-view.hbs';

export default Marionette.View.extend({
    className: 'drawing-glazing-popup',
    template,
    ui: {
        $modal: '#glazingPopup',
        $body: '.modal-body',
        $drawing: '.modal-drawing',
        $bar_controls: '.glazing-bars-controls',
        $bar_vertical: '#vertical-bars-number',
        $bar_horizontal: '#horizontal-bars-number',
    },
    events: {
        'change @ui.$bar_vertical': 'handleVBarsNumberChange',
        'change @ui.$bar_horizontal': 'handleHBarsNumberChange',
    },
    initialize(opts) {
        $('body').append(this.render().el);

        this.parent = opts.parent || null;
        this.metric_size = 50;

        this.ui.$modal.modal({
            keyboard: false,
            show: false,
        });
    },
    handleVBarsNumberChange() {
        this.handleBarsNumberChange('vertical');
    },
    handleHBarsNumberChange() {
        this.handleBarsNumberChange('horizontal');
    },
    handleBarsNumberChange(type) {
        if (this.ui[`$bar_${type}`].val() < 0 || this.ui[`$bar_${type}`].val() > 100) {
            this.ui[`$bar_${type}`].val(0);
            this.showError();

            return;
        }

        this.section.bars = this.changeBarsNumber(type);
        this.saveBars();
    },
    onRender() {
        this.stage = new Konva.Stage({
            container: this.ui.$drawing.get(0),
        });

        this.updateSize(570, (window.innerHeight - 200));
    },
    onBeforeDestroy() {
        this.ui.$modal.remove();
        this.stage.destroy();

        if (this.builder) {
            this.builder.destroy();
            this.unbindBuilderEvents();
        }
    },

    bindBuilderEvents() {
        this.listenTo(this.builder, 'labelClicked', (data) => {
            this.parent.createInput.call(this, data.params, data.pos, data.size);
        });
    },
    unbindBuilderEvents() {
        this.stopListening(this.builder);
    },

    setSection(section_id) {
        this.section = this.model.getSection(section_id);

        this.ui.$bar_vertical.val(this.getBarsCount().vertical);
        this.ui.$bar_horizontal.val(this.getBarsCount().horizontal);

        if (this.builder) {
            this.builder.destroy();
            this.unbindBuilderEvents();

            this.stage.clear();
        }

        this.builder = new DrawingBuilder({
            model: this.model,
            stage: this.stage,
            layers: {
                unit: {
                    active: false,
                },
                metrics: {
                    active: false,
                },
                glazing: {
                    DrawerClass: Drawers.GlazingBarDrawer,
                    zIndex: 1,
                    data: {
                        sectionId: section_id,
                        saveBars: this.saveBars.bind(this),
                    },
                },
            },
            metricSize: this.metric_size,
        });

        this.bindBuilderEvents();

        return this;
    },
    showModal() {
        this.ui.$modal.modal('show');
        return this;
    },
    hideModal() {
        this.ui.$modal.modal('hide');
        return this;
    },
    getBarsCount() {
        return {
            horizontal: this.section.bars.horizontal.length,
            vertical: this.section.bars.vertical.length,
        };
    },
    showError() {
        const intShakes = 2;
        const intDistance = 40;
        const intDuration = 300;

        for (let x = 1; x <= intShakes; x += 1) {
            this.ui.$modal
                .animate({ left: (intDistance * -1) }, (intDuration / intShakes) / 4)
                .animate({ left: intDistance }, (intDuration / intShakes) / 2)
                .animate({ left: 0 }, (intDuration / intShakes) / 4);
        }
    },
    updateSize(width, height) {
        const current_width = width || this.ui.$drawing.get(0).offsetWidth;
        const current_height = height || this.ui.$drawing.get(0).offsetHeight;

        this.stage.width(current_width);
        this.stage.height(current_height);
    },
    changeBarsNumber(type) {
        let vertical = [];
        let horizontal = [];

        // section params
        // needed to calculate spaces between bars
        const section = {
            width: this.getSize().width,
            height: this.getSize().height,
            bars: this.section.bars,
        };

        if (type === 'vertical' || type === 'both') {
            const vertical_count = parseInt(this.ui.$bar_vertical.val(), 10);
            const vSpace = section.width / (vertical_count + 1);

            for (let i = 0; i < vertical_count; i += 1) {
                const vbar = {
                    id: _.uniqueId(),
                    position: vSpace * (i + 1),
                    links: [null, null],
                };

                vertical.push(vbar);
            }
        } else {
            vertical = this.section.bars.vertical;
        }

        if (type === 'horizontal' || type === 'both') {
            const horizontal_count = parseInt(this.ui.$bar_horizontal.val(), 10);
            const hSpace = section.height / (horizontal_count + 1);

            for (let j = 0; j < horizontal_count; j += 1) {
                const hbar = {
                    id: _.uniqueId(),
                    position: hSpace * (j + 1),
                    links: [null, null],
                };

                horizontal.push(hbar);
            }
        } else {
            horizontal = this.section.bars.horizontal;
        }

        const bars = {
            vertical,
            horizontal,
        };

        return bars;
    },
    getSize() {
        return {
            width: this.section.glassParams.width,
            height: this.section.glassParams.height,
        };
    },
    checkLinks(bars) {
        const current_bars = clone(bars);
        const view = this;
        let linked = null;

        _.each(current_bars, (arr, type) => {
            _.each(arr, (bar, index) => {
                _.each(bar.links, (link, edge) => {
                    if (link !== null) {
                        linked = view.model.getBar(view.section.id, link);

                        if (linked === null) {
                            current_bars[type][index].links[edge] = null;
                        }
                    }
                });
            });
        });

        return current_bars;
    },
    sortBars() {
        _.each(this.section.bars, (group) => {
            group.sort((a, b) => a.position > b.position);
        });
    },
    saveBars(newBars) {
        let bars = (newBars) || this.section.bars;

        bars = this.checkLinks(bars);
        this.model.setSectionBars(this.section.id, bars);
    },
});
