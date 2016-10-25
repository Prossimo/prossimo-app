/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */
/* jscs:disable */


//  Test that QUnit is working
test('basic test', function () {
    ok(true, 'Passed.');
});


//  ------------------------------------------------------------------------
//  Test format functions from utils.js
//  ------------------------------------------------------------------------

test('utils.format.dimension', function () {
    var f = app.utils.format;

    equal(f.dimension(20), '1′−8″', 'Expected value is 1′−8″');
    equal(f.dimension(30.5), '2′−6.5″', 'Expected value is 2′−6.5″');
    equal(f.dimension(33.375), '2′−9.375″', 'Expected value is 2′−9.375″');

    equal(f.dimension(62), '5′−2″', 'Expected value is 5′−2″');
    equal(f.dimension(33.375, 'fraction'), '2′−9 3/8″', 'Expected value is 2′−9 3/8″');
    equal(f.dimension(50 + 1 / 14, 'fraction'), '4′−2 1/16″', 'Expected value is 4′−2 1/16″');
    equal(f.dimension(50 + 1 / 7, 'fraction'), '4′−2 1/8″', 'Expected value is 4′−2 1/8″');
    equal(f.dimension(50 + 1 / 3, 'fraction'), '4′−2 5/16″', 'Expected value is 4′−2 5/16″');
    equal(f.dimension(50 + 1 / 2, 'fraction'), '4′−2 1/2″', 'Expected value is 4′−2 1/2″');
    equal(f.dimension(50 + 3 / 8, 'fraction'), '4′−2 3/8″', 'Expected value is 4′−2 3/8″');
    equal(f.dimension(50 + 3 / 7, 'fraction'), '4′−2 7/16″', 'Expected value is 4′−2 7/16″');

    equal(f.dimension(50.7959183673469354, 'fraction'), '4′−2 13/16″', 'Expected not to fail with Decimal error');
    equal(f.dimension(30.979591836734695, 'fraction'), '2′−7″', 'Expected not to return 2′−6 1/1″');
    equal(f.dimension(23.99, 'fraction'), '2′−0″', 'Expected not to return 1′−12″');
    equal(f.dimension(23.96875, 'fraction'), '2′−0″', 'Expected not to return 1′−12″ or 1′−11 1/1″');

    equal(f.dimension(50 + 3 / 7, 'fraction', 'feet_plus_inches'), '4′−2 7/16″', 'Expected value is 4′−2 7/16″');
    equal(f.dimension(50 + 3 / 7, 'fraction', 'inches_only'), '50 7/16″', 'Expected value is 50 7/16″');
    equal(f.dimension(62, 'fraction', 'inches_only'), '62″', 'Expected value is 62″');
    equal(f.dimension(33.375, null, 'inches_only'), '33.375″', 'Expected value is 33.375″');

    equal(f.dimension(0.472, 'fraction', null, 'remove'), '1/2″', 'Expected value is 1/2″');
    equal(f.dimension(0.472, 'fraction', null, 'show'), '0 1/2″', 'Expected value is 0 1/2″');
});

test('utils.format.dimensions', function () {
    var f = app.utils.format;

    equal(f.dimensions(20, 30), '1′−8″ x 2′−6″', 'Expected value is 1′−8″ x 2′−6″');
    equal(f.dimensions(0, 0), '0″ x 0″', 'Expected value is 0′−0″ x 0′−0″');
    equal(f.dimensions(12, 12), '1′−0″ x 1′−0″', 'Expected value is 1′−0″ x 1′−0″');
    equal(f.dimensions('12', '12'), '1′−0″ x 1′−0″', 'Expected value is 1′−0″ x 1′−0″');
});

test('utils.format.dimension_mm', function () {
    var f = app.utils.format;

    equal(f.dimension_mm(2500), '2,500 mm', 'Expected value is 2,500 mm');
    equal(f.dimension_mm(33.3), '33 mm', 'Expected value is 33 mm');
});

