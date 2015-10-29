var app = app || {};

(function () {
    'use strict';

    app.utils = {
        format: {
            dimensions: function (width, height) {
                var width_feet = Math.floor(parseFloat(width) / 12);
                var width_inches = parseFloat(width) % 12;
                var height_feet = Math.floor(parseFloat(height) / 12);
                var height_inches = parseFloat(height) % 12;

                return width_feet + '\'-' + width_inches + '"x' + height_feet + '\'-' + height_inches + '"';
            },
            price_usd: function (price) {
                return '$' + new Decimal(parseFloat(price).toFixed(2)).toFormat(2);
            }
        },
        parseFormat: {

        },
        convert: {
            inches_to_mm: function (inch_value) {
                return parseFloat(inch_value * 24.5);
            }
        }
    };
})();
