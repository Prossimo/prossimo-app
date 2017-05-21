import _ from 'underscore';
import clone from 'clone';
import Decimal from 'decimal.js';

const MAX_DENOMINATOR = 16;
//  For numbers that are passed to Decimal constructor
const MAX_SIGNIFICANT_DIGITS = 15;

export const convert = {
    inches_to_mm(inch_value) {
        return parseFloat(inch_value * 25.4);
    },
    mm_to_inches(mm_value) {
        return parseFloat(mm_value / 25.4);
    },
};

export const format = {
    dimension(value, decimal_format, inches_display_mode, zero_inch_display_mode) {
        const current_decimal_format = _.contains(['floating', 'fraction'], decimal_format) ? decimal_format : 'floating';
        const current_inches_display_mode = _.contains(['feet_and_inches', 'inches_only'], inches_display_mode) ?
            inches_display_mode :
            'feet_and_inches';
        const current_zero_inch_display_mode = _.contains(['show', 'remove'], zero_inch_display_mode) ? zero_inch_display_mode : 'show';

        let value_feet;
        let value_inches;
        let integer_part;
        let fractional_part;
        let closest_possible_fraction = 0;

        if (current_inches_display_mode === 'feet_and_inches') {
            value_feet = Math.floor(parseFloat(value) / 12);
            value_inches = parseFloat(value) % 12;
        } else {
            value_feet = 0;
            value_inches = parseFloat(value);
        }

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
        if (value_inches === 12) {
            value_feet += 1;
            value_inches = 0;
        }

        if (current_decimal_format === 'fraction') {
            if (value_inches - Math.floor(value_inches)) {
                fractional_part = (value_inches - Math.floor(value_inches));

                //  We want to only have denominators from the list:
                //  [2, 4, 8, 16], so we select the closest fraction
                //  with denominator from this list and use it
                for (let i = 1; i < MAX_DENOMINATOR; i += 1) {
                    const i_fraction = i / MAX_DENOMINATOR;

                    if (
                        Math.abs(fractional_part - i_fraction) <
                        Math.abs(fractional_part - closest_possible_fraction)
                    ) {
                        closest_possible_fraction = i_fraction;
                    }
                }

                integer_part = Math.floor(value_inches);
                fractional_part = closest_possible_fraction.toFixed(MAX_SIGNIFICANT_DIGITS);
                value_inches = (integer_part || current_zero_inch_display_mode === 'show' ?
                    `${integer_part} ` : '') +
                    new Decimal(fractional_part).toFraction(MAX_DENOMINATOR).join('/');
            }
        } else {
            value_inches = this.fixed_minimal(value_inches, 3);
        }

        return `${(value_feet ? `${value_feet}′−` : '') + value_inches}″`;
    },
    dimension_heights(value, decimal_format, inches_display_mode, zero_inch_display_mode) {
        let result;
        const heights = value.toString().split('|');

        if (heights.length > 1) {
            result = this.dimension(heights[0], decimal_format, inches_display_mode, zero_inch_display_mode);
            result += ' | ';
            result += this.dimension(heights[1], decimal_format, inches_display_mode, zero_inch_display_mode);
        } else {
            result = this.dimension(value, decimal_format, inches_display_mode, zero_inch_display_mode);
        }

        return result;
    },
    dimensions(width, height, decimal_format, inches_display_mode) {
        return `${this.dimension(width, decimal_format, inches_display_mode)
            } × ${this.dimension(height, decimal_format, inches_display_mode)}`;
    },
    //  Includes a non-breaking space character
    dimension_mm(value) {
        return `${this.fixed_minimal(value, 0)}\u00A0mm`;
    },
    dimensions_mm(width, height) {
        return `${this.fixed_minimal(width, 0)} × ${this.fixed_minimal(height, 0)}`;
    },
    //  TODO: why do we have these dimension_in and dimensions_in
    //  functions and why do we use fixed_minimal instead of dimension
    //  inside? To show stuff like square footage?
    dimension_in(value) {
        return `${this.fixed_minimal(value, 2)}″`;
    },
    dimensions_in(width, height) {
        return `${this.dimension_in(width)} × ${this.dimension_in(height)}`;
    },
    price_usd(price) {
        return `${parseFloat(price) < 0 ? '-' : ''}$${
            new Decimal(Math.abs(parseFloat(price)).toFixed(2)).toFormat(2)}`;
    },
    percent(value, num) {
        const current_num = _.isNumber(num) ? Math.min(num, MAX_SIGNIFICANT_DIGITS) : 2;

        return `${new Decimal(parseFloat(value).toFixed(current_num)).toFormat()}%`;
    },
    percent_difference(value, num) {
        const result = this.percent(value, num);

        return result === '0%' || result.indexOf('-') !== -1 ? result : `+${result}`;
    },
    fixed(value, num) {
        const current_num = _.isNumber(num) ? Math.min(num, MAX_SIGNIFICANT_DIGITS) : 2;

        return new Decimal(parseFloat(value).toFixed(current_num)).toFormat(current_num);
    },
    fixed_minimal(value, num) {
        let result;
        let match;
        let trailing;

        //  Captures all trailing zeroes (and a preceding dot if any)
        const pattern = /\.(?:[123456789]+)([0]+)|(\.[0]+)\b/i;

        result = this.fixed(value, num);

        if (pattern.test(result)) {
            match = pattern.exec(result);
            trailing = match[1] ? match[1] : match[2];
            result = result.substr(0, result.length - trailing.length);
        }

        return result;
    },
    fixed_heights(value, num) {
        return _.isArray(value) ?
            `${this.fixed_minimal(value[0], num)} | ${this.fixed_minimal(value[1], num)}` :
            this.fixed_minimal(value, num);
    },
    //  Includes a non-breaking space character
    square_feet(value, num, suffix_format) {
        const current_suffix_format = _.contains(['normal', 'sup'], suffix_format) ? suffix_format : 'normal';
        const current_suffx = current_suffix_format === 'sup' ? '\u00A0ft<sup>2</sup>' : '\u00A0sq.ft';

        return this.fixed_minimal(value, num) + current_suffx;
    },
    //  Includes a non-breaking space character
    square_meters(value, num, suffix_format) {
        const current_suffix_format = _.contains(['normal', 'sup'], suffix_format) ? suffix_format : 'sup';

        return this.fixed_minimal(value, num) + (current_suffix_format === 'sup' ? '\u00A0m<sup>2</sup>' : '\u00A0sq.m');
    },
    //  Includes a non-breaking space character
    cubic_meters(value, num, suffix_format) {
        const current_suffix_format = _.contains(['normal', 'sup'], suffix_format) ? suffix_format : 'sup';

        return this.fixed_minimal(value, num) + (current_suffix_format === 'sup' ? '\u00A0m<sup>3</sup>' : '\u00A0cub.m.');
    },
    //  Includes a non-breaking space character
    weight(value) {
        return `${this.fixed_minimal(value, 3)}\u00A0kg`;
    },
    dimensions_and_area(
        width,
        height,
        decimal_format,
        inches_display_mode,
        area,
        area_num,
        area_format,
    ) {
        const current_decimal_format = _.contains(['floating', 'fraction'], decimal_format) ? decimal_format : 'fraction';
        const current_inches_display_mode = _.contains(['feet_and_inches', 'inches_only'], inches_display_mode) ?
            inches_display_mode :
            'inches_only';
        const current_area_format = _.contains(['normal', 'sup'], area_format) ? area_format : 'sup';

        return `${this.dimensions(width, height, current_decimal_format, current_inches_display_mode)
            } (${this.square_feet(area, area_num, current_area_format)})`;
    },
    dimensions_and_area_mm(
        width,
        height,
        area,
        area_num,
        area_format,
    ) {
        return `${this.dimensions_mm(width, height)
            } (${this.square_meters(area, area_num, area_format)})`;
    },
    //  Includes a non-breaking space character
    fileSize(size_in_bytes) {
        const suffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        let current_size_in_bytes = size_in_bytes;
        let counter = 0;

        while (parseFloat(current_size_in_bytes) >= 1024) {
            current_size_in_bytes = parseFloat(current_size_in_bytes) / 1024;
            counter += 1;
        }

        return suffixes[counter] ?
            `${this.fixed_minimal(current_size_in_bytes, counter < 2 ? 0 : 1)}\u00A0${suffixes[counter]}` :
            'Ovflw.';
    },
};

