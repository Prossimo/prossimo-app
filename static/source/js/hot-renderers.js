var app = app || {};

(function () {
    'use strict';

    //  Custom Handsontable cell content renderers
    app.hot_renderers = {
        //  Render base64-encoded string as an image
        customerImageRenderer: function (instance, td, row, col, prop, value) {
            var escaped = Handsontable.helper.stringify(value);
            var $img;
            var $td = $(td);

            if ( escaped.indexOf('data:image/png') === 0 ) {
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

            if ( escaped.indexOf('data:image/png') === 0 ) {
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

            var f = app.utils.format;
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

                if ( formatters_hash[attr_name] ) {
                    arguments[5] = formatters_hash[attr_name](value, args[0], args[1]);
                }

                Handsontable.renderers.TextRenderer.apply(this, arguments);

                if ( _.indexOf(['dimension', 'percent', 'fixed_minimal', 'fixed',
                        'price_usd', 'align_right'], attr_name) !== -1
                ) {
                    $td.addClass('htNumeric');
                }

                if ( is_highlighted ) {
                    $td.css('background-color', '#FFF0DE');
                }

                return td;
            };
        },
        //  Render Low Threshold checkbox, sometimes make cell read-only
        thresholdCheckboxRenderer: function (instance, td, row, col) {
            var isThresholdEditable = instance.getSourceData().at(row) &&
                instance.getSourceData().at(row).isThresholdEditable();

            instance.setCellMeta(row, col, 'editor', false);

            Handsontable.renderers.CheckboxRenderer.apply(this, arguments);

            //  We explicitly make input disabled because setting it to
            //  `readOnly` doesn't prevent user from clicking
            if ( !isThresholdEditable ) {
                $(td).addClass('htDimmed').find('input').attr('disabled', true);
            }

            return td;
        },
        //  Render Threshold Width param cell, sometimes make cell read-only
        thresholdWidthRenderer: function (instance, td, row, col) {
            var is_threshold_possible = instance.getSourceData().at(row) &&
                instance.getSourceData().at(row).isThresholdPossible();

            if ( is_threshold_possible ) {
                instance.setCellMeta(row, col, 'readOnly', false);
                Handsontable.renderers.NumericRenderer.apply(this, arguments);
            } else {
                instance.setCellMeta(row, col, 'readOnly', true);
                $(td).addClass('htDimmed htNumeric').text('--');
            }

            return td;
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

            if ( is_first_item ) {
                $button_up.addClass('disabled');
            }

            if ( is_last_item ) {
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

            if ( current_profile && current_profile.get('name') ) {
                arguments[5] = current_profile.get('name');
                Handsontable.renderers.AutocompleteRenderer.apply(this, arguments);
            } else {
                if ( current_unit && current_unit.get('profile_name') ) {
                    arguments[5] = current_unit.get('profile_name');
                }

                Handsontable.renderers.AutocompleteRenderer.apply(this, arguments);
                $(td).addClass('htInvalid');
            }

            return td;
        }
    };
})();
