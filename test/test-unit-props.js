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

test('split by two parts', function () {
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

test('split by 3 parts', function () {
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

test('find sash border offsets', function () {
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
        sashes: [
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
    var calculated_height_in_mm = full_root.sashParams.height +
        2 * full_root.sashParams.x;
    var calculated_width_in_mm = full_root.sashParams.width +
        2 * full_root.sashParams.y;

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

    //  Sash 1
    equal(Math.abs(target_sizes.sashes[0].width - unit.getSizes().sashes[0].width) < margin_of_error,
        true, 'Sash 1 width equals calculated width');
    equal(Math.abs(target_sizes.sashes[0].height - unit.getSizes().sashes[0].height) < margin_of_error,
        true, 'Sash 1 height equals calculated height');
    //  Sash 2
    equal(Math.abs(target_sizes.sashes[1].width - unit.getSizes().sashes[1].width) < margin_of_error,
        true, 'Sash 2 width equals calculated width');
    equal(Math.abs(target_sizes.sashes[1].height - unit.getSizes().sashes[1].height) < margin_of_error,
        true, 'Sash 2 height equals calculated height');

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

    //  Sash 1 frame
    equal(Math.abs(sash_list[0].sash_frame.width - target_sizes.sashes[0].width) < margin_of_error,
        true, 'Sash 3 frame width equals calculated width');
    equal(Math.abs(sash_list[0].sash_frame.height - target_sizes.sashes[0].height) < margin_of_error,
        true, 'Sash 3 frame height equals calculated height');
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
        sashes: [
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

    //  Sash 1
    equal(Math.abs(target_sizes.sashes[1].width - unit.getSizes().sashes[0].width) < margin_of_error,
        true, 'Sash 1 width equals calculated width');
    equal(Math.abs(target_sizes.sashes[1].height - unit.getSizes().sashes[0].height) < margin_of_error,
        true, 'Sash 1 height equals calculated height');
    //  Sash 2
    equal(Math.abs(target_sizes.sashes[0].width - unit.getSizes().sashes[1].width) < margin_of_error,
        true, 'Sash 2 width equals calculated width');
    equal(Math.abs(target_sizes.sashes[0].height - unit.getSizes().sashes[1].height) < margin_of_error,
        true, 'Sash 2 height equals calculated height');

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

    //  Sash 1 frame
    equal(Math.abs(sash_list[0].sash_frame.width - target_sizes.sashes[1].width) < margin_of_error,
        true, 'Sash 1 frame width equals calculated width');
    equal(Math.abs(sash_list[0].sash_frame.height - target_sizes.sashes[1].height) < margin_of_error,
        true, 'Sash 1 frame height equals calculated height');

    //  Sash 2
    equal(sash_list[1].type, 'Turn Only Left Hinge', 'Sash type is expected to be Turn Only Left Hinge');
    equal(sash_list[1].filling.type, 'glass', 'Sash filling type is expected to be glass');

    //  Sash 2 glass
    equal(Math.abs(sash_list[1].filling.width - target_sizes.glasses[0].width) < margin_of_error,
        true, 'Sash 1 glass width equals calculated width');
    equal(Math.abs(sash_list[1].filling.height - target_sizes.glasses[0].height) < margin_of_error,
        true, 'Sash 1 glass height equals calculated height');

    //  Sash 2 frame
    equal(Math.abs(sash_list[1].sash_frame.width - target_sizes.sashes[0].width) < margin_of_error,
        true, 'Sash 1 frame width equals calculated width');
    equal(Math.abs(sash_list[1].sash_frame.height - target_sizes.sashes[0].height) < margin_of_error,
        true, 'Sash 1 frame height equals calculated height');

    //  Now check that default filling type could be changed successfully
    unit.setFillingType(unit.get('root_section').id, 'recessed', 'Recessed');
    sash_list = unit.getSashList();

    equal(sash_list[0].filling.type, 'recessed', 'Sash filling type is expected to be recessed');
    equal(sash_list[1].filling.type, 'recessed', 'Sash filling type is expected to be recessed');
});

//  ------------------------------------------------------------------------
//  Size calculations for unit with threshold (bugfix test case)
//  ------------------------------------------------------------------------

test('Size calculations for unit with threshold (bugfix test case)', function () {
    var unit;
    var full_root;
    var root_id;
    var estimated_list;

    unit = new app.Unit({
        width: 41,
        height: 78
    });

    unit.profile = new app.Profile({
        frame_width: 90,
        mullion_width: 112,
        sash_frame_width: 102,
        sash_frame_overlap: 36,
        sash_mullion_overlap: 14,
        low_threshold: true,
        unit_type: 'Patio Door'
    });

    full_root = unit.generateFullRoot();
    root_id = full_root.id;
    unit.setSectionSashType(root_id, 'tilt_only');
    estimated_list = unit.getSectionsListWithEstimatedPrices();

    equal(estimated_list[0].height.toFixed(2), '1981.20', 'Section height');
    equal(estimated_list[0].width.toFixed(2), '1041.40', 'Section width');
});

//  ------------------------------------------------------------------------
//  Clear opening size calculations - bugfix test case for
//  https://github.com/prossimo-ben/prossimo-app/issues/181
//  ------------------------------------------------------------------------

test('Clear opening size calculations (bugfix test case)', function () {
    var unit;
    var full_root;
    var root_id;
    var sash_list;

    unit = new app.Unit({
        width: 2 * 12 + 10,     //  864 mm
        height: 6 * 12          //  1829 mm
    });

    unit.profile = new app.Profile({
        frame_width: 70,
        mullion_width: 92,
        sash_frame_width: 82,
        sash_frame_overlap: 34,
        sash_mullion_overlap: 12,
        unit_type: 'Window'
    });

    full_root = unit.generateFullRoot();
    root_id = full_root.id;
    unit.setSectionSashType(root_id, 'tilt_turn_right');
    sash_list = unit.getSashList();

    equal(sash_list[0].opening.height.toFixed(), (1829 - 70 * 2).toFixed(), 'Section height');
    equal(sash_list[0].opening.width.toFixed(), (864 - 70 * 2).toFixed(), 'Section width');
});

//  ------------------------------------------------------------------------
//  Clear opening size calculations - more complex bugfix test case for
//  https://github.com/prossimo-ben/prossimo-app/issues/181
//  This was calculated by hand. Unit is similar to #001 from 377 E 10th
//  ------------------------------------------------------------------------

test('Clear opening size calculations (bugfix test case #2)', function () {
    var unit;
    var full_root;
    var root_id;
    var sash_list;
    var left_section;
    var right_section;
    var top_right_section;
    var bottom_right_section;

    unit = new app.Unit({
        width: 5 * 12 + 6,      //  1676 mm
        height: 6 * 12 + 10     //  2083 mm
    });

    unit.profile = new app.Profile({
        frame_width: 70,
        mullion_width: 92,
        sash_frame_width: 82,
        sash_frame_overlap: 34,
        sash_mullion_overlap: 12,
        unit_type: 'Window'
    });

    full_root = unit.generateFullRoot();
    root_id = full_root.id;

    //  Now split sections as in the reference unit
    unit.splitSection(root_id, 'vertical');
    unit.setSectionMullionPosition(root_id, 838);
    full_root = unit.generateFullRoot();
    left_section = full_root.sections[0];
    right_section = full_root.sections[1];

    //  Split left and right sections as well
    unit.splitSection(left_section.id, 'horizontal');
    unit.splitSection(right_section.id, 'horizontal');
    unit.setSectionMullionPosition(left_section.id, 1511.3);
    unit.setSectionMullionPosition(right_section.id, 1511.3);
    full_root = unit.generateFullRoot();

    //  Add proper sash types
    top_right_section = full_root.sections[1].sections[0];
    bottom_right_section = full_root.sections[1].sections[1];
    unit.setSectionSashType(top_right_section.id, 'tilt_turn_right');
    unit.setSectionSashType(bottom_right_section.id, 'turn_only_right');

    sash_list = unit.getSashList();

    //  Openings
    equal(sash_list[0].opening.height.toFixed(), '1395', 'Section 1 opening height');
    equal(sash_list[0].opening.width.toFixed(), '722', 'Section 1 opening width');
    equal(sash_list[1].opening.height.toFixed(), '455', 'Section 2 opening height');
    equal(sash_list[1].opening.width.toFixed(), '722', 'Section 2 opening width');

    //  Sash frames
    equal(sash_list[0].sash_frame.height.toFixed(), (1395 + 34 + 12).toFixed(), 'Section 1 sash frame height');
    equal(sash_list[0].sash_frame.width.toFixed(), (722 + 34 + 12).toFixed(), 'Section 1 sash frame width');
    equal(sash_list[1].sash_frame.height.toFixed(), (455 + 34 + 12).toFixed(), 'Section 2 sash frame height');
    equal(sash_list[1].sash_frame.width.toFixed(), (722 + 34 + 12).toFixed(), 'Section 2 sash frame width');

    //  Fillings (glass sizes)
    equal(sash_list[0].filling.height.toFixed(), (1395 + 34 + 12 - 82 * 2).toFixed(), 'Section 1 glass height');
    equal(sash_list[0].filling.width.toFixed(), (722 + 34 + 12 - 82 * 2).toFixed(), 'Section 1 glass width');
    equal(sash_list[1].filling.height.toFixed(), (455 + 34 + 12 - 82 * 2).toFixed(), 'Section 2 glass height');
    equal(sash_list[1].filling.width.toFixed(), (722 + 34 + 12 - 82 * 2).toFixed(), 'Section 2 glass width');
    equal(sash_list[2].filling.height.toFixed(), '1395', 'Section 3 glass height');
    equal(sash_list[2].filling.width.toFixed(), '722', 'Section 3 glass width');
    equal(sash_list[3].filling.height.toFixed(), '455', 'Section 4 glass height');
    equal(sash_list[3].filling.width.toFixed(), '722', 'Section 4 glass width');
});

test('hasOperableSections function', function () {
    var unit_1;
    var unit_2;
    var full_root;
    var root_id;
    var profile;
    var target_section;

    profile = new app.Profile({
        frame_width: 70,
        mullion_width: 92,
        sash_frame_width: 82,
        sash_frame_overlap: 34,
        sash_mullion_overlap: 12,
        unit_type: 'Window'
    });

    unit_1 = new app.Unit({
        width: 5 * 12 + 6,
        height: 6 * 12 + 10
    });

    unit_2 = new app.Unit({
        width: 8 * 12 + 5,
        height: 9 * 12 + 2
    });

    unit_1.profile = profile;
    unit_2.profile = profile;

    full_root = unit_2.generateFullRoot();
    root_id = full_root.id;

    //  Now split sections as in the reference unit
    unit_2.splitSection(root_id, 'vertical');
    full_root = unit_2.generateFullRoot();
    target_section = full_root.sections[1];

    unit_2.splitSection(target_section.id, 'horizontal');
    full_root = unit_2.generateFullRoot();
    target_section = full_root.sections[1].sections[1];

    unit_2.splitSection(target_section.id, 'vertical');
    full_root = unit_2.generateFullRoot();
    target_section = full_root.sections[1].sections[1].sections[0];

    unit_2.splitSection(target_section.id, 'horizontal');
    full_root = unit_2.generateFullRoot();
    target_section = full_root.sections[1].sections[1].sections[0].sections[0];

    unit_2.setSectionSashType(target_section.id, 'tilt_turn_right');

    equal(unit_1.hasOperableSections(), false, 'Unit 1 is not expected to have operable sections');
    equal(unit_2.hasOperableSections(), true, 'Unit 2 is expected to have operable sections');
});
