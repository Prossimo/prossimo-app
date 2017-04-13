import Handsontable from 'handsontable/dist/handsontable.full';
import $ from 'jquery';
import _ from 'underscore';

import { format } from './utils';

//  Custom Handsontable cell content renderers
export default {
    //  Render base64-encoded string as an image
    customerImageRenderer(instance, td, row, col, prop, value, ...rest) {
        const escaped = Handsontable.helper.stringify(value);
        let $img;
        const $td = $(td);

        if (escaped.indexOf('data:image/png') === 0) {
            $img = $('<img class="customer-image" />');
            $img.attr('src', value);

            $td.empty().append($img);
        } else {
            Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, ...rest);
        }

        $td.addClass('hot-customer-image-cell');

        return td;
    },
    drawingPreviewRenderer(instance, td, row, col, prop, value, ...rest) {
        const escaped = Handsontable.helper.stringify(value);
        const $td = $(td);
        let $img;

        if (escaped.indexOf('data:image/png') === 0) {
            $img = $('<img class="drawing-preview" />');
            $img.attr('src', value);

            $td.empty().append($img);
        } else {
            Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, ...rest);
        }

        $td.addClass('hot-drawing-preview-cell');

        return td;
    },
    //  Format value with the help of formatters from `utils`
    getFormattedRenderer(attr_name, is_highlighted) {
        const formatters_hash = {
            dimension(...formatterArgs) {
                return format.dimension(...formatterArgs);
            },
            dimension_heights(...formatterArgs) {
                return format.dimension_heights(...formatterArgs);
            },
            percent(...formatterArgs) {
                return format.percent(...formatterArgs);
            },
            percent_difference(...formatterArgs) {
                return format.percent_difference(...formatterArgs);
            },
            fixed_minimal(...formatterArgs) {
                return format.fixed_minimal(...formatterArgs);
            },
            fixed_heights(...formatterArgs) {
                return format.fixed_heights(...formatterArgs);
            },
            fixed(...formatterArgs) {
                return format.fixed(...formatterArgs);
            },
            price_usd(...formatterArgs) {
                return format.price_usd(...formatterArgs);
            },
        };

        return (instance, td, row, col, prop, value, ...rest) => {
            const $td = $(td);

            if (formatters_hash[attr_name]) {
                value = formatters_hash[attr_name](value, attr_name, is_highlighted);
            }

            Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, ...rest);

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
                if (parseInt(value.replace(',', ''), 10) === 0) {
                    $td.addClass('is-perfect');
                } else if (Math.abs(parseInt(value.replace(',', ''), 10)) <= 15) {
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

        return (instance, td) => {
            $(td).addClass('htDimmed').text(message);
            return td;
        };
    },
    unitProfileRenderer(instance, td, row, col, prop, value, ...rest) {
        const current_unit = instance.getSourceData().at(row) && instance.getSourceData().at(row);
        const current_profile = current_unit && current_unit.profile;

        if (current_profile && current_profile.get('name')) {
            value = current_profile.get('name');
            Handsontable.renderers.AutocompleteRenderer(instance, td, row, col, prop, value, ...rest);
        } else {
            if (current_unit && current_unit.get('profile_name')) {
                value = current_unit.get('profile_name');
            }

            Handsontable.renderers.AutocompleteRenderer(instance, td, row, col, prop, value, ...rest);
            $(td).addClass('htInvalid');
        }

        return td;
    },
};
