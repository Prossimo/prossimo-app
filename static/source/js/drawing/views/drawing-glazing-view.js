var app = app || {};

(function () {
    'use strict';

    app.DrawingGlazingPopup = Marionette.ItemView.extend({
        className: 'drawing-glazing-popup',
        template: app.templates['drawing/drawing-glazing-view'],
        ui: {
            $modal: '#glazingPopup',
            $body: '.modal-body',
            $drawing: '.modal-drawing',
            $bar_controlls: '.glazing-bars-controlls',
            $bar_vertical: '#vertical-bars-number',
            $bar_horizontal: '#horizontal-bars-number'
        },
        events: {
            'change @ui.$bar_vertical': 'handleVBarsNumberChange',
            'change @ui.$bar_horizontal': 'handleHBarsNumberChange'
        },
        initialize: function (opts) {
            $('body').append( this.render().el );

            this.parent = opts.parent || null;
            this.metric_size = 50;

            this.ui.$modal.modal({
                keyboard: false,
                show: false
            });
        },
        handleVBarsNumberChange: function () {
            this.handleBarsNumberChange( 'vertical' );
        },
        handleHBarsNumberChange: function () {
            this.handleBarsNumberChange( 'horizontal' );
        },
        handleBarsNumberChange: function ( type ) {
            if ( this.ui['$bar_' + type].val() < 0 || this.ui['$bar_' + type].val() > 100 ) {
                this.ui['$bar_' + type].val(0);
                this.showError();

                return;
            }

            this.section.bars = this.changeBarsNumber( type );
            this.saveBars();
        },
        onRender: function () {
            this.stage = new Konva.Stage({
                container: this.ui.$drawing.get(0)
            });

            this.updateSize( 570, (window.innerHeight - 200) );
        },
        onDestroy: function () {
            this.ui.$modal.remove();
            this.stage.destroy();

            if ( this.module ) {
                this.module.destroy();
                this.unbindModuleEvents();
            }
        },

        bindModuleEvents: function () {
            this.listenTo(this.module, 'labelClicked', function (data) {
                this.parent.createInput.call(this, data.params, data.pos, data.size);
            });
        },
        unbindModuleEvents: function () {
            this.stopListening(this.module);
        },

        setSection: function (section_id) {
            this.section = this.model.getSection(section_id);

            this.ui.$bar_vertical.val( this.getBarsCount().vertical );
            this.ui.$bar_horizontal.val( this.getBarsCount().horizontal );

            if ( this.module ) {
                this.module.destroy();
                this.unbindModuleEvents();

                this.stage.clear();
            }

            this.module = new app.DrawingModule({
                model: this.model,
                stage: this.stage,
                layers: {
                    unit: {
                        active: false
                    },
                    metrics: {
                        active: false
                    },
                    glazing: {
                        DrawerClass: app.Drawers.GlazingBarDrawer,
                        zIndex: 1,
                        data: {
                            sectionId: section_id,
                            saveBars: this.saveBars.bind(this)
                        }
                    }
                },
                metricSize: this.metric_size
            });

            this.bindModuleEvents();

            return this;
        },
        showModal: function () {
            this.ui.$modal.modal('show');
            return this;
        },
        hideModal: function () {
            this.ui.$modal.modal('hide');
            return this;
        },
        getBarsCount: function () {
            return {
                horizontal: this.section.bars.horizontal.length,
                vertical: this.section.bars.vertical.length
            };
        },
        showError: function () {
            var intShakes = 2;
            var intDistance = 40;
            var intDuration = 300;

            for (var x = 1; x <= intShakes; x++) {
                this.ui.$modal
                    .animate({left: (intDistance * -1)}, (intDuration / intShakes) / 4)
                    .animate({left: intDistance}, (intDuration / intShakes) / 2)
                    .animate({left: 0}, (intDuration / intShakes) / 4);
            }
        },
        updateSize: function (width, height) {
            width = width || this.ui.$drawing.get(0).offsetWidth;
            height = height || this.ui.$drawing.get(0).offsetHeight;
            this.stage.width(width);
            this.stage.height(height);
        },
        changeBarsNumber: function ( type ) {
            var vertical = [];
            var horizontal = [];

            // section params
            // needed to calculate spaces between bars
            var section = {
                width: this.getSize().width,
                height: this.getSize().height,
                bars: this.section.bars
            };

            if ( type === 'vertical' || type === 'both' ) {
                var vertical_count = parseInt(this.ui.$bar_vertical.val());
                var vSpace = section.width / (vertical_count + 1);

                for (var i = 0; i < vertical_count; i++) {
                    var vbar = {
                        id: _.uniqueId(),
                        position: vSpace * (i + 1),
                        links: [null, null]
                    };

                    vertical.push(vbar);
                }

            } else {
                vertical = this.section.bars.vertical;
            }

            if ( type === 'horizontal' || type === 'both' ) {
                var horizontal_count = parseInt(this.ui.$bar_horizontal.val());
                var hSpace = section.height / (horizontal_count + 1);

                for (var j = 0; j < horizontal_count; j++) {
                    var hbar = {
                        id: _.uniqueId(),
                        position: hSpace * (j + 1),
                        links: [null, null]
                    };

                    horizontal.push(hbar);
                }
            } else {
                horizontal = this.section.bars.horizontal;
            }

            var bars = {
                vertical: vertical,
                horizontal: horizontal
            };

            return bars;
        },
        getSize: function () {
            return {
                width: this.section.glassParams.width,
                height: this.section.glassParams.height
            };
        },
        /* eslint-disable max-nested-callbacks */
        checkLinks: function (bars) {
            var view = this;
            var linked = null;

            _.each(bars, function (arr, type) {
                _.each(arr, function (bar, index) {
                    _.each(bar.links, function (link, edge) {
                        if (link !== null) {
                            linked = view.model.getBar(view.section.id, link);

                            if (linked === null) {
                                bars[type][index].links[edge] = null;
                            }
                        }
                    });
                });
            });

            return bars;
        },
        /* eslint-enable max-nested-callbacks */
        sortBars: function () {
            _.each(this.section.bars, function ( group ) {
                group.sort(function ( a, b ) {
                    return a.position > b.position;
                });
            });
        },
        saveBars: function (newBars) {
            var bars = (newBars) ? newBars : this.section.bars;

            bars = this.checkLinks( bars );
            this.model.setSectionBars( this.section.id, bars );
        }
    });

})();
