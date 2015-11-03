//  Test that QUnit is working
test('basic test', function () {
    ok(true, "Passed.");
});


//  ------------------------------------------------------------------------
//  Test format functions from utils.js
//  ------------------------------------------------------------------------

test('utils.format.dimensions', function () {
    var f = app.utils.format;

    equal(f.dimensions(20, 30), '1\'-8"x2\'-6"', 'Expected value is 1\'-8"x2\'-6"');
    equal(f.dimensions(0, 0), '0\'-0"x0\'-0"', 'Expected value is 0\'-0"x0\'-0"');
    equal(f.dimensions(12, 12), '1\'-0"x1\'-0"', 'Expected value is 1\'-0"x1\'-0"');
    equal(f.dimensions('12', '12'), '1\'-0"x1\'-0"', 'Expected value is 1\'-0"x1\'-0"');
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
    equal(p.dimension('192 "'), 192, 'Expected value is 192');

    equal(p.dimension('33 3/8'), 33.375, 'Expected value is 33.375');
    equal(p.dimension('82 1/2"'), 82.5, 'Expected value is 82.5');
    equal(p.dimension('50 1/14').toFixed(5), '50.07143', 'Expected value is 50.07143');

    equal(p.dimension('82\''), 82 * 12, 'Expected value is 82 * 12');
    equal(p.dimension('82’'), 82 * 12, 'Expected value is 82 * 12');
    equal(p.dimension('30.5 ’'), 30.5 * 12, 'Expected value is 30.5 * 12');

    equal(p.dimension('5-2'), 62, 'Expected value is 62');
    equal(p.dimension('3 - 0'), 36, 'Expected value is 36');
    equal(p.dimension('8\'-0'), 96, 'Expected value is 96');
    equal(p.dimension('9-10"'), 118, 'Expected value is 118');
    equal(p.dimension('2’–8”'), 32, 'Expected value is 62');
    equal(p.dimension('2 ’ – 8 ”'), 32, 'Expected value is 62');
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
