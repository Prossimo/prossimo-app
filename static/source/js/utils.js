var app = app || {};

(function () {
    'use strict';

    var MAX_DENOMINATOR = 16;
    //  For numbers that are passed to Decimal constructor
    var MAX_SIGNIFICANT_DIGITS = 15;

    app.utils = {
        format: {
            dimension: function (value, decimal_format) {
                var value_feet = Math.floor(parseFloat(value) / 12);
                var value_inches = parseFloat(value) % 12;
                var fractional_part;
                var closest_possible_fraction = 0;
                var i;

                decimal_format = decimal_format &&
                    _.indexOf(['floating', 'fraction'], decimal_format) !== -1 ?
                    decimal_format : 'floating';

                if ( decimal_format === 'fraction' ) {
                    //  If fractional part is too close to 0 or to 1, we just
                    //  round value_inches to a nearest integer. This prevents
                    //  us from getting something like |2′−6 1/1″|. Too close
                    //  means smaller than half of 1/16 of an inch, given that
                    //  MAX_DENOMINATOR == 16
                    if (
                        Math.abs(Math.round(value_inches) - value_inches) > 0 &&
                        Math.abs(Math.round(value_inches) - value_inches) <= (1 / MAX_DENOMINATOR) / 2
                    ) {
                        value_inches = Math.round(value_inches);
                    }

                    //  If value_inches is too close to 12, we set it to 0 and
                    //  increase value_feet by 1. This prevents us from getting
                    //  something like |1′−12″|
                    if ( value_inches === 12 ) {
                        value_feet += 1;
                        value_inches = 0;
                    }

                    if ( value_inches - Math.floor(value_inches) ) {
                        fractional_part = (value_inches - Math.floor(value_inches));

                        //  We want to only have denominators from the list:
                        //  [2, 4, 8, 16], so we select the closest fraction
                        //  with denominator from this list and use it
                        for ( i = 1; i < MAX_DENOMINATOR; i++ ) {
                            var i_fraction = i / MAX_DENOMINATOR;

                            if (
                                Math.abs(fractional_part - i_fraction) <
                                Math.abs(fractional_part - closest_possible_fraction)
                            ) {
                                closest_possible_fraction = i_fraction;
                            }
                        }

                        fractional_part = closest_possible_fraction.toFixed(MAX_SIGNIFICANT_DIGITS);
                        value_inches = Math.floor(value_inches) + ' ' +
                            new Decimal(fractional_part).toFraction(MAX_DENOMINATOR).join('/');
                    }
                } else {
                    value_inches = this.fixed_minimal(value_inches, 3);
                }

                return value_feet + '′−' + value_inches + '″';
            },
            dimensions: function (width, height, decimal_format) {
                return this.dimension(width, decimal_format) + ' x ' + this.dimension(height, decimal_format);
            },
            dimension_mm: function (value) {
                return this.fixed_minimal(value, 0) + ' mm';
            },
            dimensions_mm: function (width, height) {
                return this.fixed_minimal(width, 0) + ' x ' + this.fixed_minimal(height, 0);
            },
            dimension_in: function (value) {
                return this.fixed_minimal(value, 2) + '″';
            },
            dimensions_in: function (width, height) {
                return this.dimension_in(width) + ' x ' + this.dimension_in(height);
            },
            price_usd: function (price) {
                return '$' + new Decimal(parseFloat(price).toFixed(2)).toFormat(2);
            },
            percent: function (value) {
                return new Decimal(parseFloat(value).toFixed(2)).toFormat() + '%';
            },
            fixed: function (value, num) {
                num = _.isNumber(num) ? (num < MAX_SIGNIFICANT_DIGITS ? num : MAX_SIGNIFICANT_DIGITS) : 2;
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
            },
            square_feet: function (value, num, format) {
                format = (format && _.indexOf(['normal', 'sup'], format) !== -1) ?
                    format : 'normal';
                return this.fixed_minimal(value, num) + (format === 'sup' ?
                    ' ft<sup>2</sup>' : ' sq.ft');
            },
            square_meters: function (value, num, format) {
                format = (format && _.indexOf(['normal', 'sup'], format) !== -1) ?
                    format : 'sup';
                return this.fixed_minimal(value, num) + (format === 'sup' ?
                    ' m<sup>2</sup>' : ' sq.m');
            }
        },
        parseFormat: {
            dimension: function (size_string) {
                var result;
                var match;

                //  Captures |6'-2 1/2"|, |6 - 2 1/2|
                var pattern_1 = /(\d+)\s*(\'|’|′)*\s*(-|–|—|‒|―|‐|−)\s*(\d+)\s(\d+)\s*\/\s*(\d+)\s*("|”|″)*/i;
                //  Captures |5-2|, |8'-0|, |9-10"|, |2’–8”|, |2’–8.5”|, |2.5’−8.5”|
                var pattern_2 = /(\d+(?:\.\d+)*)\s*(\'|’|′)*\s*(-|–|—|‒|―|‐|−)\s*(\d+(?:\.\d+)*)\s*("|”|″)*/i;
                //  Captures |33 3/8|, |82 1/2"|, |4'6 1/2|
                var pattern_3 = /(?:(\d+)\s*(?:\'|’|′)\s*)*(\d+)\s(\d+)\s*\/\s*(\d+)/i;
                //  Captures |30 '|, |30'|, |30’|, |30.5 ’|, |4'6|
                var pattern_4 = /(\d+(?:\.\d+)*)\s*(?:\'|’|′)\s*(\d+(?:\.\d+)*)*/i;
                //  Captures |2 3|, |2.5 8.5|, |2 8.5|, |2' 3|, |2' 3"|
                var pattern_5 = /(\d+(?:\.\d+)*\s*(?:\'|’|′)*)\s+(\d+(?:\.\d+)*\s*("|”|″)*)/i;
                //  Captures |30|, |30 "|, |30"|, |30 ”|, |30.5 ”|
                var pattern_6 = /(\d+(?:\.\d+)*)\s*("|”|″)*/i;

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
                    result = parseFloat(match[1]) * 12 + (match[2] ? parseFloat(match[2]) : 0);
                } else if ( pattern_6.test(size_string) ) {
                    match = pattern_6.exec(size_string);
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
        math: {
            square_feet: function (width, height) {
                return parseFloat(width) * parseFloat(height) / 144;
            },
            square_meters: function (width_mm, height_mm) {
                return parseFloat(width_mm) / 1000 * parseFloat(height_mm) / 1000;
            }
        },
        convert: {
            inches_to_mm: function (inch_value) {
                return parseFloat(inch_value * 25.4);
            },
            mm_to_inches: function (mm_value) {
                return parseFloat(mm_value / 25.4);
            }
        }
    };
})();