test('utils.format.dimensions_mm', function () {
    var f = app.utils.format;

    equal(f.dimensions_mm(2500, 1300), '2,500 x 1,300', 'Expected value is 2,500 x 1,300');
});

test('utils.format.dimension_in', function () {
    var f = app.utils.format;

    equal(f.dimension_in(14), '14″', 'Expected value is 14″');
    equal(f.dimension_in(28.35), '28.35″', 'Expected value is 28.35″');
});

test('utils.format.dimensions_in', function () {
    var f = app.utils.format;

    equal(f.dimensions_in(38.14, 22), '38.14″ x 22″', 'Expected value is 38.14″ x 22″');
});

test('utils.format.price_usd', function () {
    var f = app.utils.format;

    equal(f.price_usd(30), '$30.00', 'Expected value is $30.00');
    equal(f.price_usd(30.5), '$30.50', 'Expected value is $30.50');
    equal(f.price_usd('30.5'), '$30.50', 'Expected value is $30.50');
    equal(f.price_usd(0), '$0.00', 'Expected value is $0.00');
    equal(f.price_usd(-140), '-$140.00', 'Expected value is -$140.00');
});

test('utils.format.percent', function () {
    var f = app.utils.format;

    equal(f.percent(20), '20%', 'Expected value is 20%');
    equal(f.percent(20.5), '20.5%', 'Expected value is 20.5%');
    equal(f.percent(14.13), '14.13%', 'Expected value is 14.13%');
    equal(f.percent(14.13, 1), '14.1%', 'Expected value is 14.1%');
    equal(f.percent(14.13, 0), '14%', 'Expected value is 14%');
    equal(f.percent(0), '0%', 'Expected value is 0%');
});

test('utils.format.fixed', function () {
    var f = app.utils.format;

    equal(f.fixed(0.5, 5), '0.50000', 'Expected value is 0.50000');
    equal(f.fixed(20), '20.00', 'Expected value is 20.00');
    equal(f.fixed(0), '0.00', 'Expected value is 0.00');
    equal(f.fixed(0.5510204081632679, 25), '0.551020408163268', 'Expected not to fail with Decimal error');
});

test('utils.format.square_feet', function () {
    var f = app.utils.format;

    equal(f.square_feet(12), '12 sq.ft', 'Expected value is 12 sq.ft');
    equal(f.square_feet(4.55), '4.55 sq.ft', 'Expected value is 4.55 sq.ft');

    equal(f.square_feet(4.55, 2, 'sup'), '4.55 ft<sup>2</sup>', 'Expected value is 4.55 ft<sup>2</sup>');
});

test('utils.format.square_meters', function () {
    var f = app.utils.format;

    equal(f.square_meters(12), '12 m<sup>2</sup>', 'Expected value is 12 m<sup>2</sup>');
    equal(f.square_meters(4.55), '4.55 m<sup>2</sup>', 'Expected value is 4.55 m<sup>2</sup>');
});

test('utils.format.dimensions_and_area', function () {
    var f = app.utils.format;

    equal(
        f.dimensions_and_area(26, 32.0625, 'fraction', 'inches_only', 5.78, 2, 'sup'),
        '26″ x 32 1/16″ (5.78 ft<sup>2</sup>)',
        'Test with all values set the same way as defaults'
    );
    equal(
        f.dimensions_and_area(26, 32.0625, undefined, undefined, 5.78, undefined, undefined),
        '26″ x 32 1/16″ (5.78 ft<sup>2</sup>)',
        'Test with no formatting-related values set, and defaults used instead'
    );
});

test('utils.format.dimensions_and_area_mm', function () {
    var f = app.utils.format;

    equal(
        f.dimensions_and_area_mm(722, 417, 0.301, 2, 'sup'),
        '417 x 722 (0.3 m<sup>2</sup>)',
        'Test with all values set the same way as defaults'
    );
    equal(
        f.dimensions_and_area_mm(722, 417, 0.301, undefined, undefined),
        '417 x 722 (0.3 m<sup>2</sup>)',
        'Test with no formatting-related values set, and defaults used instead'
    );
});

