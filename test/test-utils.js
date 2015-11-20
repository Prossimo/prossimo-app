/* global app */
/* eslint-env qunit */
/* eslint strict:0  */

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
    equal(f.dimension(50 + 1 / 14, 'fraction'), '4′−2 1/14″', 'Expected value is 4′−2 1/14″');
    equal(f.dimension(50.7959183673469354, 'fraction'), '4′−2 4/5″', 'Expected not to fail with Decimal error');
    equal(f.dimension(30.979591836734695, 'fraction'), '2′−7″', 'Expected not to return 2′−6 1/1″');
});

test('utils.format.dimensions', function () {
    var f = app.utils.format;

    equal(f.dimensions(20, 30), '1′−8″ x 2′−6″', 'Expected value is 1′−8″ x 2′−6″');
    equal(f.dimensions(0, 0), '0′−0″ x 0′−0″', 'Expected value is 0′−0″ x 0′−0″');
    equal(f.dimensions(12, 12), '1′−0″ x 1′−0″', 'Expected value is 1′−0″ x 1′−0″');
    equal(f.dimensions('12', '12'), '1′−0″ x 1′−0″', 'Expected value is 1′−0″ x 1′−0″');
});

test('utils.format.dimensions_mm', function () {
    var f = app.utils.format;

    equal(f.dimensions_mm(2500, 1300), '2,500 x 1,300', 'Expected value is 2,500 x 1,300');
});

test('utils.format.price_usd', function () {
    var f = app.utils.format;

    equal(f.price_usd(30), '$30.00', 'Expected value is $30.00');
    equal(f.price_usd(30.5), '$30.50', 'Expected value is $30.50');
    equal(f.price_usd('30.5'), '$30.50', 'Expected value is $30.50');
    equal(f.price_usd(0), '$0.00', 'Expected value is $0.00');
});

test('utils.format.percent', function () {
    var f = app.utils.format;

    equal(f.percent(20), '20%', 'Expected value is 20%');
    equal(f.percent(20.5), '20.5%', 'Expected value is 20.5%');
    equal(f.percent(0), '0%', 'Expected value is 0%');
});

test('utils.format.fixed', function () {
    var f = app.utils.format;

    equal(f.fixed(0.5, 5), '0.50000', 'Expected value is 0.50000');
    equal(f.fixed(20), '20.00', 'Expected value is 20.00');
    equal(f.fixed(0), '0.00', 'Expected value is 0.00');
    equal(f.fixed(0.5510204081632679, 25), '0.551020408163268', 'Expected not to fail with Decimal error');
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

    equal(p.dimension('6\'-2 1/2"'), 74.5, 'Expected value is 74.5');
    equal(p.dimension('6 - 2 1/2'), 74.5, 'Expected value is 74.5');
    equal(p.dimension('6 \' - 2 1 / 2 "'), 74.5, 'Expected value is 74.5');
    equal(p.dimension('6 − 2 1/2'), 74.5, 'Expected value is 74.5');
    equal(p.dimension('6 ― 2 1/2'), 74.5, 'Expected value is 74.5');

    equal(p.dimension('4\'6 1/2'), 54.5, 'Expected value is 54.5');
    equal(p.dimension('4 ’ 6 1/2'), 54.5, 'Expected value is 54.5');
    equal(p.dimension('4\'6'), 54, 'Expected value is 54');
    equal(p.dimension('4’'), 48, 'Expected value is 48');
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
});

test('utils.parseFormat.percent', function () {
    var p = app.utils.parseFormat;

    equal(p.percent('20%'), 20, 'Expected value is 20');
    equal(p.percent('20.5%'), 20.5, 'Expected value is 20.5');
    equal(p.percent('0%'), 0, 'Expected value is 0');
    equal(p.percent(0), 0, 'Expected value is 0');
});


//  ------------------------------------------------------------------------
//  Test convert functions from utils.js
//  ------------------------------------------------------------------------

test('utils.convert.inches_to_mm', function () {
    var c = app.utils.convert;

    equal(c.inches_to_mm(20), 490, 'Expected value is 490');
    equal(c.inches_to_mm(1), 24.5, 'Expected value is 24.5');
    equal(c.inches_to_mm(0), 0, 'Expected value is 0');
});

test('utils.convert.mm_to_inches', function () {
    var c = app.utils.convert;

    equal(c.mm_to_inches(490), 20, 'Expected value is 20');
    equal(c.mm_to_inches(24.5), 1, 'Expected value is 1');
    equal(c.mm_to_inches(0), 0, 'Expected value is 0');
});
