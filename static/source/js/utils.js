var app = app || {};

(function () {
    'use strict';

    var MAX_DENOMINATOR = 16;
    //  For numbers that are passed to Decimal constructor
    var MAX_SIGNIFICANT_DIGITS = 15;

    app.utils = {
        format: {
            dimension: function (value, decimal_format, inches_display_mode, zero_inch_display_mode) {
                var value_feet;
                var value_inches;
                var integer_part;
                var fractional_part;
                var closest_possible_fraction = 0;
                var i;

                decimal_format = decimal_format &&
                    _.indexOf(['floating', 'fraction'], decimal_format) !== -1 ?
                    decimal_format : 'floating';

                inches_display_mode = inches_display_mode &&
                    _.indexOf(['feet_and_inches', 'inches_only'], inches_display_mode) !== -1 ?
                    inches_display_mode : 'feet_and_inches';

                zero_inch_display_mode = zero_inch_display_mode &&
                    _.indexOf(['show', 'remove'], zero_inch_display_mode) !== -1 ?
                    zero_inch_display_mode : 'show';

                if ( inches_display_mode === 'feet_and_inches' ) {
                    value_feet = Math.floor(parseFloat(value) / 12);
                    value_inches = parseFloat(value) % 12;
                } else {
                    value_feet = 0;
                    value_inches = parseFloat(value);
                }

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

                        integer_part = Math.floor(value_inches);
                        fractional_part = closest_possible_fraction.toFixed(MAX_SIGNIFICANT_DIGITS);
                        value_inches = (integer_part || zero_inch_display_mode === 'show' ?
                            integer_part + ' ' : '') +
                            new Decimal(fractional_part).toFraction(MAX_DENOMINATOR).join('/');
                    }
                } else {
                    value_inches = this.fixed_minimal(value_inches, 3);
                }

                return (value_feet ? value_feet + '′−' : '' ) + value_inches + '″';
            },
            dimension_heights: function (value, decimal_format, inches_display_mode, zero_inch_display_mode) {
                var result;
                var heights = value.toString().split('|');

                if (heights.length > 1) {
                    result = this.dimension(heights[0], decimal_format, inches_display_mode, zero_inch_display_mode);
                    result += ' | ';
                    result += this.dimension(heights[1], decimal_format, inches_display_mode, zero_inch_display_mode);
                } else {
                    result = this.dimension(value, decimal_format, inches_display_mode, zero_inch_display_mode);
                }

                return result;
            },
            dimensions: function (width, height, decimal_format, inches_display_mode) {
                return this.dimension(width, decimal_format, inches_display_mode) +
                    ' x ' + this.dimension(height, decimal_format, inches_display_mode);
            },
            dimension_mm: function (value) {
                return this.fixed_minimal(value, 0) + ' mm';
            },
            dimensions_mm: function (width, height) {
                return this.fixed_minimal(width, 0) + ' x ' + this.fixed_minimal(height, 0);
            },
            //  TODO: why do we have these dimension_in and dimensions_in
            //  functions and why do we use fixed_minimal instead of dimension
            //  inside? To show stuff like square footage?
            dimension_in: function (value) {
                return this.fixed_minimal(value, 2) + '″';
            },
            dimensions_in: function (width, height) {
                return this.dimension_in(width) + ' x ' + this.dimension_in(height);
            },
            price_usd: function (price) {
                return (parseFloat(price) < 0 ? '-' : '') + '$' +
                    new Decimal(Math.abs(parseFloat(price)).toFixed(2)).toFormat(2);
            },
            percent: function (value, num) {
                num = _.isNumber(num) ? (num < MAX_SIGNIFICANT_DIGITS ? num : MAX_SIGNIFICANT_DIGITS) : 2;
                return new Decimal(parseFloat(value).toFixed(num)).toFormat() + '%';
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
            fixed_heights: function (value, num) {
                return (typeof value === 'number')
                    ? this.fixed_minimal(value, num)
                    : this.fixed_minimal(value[0], num) + ' | ' + this.fixed_minimal(value[1], num);
            },
            square_feet: function (value, num, format) {
                format = (format && _.indexOf(['normal', 'sup'], format) !== -1) ?
                    format : 'normal';
                return this.fixed_minimal(value, num) +
                       (format === 'sup' ? ' ft<sup>2</sup>' :
                       (format === 'normal') ? ' sq.ft' :
                       '');
            },
            square_meters: function (value, num, format) {
                format = (format && _.indexOf(['normal', 'sup'], format) !== -1) ?
                    format : 'sup';
                return this.fixed_minimal(value, num) + (format === 'sup' ?
                    ' m<sup>2</sup>' : ' sq.m');
            },
            weight: function (value) {
                return this.fixed_minimal(value, 3) + ' kg';
            },
            dimensions_and_area: function (
                height,
                width,
                decimal_format,
                inches_display_mode,
                area,
                area_num,
                area_format
            ) {
                decimal_format = decimal_format &&
                    _.indexOf(['floating', 'fraction'], decimal_format) !== -1 ?
                    decimal_format : 'fraction';

                inches_display_mode = inches_display_mode &&
                    _.indexOf(['feet_and_inches', 'inches_only'], inches_display_mode) !== -1 ?
                    inches_display_mode : 'inches_only';

                area_format = (area_format && _.indexOf(['normal', 'sup'], area_format) !== -1) ?
                    area_format : 'sup';

                return this.dimensions(height, width, decimal_format, inches_display_mode) +
                    ' (' + this.square_feet(area, area_num, area_format) + ')';
            },
            dimensions_and_area_mm: function (
                height,
                width,
                area,
                area_num,
                area_format
            ) {
                return this.dimensions_mm(width, height) +
                    ' (' + this.square_meters(area, area_num, area_format) + ')';
            }
        },
        parseFormat: {
            dimension: function (size_string) {
                var result;
                var match;

                //  Captures everything with mm, cm, m: |500 mm|, |6-3 m|
                var pattern_0 = /(\S*\d+)\s*(mm|cm|m)/i;
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

                if ( pattern_0.test(size_string) ) {
                    match = pattern_0.exec(size_string);
                    result = app.utils.convert.mm_to_inches(parseFloat(match[1].replace(',', '')));

                    if ( match[2] === 'cm' ) {
                        result *= 10;
                    } else if ( match[2] === 'm' ) {
                        result *= 1000;
                    }
                } else if ( pattern_1.test(size_string) ) {
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
                    height = match[2];
                } else {
                    width = this.dimension(size_string);
                    height = size_string;
                }

                if (typeof height === 'string') {
                    var heights = height.split('|');

                    if (heights.length < 2) {
                        height = this.dimension(height);
                    } else {
                        height = [this.dimension(heights[0]), this.dimension(heights[1])];

                        if (height[0] === height[1]) {
                            height = height[0];
                        }
                    }
                } else {
                    height = this.dimension(height);
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
            },
            linear_interpolation: function (x, x0, x1, y0, y1) {
                return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
            }
        },
        convert: {
            inches_to_mm: function (inch_value) {
                return parseFloat(inch_value * 25.4);
            },
            mm_to_inches: function (mm_value) {
                return parseFloat(mm_value / 25.4);
            }
        },
        object: {
            deep_extend: function (a, b) {
                if (_.isObject(a) && _.isObject(b)) {
                    for (var prop in b) {
                        if (prop in a && _.isObject(b[prop])) {
                            app.utils.object.deep_extend(a[prop], b[prop]);
                        } else {
                            a[prop] = b[prop];
                        }
                    }
                } else if ( !(_.isUndefined(b) || _.isNull(b) || _.isNaN(b)) ) {
                    a = b;
                }

                return a;
            }
        },
        vector2d: {
            getVector: function (v) {
                if (_.isObject(v) && 'x' in v && 'y' in v) {
                    return v;
                } else if (_.isArray(v) && v.length === 2) {
                    return {x: v[0], y: v[1]};
                } else if (_.isFunction(v)) {
                    return app.utils.vector2d.getVector( v() );
                } else if (_.isNumber(v)) {
                    return {x: v, y: v};
                }

                return {x: 0, y: 0};
            },
            length: function (v) {
                v = app.utils.vector2d.getVector(v);

                return Math.sqrt( Math.pow(v.x, 2) + Math.pow(v.y, 2) );
            },
            normalize: function (v) {
                v = app.utils.vector2d.getVector(v);

                var len = app.utils.vector2d.length(v);

                return {x: v.x / len, y: v.y / len };
            },
            add: function (v1, v2) {
                v1 = app.utils.vector2d.getVector(v1);
                v2 = app.utils.vector2d.getVector(v2);

                return {x: v1.x + v2.x, y: v1.y + v2.y};
            },
            substract: function (v1, v2) {
                v1 = app.utils.vector2d.getVector(v1);
                v2 = app.utils.vector2d.getVector(v2);

                return {x: v1.x - v2.x, y: v1.y - v2.y};
            },
            multiply: function (v1, v2) {
                v1 = app.utils.vector2d.getVector(v1);
                v2 = app.utils.vector2d.getVector(v2);

                return {x: v1.x * v2.x, y: v1.y * v2.y};
            },
            divide: function (v1, v2) {
                v1 = app.utils.vector2d.getVector(v1);
                v2 = app.utils.vector2d.getVector(v2);

                return {x: v1.x / v2.x, y: v1.y / v2.y};
            },
            scalar: function (v1, v2) {
                var sc = app.utils.vector2d.multiply( v1, v2 );

                return (sc.x + sc.y);
            },
            angle: function (v1, v2) {
                var scalar = app.utils.vector2d.scalar(
                    app.utils.vector2d.normalize(v1),
                    app.utils.vector2d.normalize(v2)
                );

                scalar = (scalar < -1) ? -1 : (scalar > 1) ? 1 : scalar;

                return Math.acos( scalar );
            },
            clockwiseSort: function (input) {
                var base = Math.atan2(1, 0);

                input = input.map(app.utils.vector2d.getVector);

                return input.sort(function (a, b) {
                    return Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x) +
                            (Math.atan2(b.y, b.x) > base ? -2 * Math.PI : 0) +
                            (Math.atan2(a.y, a.x) > base ? 2 * Math.PI : 0);
                });
            },
            points_to_vectors: function (points, center) {
                var result = [];

                _.each(points, function (point) {
                    var p = {
                        x: point.x - center.x,
                        y: point.y - center.y
                    };

                    p.y *= -1; // switch coordinate system

                    result.push(p);
                });

                return result;
            },
            vectors_to_points: function (points, center) {
                var result = [];

                _.each(points, function (point) {
                    var p = {
                        x: point.x + center.x,
                        y: (point.y * -1) + center.y
                    };

                    result.push(p);
                });

                return result;
            }
        },
        angle: {
            rad_to_deg: function (rad) {
                return rad * 180 / Math.PI;
            },
            deg_to_rad: function (deg) {
                return deg * Math.PI / 180;
            }
        },
        geometry: {
            intersectCircleLine: function (c, r, a1, a2, leave) {
                // From lib: http://www.kevlindev.com/gui/math/intersection/#Anchor-intersectCircleLin-40934
                // Modified for our task
                function lerp(p1, p2, t) {
                    return {
                        x: p1.x + (p2.x - p1.x) * t,
                        y: p1.y + (p2.y - p1.y) * t
                    };
                }

                var result = (leave) ? [a2, a1] : [];
                var a = (a2.x - a1.x) * (a2.x - a1.x) +
                        (a2.y - a1.y) * (a2.y - a1.y);
                var b = 2 * ( (a2.x - a1.x) * (a1.x - c.x) +
                              (a2.y - a1.y) * (a1.y - c.y) );
                var cc = c.x * c.x + c.y * c.y + a1.x * a1.x + a1.y * a1.y -
                         2 * (c.x * a1.x + c.y * a1.y) - r * r;
                var deter = b * b - 4 * a * cc;

                if ( deter > 0 ) {
                    var e = Math.sqrt(deter);
                    var u1 = ( -b + e ) / ( 2 * a );
                    var u2 = ( -b - e ) / ( 2 * a );

                    if ( !((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) ) {
                        var obj;

                        if ( u1 >= 0 && u1 <= 1) {
                            obj = lerp(a1, a2, u1);
                            obj.intersects = true;

                            result[0] = obj;
                        }

                        if ( u2 >= 0 && u2 <= 1) {
                            obj = lerp(a1, a2, u2);
                            obj.intersects = true;
                            result[1] = obj;
                        }
                    }
                }

                return result;
            }
        },
        array: {
            moveByIndex: function (array, old_index, new_index) {
                while (old_index < 0) {
                    old_index += array.length;
                }

                while (new_index < 0) {
                    new_index += array.length;
                }

                if (new_index >= array.length) {
                    var k = new_index - array.length;

                    while ((k--) + 1) {
                        array.push(undefined);
                    }
                }

                array.splice(new_index, 0, array.splice(old_index, 1)[0]);
                return array;
            },
            moveByValue: function (array, findVal, targetVal, after) {
                after = after || false;

                var fi = array.indexOf(findVal);
                var ti = array.indexOf(targetVal);

                if (fi !== -1 && ti !== -1) {
                    if (after && ti !== array.length) {
                        ti++;
                    }

                    array.splice(ti, 0, array.splice(fi, 1)[0]);
                }

                return array;
            }
        }
    };
})();
