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
                center = center || {x: 0, y: 0};

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
                center = center || {x: 0, y: 0};

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
            },
            getLineMidpoint: function (pointA, pointB) {
                return {
                    x: (pointA.x + pointB.x) / 2,
                    y: (pointA.y + pointB.y) / 2
                };
            },
            getClosestPoints: function (points) {
                var point1 = null;
                var point2 = null;
                var distance = null;

                // we will loop through all of the points
                for (var i = 0; i < points.length; i = i + 1) {
                    // compare this point with all of the points ahead of it in the array
                    for (var j = i + 1; j < points.length; j = j + 1) {
                        // compute distance using distance formula
                        var curr = Math.sqrt(
                            Math.pow(points[i][0] - points[j][0], 2) +
                            Math.pow(points[i][1] - points[j][1], 2)
                        );

                        // compare this with our shortest distance
                        // or set it if it's the first time we run
                        if (distance === null || curr < distance) {
                            distance = curr;
                            point1 = points[i];
                            point2 = points[j];
                        }
                    }
                }

                // point1 and point2 hold the closest points
                // distance is the distance between the two points
                return {
                    point1: point1,
                    point2: point2,
                    distance: distance
                };
            }
        },
        convex_hull: {
            // From https://github.com/mgomes/ConvexHull
            // Modified for our project
            compareX: function (a, b) {
                return a.x - b.x;
            },
            compareY: function (a, b) {
                return a.y - b.y;
            },
            // isLeft(): tests if a point is Left|On|Right of an infinite line.
            //    Input:  three points P0, P1, and P2
            //    Return: >0 for P2 left of the line through P0 and P1
            //            =0 for P2 on the line
            //            <0 for P2 right of the line
            isLeft: function (P0, P1, P2) {
                return (P1.x - P0.x) * (P2.y - P0.y) - (P2.x - P0.x) * (P1.y - P0.y);
            },
            // find(): A.M. Andrew's monotone chain 2D convex hull algorithm
            // http://softsurfer.com/Archive/algorithm_0109/algorithm_0109.htm
            //
            //     Input:  P[] = an array of 2D points
            //                   presorted by increasing x- and y-coordinates
            //             n = the number of points in P[]
            //     Return: H = an array of hull points
            find: function (P, n) {
                n = n || P.length;

                var H = [];

                // the output array H[] will be used as the stack
                var bot = 0;
                var top = (-1); // indices for bottom and top of the stack
                var i; // array scan index
                // Get the indices of points with min x-coord and min|max y-coord
                var minmin = 0;
                var minmax;
                var xmin = P[0].x;

                for (i = 1; i < n; i++) {
                    if (P[i].x !== xmin) {
                        break;
                    }
                }

                minmax = i - 1;

                if (minmax === n - 1) { // degenerate case: all x-coords == xmin
                    H[++top] = P[minmin];

                    if (P[minmax].y !== P[minmin].y) {// a nontrivial segment
                        H[++top] = P[minmax];
                    }

                    H[++top] = P[minmin]; // add polygon endpoint
                    return H;
                }

                // Get the indices of points with max x-coord and min|max y-coord
                var maxmin;
                var maxmax = n - 1;
                var xmax = P[n - 1].x;

                for (i = n - 2; i >= 0; i--) {
                    if (P[i].x !== xmax) {
                        break;
                    }
                }

                maxmin = i + 1;

                // Compute the lower hull on the stack H
                H[++top] = P[minmin]; // push minmin point onto stack
                i = minmax;

                while (++i <= maxmin) {
                    // the lower line joins P[minmin] with P[maxmin]
                    if (app.utils.convex_hull.isLeft(P[minmin], P[maxmin], P[i]) >= 0 && i < maxmin) {
                        continue; // ignore P[i] above or on the lower line
                    }

                    while (top > 0) { // there are at least 2 points on the stack
                        // test if P[i] is left of the line at the stack top
                        if (app.utils.convex_hull.isLeft(H[top - 1], H[top], P[i]) > 0) {
                            break; // P[i] is a new hull vertex
                        } else {
                            top--; // pop top point off stack
                        }
                    }

                    H[++top] = P[i]; // push P[i] onto stack
                }

                // Next, compute the upper hull on the stack H above the bottom hull
                if (maxmax !== maxmin) { // if distinct xmax points
                    H[++top] = P[maxmax]; // push maxmax point onto stack
                }

                bot = top; // the bottom point of the upper hull stack
                i = maxmin;

                while (--i >= minmax) {
                    // the upper line joins P[maxmax] with P[minmax]
                    if (app.utils.convex_hull.isLeft(P[maxmax], P[minmax], P[i]) >= 0 && i > minmax) {
                        continue; // ignore P[i] below or on the upper line
                    }

                    while (top > bot) { // at least 2 points on the upper stack
                        // test if P[i] is left of the line at the stack top
                        if (app.utils.convex_hull.isLeft(H[top - 1], H[top], P[i]) > 0) {
                            break;  // P[i] is a new hull vertex
                        } else {
                            top--; // pop top point off stack
                        }
                    }

                    if (P[i].x === H[0].x && P[i].y === H[0].y) {
                        return H; // special case (mgomes)
                    }

                    H[++top] = P[i]; // push P[i] onto stack
                }

                if (minmax !== minmin) {
                    H[++top] = P[minmin]; // push joining endpoint onto stack
                }

                return H;
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
