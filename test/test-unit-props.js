/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

var c = app.utils.convert;

app.session = new app.Session();
app.session.set('no_backend', true);

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
    equal(leftSection.mullionEdges.right, 'vertical');
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
    equal(topSection.mullionEdges.left, 'vertical');
    equal(topSection.mullionEdges.top, undefined);
    equal(topSection.mullionEdges.bottom, 'horizontal');

    equal(bottomSection.mullionEdges.right, undefined);
    equal(bottomSection.mullionEdges.left, 'vertical');
    equal(bottomSection.mullionEdges.top, 'horizontal');
    equal(bottomSection.mullionEdges.bottom, undefined);
});


//  We use values in mms because that's what was used in the reference project.
//  If we use values in inches, there's a noticeable margin of error
test('Size calculations for Unit #010 from 377 E 10th project', function () {
    var sash_list;
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

    //  Check that list of sashes is correct
    sash_list = unit.getSashList();

    equal(sash_list.length, 1, 'The number of sashes is expected to be 1');
    equal(sash_list[0].type, 'Fixed', 'Sash type is expected to be Fixed');
    equal(sash_list[0].filling.type, 'glass', 'Sash filling type is expected to be glass');
    equal(sash_list[0].filling.width, target_sizes.glasses[0].width, 'Sash filling width equals Glass 1 width');
    equal(sash_list[0].filling.height, target_sizes.glasses[0].height, 'Sash filling height equals Glass 1 height');
});


//  We use values in mms because that's what was used in the reference project.
test('Size calculations for Unit #001 from 377 E 10th project', function () {
    //  1 millimeter difference is possible
    var margin_of_error = 1;
    var sash_list;

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

    unit.setSectionSashType(top_right_section.id, 'tilt_turn_right');
    unit.setSectionSashType(bottom_right_section.id, 'turn_only_right');

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


    //  Check that list of sashes is correct
    sash_list = unit.getSashList();

    equal(sash_list.length, 4, 'The number of sashes is expected to be 4');
    equal(sash_list[0].type, 'Tilt-turn Right Hinge', 'Sash type is expected to be Tilt-turn Right Hinge');
    equal(sash_list[0].filling.type, 'glass', 'Sash filling type is expected to be glass');

    //  Sash 1 glass
    equal(Math.abs(sash_list[0].filling.width - target_sizes.glasses[0].width) < margin_of_error,
        true, 'Sash 1 glass width equals calculated width');
    equal(Math.abs(sash_list[0].filling.height - target_sizes.glasses[0].height) < margin_of_error,
        true, 'Sash 1 glass height equals calculated height');

    //  Sash 1 opening
    equal(Math.abs(sash_list[0].opening.width - target_sizes.openings[0].width) < margin_of_error,
        true, 'Sash 3 opening width equals calculated width');
    equal(Math.abs(sash_list[0].opening.height - target_sizes.openings[0].height) < margin_of_error,
        true, 'Sash 3 opening height equals calculated height');
});


