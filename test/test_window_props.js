test('project basic tests', function () {
    var c = app.utils.convert;
    var win = new app.Window({
        width: c.mm_to_inches(1000),
        height: c.mm_to_inches(2000)
    });

    ok(win.get('width'), 'width should be defined');
    ok(win.get('height'), 'height should be defined');
});

test('split by two parts', function() {
    var c = app.utils.convert;
    var win = new app.Window({
        width: c.mm_to_inches(1000),
        height: c.mm_to_inches(2000)
    });
    win.profile = new app.Profile({
        frameWidth: 10,
        mullionWidth: 20
    });
    var id = win.get('rootSection').id;
    win.splitSection(id, 'vertical');
    var rootSection = win.generateFullRoot();
    var leftSection = rootSection.sections[0].params;
    equal(leftSection.x, win.profile.get('frameWidth'));
    equal(leftSection.y, win.profile.get('frameWidth'));
    equal(leftSection.width, 500 - 10 - 20 / 2);
    equal(leftSection.height, 2000 - 10 * 2);
});

test('split by 3 parts', function() {
    var c = app.utils.convert;
    var win = new app.Window({
        width: c.mm_to_inches(1000),
        height: c.mm_to_inches(2000)
    });
    win.profile = new app.Profile({
        frameWidth: 10,
        mullionWidth: 20
    });
    var id = win.get('rootSection').id;
    win.splitSection(id, 'vertical');

    id = win.get('rootSection').sections[0].id;
    win.splitSection(id, 'vertical');
    var rootSection = win.generateFullRoot();
    var leftSection = rootSection.sections[0].sections[0].params;
    equal(leftSection.x, win.profile.get('frameWidth'));
    equal(leftSection.y, win.profile.get('frameWidth'));
    equal(leftSection.width, (500 - 10 - 20 / 2) / 2 - 20 / 2);
    equal(leftSection.height, 2000 - 10 * 2);
});
