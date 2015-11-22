/* global app */
/* eslint-env qunit */
/* eslint strict:0  */

var c = app.utils.convert;
test('project basic tests', function () {
    var unit = new app.Unit({
        width: c.mm_to_inches(1000),
        height: c.mm_to_inches(2000)
    });

    ok(unit.get('width'), 'width should be defined');
    ok(unit.get('height'), 'height should be defined');
});

test('split by two parts', function() {
    var unit = new app.Unit({
        width: c.mm_to_inches(1000),
        height: c.mm_to_inches(2000)
    });
    unit.profile = new app.Profile({
        frame_width: 10,
        mullion_width: 20
    });
    var id = unit.get('root_section').id;
    unit.splitSection(id, 'vertical');
    var rootSection = unit.generateFullRoot();
    var leftSection = rootSection.sections[0].params;
    equal(leftSection.x, unit.profile.get('frame_width'));
    equal(leftSection.y, unit.profile.get('frame_width'));
    equal(leftSection.width, 500 - 10 - 20 / 2);
    equal(leftSection.height, 2000 - 10 * 2);
});

test('split by 3 parts', function() {
    var unit = new app.Unit({
        width: c.mm_to_inches(1000),
        height: c.mm_to_inches(2000)
    });
    unit.profile = new app.Profile({
        frame_width: 10,
        mullion_width: 20
    });
    var id = unit.get('root_section').id;
    unit.splitSection(id, 'vertical');

    id = unit.get('root_section').sections[0].id;
    unit.splitSection(id, 'vertical');
    var rootSection = unit.generateFullRoot();
    var leftSection = rootSection.sections[0].sections[0].params;
    equal(leftSection.x, unit.profile.get('frame_width'));
    equal(leftSection.y, unit.profile.get('frame_width'));
    equal(leftSection.width, (500 - 10 - 20 / 2) / 2 - 20 / 2);
    equal(leftSection.height, 2000 - 10 * 2);
});


test('find sash border offsets', function() {
    var unit = new app.Unit({
        width: c.mm_to_inches(1000),
        height: c.mm_to_inches(2000)
    });
    unit.profile = new app.Profile({
        frame_width: 10,
        mullion_width: 20
    });
    // split by 2 parts
    var id = unit.get('root_section').id;
    unit.splitSection(id, 'vertical');
    var rootSection = unit.generateFullRoot();
    var leftSection = rootSection.sections[0];
    equal(leftSection.mullionEdges.right, true);
    equal(leftSection.mullionEdges.left, undefined);
    equal(leftSection.mullionEdges.top, undefined);
    equal(leftSection.mullionEdges.bottom, undefined);

    // split by 3 parts
    var rightSection = rootSection.sections[1];
    unit.splitSection(rightSection.id, 'horizontal');
    rootSection = unit.generateFullRoot();
    var topSection = rootSection.sections[1].sections[0];
    var bottomSection = rootSection.sections[1].sections[1];

    equal(topSection.mullionEdges.right, undefined);
    equal(topSection.mullionEdges.left, true);
    equal(topSection.mullionEdges.top, undefined);
    equal(topSection.mullionEdges.bottom, true);

    equal(bottomSection.mullionEdges.right, undefined);
    equal(bottomSection.mullionEdges.left, true);
    equal(bottomSection.mullionEdges.top, true);
    equal(bottomSection.mullionEdges.bottom, undefined);
});
