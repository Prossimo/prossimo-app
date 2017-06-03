import _ from 'underscore';
import DrawingModule from './drawing-module';

export function mergePreviewOptions(unitModel, options) {
    const defaults = {
        width: 300,            // Image width, px
        height: 300,           // Image height, px
        mode: 'base64',        // Output type, canvas | base64 | image | group
        position: 'inside',    // Inside or outside
        metricSize: 50,        // Size of metrics drawn, px
        preview: true,         //
        isMaximized: false,    // Remove cosmetic padding?
        drawNeighbors: false,  // In subunit, draw multiunit surroundings, in grayscale?
        drawIndexes: true,     // In multiunit, draw subunit position labels?
        isSelected: false,     // Draw unit selected?
    };

    return _.defaults({}, options, defaults, { model: unitModel });
}

export function generatePreview(unitModel, preview_options) {
    const options = mergePreviewOptions(unitModel, preview_options);
    let result;

    const module = new DrawingModule(options);
    const isInside = (options.position === 'inside');

    if (_.indexOf(['inside', 'outside'], options.position) !== -1) {
        module.setState({
            insideView: isInside,
            openingView: (isInside && !unitModel.isOpeningDirectionOutward()) ||
                (options.position === 'outside' && unitModel.isOpeningDirectionOutward()),
            inchesDisplayMode: options.inchesDisplayMode,
            hingeIndicatorMode: options.hingeIndicatorMode,
            drawIndexes: options.drawIndexes,
            'selected:unit': (options.isSelected) ? 'frame' : undefined,
        }, false);
    }

    if (options.width && options.height) {
        module.updateSize(options.width, options.height);
    }

    if (options.drawNeighbors) {
        const style = module.getStyle('neighbors_background');
        const previewRatio = module.get('ratio');
        const originCoords = module.layerManager.layers.unit.drawer.layer.getClientRect();
        const originX = originCoords.x;
        const originY = originCoords.y;
        const parentMultiunit = unitModel.getParentMultiunit();
        const parentMultiunitWidth = parentMultiunit.getInMetric('width', 'mm') * previewRatio;
        const parentMultiunitHeight = parentMultiunit.getInMetric('height', 'mm') * previewRatio;
        const unitWidth = unitModel.getInMetric('width', 'mm') * previewRatio;
        const unitCoords = parentMultiunit.getSubunitCoords(unitModel.id);
        const adjustedUnitCoords = {
            x: (unitCoords) ? unitCoords.x * previewRatio : 0,
            y: (unitCoords) ? unitCoords.y * previewRatio : 0,
        };
        const backgroundDeltaX = (isInside) ?
            parentMultiunitWidth - adjustedUnitCoords.x - unitWidth :
            adjustedUnitCoords.x;
        const backgroundDeltaY = adjustedUnitCoords.y;
        const backgroundX = originX - backgroundDeltaX;
        const backgroundY = originY - backgroundDeltaY;
        const backgroundOptions = _.defaults({
            width: parentMultiunitWidth,
            height: parentMultiunitHeight,
            mode: 'group',
            metricSize: 0,
            isMaximized: true,
            drawNeighbors: false,
            model: parentMultiunit,
        }, options);
        const background = parentMultiunit.getPreview(backgroundOptions);

        module.setBackground(background, {
            opacity: style.opacity,
            filters: style.filters,
            x: backgroundX,
            y: backgroundY,
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

    //  TODO disentangle Konva.Group from the module and destroy module
    if (options.mode !== 'group') {
        module.destroy();
    }

    return result;
}

export default { mergePreviewOptions, generatePreview };
