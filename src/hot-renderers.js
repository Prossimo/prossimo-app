import Handsontable from 'handsontable/dist/handsontable.full';
import $ from 'jquery';
import _ from 'underscore';

import { format } from './utils';

//  Custom Handsontable cell content renderers
export default {
    //  Render base64-encoded string as an image
    customerImageRenderer(instance, td, row, col, prop, value) {
        const escaped = Handsontable.helper.stringify(value);
        let $img;
        const $td = $(td);

        if (escaped.indexOf('data:image/png') === 0) {
            $img = $('<img class="customer-image" />');
            $img.attr('src', value);

            $td.empty().append($img);
        } else {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
        }

        $td.addClass('hot-customer-image-cell');

        return td;
    },
    drawingPreviewRenderer(instance, td, row, col, prop, value) {
        const escaped = Handsontable.helper.stringify(value);
        let $img;
        const $td = $(td);

        if (escaped.indexOf('data:image/png') === 0) {
            $img = $('<img class="drawing-preview" />');
            $img.attr('src', value);

            $td.empty().append($img);
        } else {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
        }

        $td.addClass('hot-drawing-preview-cell');

        return td;
    },
    //  Format value with the help of formatters from `utils`
    getFormattedRenderer(attr_name, is_highlighted) {
        const args = _.toArray(arguments).slice(1);

        const f = format;
        const formatters_hash = {
            dimension() {
                return f.dimension.apply(this, arguments);
            },
            dimension_heights() {
                return f.dimension_heights.apply(this, arguments);
            },
            percent() {
                return f.percent.apply(this, arguments);
            },
            percent_difference() {
                return f.percent_difference.apply(this, arguments);
            },
            fixed_minimal() {
                return f.fixed_minimal.apply(this, arguments);
            },
            fixed_heights() {
                return f.fixed_heights.apply(this, arguments);
            },
            fixed() {
                return f.fixed.apply(this, arguments);
            },
            price_usd() {
                return f.price_usd.apply(this, arguments);
            },
        };

        return function (instance, td, row, col, prop, value) {
            const $td = $(td);

            if (formatters_hash[attr_name]) {
                arguments[5] = formatters_hash[attr_name](value, args[0], args[1]);
            }

            Handsontable.renderers.TextRenderer.apply(this, arguments);

            if (
                _.indexOf(['dimension', 'percent', 'percent_difference', 'fixed_minimal', 'fixed',
                    'fixed_heights', 'dimension_heights', 'price_usd', 'align_right'], attr_name) !== -1
            ) {
                $td.addClass('htNumeric');
            }

            if (is_highlighted) {
                $td.addClass('is-highlighted');
            }

            if (attr_name === 'percent_difference') {
                if (parseInt(arguments[5].replace(',', ''), 10) === 0) {
                    $td.addClass('is-perfect');
                } else if (Math.abs(parseInt(arguments[5].replace(',', ''), 10)) <= 15) {
                    $td.addClass('is-okay');
                } else {
                    $td.addClass('is-average');
                }
            }

            return td;
        };
    },
    //  Add move up / down buttons to move item within collection
    moveItemRenderer(instance, td, row) {
        const $td = $(td);
        const is_first_item = row === 0;
        const is_last_item = row === instance.getSourceData().filter(item => item.get('is_base_type') !== true).length - 1;

        const $button_up = $('<button>', {
            class: 'btn btn-xs btn-move js-move-item-up glyphicon glyphicon-arrow-up',
            'data-row': row,
            title: 'Move Item Up',
        });
        const $button_down = $('<button>', {
            class: 'btn btn-xs btn-move js-move-item-down glyphicon glyphicon-arrow-down',
            'data-row': row,
            title: 'Move Item Down',
        });

        if (is_first_item) {
            $button_up.addClass('disabled');
        }

        if (is_last_item) {
            $button_down.addClass('disabled');
        }

        $td.empty().append($button_up.add($button_down));

        return td;
    },
    //  Just replace visible cell value with "--" or another message
    getDisabledPropertyRenderer(message) {
        message = message || '--';

        return function (instance, td) {
            $(td).addClass('htDimmed').text(message);
            return td;
        };
    },
    unitProfileRenderer(instance, td, row) {
        const current_unit = instance.getSourceData().at(row) &&
            instance.getSourceData().at(row);
        const current_profile = current_unit && current_unit.profile;

        if (current_profile && current_profile.get('name')) {
            arguments[5] = current_profile.get('name');
            Handsontable.renderers.AutocompleteRenderer.apply(this, arguments);
        } else {
            if (current_unit && current_unit.get('profile_name')) {
                arguments[5] = current_unit.get('profile_name');
            }

            Handsontable.renderers.AutocompleteRenderer.apply(this, arguments);
            $(td).addClass('htInvalid');
        }

        return td;
    },
};