export const parseFormat = {
    dimension(size_string) {
        let result;
        let match;

        //  Captures everything with mm, cm, m: |500 mm|, |6-3 m|
        const pattern_0 = /(\S*\d+)\s*(mm|cm|m)/i;
        //  Captures |6'-2 1/2"|, |6 - 2 1/2|
        const pattern_1 = /(\d+)\s*('|’|′)*\s*(-|–|—|‒|―|‐|−)\s*(\d+)\s(\d+)\s*\/\s*(\d+)\s*("|”|″)*/i;
        //  Captures |5-2|, |8'-0|, |9-10"|, |2’–8”|, |2’–8.5”|, |2.5’−8.5”|
        const pattern_2 = /(\d+(?:\.\d+)*)\s*('|’|′)*\s*(-|–|—|‒|―|‐|−)\s*(\d+(?:\.\d+)*)\s*("|”|″)*/i;
        //  Captures |33 3/8|, |82 1/2"|, |4'6 1/2|
        const pattern_3 = /(?:(\d+)\s*(?:'|’|′)\s*)*(\d+)\s(\d+)\s*\/\s*(\d+)/i;
        //  Captures |30 '|, |30'|, |30’|, |30.5 ’|, |4'6|
        const pattern_4 = /(\d+(?:\.\d+)*)\s*(?:'|’|′)\s*(\d+(?:\.\d+)*)*/i;
        //  Captures |2 3|, |2.5 8.5|, |2 8.5|, |2' 3|, |2' 3"|
        const pattern_5 = /(\d+(?:\.\d+)*\s*(?:'|’|′)*)\s+(\d+(?:\.\d+)*\s*("|”|″)*)/i;
        //  Captures |30|, |30 "|, |30"|, |30 ”|, |30.5 ”|
        const pattern_6 = /(\d+(?:\.\d+)*)\s*("|”|″)*/i;

        if (pattern_0.test(size_string)) {
            match = pattern_0.exec(size_string);
            result = convert.mm_to_inches(parseFloat(match[1].replace(',', '')));

            if (match[2] === 'cm') {
                result *= 10;
            } else if (match[2] === 'm') {
                result *= 1000;
            }
        } else if (pattern_1.test(size_string)) {
            match = pattern_1.exec(size_string);
            result = (parseFloat(match[1]) * 12) + parseFloat(match[4]) + (parseFloat(match[5]) / parseFloat(match[6]));
        } else if (pattern_2.test(size_string)) {
            match = pattern_2.exec(size_string);
            result = (parseFloat(match[1]) * 12) + parseFloat(match[4]);
        } else if (pattern_3.test(size_string)) {
            match = pattern_3.exec(size_string);
            result = (match[1] ? match[1] * 12 : 0) + parseFloat(match[2]) + (parseFloat(match[3]) / parseFloat(match[4]));
        } else if (pattern_4.test(size_string)) {
            match = pattern_4.exec(size_string);
            result = (parseFloat(match[1]) * 12) + (match[2] ? parseFloat(match[2]) : 0);
        } else if (pattern_5.test(size_string)) {
            match = pattern_5.exec(size_string);
            result = (parseFloat(match[1]) * 12) + (match[2] ? parseFloat(match[2]) : 0);
        } else if (pattern_6.test(size_string)) {
            match = pattern_6.exec(size_string);
            result = match[1];
        } else {
            result = size_string;
        }

        return parseFloat(result);
    },
    dimensions(size_string, attr) {
        const current_attr = _.contains(['both', 'width', 'height'], attr) ? attr : 'both';

        let width;
        let height;
        let result;
        let match;

        const pattern = /(\S+(?:\s*\S*)*)\s*(?:x|X|✕|✖)\s*(\S+(?:\s*\S*)*)/i;

        if (pattern.test(size_string)) {
            match = pattern.exec(size_string);
            width = this.dimension(match[1]);
            height = match[2];
        } else {
            width = this.dimension(size_string);
            height = size_string;
        }

        if (typeof height === 'string') {
            const heights = height.split('|');

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

        if (current_attr === 'width') {
            result = width;
        } else if (current_attr === 'height') {
            result = height;
        } else {
            result = {
                width,
                height,
            };
        }

        return result;
    },
    percent(string) {
        return parseFloat(string);
    },
};

export const math = {
    square_feet(width, height) {
        return (parseFloat(width) * parseFloat(height)) / 144;
    },
    square_meters(width_mm, height_mm) {
        return (parseFloat(width_mm) * parseFloat(height_mm)) / (1000 * 1000);
    },
    cubic_meters(width_mm, height_mm, depth_mm) {
        return (parseFloat(width_mm) * parseFloat(height_mm) * parseFloat(depth_mm)) / (1000 * 1000 * 1000);
    },
    linear_interpolation(x, x0, x1, y0, y1) {
        return y0 + ((y1 - y0) * ((x - x0) / (x1 - x0)));
    },
};

export const object = {
    deep_extend(a, b) {
        const cloned_b = clone(b);
        let cloned_a = clone(a);

        if (_.isObject(cloned_a) && _.isObject(cloned_b)) {
            Object.keys(cloned_b).forEach((prop) => {
                if (prop in cloned_a && _.isObject(cloned_b[prop])) {
                    object.deep_extend(cloned_a[prop], cloned_b[prop]);
                } else {
                    cloned_a[prop] = cloned_b[prop];
                }
            });
        } else if (!(_.isUndefined(cloned_b) || _.isNull(cloned_b) || _.isNaN(cloned_b))) {
            cloned_a = cloned_b;
        }

        return cloned_a;
    },
    extractObjectOrNull(data_object) {
        let result = null;

        if (typeof data_object === 'string') {
            try {
                result = JSON.parse(data_object);
            } catch (e) {
                // Do nothing
            }
        //  For regular objects and arrays
        } else if (typeof data_object === 'object') {
            result = data_object;
        }

        return result;
    },
};

export const vector2d = {
    getVector(v) {
        if (_.isObject(v) && 'x' in v && 'y' in v) {
            return v;
        } else if (_.isArray(v) && v.length === 2) {
            return { x: v[0], y: v[1] };
        } else if (_.isFunction(v)) {
            return vector2d.getVector(v());
        } else if (_.isNumber(v)) {
            return { x: v, y: v };
        }

        return { x: 0, y: 0 };
    },
    length(v) {
        const vector = vector2d.getVector(v);

        return Math.sqrt((vector.x ** 2) + (vector.y ** 2));
    },
    normalize(v) {
        const vector = vector2d.getVector(v);
        const len = vector2d.length(vector);

        return { x: vector.x / len, y: vector.y / len };
    },
    add(v1, v2) {
        const vector1 = vector2d.getVector(v1);
        const vector2 = vector2d.getVector(v2);

        return { x: vector1.x + vector2.x, y: vector1.y + vector2.y };
    },
    substract(v1, v2) {
        const vector1 = vector2d.getVector(v1);
        const vector2 = vector2d.getVector(v2);

        return { x: vector1.x - vector2.x, y: vector1.y - vector2.y };
    },
    multiply(v1, v2) {
        const vector1 = vector2d.getVector(v1);
        const vector2 = vector2d.getVector(v2);

        return { x: vector1.x * vector2.x, y: vector1.y * vector2.y };
    },
    divide(v1, v2) {
        const vector1 = vector2d.getVector(v1);
        const vector2 = vector2d.getVector(v2);

        return { x: vector1.x / vector2.x, y: vector1.y / vector2.y };
    },
    scalar(v1, v2) {
        const sc = vector2d.multiply(v1, v2);

        return (sc.x + sc.y);
    },
    angle(v1, v2) {
        let scalar = vector2d.scalar(
            vector2d.normalize(v1),
            vector2d.normalize(v2),
        );

        //  Make sure scalar is between -1 and 1
        scalar = Math.max(-1, Math.min(scalar, 1));

        return Math.acos(scalar);
    },
    clockwiseSort(input) {
        const base = Math.atan2(1, 0);
        const input_mapped = input.map(vector2d.getVector);

        return input_mapped.sort((a, b) =>
            (Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x)) +
            (Math.atan2(b.y, b.x) > base ? -2 * Math.PI : 0) +
            (Math.atan2(a.y, a.x) > base ? 2 * Math.PI : 0));
    },
    points_to_vectors(points, center) {
        const result = [];

        _.each(points, (point) => {
            const p = {
                x: point.x - center.x,
                y: point.y - center.y,
            };

            p.y *= -1; // switch coordinate system

            result.push(p);
        });

        return result;
    },
    vectors_to_points(points, center) {
        const result = [];

        _.each(points, (point) => {
            const p = {
                x: point.x + center.x,
                y: (point.y * -1) + center.y,
            };

            result.push(p);
        });

        return result;
    },
};

export const angle = {
    rad_to_deg(rad) {
        return rad * (180 / Math.PI);
    },
    deg_to_rad(deg) {
        return deg * (Math.PI / 180);
    },
};

export const geometry = {
    intersectCircleLine(c, r, a1, a2, leave) {
        // From lib: http://www.kevlindev.com/gui/math/intersection/#Anchor-intersectCircleLin-40934
        // Modified for our task
        function lerp(p1, p2, t) {
            return {
                x: p1.x + ((p2.x - p1.x) * t),
                y: p1.y + ((p2.y - p1.y) * t),
            };
        }

        const result = (leave) ? [a2, a1] : [];
        const a = ((a2.x - a1.x) * (a2.x - a1.x)) + ((a2.y - a1.y) * (a2.y - a1.y));
        const b = 2 * (((a2.x - a1.x) * (a1.x - c.x)) + ((a2.y - a1.y) * (a1.y - c.y)));
        const cc = ((c.x * c.x) + (c.y * c.y) + (a1.x * a1.x) + (a1.y * a1.y)) - (2 * ((c.x * a1.x) + (c.y * a1.y))) - (r * r);
        const deter = (b * b) - (4 * a * cc);

        if (deter > 0) {
            const e = Math.sqrt(deter);
            const u1 = (-b + e) / (2 * a);
            const u2 = (-b - e) / (2 * a);

            if (!((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1))) {
                let obj;

                if (u1 >= 0 && u1 <= 1) {
                    obj = lerp(a1, a2, u1);
                    obj.intersects = true;

                    result[0] = obj;
                }

                if (u2 >= 0 && u2 <= 1) {
                    obj = lerp(a1, a2, u2);
                    obj.intersects = true;
                    result[1] = obj;
                }
            }
        }

        return result;
    },
};

export const array = {
    moveByValue(arr, findVal, targetVal, after) {
        const current_after = after || false;

        const fi = arr.indexOf(findVal);
        let ti = arr.indexOf(targetVal);

        if (fi !== -1 && ti !== -1) {
            if (current_after && ti !== arr.length) {
                ti += 1;
            }

            arr.splice(ti, 0, arr.splice(fi, 1)[0]);
        }

        return arr;
    },
};

export const dom = {
    isElementVisible(element) {
        if (!element) { return undefined; }

        let opacity = 1;
        window.jQuery(element).parents().andSelf().each((index, elem) => {
            opacity *= window.jQuery(elem).css('opacity') || 1;
        });
        const isVisible = element.clientHeight && opacity;

        return isVisible;
    },
};

export default { format, parseFormat, math, convert, object, vector2d, angle, geometry, array, dom };
