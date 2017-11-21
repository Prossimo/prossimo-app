import _ from 'underscore';

import { PREVIEW_SIZES } from '../constants';

/**
 * Get proper size of the preview, depending on conditions: which layout mode
 * should be used, which preview type we need, whether customer image is
 * present (the latter only applies for drawings)
 *
 * @return {{ height: number, width: number }} - object, containing width and
 *     height of the preview, in pixels
 */
export function getPreviewSize(opts) {
    const defaults = {
        type: 'drawing',
        mode: 'normal',
        has_customer_image: false,
    };
    const options = _.defaults({}, opts, defaults);

    const allowed_types = ['drawing', 'customer_image'];
    const allowed_modes = ['normal', 'wide', 'extrawide', 'extralarge'];

    if (allowed_types.indexOf(options.type) === -1) {
        throw new Error(`Wrong preview type requested: ${options.type}`);
    }

    if (allowed_modes.indexOf(options.mode) === -1) {
        throw new Error(`Wrong preview mode requested: ${options.mode}'`);
    }

    if (options.type === 'customer_image' && options.has_customer_image) {
        throw new Error('Wrong preview mode requested: `has_customer_image` flag is not possible for `customer_image` type');
    }

    let sizes;

    if (options.type === 'customer_image') {
        sizes = PREVIEW_SIZES[options.type][options.mode];
    } else {
        const ci_mode = options.has_customer_image ? 'has_ci' : 'no_ci';

        sizes = PREVIEW_SIZES[options.type][ci_mode][options.mode];
    }

    return sizes;
}

/**
 * We determine a mode to draw a quote entry for this unit. It could be:
 * `normal`     - just draw it as usual (customer image on the right)
 * `wide`       - customer image below the drawing
 * `extrawide`  - image will take more width, all text columns go above
 * `extralarge` - image will take the whole print page
 *
 * @return {string} Unit drawing mode
 */
export function getResponsiveMode(opts) {
    //  TODO: figure out more appropriate conditions for extrawide / extralarge

    const defaults = {
        width_mm: 0,
        height_mm: 0,
    };
    const options = _.defaults({}, opts, defaults);

    let mode = 'normal';

    if (options.width_mm > options.height_mm) {
        mode = 'wide';
    }

    if (options.width_mm > options.height_mm * 3) {
        mode = 'extrawide';
    }

    if (
        options.width_mm > options.height_mm &&
        options.width_mm > 7000 &&
        options.height_mm > 2000
    ) {
        mode = 'extralarge';
    }

    return mode;
}