//  We use values in mms because that's what was used in the reference project.
test('Size calculations for Unit #013 from 377 E 10th project', function () {
    //  1 millimeter difference is possible
    var margin_of_error = 1;
    var sash_list;

    var unit = new app.Unit({
        width: c.mm_to_inches(711),
        height: c.mm_to_inches(1880)
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
                width: 475,
                height: 360
            },
            {
                width: 475,
                height: 1096
            }
        ],
        openings: [
            {
                width: 639,
                height: 524
            },
            {
                width: 639,
                height: 1260
            }
        ]
    };

    var root_id = unit.get('root_section').id;

    //  Now split sections as in the reference unit
    unit.splitSection(root_id, 'horizontal');
    unit.setSectionMullionPosition(root_id, 1308);

    var full_root = unit.generateFullRoot();

    //  Add proper sash types
    var top_section = full_root.sections[0];
    var bottom_section = full_root.sections[1];

    unit.setSectionSashType(top_section.id, 'tilt_turn_left');
    unit.setSectionSashType(bottom_section.id, 'turn_only_left');

    //  Opening 1
    equal(Math.abs(target_sizes.openings[1].width - unit.getSizes().openings[0].width) < margin_of_error,
        true, 'Opening 1 width equals calculated width');
    equal(Math.abs(target_sizes.openings[1].height - unit.getSizes().openings[0].height) < margin_of_error,
        true, 'Opening 1 height equals calculated height');
    //  Opening 2
    equal(Math.abs(target_sizes.openings[0].width - unit.getSizes().openings[1].width) < margin_of_error,
        true, 'Opening 2 width equals calculated width');
    equal(Math.abs(target_sizes.openings[0].height - unit.getSizes().openings[1].height) < margin_of_error,
        true, 'Opening 2 height equals calculated height');

    //  Glass 1
    equal(Math.abs(target_sizes.glasses[1].width - unit.getSizes().glasses[0].width) < margin_of_error,
        true, 'Glass 1 width equals calculated width');
    equal(Math.abs(target_sizes.glasses[1].height - unit.getSizes().glasses[0].height) < margin_of_error,
        true, 'Glass 1 height equals calculated height');
    //  Glass 2
    equal(Math.abs(target_sizes.glasses[0].width - unit.getSizes().glasses[1].width) < margin_of_error,
        true, 'Glass 2 width equals calculated width');
    equal(Math.abs(target_sizes.glasses[0].height - unit.getSizes().glasses[1].height) < margin_of_error,
        true, 'Glass 2 height equals calculated height');


    //  Check that list of sashes is correct
    sash_list = unit.getSashList();

    equal(sash_list.length, 2, 'The number of sashes is expected to be 2');

    //  Sash 1
    equal(sash_list[0].type, 'Tilt-turn Left Hinge', 'Sash type is expected to be Tilt-turn Left Hinge');
    equal(sash_list[0].filling.type, 'glass', 'Sash filling type is expected to be glass');

    //  Sash 1 glass
    equal(Math.abs(sash_list[0].filling.width - target_sizes.glasses[1].width) < margin_of_error,
        true, 'Sash 1 glass width equals calculated width');
    equal(Math.abs(sash_list[0].filling.height - target_sizes.glasses[1].height) < margin_of_error,
        true, 'Sash 1 glass height equals calculated height');

    //  Sash 1 opening
    equal(Math.abs(sash_list[0].opening.width - target_sizes.openings[1].width) < margin_of_error,
        true, 'Sash 1 opening width equals calculated width');
    equal(Math.abs(sash_list[0].opening.height - target_sizes.openings[1].height) < margin_of_error,
        true, 'Sash 1 opening height equals calculated height');

    //  Sash 2
    equal(sash_list[1].type, 'Turn Only Left Hinge', 'Sash type is expected to be Turn Only Left Hinge');
    equal(sash_list[1].filling.type, 'glass', 'Sash filling type is expected to be glass');

    //  Sash 2 glass
    equal(Math.abs(sash_list[1].filling.width - target_sizes.glasses[0].width) < margin_of_error,
        true, 'Sash 1 glass width equals calculated width');
    equal(Math.abs(sash_list[1].filling.height - target_sizes.glasses[0].height) < margin_of_error,
        true, 'Sash 1 glass height equals calculated height');

    //  Sash 2 opening
    equal(Math.abs(sash_list[1].opening.width - target_sizes.openings[0].width) < margin_of_error,
        true, 'Sash 1 opening width equals calculated width');
    equal(Math.abs(sash_list[1].opening.height - target_sizes.openings[0].height) < margin_of_error,
        true, 'Sash 1 opening height equals calculated height');

    //  Now check that default filling type could be changed successfully
    unit.setFillingType(unit.get('root_section').id, 'recessed', 'Recessed');
    sash_list = unit.getSashList();

    equal(sash_list[0].filling.type, 'recessed', 'Sash filling type is expected to be recessed');
    equal(sash_list[1].filling.type, 'recessed', 'Sash filling type is expected to be recessed');
});