//  ------------------------------------------------------------------------
//  Test parseFormat functions from utils.js
//  ------------------------------------------------------------------------

test('utils.parseFormat.dimension', function () {
    var p = app.utils.parseFormat;

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
    equal(p.dimension('30.5 mm').toFixed(5), 1.20079, 'Expected value is 1.2');
    equal(p.dimension('4.5 mm').toFixed(5), 0.17717, 'Expected value is 0.17');
    equal(p.dimension(' 30mm ').toFixed(5), 1.18110, 'Expected value is 1.18');
    equal(p.dimension('303.5mm').toFixed(5), 11.94882, 'Expected value is 11.95');
    equal(p.dimension('303,5mm').toFixed(5), 119.48819, 'Expected value is 119.49');
    equal(p.dimension('3,303.5mm').toFixed(5), 130.05906, 'Expected value is 130.06');
    equal(p.dimension('60 - 4 mm').toFixed(5), 0.15748, 'Expected value is 0.15');
    equal(p.dimension('60  4 mm').toFixed(5), 0.15748, 'Expected value is 0.15');
    equal(p.dimension('60\'4 mm').toFixed(5), 2.36220, 'Expected value is 2.36');

    equal(p.dimension(' 30m ').toFixed(5), 1181.10236, 'Expected value is 1181.1');
    equal(p.dimension('4.5 cm').toFixed(5), 1.77165, 'Expected value is 1.77');
});

