import Handsontable from 'handsontable/dist/handsontable.full';
import $ from 'jquery';
import _ from 'underscore';

import Utils from './utils';

//  Custom Handsontable cell content renderers
export default {
    //  Render base64-encoded string as an image
    customerImageRenderer: function (instance, td, row, col, prop, value) {
        var escaped = Handsontable.helper.stringify(value);
        var $img;
        var $td = $(td);

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
    drawingPreviewRenderer: function (instance, td, row, col, prop, value) {
        var escaped = Handsontable.helper.stringify(value);
        var $img;
        var $td = $(td);

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
    //  Format value with the help of formatters from `utils.js`
    getFormattedRenderer: function (attr_name, is_highlighted) {
        var args = _.toArray(arguments).slice(1);

        var f = Utils.format;
        var formatters_hash = {
            dimension: function () {
                return f.dimension.apply(this, arguments);
            },
            dimension_heights: function () {
                return f.dimension_heights.apply(this, arguments);
            },
            percent: function () {
                return f.percent.apply(this, arguments);
            },
            percent_difference: function () {
                return f.percent_difference.apply(this, arguments);
            },
            fixed_minimal: function () {
                return f.fixed_minimal.apply(this, arguments);
            },
            fixed_heights: function () {
                return f.fixed_heights.apply(this, arguments);
            },
            fixed: function () {
                return f.fixed.apply(this, arguments);
            },
            price_usd: function () {
                return f.price_usd.apply(this, arguments);
            }
        };

        return function (instance, td, row, col, prop, value) {
            var $td = $(td);

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
    moveItemRenderer: function (instance, td, row) {
        var $td = $(td);
        var is_first_item = row === 0;
        var is_last_item = row === instance.getSourceData().filter(function (item) {
            return item.get('is_base_type') !== true;
        }).length - 1;

        var $button_up = $('<button>', {
            class: 'btn btn-xs btn-move js-move-item-up glyphicon glyphicon-arrow-up',
            'data-row': row,
            title: 'Move Item Up'
        });
        var $button_down = $('<button>', {
            class: 'btn btn-xs btn-move js-move-item-down glyphicon glyphicon-arrow-down',
            'data-row': row,
            title: 'Move Item Down'
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
    getDisabledPropertyRenderer: function (message) {
        message = message || '--';

        return function (instance, td) {
            $(td).addClass('htDimmed').text(message);
            return td;
        };
    },
    unitProfileRenderer: function (instance, td, row) {
        var current_unit = instance.getSourceData().at(row) &&
            instance.getSourceData().at(row);
        var current_profile = current_unit && current_unit.profile;

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
    }
};
