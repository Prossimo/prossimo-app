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
                drawIndexes: true,     // In multiunit, draw subunit position labels?
                isSelected: false      // Draw unit selected?
            };

            options = _.defaults({}, options, defaults, { model: unitModel });

            return options;
        },
        getPreview: function (unitModel, options) {
            var result;

            options = this.mergeOptions(unitModel, options);

            var module = new app.DrawingModule(options);
            var isInside = (options.position === 'inside');

            if ( _.indexOf(['inside', 'outside'], options.position) !== -1 ) {
                module.setState({
                    insideView: isInside,
                    openingView: isInside && !unitModel.isOpeningDirectionOutward() ||
                        options.position === 'outside' && unitModel.isOpeningDirectionOutward(),
                    inchesDisplayMode: options.inchesDisplayMode,
                    hingeIndicatorMode: options.hingeIndicatorMode,
                    drawIndexes: options.drawIndexes,
                    'selected:frame': (options.isSelected) ? 'whole' : undefined
                }, false);
            }

            if (options.width && options.height) {
                module.updateSize( options.width, options.height );
            }

            if (options.drawNeighbors) {
                var previewRatio = module.get('ratio');
                var originCoords = module.layerManager.layers.unit.drawer.layer.getClientRect();
                var originX = originCoords.x;
                var originY = originCoords.y;
                var parentMultiunit = unitModel.getParentMultiunit();
                var parentMultiunitWidth = parentMultiunit.getInMetric('width', 'mm') * previewRatio;
                var parentMultiunitHeight = parentMultiunit.getInMetric('height', 'mm') * previewRatio;
                var unitWidth = unitModel.getInMetric('width', 'mm') * previewRatio;
                var unitCoords = parentMultiunit.getSubunitCoords(unitModel.id);
                var adjustedUnitCoords = {
                    x: (unitCoords) ? unitCoords.x * previewRatio : 0,
                    y: (unitCoords) ? unitCoords.y * previewRatio : 0
                };
                var backgroundDeltaX = (isInside) ?
                    parentMultiunitWidth - adjustedUnitCoords.x - unitWidth :
                    adjustedUnitCoords.x;
                var backgroundDeltaY = adjustedUnitCoords.y;
                var backgroundX = originX - backgroundDeltaX;
                var backgroundY = originY - backgroundDeltaY;
                var backgroundOptions = _.defaults({
                    width: parentMultiunitWidth,
                    height: parentMultiunitHeight,
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

            // TODO disentangle Konva.Group from the module and destroy module
            if (options.mode !== 'group') {
                module.destroy();
            }

            return result;
        }
    };
})();
