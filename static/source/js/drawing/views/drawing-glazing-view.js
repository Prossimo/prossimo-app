var app = app || {};

(function () {
    'use strict';

    // global variables
    var metricSize = 50;
    var minimalGap = 25; // minimal gap between bars

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
            var vBarCount = this.getBarsCount().vertical;
            var space;

            for (var i = 0; i < vBarCount; i++) {
                space = this.section.bars.vertical[i].position;

                bar = new Konva.Rect({
                    x: fillX + space - (this.model.get('glazing_bar_width') / 2), y: fillY,
                    width: this.model.get('glazing_bar_width'), height: fillHeight,
                    fill: 'white', listening: false
                });
                group.add(bar);
            }

            for (i = 0; i < hBarCount; i++) {
                space = this.section.bars.horizontal[i].position;

                bar = new Konva.Rect({
                    x: fillX, y: fillY + space - (this.model.get('glazing_bar_width') / 2),
                    width: fillWidth, height: this.model.get('glazing_bar_width'),
                    fill: 'white', listening: false
                });
                group.add(bar);
            }

            return group;
        },
        createMetrics: function ( params ) {
            // @TODO: Add "lock" control to metrics
            var view = this;
            var metrics = new Konva.Group();
            var max = {
                vertical: params.width,
                horizontal: params.height
            };
            var paramName = {
                vertical: 'width',
                horizontal: 'height'
            };
            var groups = {
                vertical: new Konva.Group(),
                horizontal: new Konva.Group()
            };
            var methods = {
                vertical: this.createHorizontalMetrics.bind(view),
                horizontal: this.createVerticalMetrics.bind(view)
            };
            var barMetric;

            var bars = this.callDrawer( 'getBarsWithSpaces', [this.section] );

            var defaultMethods = {
                getter: function () {
                    return this.space;
                },
                setter: function ( type, space, val ) {
                    var delta = val - space;
                    var mm = app.utils.parseFormat.dimension( this.position + delta );

                    if ( mm >= max[type] - minimalGap || (this.position + delta) < 0 + minimalGap ) {
                        view.showError();
                        return;
                    }

                    this.position = this.position + delta;
                },
                gap_getter: function ( ) {
                    return this.space;
                },
                gap_setter: function ( type, val ) {
                    var mm = app.utils.parseFormat.dimension(val);
                    var lastBar = view.section.bars[type][view.section.bars[type].length - 1];
                    var freeSpace = max[type] - lastBar.position;
                    var delta = freeSpace - val;

                    if ( mm > max[type] - minimalGap || val < 0 + minimalGap ) {
                        view.showError();
                        return;
                    }

                    lastBar.position = lastBar.position + delta;
                }
            };

            _.each(bars, function ( group, type ) {
                var spaceUsed = 0;
                var gap;

                group.forEach(function ( bar, i ) {
                    var p = {
                        methods: {
                            getter: defaultMethods.getter.bind( bar ),
                            setter: defaultMethods.setter.bind( view.section.bars[type][i], type, bar.space )
                        }
                    };
                    var position = view.getBarPosition( type, bar );

                    _.extend(p, params);
                    p[paramName[type]] = bar.space;

                    barMetric = methods[type]( p );
                    barMetric.position(position);
                    groups[type].add(barMetric);

                    spaceUsed += bar.space;
                });
                // Add gap
                var gapObject = {
                    position: max[type],
                    space: max[type] - spaceUsed
                };
                var p = {
                    methods: {
                        getter: defaultMethods.gap_getter.bind( gapObject )
                    }
                };
                var position = view.getBarPosition( type, gapObject );

                if (group.length > 0) {
                    p.methods.setter = defaultMethods.gap_setter.bind( gapObject, type );
                }

                _.extend(p, params);
                p[paramName[type]] = gapObject.space;

                gap = methods[type]( p );
                gap.position(position);
                groups[type].add(gap);
            });

            metrics.add( groups.vertical, groups.horizontal );

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
        getDefaultMetricStyles: function () {
            return this.callDrawer( 'getDefaultMetricStyles' );
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
                    if (e.keyCode === 13) {  // enter
                        var _value = this.value;
                        var sign = 1;

                        if (_value[0] === '-') {
                            sign = -1;
                            _value = _value.slice(1);
                        }

                        var inches = app.utils.parseFormat.dimension(_value);
                        var mm = app.utils.convert.inches_to_mm(inches) * sign;

                        params.setter(mm);
                        view.sortBars();
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
        sortBars: function () {
            _.each(this.section.bars, function ( group ) {
                group.sort(function ( a, b ) {
                    return a.position > b.position;
                });
            });
        },
        saveBars: function () {
            this.model.setSectionBars( this.section.id, this.section.bars );
            this.updateCanvas();
            this.options.parent_view.updateCanvas();
        },
        onDestroy: function () {
            this.ui.$modal.remove();
            this.stage.destroy();
        },
        setSection: function (section_id) {
            this.section = this.model.getSection(section_id);

            this.ui.$bar_vertical.val( this.getBarsCount().vertical );
            this.ui.$bar_horizontal.val( this.getBarsCount().horizontal );

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
        getBarPosition: function ( type, bar ) {
            var position = {
                x: 0,
                y: 0
            };

            if ( typeof bar === 'object' && 'position' in bar && 'space' in bar) {
                if (type === 'horizontal') {
                    position = {
                        x: 0,
                        y: (bar.position - bar.space) * this.ratio
                    };
                }

                if (type === 'vertical') {
                    position = {
                        x: metricSize + ((bar.position - bar.space) * this.ratio),
                        y: this.getSize().height * this.ratio
                    };
                }
            }

            return position;
        },
        getSize: function () {
            return {
                width: this.section.glassParams.width,
                height: this.section.glassParams.height
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
