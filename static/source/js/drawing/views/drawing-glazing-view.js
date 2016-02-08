var app = app || {};

(function () {
    'use strict';

    // global variables
    var metricSize = 50;
    var minimalGap = 10; // minimal gap between bars

    app.DrawingGlazingPopup = Marionette.ItemView.extend({
        className: 'drawing-glazing-popup',
        template: app.templates['drawing/drawing-glazing-view'],
        initialize: function () {
            $('body').append( this.render().el );

            this.on('updateSection', this.onUpdate, this);
        },
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
        handleVBarsNumberChange: function () {
            this.handleBarsNumberChange( 'vertical' );
        },
        handleHBarsNumberChange: function () {
            this.handleBarsNumberChange( 'horizontal' );
        },
        handleBarsNumberChange: function ( type ) {
            if ( this.ui['$bar_' + type].val() < 0 ) {
                this.ui['$bar_' + type].val(0);
                return;
            }

            this.section.bars = this.changeBarsNumber( type );
            this.saveBars();
        },
        onRender: function () {
            this.stage = new Konva.Stage({
                container: this.ui.$drawing.get(0)
            });
            var stageSize = [570, window.innerHeight - 200];

            this.callDrawer('updateSize', stageSize);

            this.layer = new Konva.Layer();
            this.stage.add(this.layer);
        },
        onUpdate: function () {
            this.updateCanvas();
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

            var section = new Konva.Group();

            section.add( this.createSection() );
            this.layer.add( section );

            section.setAbsolutePosition({
                x: (this.stage.width() / 2) - (this.getSize().width * this.ratio / 2) - metricSize,
                y: 0
            });

            this.layer.draw();
        },
        createSection: function () {
            // we will add 0.5 pixel offset for better strokes
            var topOffset = 10 + 0.5;
            var group = new Konva.Group({
                x: 20,
                y: 20
            });

            var fillWidth = this.getSize().width;
            var fillHeight = this.getSize().height;

            // calculate ratio
            var wr = (this.stage.width() - metricSize) / fillWidth;
            var hr = (this.stage.height() - metricSize - topOffset) / fillHeight;
            var ratio = Math.min(wr, hr) * 0.95;

            // zero position for children graphics
            var zeroPos = {
                x: (0 + metricSize) / ratio,
                y: 0
            };

            this.ratio = ratio;

            // creating graphics
            var frameGroup = this.createGlass({
                x: zeroPos.x,
                y: zeroPos.y,
                width: fillWidth,
                height: fillHeight
            });
            var bars = this.createBars({
                x: zeroPos.x,
                y: zeroPos.y,
                width: fillWidth,
                height: fillHeight
            });
            var metrics = this.createMetrics({
                metricSize: metricSize,
                width: fillWidth,
                height: fillHeight
            });

            // scale with ratio
            frameGroup.scale({x: ratio, y: ratio});
            bars.scale({x: ratio, y: ratio});

            // adding to group
            group.add( frameGroup );
            group.add( bars );

            group.add( metrics );

            return group;
        },
        createGlass: function ( params ) {
            var group = new Konva.Group();

            var glass = new Konva.Rect({
                x: params.x,
                y: params.y,
                width: params.width,
                height: params.height,
                fill: 'lightblue'
            });

            group.add(glass);

            return group;
        },
        createBars: function (params) {
            var fillX = params.x;
            var fillY = params.y;
            var fillWidth = params.width;
            var fillHeight = params.height;

            var group = new Konva.Group();
            var bar;

            var hBarCount = this.getBarsCount().horizontal;
            var vSpaceUsed = 0;
            var vBarCount = this.getBarsCount().vertical;
            var hSpaceUsed = 0;
            var space;

            for (var i = 0; i < vBarCount; i++) {
                if (this.section.bars.vertical[i].id === 'gap') { continue; }

                space = this.section.bars.vertical[i].space;

                bar = new Konva.Rect({
                    x: fillX + (vSpaceUsed + space) - (this.model.get('glazing_bar_width') / 2), y: fillY,
                    width: this.model.get('glazing_bar_width'), height: fillHeight,
                    fill: 'white', listening: false
                });
                group.add(bar);

                vSpaceUsed += space;
            }

            for (i = 0; i < hBarCount; i++) {
                if (this.section.bars.horizontal[i].id === 'gap') { continue; }

                space = this.section.bars.horizontal[i].space;

                bar = new Konva.Rect({
                    x: fillX, y: fillY + (hSpaceUsed + space) - (this.model.get('glazing_bar_width') / 2),
                    width: fillWidth, height: this.model.get('glazing_bar_width'),
                    fill: 'white', listening: false
                });
                group.add(bar);

                hSpaceUsed += space;
            }

            return group;
        },
        createMetrics: function ( params ) {
            // @TODO: Add "lock" control to metrics
            var view = this;
            var metrics = new Konva.Group();
            var vertical = new Konva.Group();
            var horizontal = new Konva.Group();
            var barMetric;
            var space;
            var self;
            var methods;

            var vParams = {};
            var hBarCount = this.getBarsCount().horizontal;
            var vSpaceUsed = 0;
            var vSpaceLeft = params.height;

            var hParams = {};
            var vBarCount = this.getBarsCount().vertical;
            var hSpaceUsed = 0;
            var hSpaceLeft = params.width;

            var defaultMethods = {
                v_getter: function () {
                    return (typeof this === 'object' && 'space' in this) ? this.space : vSpaceLeft;
                },
                h_getter: function () {
                    return (typeof this === 'object' && 'space' in this) ? this.space : hSpaceLeft;
                },
                v_setter: function ( val ) {
                    var mm = app.utils.parseFormat.dimension(val);

                    if ( mm > params.height - minimalGap ) { return; }

                    this.space = val;
                },
                h_setter: function ( val ) {
                    var mm = app.utils.parseFormat.dimension(val);

                    if ( mm > params.width - minimalGap ) { return; }

                    this.space = val;
                },
                gap_v_setter: function ( val ) {
                    var mm = app.utils.parseFormat.dimension(val);
                    var lastBar = view.section.bars.horizontal[view.section.bars.horizontal.length - 2];
                    var freeSpace = this.space + lastBar.space;

                    if ( mm > params.height - minimalGap ) { return; }

                    if ( mm <= (this.space + lastBar.space - minimalGap) ) {
                        lastBar.space = freeSpace - val;
                        this.space = val;
                    } else {
                        return; // Not enough free space to do this
                    }
                },
                gap_h_setter: function ( val ) {
                    var mm = app.utils.parseFormat.dimension(val);
                    var lastBar = view.section.bars.vertical[view.section.bars.vertical.length - 2];
                    var freeSpace = this.space + lastBar.space;

                    if ( mm > params.height ) { return; }

                    if ( mm <= (this.space + lastBar.space - minimalGap) ) {
                        lastBar.space = freeSpace - val;
                        this.space = val;
                    } else {
                        return; // Not enough free space to do this
                    }
                }
            };

            // Make metrics for horizontal bars
            for (var vb = 0; vb < hBarCount; vb++) {
                self = this.section.bars.horizontal[vb];
                methods = {
                    getter: defaultMethods.v_getter.bind( self )
                };

                if (self.id !== 'gap') {
                    space = self.space;
                    methods.setter = defaultMethods.v_setter.bind( self );
                } else {
                    space = vSpaceLeft;

                    if ( hBarCount > 1 ) {
                        methods.setter = defaultMethods.gap_v_setter.bind( self );
                    }
                }

                _.extend( vParams, params, {
                    height: space,
                    methods: methods
                });

                barMetric = this.createVerticalMetrics( vParams );
                barMetric.position({
                    x: 0,
                    y: vSpaceUsed * this.ratio
                });

                vertical.add(barMetric);

                vSpaceUsed += space;
                vSpaceLeft = params.height - vSpaceUsed;
            }

            // Make metrics for vertical bars
            for (var hb = 0; hb < vBarCount; hb++) {
                self = this.section.bars.vertical[hb];
                methods = {
                    getter: defaultMethods.h_getter.bind( self )
                };

                if (self.id !== 'gap') {
                    space = self.space;
                    methods.setter = defaultMethods.h_setter.bind( self );
                } else {
                    space = hSpaceLeft;

                    if ( vBarCount > 1 ) {
                        methods.setter = defaultMethods.gap_h_setter.bind( self );
                    }
                }

                _.extend( hParams, params, {
                    width: space,
                    methods: methods
                } );

                barMetric = this.createHorizontalMetrics( hParams );
                barMetric.position({
                    x: metricSize + (hSpaceUsed * this.ratio),
                    y: params.height * this.ratio
                });

                horizontal.add(barMetric);

                hSpaceUsed += space;
                hSpaceLeft = params.width - hSpaceUsed;
            }

            metrics.add( vertical, horizontal );

            return metrics;
        },
        createVerticalMetrics: function ( params ) {
            var drawerParams = [params.metricSize, params.height * this.ratio, params.methods];

            return this.callDrawer( 'createVerticalMetric', drawerParams );
        },
        createHorizontalMetrics: function ( params ) {
            var drawerParams = [params.width * this.ratio, params.metricSize, params.methods];

            return this.callDrawer( 'createHorizontalMetric', drawerParams );
        },
        // duplicate of DrawingView.createInput
        // changed only appendTo and containerPos
        createInput: function (params, pos, size) {
            var view = this;
            var $wrap = $('<div>')
                .addClass('popup-wrap')
                .appendTo(this.ui.$body)
                .on('click', function (e) {
                    if (e.target === $wrap.get(0)) {
                        $wrap.remove();
                    }
                });

            var containerPos = this.ui.$drawing.position();

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
                    if (this.value < 0) { return; }

                    if (e.keyCode === 13) {  // enter
                        var inches = app.utils.parseFormat.dimension(this.value);
                        var mm = app.utils.convert.inches_to_mm(inches);

                        params.setter(mm);
                        view.recalculateSpaces();
                        view.saveBars();

                        $wrap.remove();
                    }

                    if (e.keyCode === 27) { // esc
                        $wrap.remove();
                    }
                })
                .on('blur', function () {
                    $wrap.remove();
                })
                ;
        },
        changeBarsNumber: function ( type ) {
            var defaultBar = {
                space: 0, // space to next bar. in mm
                lock: false    // lock space param, to prevent change when add/remove bars
            };
            var defaultVBar = {};
            var defaultHBar = {};
            var vertical = [];
            var horizontal = [];

            // section params
            // needed to calculate spaces between bars
            var section = {
                width: this.section.glassParams.width,
                height: this.section.glassParams.height,
                bars: this.section.bars
            };

            if ( type === 'vertical' || type === 'both' ) {
                var vBarWidth = 0;
                var vertical_count = parseInt(this.ui.$bar_vertical.val());
                var vSpace = section.width / (vertical_count + 1) - vBarWidth;

                _.extend(defaultVBar, defaultBar, {space: vSpace});

                // Just push all as default bars!
                // @TODO: change bar spaces accordingly with already added bar spaces (lock param)

                for (var i = 0; i < vertical_count; i++) {
                    var vbar = JSON.parse( JSON.stringify( defaultVBar ) );

                    vbar.id = i;
                    vertical.push(vbar);
                }

                var vGap = {id: 'gap', space: vSpace, lock: false};

                vertical.push( vGap );
            } else {
                vertical = this.section.bars.vertical;
            }

            if ( type === 'horizontal' || type === 'both' ) {
                var hBarWidth = 0;
                var horizontal_count = parseInt(this.ui.$bar_horizontal.val());
                var hSpace = section.height / (horizontal_count + 1) - hBarWidth;

                _.extend(defaultHBar, defaultBar, {space: hSpace});

                for (var j = 0; j < horizontal_count; j++) {
                    var hbar = JSON.parse( JSON.stringify( defaultHBar ) );

                    hbar.id = j;
                    horizontal.push(hbar);
                }

                var hGap = {id: 'gap', space: hSpace, lock: false};

                horizontal.push( hGap );
            } else {
                horizontal = this.section.bars.horizontal;
            }

            var bars = {
                vertical: vertical,
                horizontal: horizontal
            };

            return bars;
        },
        recalculateSpaces: function () {
            // @TODO: Take into account "lock" param in this calculation
            // Always change space in a "gap"
            var width = this.getSize().width;
            var height = this.getSize().height;
            var sum = 0;
            var gap;
            var gap_space;

            this.section.bars.vertical.forEach(function ( bar ) {
                sum += bar.space;
            });

            if ( sum < this.getSize().height ) {
                gap = this.section.bars.vertical[this.section.bars.vertical.length - 1];

                gap_space = gap.space;

                gap.space = width - (sum - gap_space);
            }

            sum = 0;
            this.section.bars.horizontal.forEach(function ( bar ) {
                sum += bar.space;
            });

            if ( sum < this.getSize().height ) {
                gap = this.section.bars.horizontal[this.section.bars.horizontal.length - 1];

                gap_space = gap.space;

                gap.space = height - (sum - gap_space);
            }
        },
        saveBars: function () {
            this.model.setSectionBars( this.section.id, this.section.bars );
            this.updateCanvas();
            this.options.parent_view.updateCanvas();
        },
        destroy: function () {
            this.ui.$modal.remove();
            this.stage.destroy();
        },
        setSection: function (section_id) {
            this.section = this.model.getSection(section_id);

            this.ui.$bar_vertical.val( this.getBarsCount().vertical );
            this.ui.$bar_horizontal.val( this.getBarsCount().horizontal );

            if (this.section.bars.vertical.length === 0 && this.section.bars.horizontal.length === 0) {
                this.section.bars = this.changeBarsNumber( 'both' );
            }

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
        getSize: function () {
            return {
                width: this.section.glassParams.width,
                height: this.section.glassParams.height
            };
        },
        callDrawer: function ( method, args ) {
            var parent = this.options.parent_view;
            var _args = args || [];

            if ( !(parent instanceof app.DrawingView && method in parent) ) {
                throw new Error('There is no method `' + method + '` in parent Drawing_view');
            }

            return parent[method].apply(this, _args);
        }
    });

})();