test('utils.parseFormat.dimensions', function () {
    var p = app.utils.parseFormat;

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
    deepEqual(p.dimensions('30 3/4 x 50 1/14'), { width: 30.75, height: 50 + 1 / 14 }, 'Expected { width: 30.75, height: 50.071428571 }');
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

test('utils.parseFormat.percent', function () {
    var p = app.utils.parseFormat;

    equal(p.percent('20%'), 20, 'Expected value is 20');
    equal(p.percent('20.5%'), 20.5, 'Expected value is 20.5');
    equal(p.percent('0%'), 0, 'Expected value is 0');
    equal(p.percent(0), 0, 'Expected value is 0');
});


//  ------------------------------------------------------------------------
//  Test math functions from utils.js
//  ------------------------------------------------------------------------

test('utils.math.square_feet', function () {
    var m = app.utils.math;

    equal(m.square_feet(20, 20).toFixed(5), '2.77778', 'Expected value is 2.77778');
    equal(m.square_feet(12, 12), 1, 'Expected value is 1');
    equal(m.square_feet(0, 0), 0, 'Expected value is 0');
});


test('utils.math.square_meters', function () {
    var m = app.utils.math;

    equal(m.square_meters(200, 200), 0.04, 'Expected value is 0.04');
    equal(m.square_meters(1000, 1000), 1, 'Expected value is 1');
    equal(m.square_meters(0, 0), 0, 'Expected value is 0');
});


test('utils.math.linear_interpolation', function () {
    var m = app.utils.math;

    equal(m.linear_interpolation(20, 10, 30, 50, 70), 60, 'Expected value is 60');
    equal(m.linear_interpolation(1.2, 1, 2.3, 235, 342).toFixed(2), '251.46', 'Expected value is 251.46');
    equal(m.linear_interpolation(2.2, 1, 2.3, 235, 342).toFixed(2), '333.77', 'Expected value is 333.77');
});


//  ------------------------------------------------------------------------
//  Test convert functions from utils.js
//  ------------------------------------------------------------------------

test('utils.convert.inches_to_mm', function () {
    var c = app.utils.convert;

    equal(c.inches_to_mm(20), 508, 'Expected value is 508');
    equal(c.inches_to_mm(1), 25.4, 'Expected value is 25.4');
    equal(c.inches_to_mm(0), 0, 'Expected value is 0');
});

test('utils.convert.mm_to_inches', function () {
    var c = app.utils.convert;

    equal(c.mm_to_inches(508), 20, 'Expected value is 20');
    equal(c.mm_to_inches(25.4), 1, 'Expected value is 1');
    equal(c.mm_to_inches(0), 0, 'Expected value is 0');
});

//  ------------------------------------------------------------------------
//  Test vector2d functions from utils.js
//  ------------------------------------------------------------------------
test('utils.vector2d.getVector', function () {
    var v = app.utils.vector2d;

    function func() {
        return [this, Math.pow(this, 2)];
    }

    deepEqual(v.getVector({x: 5, y: 10}), {x: 5, y: 10}, 'Expected value is {x: 5, y: 10}');
    deepEqual(v.getVector([1, 3]), {x: 1, y: 3}, 'Expected value is {x: 1, y: 3}');
    deepEqual(v.getVector(3), {x: 3, y: 3}, 'Expected value is {x: 3, y: 3}');
    deepEqual(v.getVector(func.bind(3)), {x: 3, y: 9}, 'Expected value is {x: 3, y: 9}');
});

test('utils.vector2d.length', function () {
    var v = app.utils.vector2d;

    equal(v.length({x: 3, y: 4}), 5, 'Expected value is 5');
    equal(v.length({x: 0, y: 10}), 10, 'Expected value is 10');
    equal(v.length({x: 1, y: 9}), 9.055385138137417, 'Expected value is 9.055385138137417');
});

test('utils.vector2d.normalize', function () {
    var v = app.utils.vector2d;

    deepEqual(v.normalize([1, 1]), {x: 0.7071067811865475, y: 0.7071067811865475},
                    'Expected value is {x: 0.7071067811865475, y: 0.7071067811865475}');
    deepEqual(v.normalize({x: 3, y: 4}), {x: 0.6, y: 0.8}, 'Expected value is {x: 0.6, y: 0.8}');
    deepEqual(v.normalize({x: 0, y: 10}), {x: 0, y: 1}, 'Expected value is {x: 0, y: 1}');
    deepEqual(v.normalize({x: 1, y: 9}), {x: 0.11043152607484653, y: 0.9938837346736188},
                    'Expected value is {x: 0.11043152607484653, y: 0.9938837346736188}');
});

test('utils.vector2d.add', function () {
    var v = app.utils.vector2d;

    deepEqual(v.add([1, 1], [2, 4]), {x: 3, y: 5}, 'Expected value is {x: 3, y: 5}');
    deepEqual(v.add([-3, -1], [2, 4]), {x: -1, y: 3}, 'Expected value is {x: -1, y: 3}');
    deepEqual(v.add({x: 3, y: 4}, {x: 0, y: 1}), {x: 3, y: 5}, 'Expected value is {x: 3, y: 5}');
});

test('utils.vector2d.substract', function () {
    var v = app.utils.vector2d;

    deepEqual(v.substract([1, 1], [2, 4]), {x: -1, y: -3}, 'Expected value is {x: -1, y: -3}');
    deepEqual(v.substract([-3, -1], [2, 4]), {x: -5, y: -5}, 'Expected value is {x: -5, y: -5}');
    deepEqual(v.substract({x: 3, y: 4}, {x: 0, y: 1}), {x: 3, y: 3}, 'Expected value is {x: 3, y: 3}');
});

test('utils.vector2d.multiply', function () {
    var v = app.utils.vector2d;

    deepEqual(v.multiply([1, 1], [2, 4]), {x: 2, y: 4}, 'Expected value is {x: 2, y: 4}');
    deepEqual(v.multiply([-3, -1], [2, 4]), {x: -6, y: -4}, 'Expected value is {x: -6, y: -4}');
    deepEqual(v.multiply({x: 3, y: 4}, {x: 0, y: 1}), {x: 0, y: 4}, 'Expected value is {x: 0, y: 4}');
});

test('utils.vector2d.divide', function () {
    var v = app.utils.vector2d;

    deepEqual(v.divide([1, 1], [2, 4]), {x: 0.5, y: 0.25}, 'Expected value is {x: 0.5, y: 0.25}');
    deepEqual(v.divide([-3, -1], [2, 4]), {x: -1.5, y: -0.25}, 'Expected value is {x: -1.5, y: -0.25}');
    deepEqual(v.divide({x: 3, y: 4}, {x: 0.5, y: 1}), {x: 6, y: 4}, 'Expected value is {x: 6, y: 4}');
});

test('utils.vector2d.scalar', function () {
    var v = app.utils.vector2d;

    equal(v.scalar([1, 1], [2, 4]), 6, 'Expected value is 6');
    equal(v.scalar([-3, -1], [2, 4]), -10, 'Expected value is -10');
    equal(v.scalar({x: 3, y: 4}, {x: 0.5, y: 1}), 5.5, 'Expected value is 5.5');
});

test('utils.vector2d.angle', function () {
    var v = app.utils.vector2d;

    equal(v.angle([1, 0], [0, 1]), 1.5707963267948966, 'Expected value is 1.5707963267948966');
    equal(v.angle([1, 1], [2, 4]), 0.32175055439664263, 'Expected value is 0.32175055439664263');
    equal(v.angle([-3, -1], [2, 4]), 2.356194490192345, 'Expected value is 2.356194490192345');
    equal(v.angle({x: 3, y: 4}, {x: 0.5, y: 1}), 0.17985349979247847, 'Expected value is 0.17985349979247847');
});

test('utils.vector2d.clockwiseSort', function () {
    var v = app.utils.vector2d;

    var toSort = _.shuffle([[0, 1], [1, 0], [0, -1], [-1, 0]]);
    var sorted = [{x: 0, y: 1}, {x: 1, y: 0}, {x: 0, y: -1}, {x: -1, y: 0}];

    deepEqual(v.clockwiseSort(toSort), sorted, 'Expected value is (0,1) (1,0) (0, -1) (-1, 0)');
});

test('utils.vector2d.points_to_vectors', function () {
    var v = app.utils.vector2d;

    var points = [{x: 3, y: 3}, {x: -1, y: -6}, {x: 0, y: 0}];
    var center = {x: 1, y: 1};

    var exp = [{x: 2, y: -2}, {x: -2, y: 7}, {x: -1, y: 1}];

    deepEqual(v.points_to_vectors(points, center), exp, 'Points to vectors conversion');
});
test('utils.vector2d.vectors_to_points', function () {
    var v = app.utils.vector2d;

    var points = [{x: 2, y: -2}, {x: -2, y: 7}, {x: -1, y: 1}];
    var center = {x: 1, y: 1};

    var exp = [{x: 3, y: 3}, {x: -1, y: -6}, {x: 0, y: 0}];

    deepEqual(v.vectors_to_points(points, center), exp, 'Vectors to points conversion');
});

//  ------------------------------------------------------------------------
//  Test angle functions from utils.js
//  ------------------------------------------------------------------------
test('utils.angle.rad_to_deg', function () {
    var a = app.utils.angle;

    equal(a.rad_to_deg(0.5), 28.64788975654116, 'Expected value is 28.64788975654116');
    equal(a.rad_to_deg(1), 57.29577951308232, 'Expected value is 57.29577951308232');
    equal(a.rad_to_deg(-9.5), -544.309905374282, 'Expected value is -544.309905374282');
});

test('utils.angle.deg_to_rad', function () {
    var a = app.utils.angle;

    equal(a.deg_to_rad(90), 1.5707963267948966, 'Expected value is 1.5707963267948966');
    equal(a.deg_to_rad(1), 0.017453292519943295, 'Expected value is 0.017453292519943295');
    equal(a.deg_to_rad(180), 3.141592653589793, 'Expected value is 3.141592653589793');
    equal(a.deg_to_rad(-180), -3.141592653589793, 'Expected value is -3.141592653589793');
});
