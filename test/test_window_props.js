/* global app */
/* eslint-env qunit */
/* eslint strict:0  */

var c = app.utils.convert;
test('project basic tests', function () {
    var win = new app.Window({
        width: c.mm_to_inches(1000),
        height: c.mm_to_inches(2000)
    });

    ok(win.get('width'), 'width should be defined');
    ok(win.get('height'), 'height should be defined');
});

test('split by two parts', function() {
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


test('find sash border offsets', function() {
    var win = new app.Window({
        width: c.mm_to_inches(1000),
        height: c.mm_to_inches(2000)
    });
    win.profile = new app.Profile({
        frameWidth: 10,
        mullionWidth: 20
    });
    // split by 2 parts
    var id = win.get('rootSection').id;
    win.splitSection(id, 'vertical');
    var rootSection = win.generateFullRoot();
    var leftSection = rootSection.sections[0];
    equal(leftSection.mullionEdges.right, true);
    equal(leftSection.mullionEdges.left, undefined);
    equal(leftSection.mullionEdges.top, undefined);
    equal(leftSection.mullionEdges.bottom, undefined);

    // split by 3 parts
    var rightSection = rootSection.sections[1];
    win.splitSection(rightSection.id, 'horizontal');
    rootSection = win.generateFullRoot();
    var topSection = rootSection.sections[1].sections[0];
    var bottomSection = rootSection.sections[1].sections[1];

    console.log(topSection.mullionEdges);
    equal(topSection.mullionEdges.right, undefined);
    equal(topSection.mullionEdges.left, true);
    equal(topSection.mullionEdges.top, undefined);
    equal(topSection.mullionEdges.bottom, true);

    console.log(bottomSection.mullionEdges);
    equal(bottomSection.mullionEdges.right, undefined);
    equal(bottomSection.mullionEdges.left, true);
    equal(bottomSection.mullionEdges.top, true);
    equal(bottomSection.mullionEdges.bottom, undefined);

});
