var app = app || {};

(function () {
    'use strict';

    app.utils = {
        format: {
            dimension: function (value, decimal_format) {
                var value_feet = Math.floor(parseFloat(value) / 12);
                var value_inches = parseFloat(value) % 12;
                var fractional_part;

                decimal_format = decimal_format &&
                    _.indexOf(['floating', 'fraction'], decimal_format) !== -1 ?
                    decimal_format : 'floating';

                if ( decimal_format === 'fraction' ) {
                    if ( value_inches - Math.floor(value_inches) ) {
                        fractional_part = (value_inches - Math.floor(value_inches)).toFixed(15);
                        value_inches = Math.floor(value_inches) + ' ' +
                            new Decimal(fractional_part).toFraction(16).join('/');
                    }
                } else {
                    value_inches = this.fixed_minimal(value_inches, 3);
                }

                return value_feet + '′−' + value_inches + '″';
            },
            dimensions: function (width, height, decimal_format) {
                return this.dimension(width, decimal_format) + ' x ' + this.dimension(height, decimal_format);
            },
            price_usd: function (price) {
                return '$' + new Decimal(parseFloat(price).toFixed(2)).toFormat(2);
            },
            percent: function (value) {
                return new Decimal(parseFloat(value).toFixed(2)).toFormat() + '%';
            },
            fixed: function (value, num) {
                num = num ? (num < 15 ? num : 15) : 2;
                return new Decimal(parseFloat(value).toFixed(num)).toFormat(num);
            },
            fixed_minimal: function (value, num) {
                var result;
                var match;
                var trailing;

                //  Captures all trailing zeroes (and a preceding dot if any)
                var pattern = /\.(?:[123456789]+)([0]+)|(\.[0]+)\b/i;

                result = this.fixed(value, num);

                if ( pattern.test(result) ) {
                    match = pattern.exec(result);
                    trailing = match[1] ? match[1] : match[2];
                    result = result.substr(0, result.length - trailing.length);
                }

                return result;
            }
        },
        parseFormat: {
            dimension: function (size_string) {
                var result;
                var match;

                //  Captures |6'-2 1/2"|, |6 - 2 1/2|
                var pattern_1 = /(\d+)\s*(\'|’|′)*\s*(-|–|—|‒|―|‐|−)\s*(\d+)\s(\d+)\s*\/\s*(\d+)\s*("|”|″)*/i;
                //  Captures |5-2|, |8'-0|, |9-10"|, |2’–8”|
                var pattern_2 = /(\d+)\s*(\'|’|′)*\s*(-|–|—|‒|―|‐|−)\s*(\d+)\s*("|”|″)*/i;
                //  Captures |33 3/8|, |82 1/2"|, |4'6 1/2|
                var pattern_3 = /(?:(\d+)\s*(?:\'|’|′)\s*)*(\d+)\s(\d+)\s*\/\s*(\d+)/i;
                //  Captures |30 '|, |30'|, |30’|, |30.5 ’|, |4'6|
                var pattern_4 = /(\d+(?:\.\d+)*)\s*(?:\'|’|′)\s*(\d+)*/i;
                //  Captures |30|, |30 "|, |30"|, |30 ”|, |30.5 ”|
                var pattern_5 = /(\d+(\.\d+)*)\s*("|”|″)*/i;

                if ( pattern_1.test(size_string) ) {
                    match = pattern_1.exec(size_string);
                    result = parseFloat(match[1]) * 12 + parseFloat(match[4]) +
                        parseFloat(match[5]) / parseFloat(match[6]);
                } else if ( pattern_2.test(size_string) ) {
                    match = pattern_2.exec(size_string);
                    result = parseFloat(match[1]) * 12 + parseFloat(match[4]);
                } else if ( pattern_3.test(size_string) ) {
                    match = pattern_3.exec(size_string);
                    result = (match[1] ? match[1] * 12 : 0) +
                        parseFloat(match[2]) + parseFloat(match[3]) / parseFloat(match[4]);
                } else if ( pattern_4.test(size_string) ) {
                    match = pattern_4.exec(size_string);
                    result = parseFloat(match[1]) * 12 + (match[2] ? parseFloat(match[2]) : 0);
                } else if ( pattern_5.test(size_string) ) {
                    match = pattern_5.exec(size_string);
                    result = match[1];
                } else {
                    result = size_string;
                }

                return parseFloat(result);
            },
            dimensions: function (size_string, attr) {
                var width;
                var height;
                var result;
                var match;

                attr = attr && _.indexOf(['both', 'width', 'height'], attr) !== -1 ?
                    attr : 'both';

                var pattern = /(\S+(?:\s*\S*)*)\s*(?:x|X|✕|✖)\s*(\S+(?:\s*\S*)*)/i;

                if ( pattern.test(size_string) ) {
                    match = pattern.exec(size_string);
                    width = this.dimension(match[1]);
                    height = this.dimension(match[2]);
                } else {
                    width = this.dimension(size_string);
                    height = this.dimension(size_string);
                }

                if ( attr === 'width' ) {
                    result = width;
                } else if ( attr === 'height' ) {
                    result = height;
                } else {
                    result = {
                        width: width,
                        height: height
                    };
                }

                return result;
            },
            percent: function (string) {
                return parseFloat(string);
            }
        },
        convert: {
            inches_to_mm: function (inch_value) {
                return parseFloat(inch_value * 24.5);
            },
            mm_to_inches: function (mm_value) {
                return parseFloat(mm_value / 24.5);
            }
        }
    };
})();
