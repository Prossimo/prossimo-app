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


//  We use values in mms because that's what was used in the reference project.
//  If we use values in inches, there's a noticeable margin of error
test('Size calculations for Unit #010 from 377 E 10th project', function () {
    var unit = new app.Unit({
        width: c.mm_to_inches(1067),
        height: c.mm_to_inches(1194)
    });

    unit.profile = new app.Profile({
        frame_width: 70,
        mullion_width: 92
    });

    var target_sizes = {
        glasses: [
            {
                width: 927,
                height: 1054
            }
        ]
    };

    //  Glass 1
    equal(target_sizes.glasses[0].width, unit.getSizes().glasses[0].width, 'Glass 1 width equals calculated width');
    equal(target_sizes.glasses[0].height, unit.getSizes().glasses[0].height, 'Glass 1 height equals calculated height');
});


//  We use values in mms because that's what was used in the reference project.
test('Size calculations for Unit #001 from 377 E 10th project', function () {
    //  1 millimeter difference is possible
    var margin_of_error = 1;

    var unit = new app.Unit({
        width: c.mm_to_inches(1676),
        height: c.mm_to_inches(2083)
    });

    unit.profile = new app.Profile({
        frame_width: 70,
        mullion_width: 92,
        sash_frame_width: 82,
        sash_frame_overlap: 34,
        sash_mullion_overlap: 34
    });

    var target_sizes = {
        glasses: [
            {
                width: 626,
                height: 1299
            },
            {
                width: 626,
                height: 360
            },
            {
                width: 722,
                height: 1395
            },
            {
                width: 722,
                height: 455
            }
        ],
        openings: [
            {
                width: 790,
                height: 1463
            },
            {
                width: 790,
                height: 524
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

    equal(converted_height_in_mm, calculated_height_in_mm, 'Converted height equals calculated height');
    equal(converted_width_in_mm, calculated_width_in_mm, 'Converted width equals calculated width');

    //  Now split sections as in the reference unit
    unit.splitSection(root_id, 'vertical');
    unit.setSectionMullionPosition(root_id, 838);
    full_root = unit.generateFullRoot();

    var left_section = full_root.sections[0];
    var right_section = full_root.sections[1];

    //  Split left and right sections as well
    unit.splitSection(left_section.id, 'horizontal');
    unit.splitSection(right_section.id, 'horizontal');
    unit.setSectionMullionPosition(left_section.id, 1511.3);
    unit.setSectionMullionPosition(right_section.id, 1511.3);
    full_root = unit.generateFullRoot();

    //  Glass 1
    equal(Math.abs(target_sizes.glasses[2].width - unit.getSizes().glasses[0].width) < margin_of_error,
        true, 'Glass 1 width equals calculated width');
    equal(Math.abs(target_sizes.glasses[2].height - unit.getSizes().glasses[0].height) < margin_of_error,
        true, 'Glass 1 height equals calculated height');
    //  Glass 2
    equal(Math.abs(target_sizes.glasses[3].width - unit.getSizes().glasses[1].width) < margin_of_error,
        true, 'Glass 2 width equals calculated width');
    equal(Math.abs(target_sizes.glasses[3].height - unit.getSizes().glasses[1].height) < margin_of_error,
        true, 'Glass 2 height equals calculated height');

    //  Add proper sash types
    var top_right_section = full_root.sections[1].sections[0];
    var bottom_right_section = full_root.sections[1].sections[1];

    unit.setSectionSashType(top_right_section.id, 'tilt_turn_left');
    unit.setSectionSashType(bottom_right_section.id, 'turn_only_left');

    //  Glass 3
    equal(Math.abs(target_sizes.glasses[0].width - unit.getSizes().glasses[2].width) < margin_of_error,
        true, 'Glass 3 width equals calculated width');
    equal(Math.abs(target_sizes.glasses[0].height - unit.getSizes().glasses[2].height) < margin_of_error,
        true, 'Glass 3 height equals calculated height');
    //  Glass 4
    equal(Math.abs(target_sizes.glasses[1].width - unit.getSizes().glasses[3].width) < margin_of_error,
        true, 'Glass 4 width equals calculated width');
    equal(Math.abs(target_sizes.glasses[1].height - unit.getSizes().glasses[3].height) < margin_of_error,
        true, 'Glass 4 height equals calculated height');

    //  Opening 1
    equal(Math.abs(target_sizes.openings[0].width - unit.getSizes().openings[0].width) < margin_of_error,
        true, 'Opening 1 width equals calculated width');
    equal(Math.abs(target_sizes.openings[0].height - unit.getSizes().openings[0].height) < margin_of_error,
        true, 'Opening 1 height equals calculated height');
    //  Opening 2
    equal(Math.abs(target_sizes.openings[1].width - unit.getSizes().openings[1].width) < margin_of_error,
        true, 'Opening 2 width equals calculated width');
    equal(Math.abs(target_sizes.openings[1].height - unit.getSizes().openings[1].height) < margin_of_error,
        true, 'Opening 2 height equals calculated height');
});
