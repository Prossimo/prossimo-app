import _ from 'underscore';

import {
    angle,
    convert,
    format,
    math,
    parseFormat,
    vector2d,
    array,
    multiunit,
} from '../../src/utils';

test('Utils.js tests: ', () => {
    //  ------------------------------------------------------------------------
    //  Test convert functions from utils.js
    //  ------------------------------------------------------------------------
    test('convert', () => {
        test('inches_to_mm', () => {
            equal(convert.inches_to_mm(20), 508, 'Expected value is 508');
            equal(convert.inches_to_mm(1), 25.4, 'Expected value is 25.4');
            equal(convert.inches_to_mm(0), 0, 'Expected value is 0');
        });

        test('mm_to_inches', () => {
            equal(convert.mm_to_inches(508), 20, 'Expected value is 20');
            equal(convert.mm_to_inches(25.4), 1, 'Expected value is 1');
            equal(convert.mm_to_inches(0), 0, 'Expected value is 0');
        });

        test('number_to_letters', () => {
            equal(convert.number_to_letters(0), '', 'Expected value is an empty string');
            equal(convert.number_to_letters(1), 'a', 'Expected value is a');
            equal(convert.number_to_letters(12), 'l', 'Expected value is l');
            equal(convert.number_to_letters(26), 'z', 'Expected value is z');
            equal(convert.number_to_letters(27), 'aa', 'Expected value is aa');
            equal(convert.number_to_letters(26 * 2), 'az', 'Expected value is az');
            equal(convert.number_to_letters((26 * 2) + 1), 'ba', 'Expected value is ba');
            equal(convert.number_to_letters(26 * 27), 'zz', 'Expected value is zz');
        });
    });

    //  ------------------------------------------------------------------------
    //  Test format functions from utils.js
    //  ------------------------------------------------------------------------
    test('format', () => {
        test('dimension', () => {
            const f = format;

            equal(f.dimension(20), '1′−8″', 'Expected value is 1′−8″');
            equal(f.dimension(30.5), '2′−6.5″', 'Expected value is 2′−6.5″');
            equal(f.dimension(33.375), '2′−9.375″', 'Expected value is 2′−9.375″');

            equal(f.dimension(62), '5′−2″', 'Expected value is 5′−2″');
            equal(f.dimension(33.375, 'fraction'), '2′−9 3/8″', 'Expected value is 2′−9 3/8″');
            equal(f.dimension(50 + (1 / 14), 'fraction'), '4′−2 1/16″', 'Expected value is 4′−2 1/16″');
            equal(f.dimension(50 + (1 / 7), 'fraction'), '4′−2 1/8″', 'Expected value is 4′−2 1/8″');
            equal(f.dimension(50 + (1 / 3), 'fraction'), '4′−2 5/16″', 'Expected value is 4′−2 5/16″');
            equal(f.dimension(50 + (1 / 2), 'fraction'), '4′−2 1/2″', 'Expected value is 4′−2 1/2″');
            equal(f.dimension(50 + (3 / 8), 'fraction'), '4′−2 3/8″', 'Expected value is 4′−2 3/8″');
            equal(f.dimension(50 + (3 / 7), 'fraction'), '4′−2 7/16″', 'Expected value is 4′−2 7/16″');

            equal(f.dimension(50.7959183673469354, 'fraction'), '4′−2 13/16″', 'Expected not to fail with Decimal error');
            equal(f.dimension(30.979591836734695, 'fraction'), '2′−7″', 'Expected not to return 2′−6 1/1″');
            equal(f.dimension(23.99, 'fraction'), '2′−0″', 'Expected not to return 1′−12″');
            equal(f.dimension(23.96875, 'fraction'), '2′−0″', 'Expected not to return 1′−12″ or 1′−11 1/1″');

            equal(f.dimension(50 + (3 / 7), 'fraction', 'feet_plus_inches'), '4′−2 7/16″', 'Expected value is 4′−2 7/16″');
            equal(f.dimension(50 + (3 / 7), 'fraction', 'inches_only'), '50 7/16″', 'Expected value is 50 7/16″');
            equal(f.dimension(62, 'fraction', 'inches_only'), '62″', 'Expected value is 62″');
            equal(f.dimension(33.375, null, 'inches_only'), '33.375″', 'Expected value is 33.375″');

            equal(f.dimension(0.472, 'fraction', null, 'remove'), '1/2″', 'Expected value is 1/2″');
            equal(f.dimension(0.472, 'fraction', null, 'show'), '0 1/2″', 'Expected value is 0 1/2″');

            equal(f.dimension(47.99999, null, 'fraction'), '4′−0″', 'Expected to return 4-0, not 3-12');
        });

        test('dimensions', () => {
            const f = format;

            equal(f.dimensions(20, 30), '1′−8″ × 2′−6″', 'Expected value is 1′−8″ × 2′−6″');
            equal(f.dimensions(0, 0), '0″ × 0″', 'Expected value is 0′−0″ × 0′−0″');
            equal(f.dimensions(12, 12), '1′−0″ × 1′−0″', 'Expected value is 1′−0″ × 1′−0″');
            equal(f.dimensions('12', '12'), '1′−0″ × 1′−0″', 'Expected value is 1′−0″ × 1′−0″');
        });

        test('dimension_mm', () => {
            const f = format;

            equal(f.dimension_mm(2500), '2,500\u00A0mm', 'Expected value is 2,500 mm');
            equal(f.dimension_mm(33.3), '33\u00A0mm', 'Expected value is 33 mm');
        });

        test('dimensions_mm', () => {
            const f = format;

            equal(f.dimensions_mm(2500, 1300), '2,500 × 1,300', 'Expected value is 2,500 × 1,300');
        });

        test('dimension_in', () => {
            const f = format;

            equal(f.dimension_in(14), '14″', 'Expected value is 14″');
            equal(f.dimension_in(28.35), '28.35″', 'Expected value is 28.35″');
        });

        test('dimensions_in', () => {
            const f = format;

            equal(f.dimensions_in(38.14, 22), '38.14″ × 22″', 'Expected value is 38.14″ × 22″');
        });

        test('price_usd', () => {
            const f = format;

            equal(f.price_usd(30), '$30.00', 'Expected value is $30.00');
            equal(f.price_usd(30.5), '$30.50', 'Expected value is $30.50');
            equal(f.price_usd('30.5'), '$30.50', 'Expected value is $30.50');
            equal(f.price_usd(0), '$0.00', 'Expected value is $0.00');
            equal(f.price_usd(-140), '-$140.00', 'Expected value is -$140.00');
        });

        test('percent', () => {
            const f = format;

            equal(f.percent(20), '20%', 'Expected value is 20%');
            equal(f.percent(20.5), '20.5%', 'Expected value is 20.5%');
            equal(f.percent(14.13), '14.13%', 'Expected value is 14.13%');
            equal(f.percent(14.13, 1), '14.1%', 'Expected value is 14.1%');
            equal(f.percent(14.13, 0), '14%', 'Expected value is 14%');
            equal(f.percent(0), '0%', 'Expected value is 0%');
        });

        test('fixed', () => {
            const f = format;

            equal(f.fixed(0.5, 5), '0.50000', 'Expected value is 0.50000');
            equal(f.fixed(20), '20.00', 'Expected value is 20.00');
            equal(f.fixed(0), '0.00', 'Expected value is 0.00');
            equal(f.fixed(0.5510204081632679, 25), '0.551020408163268', 'Expected not to fail with Decimal error');
        });

        test('square_feet', () => {
            const f = format;

            equal(f.square_feet(12), '12\u00A0sq.ft', 'Expected value is 12 sq.ft');
            equal(f.square_feet(4.55), '4.55\u00A0sq.ft', 'Expected value is 4.55 sq.ft');

            equal(f.square_feet(4.55, 2, 'sup'), '4.55\u00A0ft<sup>2</sup>', 'Expected value is 4.55 ft<sup>2</sup>');
        });

        test('square_meters', () => {
            const f = format;

            equal(f.square_meters(12), '12\u00A0m<sup>2</sup>', 'Expected value is 12 m<sup>2</sup>');
            equal(f.square_meters(4.55), '4.55\u00A0m<sup>2</sup>', 'Expected value is 4.55 m<sup>2</sup>');
        });

        test('dimensions_and_area', () => {
            const f = format;

            equal(
                f.dimensions_and_area(26, 32.0625, 'fraction', 'inches_only', 5.78, 2, 'sup'),
                '26″ × 32 1/16″ (5.78\u00A0ft<sup>2</sup>)',
                'Test with all values set the same way as defaults',
            );
            equal(
                f.dimensions_and_area(26, 32.0625, undefined, undefined, 5.78, undefined, undefined),
                '26″ × 32 1/16″ (5.78\u00A0ft<sup>2</sup>)',
                'Test with no formatting-related values set, and defaults used instead',
            );
        });

        test('dimensions_and_area_mm', () => {
            const f = format;

            equal(
                f.dimensions_and_area_mm(722, 417, 0.301, 2, 'sup'),
                '722 × 417 (0.3\u00A0m<sup>2</sup>)',
                'Test with all values set the same way as defaults',
            );
            equal(
                f.dimensions_and_area_mm(722, 417, 0.301, undefined, undefined),
                '722 × 417 (0.3\u00A0m<sup>2</sup>)',
                'Test with no formatting-related values set, and defaults used instead',
            );
        });

        test('fileSize', () => {
            const f = format;

            equal(f.fileSize(0), '0\u00A0B', 'Expected 0 B');
            equal(f.fileSize(678), '678\u00A0B', 'Expected 678 B');
            equal(f.fileSize(96085), '94\u00A0KB', 'Expected 94 KB');
            equal(f.fileSize(437575), '427\u00A0KB', 'Expected 427 KB');
            equal(f.fileSize(5867777), '5.6\u00A0MB', 'Expected 5.6 MB');
        });
    });

    //  ------------------------------------------------------------------------
    //  Test parseFormat functions from utils.js
    //  ------------------------------------------------------------------------
    test('parseFormat', () => {
        test('dimension', () => {
            const p = parseFormat;

            equal(p.dimension(' 30 '), 30, 'Expected value is 30');
            equal(p.dimension('30 "'), 30, 'Expected value is 30');
            equal(p.dimension('30 ”'), 30, 'Expected value is 30');
            equal(p.dimension('30"'), 30, 'Expected value is 30');
            equal(p.dimension('30.5 ”'), 30.5, 'Expected value is 30.5');
            equal(p.dimension('4.5 ”'), 4.5, 'Expected value is 4.5');
            equal(p.dimension('192 "'), 192, 'Expected value is 192');

            equal(p.dimension('33 3/8'), 33.375, 'Expected value is 33.375');
            equal(p.dimension('82 1/2"'), 82.5, 'Expected value is 82.5');
            equal(p.dimension('50 1/14').toFixed(5), '50.07143', 'Expected value is 50.07143');
            equal(p.dimension('33 3 / 8'), 33.375, 'Expected value is 33.375');

            equal(p.dimension('2 8.5'), 32.5, 'Expected value is 32.5');
            equal(p.dimension('2 3'), 27, 'Expected value is 27');
            equal(p.dimension('2.5 8.5'), 38.5, 'Expected value is 38.5');
            equal(p.dimension('2\' 3'), 27, 'Expected value is 27');
            equal(p.dimension('2\' 3.5'), 27.5, 'Expected value is 27.5');
            equal(p.dimension('2\' 3"'), 27, 'Expected value is 27');
            equal(p.dimension('2.5\' 3.5"'), 33.5, 'Expected value is 33.5');

            equal(p.dimension('82\''), 984, 'Expected value is 984 (82 * 12)');
            equal(p.dimension('82’'), 984, 'Expected value is 984 (82 * 12)');
            equal(p.dimension('1’'), 12, 'Expected value is 12 (1 * 12)');
            equal(p.dimension('30.5 ’'), 366, 'Expected value is 366 (30.5 * 12)');

            equal(p.dimension('5-2'), 62, 'Expected value is 62');
            equal(p.dimension('3 - 0'), 36, 'Expected value is 36');
            equal(p.dimension('8\'-0'), 96, 'Expected value is 96');
            equal(p.dimension('9-10"'), 118, 'Expected value is 118');
            equal(p.dimension('2’–8”'), 32, 'Expected value is 32');
            equal(p.dimension('2 ’ – 8 ”'), 32, 'Expected value is 32');
            equal(p.dimension('2 ’−8 ”'), 32, 'Expected value is 32');
            equal(p.dimension('2’−8.5”'), 32.5, 'Expected value is 32.5');
            equal(p.dimension('2−8.5'), 32.5, 'Expected value is 32.5');
            equal(p.dimension('2.5’−8.5”'), 38.5, 'Expected value is 38.5');

            equal(p.dimension('6\'-2 1/2"'), 74.5, 'Expected value is 74.5');
            equal(p.dimension('6 - 2 1/2'), 74.5, 'Expected value is 74.5');
            equal(p.dimension('6 \' - 2 1 / 2 "'), 74.5, 'Expected value is 74.5');
            equal(p.dimension('6 − 2 1/2'), 74.5, 'Expected value is 74.5');
            equal(p.dimension('6 ― 2 1/2'), 74.5, 'Expected value is 74.5');

            equal(p.dimension('4\'6 1/2'), 54.5, 'Expected value is 54.5');
            equal(p.dimension('4 ’ 6 1/2'), 54.5, 'Expected value is 54.5');
            equal(p.dimension('4\'6'), 54, 'Expected value is 54');
            equal(p.dimension('4’'), 48, 'Expected value is 48');

            //  In metric
            equal(p.dimension('30.5 mm').toFixed(5), '1.20079', 'Expected value is 1.2');
            equal(p.dimension('4.5 mm').toFixed(5), '0.17717', 'Expected value is 0.17');
            equal(p.dimension(' 30mm ').toFixed(5), '1.18110', 'Expected value is 1.18');
            equal(p.dimension('303.5mm').toFixed(5), '11.94882', 'Expected value is 11.95');
            equal(p.dimension('303,5mm').toFixed(5), '119.48819', 'Expected value is 119.49');
            equal(p.dimension('3,303.5mm').toFixed(5), '130.05906', 'Expected value is 130.06');
            equal(p.dimension('60 - 4 mm').toFixed(5), '0.15748', 'Expected value is 0.15');
            equal(p.dimension('60  4 mm').toFixed(5), '0.15748', 'Expected value is 0.15');
            equal(p.dimension('60\'4 mm').toFixed(5), '2.36220', 'Expected value is 2.36');

            equal(p.dimension(' 30m ').toFixed(5), '1181.10236', 'Expected value is 1181.1');
            equal(p.dimension('4.5 cm').toFixed(5), '1.77165', 'Expected value is 1.77');
        });

        test('dimensions', () => {
            const p = parseFormat;

            deepEqual(p.dimensions('32"X82 1/2"'), { width: 32, height: 82.5 }, 'Expected { width: 32, height: 82.5 }');
            deepEqual(p.dimensions('38"X83"'), { width: 38, height: 83 }, 'Expected { width: 38, height: 83 }');
            deepEqual(p.dimensions('6 \' - 2 1 / 2 " X 6 \' - 2 1 / 2 "'), { width: 74.5, height: 74.5 }, 'Expected { width: 74.5, height: 74.5 }');

            deepEqual(p.dimensions('35 x 17'), { width: 35, height: 17 }, 'Expected { width: 35, height: 17 }');
            deepEqual(p.dimensions('35.75 x 59.75'), { width: 35.75, height: 59.75 }, 'Expected { width: 35.75, height: 59.75 }');
            deepEqual(p.dimensions('36 x 45.5'), { width: 36, height: 45.5 }, 'Expected { width: 36, height: 45.5 }');

            deepEqual(p.dimensions('5-2x8-0'), { width: 62, height: 96 }, 'Expected { width: 62, height: 96 }');
            deepEqual(p.dimensions('3-11x7-4'), { width: 47, height: 88 }, 'Expected { width: 47, height: 88 }');

            deepEqual(p.dimensions('71 1/4 x 70 7/8'), { width: 71.25, height: 70.875 }, 'Expected { width: 71.25, height: 70.875 }');
            deepEqual(p.dimensions('50 x 31 7/8'), { width: 50, height: 31.875 }, 'Expected { width: 50, height: 31.875 }');
            deepEqual(p.dimensions('30 3/4 x 50 1/14'), { width: 30.75, height: 50 + (1 / 14) }, 'Expected { width: 30.75, height: 50.071428571 }');
            deepEqual(p.dimensions('13 5/8 x 17'), { width: 13.625, height: 17 }, 'Expected { width: 13.625, height: 17 }');

            deepEqual(p.dimensions('2’–8” X 5’–0”'), { width: 32, height: 60 }, 'Expected { width: 32, height: 60 }');
            deepEqual(p.dimensions('2’—8” X 5’—0”'), { width: 32, height: 60 }, 'Expected { width: 32, height: 60 }');

            deepEqual(p.dimensions('12\'-10" x 9\'-0"'), { width: 154, height: 108 }, 'Expected { width: 154, height: 108 }');
            deepEqual(p.dimensions(' 12\'-10" x 9\'-0" '), { width: 154, height: 108 }, 'Expected { width: 154, height: 108 }');

            deepEqual(p.dimensions(' 12\'-10" ✕ 9\'-0" '), { width: 154, height: 108 }, 'Expected { width: 154, height: 108 }');

            equal(p.dimensions('2’—8” X 5’—0”', 'width'), 32, 'Expected value is 32');
            equal(p.dimensions('2’—8” X 5’—0”', 'height'), 60, 'Expected value is 60');

            equal(p.dimensions('2’—8”', 'height'), 32, 'Expected value is 32');
            equal(p.dimensions('5’—0”', 'width'), 60, 'Expected value is 60');

            //  In metric
            deepEqual(p.dimensions('30.5 mm x 4.5 mm'), { width: 1.2007874015748032, height: 0.17716535433070868 },
                'Expected value is { width: 1.2007874015748032, height: 0.17716535433070868 }');
            deepEqual(p.dimensions('2mx5.5m'), { width: 78.74015748031496, height: 216.53543307086613 },
                'Expected value is { width: 78.74015748031496, height: 216.53543307086613 }');

            //  Trazepoids (height pairs are split with a | vertical line)
            deepEqual(p.dimensions('33 3/8 | 192 "', 'height'), [33.375, 192], 'Expected pair of values');
            deepEqual(p.dimensions('6\'-2 1/2" | 381 mm', 'height'), [74.5, 15], 'Expected pair of values');
            deepEqual(p.dimensions('33 3/8 | 66 3/8', 'height'), [33.375, 66.375], 'Expected pair of values');
            deepEqual(p.dimensions('33 3/8 | 33 3/8', 'height'), 33.375, 'Expected one value as pairs are equal');

            equal(p.dimensions('2’—8” | 2’—4” X 5’—0”', 'width'), 32, 'Expected only the first value to be recognized for width');
            equal(p.dimensions('2’—8” | 2’—4” X 5’—0”', 'height'), 60, 'Expected height to be 60');
            deepEqual(p.dimensions('5’—0” X 2’—8” | 2’—4”', 'height'), [32, 28], 'Expected height to be array');
            deepEqual(p.dimensions('5’—0” X 2’—8” | 2’—4”'), { width: 60, height: [32, 28] }, 'Expected height to be array');
            deepEqual(p.dimensions('2’—8” | 2’—4” X 5’—0”'), { width: 32, height: 60 }, 'Expected only the first value to be recognized for width');
        });

        test('percent', () => {
            const p = parseFormat;

            equal(p.percent('20%'), 20, 'Expected value is 20');
            equal(p.percent('20.5%'), 20.5, 'Expected value is 20.5');
            equal(p.percent('0%'), 0, 'Expected value is 0');
            equal(p.percent(0), 0, 'Expected value is 0');
        });
    });

    //  ------------------------------------------------------------------------
    //  Test math functions from utils.js
    //  ------------------------------------------------------------------------
    test('math', () => {
        test('square_feet', () => {
            const m = math;

            equal(m.square_feet(20, 20).toFixed(5), '2.77778', 'Expected value is 2.77778');
            equal(m.square_feet(12, 12), 1, 'Expected value is 1');
            equal(m.square_feet(0, 0), 0, 'Expected value is 0');
        });

        test('square_meters', () => {
            const m = math;

            equal(m.square_meters(200, 200), 0.04, 'Expected value is 0.04');
            equal(m.square_meters(1000, 1000), 1, 'Expected value is 1');
            equal(m.square_meters(0, 0), 0, 'Expected value is 0');
        });

        test('linear_interpolation', () => {
            const m = math;

            equal(m.linear_interpolation(20, 10, 30, 50, 70), 60, 'Expected value is 60');
            equal(m.linear_interpolation(1.2, 1, 2.3, 235, 342).toFixed(2), '251.46', 'Expected value is 251.46');
            equal(m.linear_interpolation(2.2, 1, 2.3, 235, 342).toFixed(2), '333.77', 'Expected value is 333.77');
        });
    });

    //  ------------------------------------------------------------------------
    //  Test vector2d functions from utils.js
    //  ------------------------------------------------------------------------
    test('vector2d', () => {
        test('getVector', () => {
            const v = vector2d;

            function func() {
                return [this, this ** 2];
            }

            deepEqual(v.getVector({ x: 5, y: 10 }), { x: 5, y: 10 }, 'Expected value is {x: 5, y: 10}');
            deepEqual(v.getVector([1, 3]), { x: 1, y: 3 }, 'Expected value is {x: 1, y: 3}');
            deepEqual(v.getVector(3), { x: 3, y: 3 }, 'Expected value is {x: 3, y: 3}');
            deepEqual(v.getVector(func.bind(3)), { x: 3, y: 9 }, 'Expected value is {x: 3, y: 9}');
        });

        test('length', () => {
            const v = vector2d;

            equal(v.length({ x: 3, y: 4 }), 5, 'Expected value is 5');
            equal(v.length({ x: 0, y: 10 }), 10, 'Expected value is 10');
            equal(v.length({ x: 1, y: 9 }), 9.055385138137417, 'Expected value is 9.055385138137417');
        });

        test('normalize', () => {
            const v = vector2d;

            deepEqual(v.normalize([1, 1]), { x: 0.7071067811865475, y: 0.7071067811865475 },
                'Expected value is {x: 0.7071067811865475, y: 0.7071067811865475}');
            deepEqual(v.normalize({ x: 3, y: 4 }), { x: 0.6, y: 0.8 }, 'Expected value is {x: 0.6, y: 0.8}');
            deepEqual(v.normalize({ x: 0, y: 10 }), { x: 0, y: 1 }, 'Expected value is {x: 0, y: 1}');
            deepEqual(v.normalize({ x: 1, y: 9 }), { x: 0.11043152607484653, y: 0.9938837346736188 },
                'Expected value is {x: 0.11043152607484653, y: 0.9938837346736188}');
        });

        test('add', () => {
            const v = vector2d;

            deepEqual(v.add([1, 1], [2, 4]), { x: 3, y: 5 }, 'Expected value is {x: 3, y: 5}');
            deepEqual(v.add([-3, -1], [2, 4]), { x: -1, y: 3 }, 'Expected value is {x: -1, y: 3}');
            deepEqual(v.add({ x: 3, y: 4 }, { x: 0, y: 1 }), { x: 3, y: 5 }, 'Expected value is {x: 3, y: 5}');
        });

        test('substract', () => {
            const v = vector2d;

            deepEqual(v.substract([1, 1], [2, 4]), { x: -1, y: -3 }, 'Expected value is {x: -1, y: -3}');
            deepEqual(v.substract([-3, -1], [2, 4]), { x: -5, y: -5 }, 'Expected value is {x: -5, y: -5}');
            deepEqual(v.substract({ x: 3, y: 4 }, { x: 0, y: 1 }), { x: 3, y: 3 }, 'Expected value is {x: 3, y: 3}');
        });

        test('multiply', () => {
            const v = vector2d;

            deepEqual(v.multiply([1, 1], [2, 4]), { x: 2, y: 4 }, 'Expected value is {x: 2, y: 4}');
            deepEqual(v.multiply([-3, -1], [2, 4]), { x: -6, y: -4 }, 'Expected value is {x: -6, y: -4}');
            deepEqual(v.multiply({ x: 3, y: 4 }, { x: 0, y: 1 }), { x: 0, y: 4 }, 'Expected value is {x: 0, y: 4}');
        });

        test('divide', () => {
            const v = vector2d;

            deepEqual(v.divide([1, 1], [2, 4]), { x: 0.5, y: 0.25 }, 'Expected value is {x: 0.5, y: 0.25}');
            deepEqual(v.divide([-3, -1], [2, 4]), { x: -1.5, y: -0.25 }, 'Expected value is {x: -1.5, y: -0.25}');
            deepEqual(v.divide({ x: 3, y: 4 }, { x: 0.5, y: 1 }), { x: 6, y: 4 }, 'Expected value is {x: 6, y: 4}');
        });

        test('scalar', () => {
            const v = vector2d;

            equal(v.scalar([1, 1], [2, 4]), 6, 'Expected value is 6');
            equal(v.scalar([-3, -1], [2, 4]), -10, 'Expected value is -10');
            equal(v.scalar({ x: 3, y: 4 }, { x: 0.5, y: 1 }), 5.5, 'Expected value is 5.5');
        });

        test('angle', () => {
            const v = vector2d;

            equal(v.angle([1, 0], [0, 1]), 1.5707963267948966, 'Expected value is 1.5707963267948966');
            equal(v.angle([1, 1], [2, 4]), 0.32175055439664263, 'Expected value is 0.32175055439664263');
            equal(v.angle([-3, -1], [2, 4]), 2.356194490192345, 'Expected value is 2.356194490192345');
            equal(v.angle({ x: 3, y: 4 }, { x: 0.5, y: 1 }), 0.17985349979247847, 'Expected value is 0.17985349979247847');
        });

        test('clockwiseSort', () => {
            const v = vector2d;
            const toSort = _.shuffle([[0, 1], [1, 0], [0, -1], [-1, 0]]);
            const sorted = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }];

            deepEqual(v.clockwiseSort(toSort), sorted, 'Expected value is (0,1) (1,0) (0, -1) (-1, 0)');
        });

        test('points_to_vectors', () => {
            const v = vector2d;
            const points = [{ x: 3, y: 3 }, { x: -1, y: -6 }, { x: 0, y: 0 }];
            const center = { x: 1, y: 1 };

            const exp = [{ x: 2, y: -2 }, { x: -2, y: 7 }, { x: -1, y: 1 }];

            deepEqual(v.points_to_vectors(points, center), exp, 'Points to vectors conversion');
        });

        test('vectors_to_points', () => {
            const v = vector2d;
            const points = [{ x: 2, y: -2 }, { x: -2, y: 7 }, { x: -1, y: 1 }];
            const center = { x: 1, y: 1 };

            const exp = [{ x: 3, y: 3 }, { x: -1, y: -6 }, { x: 0, y: 0 }];

            deepEqual(v.vectors_to_points(points, center), exp, 'Vectors to points conversion');
        });
    });

    //  ------------------------------------------------------------------------
    //  Test angle functions from utils.js
    //  ------------------------------------------------------------------------
    test('angle', () => {
        test('rad_to_deg', () => {
            const a = angle;

            equal(a.rad_to_deg(0.5), 28.64788975654116, 'Expected value is 28.64788975654116');
            equal(a.rad_to_deg(1), 57.29577951308232, 'Expected value is 57.29577951308232');
            equal(a.rad_to_deg(-9.5), -544.309905374282, 'Expected value is -544.309905374282');
        });

        test('deg_to_rad', () => {
            const a = angle;

            equal(a.deg_to_rad(90), 1.5707963267948966, 'Expected value is 1.5707963267948966');
            equal(a.deg_to_rad(1), 0.017453292519943295, 'Expected value is 0.017453292519943295');
            equal(a.deg_to_rad(180), 3.141592653589793, 'Expected value is 3.141592653589793');
            equal(a.deg_to_rad(-180), -3.141592653589793, 'Expected value is -3.141592653589793');
        });
    });

    //  ------------------------------------------------------------------------
    //  Test array functions from utils.js
    //  ------------------------------------------------------------------------
    test('array', () => {
        test('insertAt', () => {
            const a = array;
            const data = [4, 4, 4];

            deepEqual(a.insertAt(data, 0, 55), [55, 4, 4, 4], 'New value was added to array, as expected');
            deepEqual(a.insertAt(data, 1, 55), [4, 55, 4, 4], 'New value was added to array, as expected');
            deepEqual(a.insertAt(data, 2, 55), [4, 4, 55, 4], 'New value was added to array, as expected');
            deepEqual(a.insertAt(data, 3, 55), [4, 4, 4, 55], 'New value was added to array, as expected');
            deepEqual(a.insertAt(data, 4, 55), [4, 4, 4, 55], 'New value was added to array, as expected');
            deepEqual(a.insertAt(data, 14, 55), [4, 4, 4, 55], 'New value was added to array, as expected');

            deepEqual(a.insertAt(data, -1, 55), [4, 4, 55, 4], 'New value was added to array, as expected');
            deepEqual(a.insertAt(data, -2, 55), [4, 55, 4, 4], 'New value was added to array, as expected');
            deepEqual(a.insertAt(data, -3, 55), [55, 4, 4, 4], 'New value was added to array, as expected');
            deepEqual(a.insertAt(data, -5, 55), [55, 4, 4, 4], 'New value was added to array, as expected');

            deepEqual(a.insertAt(data, 3, 55, 44), [4, 4, 4, 55], 'Only one value was added to array');

            deepEqual(data, [4, 4, 4], 'Original array was not modified');
        });

        test('insertBefore', () => {
            const a = array;
            const data = [7, 8, 9];

            deepEqual(a.insertBefore(data, 7, 55), [55, 7, 8, 9], 'New value was added to array, as expected');
            deepEqual(a.insertBefore(data, 8, 55), [7, 55, 8, 9], 'New value was added to array, as expected');
            deepEqual(a.insertBefore(data, 9, 55), [7, 8, 55, 9], 'New value was added to array, as expected');
            deepEqual(a.insertBefore(data, -1, 55), [7, 8, 9], 'New value was not added to array');
            deepEqual(a.insertBefore(data, 11, 55), [7, 8, 9], 'New value was not added to array');

            deepEqual(a.insertBefore([7, 7, 7], 7, 55), [55, 7, 7, 7], 'New value was added to array, as expected');
            deepEqual(a.insertBefore([], 7, 55), [], 'New value was not added to an empty array');

            deepEqual(data, [7, 8, 9], 'Original array was not modified');
        });

        test('insertAfter', () => {
            const a = array;
            const data = [7, 8, 9];

            deepEqual(a.insertAfter(data, 7, 55), [7, 55, 8, 9], 'New value was added to array, as expected');
            deepEqual(a.insertAfter(data, 8, 55), [7, 8, 55, 9], 'New value was added to array, as expected');
            deepEqual(a.insertAfter(data, 9, 55), [7, 8, 9, 55], 'New value was added to array, as expected');
            deepEqual(a.insertAfter(data, -1, 55), [7, 8, 9], 'New value was not added to array');
            deepEqual(a.insertAfter(data, 11, 55), [7, 8, 9], 'New value was not added to array');

            deepEqual(a.insertAfter([7, 7, 7], 7, 55), [7, 55, 7, 7], 'New value was added to array, as expected');
            deepEqual(a.insertAfter([], 7, 55), [], 'New value was not added to an empty array');

            deepEqual(data, [7, 8, 9], 'Original array was not modified');
        });
    });

    //  ------------------------------------------------------------------------
    //  Test multiunit helper functions from utils.js
    //  ------------------------------------------------------------------------
    test('multiunit helpers', () => {
        test('getSubunitsTraversalSequences', () => {
            const connectors = [
                [1, 4],
                [1, 5],
            ];

            deepEqual(multiunit.getSubunitsTraversalSequences(connectors), [
                [1, 4],
                [1, 5],
            ], 'Test 1 traversal sequences are valid');

            const connectors_2 = [
                [1, 3],
                [1, 4],
                [4, 5],
            ];

            deepEqual(multiunit.getSubunitsTraversalSequences(connectors_2), [
                [1, 3],
                [1, 4, 5],
            ], 'Test 2 traversal sequences are valid');

            const connectors_3 = [
                [1, 4],
                [4, 5],
                [1, 3],
                [3, 6],
                [6, 8],
                [8, 11],
                [8, 12],
            ];

            deepEqual(multiunit.getSubunitsTraversalSequences(connectors_3), [
                [1, 4, 5],
                [1, 3, 6, 8, 11],
                [1, 3, 6, 8, 12],
            ], 'Test 3 traversal sequences are valid');

            const connectors_4 = [
                [1, 4],
                [4, 5],
                [1, 3],
                [3, 6],
                [6, 8],
                [8, 11],
                [8, 12],
                [4, 2],
            ];

            deepEqual(multiunit.getSubunitsTraversalSequences(connectors_4), [
                [1, 4, 5],
                [1, 4, 2],
                [1, 3, 6, 8, 11],
                [1, 3, 6, 8, 12],
            ], 'Test 4 traversal sequences are valid');

            const connectors_5 = [
                [1, 3],
                [3, 5],
                [4, 5],
            ];

            deepEqual(multiunit.getSubunitsTraversalSequences(connectors_5), [
                [4, 5],
                [1, 3, 5],
            ], 'Test 5 traversal sequences are valid');

            const connectors_6 = [
                [1, 3],
                [3, 5],
                [1, 7],
            ];

            deepEqual(multiunit.getSubunitsTraversalSequences(connectors_6), [
                [1, 7],
                [1, 3, 5],
            ], 'Test 6 traversal sequences are valid');

            const connectors_7 = [
                [1, 3],
                [3, 5],
                [1, 5],
            ];

            deepEqual(multiunit.getSubunitsTraversalSequences(connectors_7), [
                [1, 5],
                [1, 3, 5],
            ], 'Test 7 traversal sequences are valid');

            const connectors_8 = [
                [1, 3],
                [9, 5],
                [1, 5],
            ];

            deepEqual(multiunit.getSubunitsTraversalSequences(connectors_8), [
                [1, 3],
                [9, 5],
                [1, 5],
            ], 'Test 8 traversal sequences are valid');

            deepEqual(multiunit.getSubunitsTraversalSequences([]), [], 'Empty array traversal sequences are empty');
        });


        test('getSubunitsAsMatrix', () => {
            const connectors = [
                {
                    connects: [45, 46],
                    side: 'bottom',
                    width: 30,
                },
            ];

            deepEqual(multiunit.getSubunitsAsMatrix(connectors), {
                rows: [
                    [
                        { type: 'unit', id: 45 },
                    ],
                    [
                        { type: 'unit', id: 46 },
                    ],
                ],
                cols: [
                    [
                        { type: 'unit', id: 45 },
                        { type: 'connector', width: 30 },
                        { type: 'unit', id: 46 },
                    ],
                ],
            }, 'Test 1 connectors matrix is valid');

            const connectors_2 = [
                {
                    connects: [45, 46],
                    side: 'bottom',
                    width: 30,
                },
                {
                    connects: [46, 48],
                    side: 'bottom',
                    width: 31,
                },
                {
                    connects: [48, 49],
                    side: 'bottom',
                    width: 32,
                },
                {
                    connects: [49, 50],
                    side: 'right',
                    width: 33,
                },
                {
                    connects: [50, 51],
                    side: 'right',
                    width: 34,
                },
                {
                    connects: [51, 52],
                    side: 'bottom',
                    width: 35,
                },
            ];

            deepEqual(multiunit.getSubunitsAsMatrix(connectors_2), {
                rows: [
                    [
                        { type: 'unit', id: 45 },
                    ],
                    [
                        { type: 'unit', id: 46 },
                    ],
                    [
                        { type: 'unit', id: 48 },
                    ],
                    [
                        { type: 'unit', id: 49 },
                        { type: 'connector', width: 33 },
                        { type: 'unit', id: 50 },
                        { type: 'connector', width: 34 },
                        { type: 'unit', id: 51 },
                    ],
                    [
                        { type: 'unit', id: 52 },
                    ],
                ],
                cols: [
                    [
                        { type: 'unit', id: 45 },
                        { type: 'connector', width: 30 },
                        { type: 'unit', id: 46 },
                        { type: 'connector', width: 31 },
                        { type: 'unit', id: 48 },
                        { type: 'connector', width: 32 },
                        { type: 'unit', id: 49 },
                    ],
                    [
                        { type: 'unit', id: 50 },
                    ],
                    [
                        { type: 'unit', id: 51 },
                        { type: 'connector', width: 35 },
                        { type: 'unit', id: 52 },
                    ],
                ],
            }, 'Test 2 connectors matrix is valid');

            const connectors_3 = [
                {
                    connects: [45, 46],
                    side: 'bottom',
                    width: 30,
                },
                {
                    connects: [46, 48],
                    side: 'bottom',
                    width: 31,
                },
                {
                    connects: [48, 49],
                    side: 'bottom',
                    width: 32,
                },
                {
                    connects: [49, 50],
                    side: 'right',
                    width: 33,
                },
                {
                    connects: [50, 51],
                    side: 'right',
                    width: 34,
                },
                {
                    connects: [51, 52],
                    side: 'top',
                    width: 35,
                },
            ];

            deepEqual(multiunit.getSubunitsAsMatrix(connectors_3), {
                rows: [
                    [
                        { type: 'unit', id: 45 },
                    ],
                    [
                        { type: 'unit', id: 46 },
                    ],
                    [
                        { type: 'unit', id: 48 },
                        { type: 'unit', id: 52 },
                    ],
                    [
                        { type: 'unit', id: 49 },
                        { type: 'connector', width: 33 },
                        { type: 'unit', id: 50 },
                        { type: 'connector', width: 34 },
                        { type: 'unit', id: 51 },
                    ],
                ],
                cols: [
                    [
                        { type: 'unit', id: 45 },
                        { type: 'connector', width: 30 },
                        { type: 'unit', id: 46 },
                        { type: 'connector', width: 31 },
                        { type: 'unit', id: 48 },
                        { type: 'connector', width: 32 },
                        { type: 'unit', id: 49 },
                    ],
                    [
                        { type: 'unit', id: 50 },
                    ],
                    [
                        { type: 'unit', id: 52 },
                        { type: 'connector', width: 35 },
                        { type: 'unit', id: 51 },
                    ],
                ],
            }, 'Test 3 connectors matrix is valid');

            deepEqual(multiunit.getSubunitsAsMatrix([]), {
                rows: [],
                cols: [],
            }, 'Empty array connectors matrix is empty');

            const connectors_4 = [
                {
                    connects: [46, 48],
                    side: 'bottom',
                    width: 31,
                },
                {
                    connects: [45, 46],
                    side: 'bottom',
                    width: 30,
                },
            ];

            deepEqual(multiunit.getSubunitsAsMatrix(connectors_4), {
                rows: [
                    [
                        { type: 'unit', id: 45 },
                    ],
                    [
                        { type: 'unit', id: 46 },
                    ],
                    [
                        { type: 'unit', id: 48 },
                    ],
                ],
                cols: [
                    [
                        { type: 'unit', id: 45 },
                        { type: 'connector', width: 30 },
                        { type: 'unit', id: 46 },
                        { type: 'connector', width: 31 },
                        { type: 'unit', id: 48 },
                    ],
                ],
            }, 'Unsorted array 1 connectors matrix is still valid');

            const connectors_3_random = [
                {
                    connects: [51, 52],
                    side: 'top',
                    width: 35,
                },
                {
                    connects: [46, 48],
                    side: 'bottom',
                    width: 31,
                },
                {
                    connects: [50, 51],
                    side: 'right',
                    width: 34,
                },
                {
                    connects: [49, 50],
                    side: 'right',
                    width: 33,
                },
                {
                    connects: [48, 49],
                    side: 'bottom',
                    width: 32,
                },
                {
                    connects: [45, 46],
                    side: 'bottom',
                    width: 30,
                },
            ];

            deepEqual(
                multiunit.getSubunitsAsMatrix(connectors_3),
                multiunit.getSubunitsAsMatrix(connectors_3_random),
                'Unsorted array 2 connectors matrix is still valid',
            );
        });
    });
});
