var app = app || {};

(function () {
    'use strict';

    var PREVIEW_BACKGROUND_OPACITY = 0.3;

    app.preview = {
        mergeOptions: function (unitModel, options) {
            var defaults = {
                width: 300,            // Image width, px
                height: 300,           // Image height, px
                mode: 'base64',        // Output type, canvas | base64 | image | group
                position: 'inside',    // Inside or outside
                metricSize: 50,        // Size of metrics drawn, px
                preview: true,         //
                isMaximized: false,    // Remove cosmetic padding?
                drawNeighbors: false,  // In subunit, draw multiunit surroundings, in grayscale?
                drawIndexes: true      // In multiunit, draw subunit position labels?
            };

            options = _.defaults({}, options, defaults, { model: unitModel });

            return options;
        },
        getPreview: function (unitModel, options) {
            var result;

            options = this.mergeOptions(unitModel, options);
            var module = new app.DrawingModule(options);

            if ( _.indexOf(['inside', 'outside'], options.position) !== -1 ) {
                module.setState({
                    insideView: options.position === 'inside',
                    openingView: options.position === 'inside' && !unitModel.isOpeningDirectionOutward() ||
                        options.position === 'outside' && unitModel.isOpeningDirectionOutward(),
                    inchesDisplayMode: options.inchesDisplayMode,
                    hingeIndicatorMode: options.hingeIndicatorMode,
                    drawIndexes: options.drawIndexes
                }, false);
            }

            if (options.width && options.height) {
                module.updateSize( options.width, options.height );
            }

            if (options.drawNeighbors) {
                var originCoords = module.layerManager.layers.unit.drawer.layer.getClientRect();
                var originX = originCoords.x;
                var originY = originCoords.y;
                var parentMultiunit = unitModel.getParentMultiunit();
                var previewRatio = module.get('ratio');
                var unitCoords = parentMultiunit.getSubunitCoords(unitModel.getId());
                var backgroundDeltaX = (unitCoords) ? unitCoords.x * previewRatio : 0;
                var backgroundDeltaY = (unitCoords) ? unitCoords.y * previewRatio : 0;
                var backgroundX = originX - backgroundDeltaX;
                var backgroundY = originY - backgroundDeltaY;
                var backgroundWidth = parentMultiunit.getInMetric('width', 'mm') * previewRatio;
                var backgroundHeight = parentMultiunit.getInMetric('height', 'mm') * previewRatio;
                var backgroundOptions = _.defaults({
                    width: backgroundWidth,
                    height: backgroundHeight,
                    mode: 'group',
                    metricSize: 0,
                    isMaximized: true,
                    drawNeighbors: false,
                    model: parentMultiunit
                }, options);
                var background = parentMultiunit.getPreview(backgroundOptions);

                module.setBackground(background, {
                    opacity: PREVIEW_BACKGROUND_OPACITY,
                    filters: [Konva.Filters.Grayscale],
                    x: backgroundX,
                    y: backgroundY
                });
            }

            if (options.mode === 'canvas') {
                result = module.getCanvas();
            } else if (options.mode === 'base64') {
                result = module.getBase64();
            } else if (options.mode === 'image') {
                result = module.getImage();
            } else if (options.mode === 'group') {
                result = module.getGroup();
                result.setAttr('name', 'preview');
            }

            // TODO destroy module in group mode too, by event when it is no longer needed
            if (options.mode !== 'group') {
                module.destroy();
            }

            return result;
        }
    };
})();
