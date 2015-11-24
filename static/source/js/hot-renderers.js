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
        getFormattedRenderer: function (attr_name) {
            var args = _.toArray(arguments).slice(1);

            var f = app.utils.format;
            var formatters_hash = {
                discount: function () {
                    return f.percent.apply(this, arguments);
                },
                fixed_minimal: function () {
                    return f.fixed_minimal.apply(this, arguments);
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
                    arguments[5] = formatters_hash[attr_name](value, args[0]);
                }

                Handsontable.renderers.TextRenderer.apply(this, arguments);

                if ( _.indexOf(['discount', 'fixed_minimal', 'fixed', 'price_usd'], attr_name) !== -1 ) {
                    $td.addClass('htNumeric');
                }

                return td;
            };
        },
        //  Render Low Threshold checkbox, sometimes make cell read-only
        thresholdCheckboxRenderer: function (instance, td, row, col) {
            var isThresholdEditable = instance.getData().at(row).isThresholdEditable();

            //  We need this because otherwise user will be able to paste
            if ( isThresholdEditable ) {
                instance.setCellMeta(row, col, 'readOnly', false);
            } else {
                instance.setCellMeta(row, col, 'readOnly', true);
            }

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
            var isThresholdPossible = instance.getData().at(row).isThresholdPossible();

            if ( isThresholdPossible ) {
                instance.setCellMeta(row, col, 'readOnly', false);
                Handsontable.renderers.NumericRenderer.apply(this, arguments);
            } else {
                instance.setCellMeta(row, col, 'readOnly', true);
                $(td).addClass('htDimmed htNumeric').text('--');
            }

            return td;
        },
        //  Add remove button to remove item from collection
        removeItemRenderer: function (instance, td, row) {
            var $td = $(td);
            var $button = $('<button class="btn btn-xs js-remove-item"' +
                'data-row="' + row + '">Remove</button>');

            $td.empty().append($button);

            return td;
        }
    };
})();
