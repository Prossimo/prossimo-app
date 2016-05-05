var app = app || {};

(function () {
    'use strict';

    // global variables
    var metricSize = 50;

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
        initialize: function () {
            $('body').append( this.render().el );

            this.ui.$modal.modal({
                keyboard: false,
                show: false
            });

            this.on('updateSection', this.onUpdate, this);
        },
        handleVBarsNumberChange: function () {
            this.handleBarsNumberChange( 'vertical' );
        },
        handleHBarsNumberChange: function () {
            this.handleBarsNumberChange( 'horizontal' );
        },
        handleBarsNumberChange: function ( type ) {
            if ( this.ui['$bar_' + type].val() < 0 ) {
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

            this.module = new app.DrawingModule({
                model: this.model,
                stage: this.stage,
                layers: {
                    unit: {
                        // active: false
                        zIndex: 0
                    },
                    metrics: {
                        active: false
                    },
                    glazing: {
                        DrawerClass: app.Drawers.GlazingBarDrawer,
                        zIndex: 1
                    }
                },
                metricSize: metricSize
            });

            this.updateSize( 570, (window.innerHeight - 200) );
        },
        onDestroy: function () {
            this.ui.$modal.remove();
            this.stage.destroy();
        },
        setSection: function (section_id) {
            this.section = this.model.getSection(section_id);

            this.ui.$bar_vertical.val( this.getBarsCount().vertical );
            this.ui.$bar_horizontal.val( this.getBarsCount().horizontal );

            this.module.getLayer('glazing').drawer.setSection( section_id );

            this.trigger('updateSection');
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
                        position: vSpace * (i + 1)
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
                        position: hSpace * (j + 1)
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
        saveBars: function () {
            this.model.setSectionBars( this.section.id, this.section.bars );
        }
    });

})();
