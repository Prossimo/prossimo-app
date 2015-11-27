/* global app */
/* eslint-env qunit */
/* eslint strict:0  */

var c = app.utils.convert;
app.no_backend = true;

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
    var leftSection = rootSection.sections[0].openingParams;
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
    var leftSection = rootSection.sections[0].sections[0].openingParams;
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


//  TODO: this test is incomplete because we don't have some functions for Unit
test('Size calculations for Unit #1 from 377 E 10th project', function () {
    var unit = new app.Unit({
        width: 5 * 12 + 6,
        height: 6 * 12 + 10
    });

    //  TODO: add proper profile params
    unit.profile = new app.Profile({
        frame_width: 70,
        mullion_width: 94
    });

    var target_sizes = {
        glasses: [
            {
                width: 2 * 12 + 1,          //  626 mm
                height: 4 * 12 + 3.125      //  1299 mm
            },
            {
                width: 2 * 12 + 1,          //  626 mm
                height: 1 * 12 + 2.125      //  360 mm
            },
            {
                width: 2 * 12 + 4.4375,     //  722 mm
                height: 4 * 12 + 7          //  1395 mm
            },
            {
                width: 2 * 12 + 4.4375,     //  722 mm
                height: 1 * 12 + 6          //  455 mm
            }
        ],
        openings: [
            {
                width: 2 * 12 + 7.125,      //  790 mm
                height: 4 * 12 + 10         //  1463 mm
            },
            {
                width: 2 * 12 + 7.125,      //  790 mm
                height: 1 * 12 + 9          //  524 mm
            }
        ]
    };

    var root_id = unit.get('root_section').id;
    var full_root = unit.generateFullRoot();

    var converted_height_in_mm = c.inches_to_mm(unit.get('height'));
    var converted_width_in_mm = c.inches_to_mm(unit.get('width'));
    var calculated_height_in_mm = full_root.openingParams.height +
        2 * full_root.openingParams.x;
    var calculated_width_in_mm = full_root.openingParams.width +
        2 * full_root.openingParams.y;

    // console.log( full_root );
    // console.log( unit.getSizes() );
    // console.log( converted_height_in_mm );
    // console.log( calculated_height_in_mm );

    equal(converted_height_in_mm, calculated_height_in_mm, 'Converted height equals calculated height');
    equal(converted_width_in_mm, calculated_width_in_mm, 'Converted width equals calculated width');

    //  Now split sections as in the reference unit
    unit.splitSection(root_id, 'vertical');
    unit.setSectionMullionPosition(root_id, 838);
    full_root = unit.generateFullRoot();

    // console.log( unit.generateFullRoot() );
    // console.log( unit.getSizes() );

    var left_section = full_root.sections[0];
    var right_section = full_root.sections[1];

    //  Split left and right sections as well
    unit.splitSection(left_section.id, 'horizontal');
    unit.splitSection(right_section.id, 'horizontal');
    unit.setSectionMullionPosition(left_section.id, 1511.3);
    unit.setSectionMullionPosition(right_section.id, 1511.3);
    full_root = unit.generateFullRoot();

    // console.log( unit.generateFullRoot() );
    // console.log( unit.getSizes() );

    //  TODO: add Glass 3 and Glass 4, enable tests
    //  Glass 1
    // equal(c.inches_to_mm(target_sizes.glasses[2].width), unit.getSizes().glasses[0].width, 'Glass 1 width equals calculated width');
    // equal(c.inches_to_mm(target_sizes.glasses[2].height), unit.getSizes().glasses[0].height, 'Glass 1 height equals calculated height');
    //  Glass 2
    // equal(c.inches_to_mm(target_sizes.glasses[3].width), unit.getSizes().glasses[1].width, 'Glass 2 width equals calculated width');
    // equal(c.inches_to_mm(target_sizes.glasses[3].height), unit.getSizes().glasses[1].height, 'Glass 2 height equals calculated height');

    //  Add proper sash types
    //  TODO: we need to move `createSash` function from Drawing View to Unit
    // var top_right_section = full_root.sections[1].sections[0];
    // var bottom_right_section = full_root.sections[1].sections[1];

    // console.log( unit.generateFullRoot() );
    // console.log( unit.getSizes() );

    // $('body').append( app.preview(unit, {
    //     width: 1000,
    //     height: 1000,
    //     mode: 'image',
    //     position: 'inside'
    // }) );
});
