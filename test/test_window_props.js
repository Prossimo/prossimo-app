test('project basic tests', function () {
    var win = new app.WindowDrawing();

    ok(win.get('width'), 'width should be defined');
    ok(win.get('height'), 'height should be defined');
    // equal(current_project.get('client_name'), 'Andy Huh', 'Client name should be Andy Huh');
});

test('split by two parts', function() {
    var win = new app.WindowDrawing({
        width: 1000,
        height: 2000,
        frameWidth: 10,
        mullionWidth: 20
    });
    var id = win.get('rootSection').id;
    win.splitSection(id, 'vertical');
    var rootSection = win.generateFullRoot();
    var leftSection = rootSection.sections[0].params;
    equal(leftSection.x, win.get('frameWidth'));
    equal(leftSection.y, win.get('frameWidth'));
    equal(leftSection.width, 500 - 10 - 20 / 2);
    equal(leftSection.height, 2000 - 10 * 2);
});

test('split by 3 parts', function() {
    var win = new app.WindowDrawing({
        width: 1000,
        height: 2000,
        frameWidth: 10,
        mullionWidth: 20
    });
    var id = win.get('rootSection').id;
    win.splitSection(id, 'vertical');

    id = win.get('rootSection').sections[0].id;
    win.splitSection(id, 'vertical');
    var rootSection = win.generateFullRoot();
    var leftSection = rootSection.sections[0].sections[0].params;
    equal(leftSection.x, win.get('frameWidth'));
    equal(leftSection.y, win.get('frameWidth'));
    equal(leftSection.width, (500 - 10 - 20 / 2) / 2 - 20 / 2);
    equal(leftSection.height, 2000 - 10 * 2);
});
