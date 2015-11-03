var app = app || {};

(function () {
    'use strict';

    app.utils = {
        format: {
            dimension: function (value) {
                var value_feet = Math.floor(parseFloat(value) / 12);
                var value_inches = parseFloat(value) % 12;

                return value_feet + '\'-' + value_inches + '"';
            },
            dimensions: function (width, height) {
                return this.dimension(width) + 'x' + this.dimension(height);
            },
            price_usd: function (price) {
                return '$' + new Decimal(parseFloat(price).toFixed(2)).toFormat(2);
            },
            percent: function (value) {
                return new Decimal(parseFloat(value).toFixed(2)).toFormat() + '%';
            },
            fixed: function (value, num) {
                num = num || 2;
                return new Decimal(parseFloat(value).toFixed(num)).toFormat(num);
            }
        },
        parseFormat: {
            dimension: function (size_string) {
                var result;
                var match;

                //  Captures |33 3/8|, |82 1/2"|
                var pattern_1 = /(\d+)\s(\d+)\/(\d+)/i;
                //  Captures |5-2|, |8'-0|, |9-10"|, |2’–8”|
                var pattern_2 = /(\d+)\s*(\'|’)*\s*(-|–|—)\s*(\d+)\s*("|”)*/i;
                //  Captures |30 '|, |30'|, |30’|, |30.5 ’|
                var pattern_3 = /(\d+\.*\d+)\s*(\'|’)/i;
                //  Captures |30|, |30 "|, |30"|, |30 ”|, |30.5 ”|
                var pattern_4 = /(\d+\.*\d+)\s*("|”)*/i;

                if ( pattern_1.test(size_string) ) {
                    match = pattern_1.exec(size_string);
                    result = parseFloat(match[1]) + parseFloat(match[2]) / parseFloat(match[3]);
                } else if ( pattern_2.test(size_string) ) {
                    match = pattern_2.exec(size_string);
                    result = parseFloat(match[1]) * 12 + parseFloat(match[4]);
                } else if ( pattern_3.test(size_string) ) {
                    match = pattern_3.exec(size_string);
                    result = parseFloat(match[1]) * 12;
                } else if ( pattern_4.test(size_string) ) {
                    match = pattern_4.exec(size_string);
                    result = match[1];
                } else {
                    //  As a last resort, just extract any number from string
                    result = size_string;
                }

                return parseFloat(result);
            },
            dimensions: function (size_string, attr) {
                attr = attr && _.indexOf(['both', 'width', 'height'], attr) !== -1 ?
                    attr : 'both';

            },
            percent: function (string) {
                return parseFloat(string);
            }
        },
        convert: {
            inches_to_mm: function (inch_value) {
                return parseFloat(inch_value * 24.5);
            }
        }
    };
})();
