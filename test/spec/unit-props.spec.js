import _ from 'underscore';

import App from 'src/main';
import {convert as c} from 'src/utils';
import Unit from 'src/core/models/unit';
import Profile from 'src/core/models/profile';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

describe('Unit model tests: ', function () {
    describe('unit basic tests', function () {
        let unit = new Unit({
            width: c.mm_to_inches(1000),
            height: c.mm_to_inches(2000)
        });

        ok(unit.get('width'), 'width should be defined');
        ok(unit.get('height'), 'height should be defined');
    });
    describe('default attributes', function () {
        let unit = new Unit();

        ok(unit.hasOnlyDefaultAttributes(), 'Unit has only default attributes upon creation');

        unit.set('width', 100);
        notOk(unit.hasOnlyDefaultAttributes(), 'Unit has non-default attributes after calling set()');
    });
    describe('split by two parts', function () {
        let unit = new Unit({
            width: c.mm_to_inches(1000),
            height: c.mm_to_inches(2000)
        });

        unit.profile = new Profile({
            frame_width: 10,
            mullion_width: 20
        });
        let id = unit.get('root_section').id;

        unit.splitSection(id, 'vertical');
        let rootSection = unit.generateFullRoot();
        let leftSection = rootSection.sections[0].openingParams;

        equal(leftSection.x, unit.profile.get('frame_width'));
        equal(leftSection.y, unit.profile.get('frame_width'));
        equal(leftSection.width, 500 - 10 - 20 / 2);
        equal(leftSection.height, 2000 - 10 * 2);
    });
    describe('split by 3 parts', function () {
        let unit = new Unit({
            width: c.mm_to_inches(1000),
            height: c.mm_to_inches(2000)
        });

        unit.profile = new Profile({
            frame_width: 10,
            mullion_width: 20
        });
        let id = unit.get('root_section').id;

        unit.splitSection(id, 'vertical');

        id = unit.get('root_section').sections[0].id;
        unit.splitSection(id, 'vertical');
        let rootSection = unit.generateFullRoot();
        let leftSection = rootSection.sections[0].sections[0].openingParams;

        equal(leftSection.x, unit.profile.get('frame_width'));
        equal(leftSection.y, unit.profile.get('frame_width'));
        equal(leftSection.width, (500 - 10 - 20 / 2) / 2 - 20 / 2);
        equal(leftSection.height, 2000 - 10 * 2);
    });
    describe('find sash border offsets', function () {
        let unit = new Unit({
            width: c.mm_to_inches(1000),
            height: c.mm_to_inches(2000)
        });

        unit.profile = new Profile({
            frame_width: 10,
            mullion_width: 20
        });
        // split by 2 parts
        let id = unit.get('root_section').id;

        unit.splitSection(id, 'vertical');
        let rootSection = unit.generateFullRoot();
        let leftSection = rootSection.sections[0];

        equal(leftSection.mullionEdges.right, 'vertical');
        equal(leftSection.mullionEdges.left, undefined);
        equal(leftSection.mullionEdges.top, undefined);
        equal(leftSection.mullionEdges.bottom, undefined);

        // split by 3 parts
        let rightSection = rootSection.sections[1];

        unit.splitSection(rightSection.id, 'horizontal');
        rootSection = unit.generateFullRoot();
        let topSection = rootSection.sections[1].sections[0];
        let bottomSection = rootSection.sections[1].sections[1];

        equal(topSection.mullionEdges.right, undefined);
        equal(topSection.mullionEdges.left, 'vertical');
        equal(topSection.mullionEdges.top, undefined);
        equal(topSection.mullionEdges.bottom, 'horizontal');

        equal(bottomSection.mullionEdges.right, undefined);
        equal(bottomSection.mullionEdges.left, 'vertical');
        equal(bottomSection.mullionEdges.top, 'horizontal');
        equal(bottomSection.mullionEdges.bottom, undefined);
    });
    describe('Size calculations for Unit #010 from 377 E 10th project', function () {
        //  We use values in mms because that's what was used in the reference project.
        //  If we use values in inches, there's a noticeable margin of error
        let sash_list;
        let unit_sizes;
        let unit = new Unit({
            width: c.mm_to_inches(1067),
            height: c.mm_to_inches(1194)
        });

        unit.profile = new Profile({
            frame_width: 70,
            mullion_width: 92
        });

        let target_sizes = {
            glasses: [
                {
                    width: 927,
                    height: 1054
                }
            ]
        };

        unit_sizes = unit.getSizes();

        //  Frame
        equal(1067, unit_sizes.frame.width, 'Unit width equals calculated width');
        equal(1194, unit_sizes.frame.height, 'Unit height equals calculated height');
        equal(70, unit_sizes.frame.frame_width, 'Unit frame width equals calculated frame width');

        //  Glass 1
        equal(target_sizes.glasses[0].width, unit_sizes.glasses[0].width, 'Glass 1 width equals calculated width');
        equal(target_sizes.glasses[0].height, unit_sizes.glasses[0].height, 'Glass 1 height equals calculated height');

        //  Check that list of sashes is correct
        sash_list = unit.getSashList();

        equal(sash_list.length, 1, 'The number of sashes is expected to be 1');
        equal(sash_list[0].type, 'Fixed', 'Sash type is expected to be Fixed');
        equal(sash_list[0].filling.type, 'glass', 'Sash filling type is expected to be glass');
        equal(sash_list[0].filling.width, target_sizes.glasses[0].width, 'Sash filling width equals Glass 1 width');
        equal(sash_list[0].filling.height, target_sizes.glasses[0].height, 'Sash filling height equals Glass 1 height');
    });
    describe('Size calculations for Unit #001 from 377 E 10th project', function () {
        //  We use values in mms because that's what was used in the reference project.
        //  1 millimeter difference is possible
        let margin_of_error = 1;
        let unit_sizes;
        let unit_size_stats;
        let sash_list;

        let unit = new Unit({
            width: c.mm_to_inches(1676),
            height: c.mm_to_inches(2083),
            glazing_bar_width: 12
        });

        unit.profile = new Profile({
            frame_width: 70,
            mullion_width: 92,
            sash_frame_width: 82,
            sash_frame_overlap: 34,
            sash_mullion_overlap: 34
        });

        let target_sizes = {
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

        let root_id = unit.get('root_section').id;
        let full_root = unit.generateFullRoot();

        unit_sizes = unit.getSizes();

        let converted_height_in_mm = c.inches_to_mm(unit.get('height'));
        let converted_width_in_mm = c.inches_to_mm(unit.get('width'));
        let calculated_height_in_mm = full_root.sashParams.height +
            2 * full_root.sashParams.x;
        let calculated_width_in_mm = full_root.sashParams.width +
            2 * full_root.sashParams.y;

        //  Frame sizes
        equal(converted_height_in_mm, calculated_height_in_mm, 'Converted height equals calculated height');
        equal(converted_width_in_mm, calculated_width_in_mm, 'Converted width equals calculated width');
        equal(converted_height_in_mm, unit_sizes.frame.height, 'Converted height equals height calculated with getSizes');
        equal(converted_width_in_mm, unit_sizes.frame.width, 'Converted width equals width calculated with getSizes');

        //  Now split sections as in the reference unit
        unit.splitSection(root_id, 'vertical');
        unit.setSectionMullionPosition(root_id, 838);
        full_root = unit.generateFullRoot();

        let left_section = full_root.sections[0];
        let right_section = full_root.sections[1];

        //  Split left and right sections as well
        unit.splitSection(left_section.id, 'horizontal');
        unit.splitSection(right_section.id, 'horizontal');
        unit.setSectionMullionPosition(left_section.id, 1511.3);
        unit.setSectionMullionPosition(right_section.id, 1511.3);
        full_root = unit.generateFullRoot();
        unit_sizes = unit.getSizes();

        //  Glass 1
        equal(Math.abs(target_sizes.glasses[2].width - unit_sizes.glasses[0].width) < margin_of_error,
            true, 'Glass 1 width equals calculated width');
        equal(Math.abs(target_sizes.glasses[2].height - unit_sizes.glasses[0].height) < margin_of_error,
            true, 'Glass 1 height equals calculated height');
        //  Glass 2
        equal(Math.abs(target_sizes.glasses[3].width - unit_sizes.glasses[1].width) < margin_of_error,
            true, 'Glass 2 width equals calculated width');
        equal(Math.abs(target_sizes.glasses[3].height - unit_sizes.glasses[1].height) < margin_of_error,
            true, 'Glass 2 height equals calculated height');

        //  Add proper sash types
        let top_right_section = full_root.sections[1].sections[0];
        let bottom_right_section = full_root.sections[1].sections[1];

        unit.setSectionSashType(top_right_section.id, 'tilt_turn_right');
        unit.setSectionSashType(bottom_right_section.id, 'turn_only_right');

        unit_sizes = unit.getSizes();

        //  Glass 3
        equal(Math.abs(target_sizes.glasses[0].width - unit_sizes.glasses[2].width) < margin_of_error,
            true, 'Glass 3 width equals calculated width');
        equal(Math.abs(target_sizes.glasses[0].height - unit_sizes.glasses[2].height) < margin_of_error,
            true, 'Glass 3 height equals calculated height');
        //  Glass 4
        equal(Math.abs(target_sizes.glasses[1].width - unit_sizes.glasses[3].width) < margin_of_error,
            true, 'Glass 4 width equals calculated width');
        equal(Math.abs(target_sizes.glasses[1].height - unit_sizes.glasses[3].height) < margin_of_error,
            true, 'Glass 4 height equals calculated height');

        //  Sash 1
        equal(Math.abs(target_sizes.sashes[0].width - unit_sizes.sashes[0].width) < margin_of_error,
            true, 'Sash 1 width equals calculated width');
        equal(Math.abs(target_sizes.sashes[0].height - unit_sizes.sashes[0].height) < margin_of_error,
            true, 'Sash 1 height equals calculated height');
        //  Sash 2
        equal(Math.abs(target_sizes.sashes[1].width - unit_sizes.sashes[1].width) < margin_of_error,
            true, 'Sash 2 width equals calculated width');
        equal(Math.abs(target_sizes.sashes[1].height - unit_sizes.sashes[1].height) < margin_of_error,
            true, 'Sash 2 height equals calculated height');

        //  Mullion sizes
        equal(unit_sizes.mullions[0].width, 722, 'Mullion 1 length is correct');
        equal(unit_sizes.mullions[0].type, 'horizontal', 'Mullion 1 type is correct');
        equal(unit_sizes.mullions[1].width, 722, 'Mullion 2 length is correct');
        equal(unit_sizes.mullions[1].type, 'horizontal', 'Mullion 2 type is correct');
        equal(unit_sizes.mullions[2].height, 1943, 'Mullion 3 length is correct');
        equal(unit_sizes.mullions[2].type, 'vertical', 'Mullion 3 type is correct');

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

        //  Now get unit stats
        unit_size_stats = unit.getLinearAndAreaStats();

        equal(unit_size_stats.frame.linear, 7518, 'Unit frame linear');
        equal(unit_size_stats.frame.linear_without_intersections, 7238, 'Unit frame linear without intersections');
        equal(unit_size_stats.frame.area, 1.01332 / 2, 'Unit frame area');
        equal(unit_size_stats.frame.area_both_sides, 1.01332, 'Unit frame area for both sides');
        equal(unit_size_stats.sashes.linear, 7134, 'Unit sashes linear');
        equal(unit_size_stats.sashes.linear_without_intersections, 6478, 'Unit sashes linear without intersections');
        equal(unit_size_stats.sashes.area, 1.062392 / 2, 'Unit sashes area');
        equal(unit_size_stats.sashes.area_both_sides, 1.062392, 'Unit sashes area for both sides');
        equal(unit_size_stats.mullions.linear, 3387, 'Unit mullions linear');
        equal(unit_size_stats.mullions.area, 0.623208 / 2, 'Unit mullions area');
        equal(unit_size_stats.mullions.area_both_sides, 0.623208, 'Unit mullions area for both sides');
        equal(unit_size_stats.profile_total.linear, 18039, 'Unit profile total linear');
        equal(unit_size_stats.profile_total.linear_without_intersections, 17103,
            'Unit profile total linear without intersections');
        equal(unit_size_stats.profile_total.area, 2.69892 / 2, 'Unit profile total area');
        equal(unit_size_stats.profile_total.area_both_sides, 2.69892, 'Unit profile total area for both sides');
        equal(unit_size_stats.openings.area, 1.336422, 'Unit openings area');
        equal(unit_size_stats.glasses.area, 2.374956, 'Unit glasses area');
        equal(unit_size_stats.glasses.area_both_sides, 2.374956 * 2, 'Unit glasses area for both sides');

        //  Now add some glazing bars and get stats for them
        unit.setSectionBars(bottom_right_section.id, {
            vertical: [
                { position: 100 },
                { position: 200 }
            ],
            horizontal: [
                { position: 100 },
                { position: 200 }
            ]
        });

        unit_size_stats = unit.getLinearAndAreaStats();

        equal(unit_size_stats.glazing_bars.linear, 1971.4, 'Unit glazing bar linear');
        equal(unit_size_stats.glazing_bars.linear_without_intersections, 1923.4,
            'Unit glazing bar linear without intersections');
        equal(unit_size_stats.glazing_bars.area, 0.0236568, 'Unit glazing bar area');
        equal(unit_size_stats.glazing_bars.area_both_sides, 0.0236568 * 2, 'Unit glazing bar area for both sides');
    });
    describe('Size calculations for Unit #013 from 377 E 10th project', function () {
        //  We use values in mms because that's what was used in the reference project.
        //  1 millimeter difference is possible
        let margin_of_error = 1;
        let sash_list;

        let unit = new Unit({
            width: c.mm_to_inches(711),
            height: c.mm_to_inches(1880)
        });

        unit.profile = new Profile({
            frame_width: 70,
            mullion_width: 92,
            sash_frame_width: 82,
            sash_frame_overlap: 34,
            sash_mullion_overlap: 34
        });

        let target_sizes = {
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

        let root_id = unit.get('root_section').id;

        //  Now split sections as in the reference unit
        unit.splitSection(root_id, 'horizontal');
        unit.setSectionMullionPosition(root_id, 1308);

        let full_root = unit.generateFullRoot();

        //  Add proper sash types
        let top_section = full_root.sections[0];
        let bottom_section = full_root.sections[1];

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
    describe('Size calculations for unit with threshold (bugfix test case)', function () {
        let unit;
        let full_root;
        let root_id;
        let estimated_list;

        unit = new Unit({
            width: 41,
            height: 78
        });

        unit.profile = new Profile({
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
        estimated_list = unit.getSectionsListWithEstimatedCost();

        equal(estimated_list[0].height.toFixed(2), '1981.20', 'Section height');
        equal(estimated_list[0].width.toFixed(2), '1041.40', 'Section width');
    });
    //  ------------------------------------------------------------------------
    //  Clear opening size calculations - bugfix test case for
    //  https://github.com/prossimo-ben/prossimo-app/issues/181
    //  ------------------------------------------------------------------------
    describe('Clear opening size calculations (bugfix test case)', function () {
        let unit;
        let full_root;
        let root_id;
        let sash_list;

        unit = new Unit({
            width: 2 * 12 + 10,     //  864 mm
            height: 6 * 12          //  1829 mm
        });

        unit.profile = new Profile({
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
    describe('Clear opening size calculations (bugfix test case #2)', function () {
        let unit;
        let full_root;
        let root_id;
        let sash_list;
        let left_section;
        let right_section;
        let top_right_section;
        let bottom_right_section;

        unit = new Unit({
            width: 5 * 12 + 6,      //  1676 mm
            height: 6 * 12 + 10     //  2083 mm
        });

        unit.profile = new Profile({
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
    describe('hasOperableSections function', function () {
        let unit_1;
        let unit_2;
        let full_root;
        let root_id;
        let profile;
        let target_section;

        profile = new Profile({
            frame_width: 70,
            mullion_width: 92,
            sash_frame_width: 82,
            sash_frame_overlap: 34,
            sash_mullion_overlap: 12,
            unit_type: 'Window'
        });

        unit_1 = new Unit({
            width: 5 * 12 + 6,
            height: 6 * 12 + 10
        });

        unit_2 = new Unit({
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
    describe('getSashName function', function () {
        let unit = new Unit();

        equal(unit.getSashName('tilt_turn_right'), 'Tilt-turn Right Hinge',
            'Name for tilt_turn_right type in normal hinges mode');
        equal(unit.getSashName('tilt_turn_right', true), 'Tilt-turn Left Hinge',
            'Name for tilt_turn_right type in reversed hinges mode');

        equal(unit.getSashName('tilt_turn_left'), 'Tilt-turn Left Hinge',
            'Name for tilt_turn_left type in normal hinges mode');
        equal(unit.getSashName('tilt_turn_left', true), 'Tilt-turn Right Hinge',
            'Name for tilt_turn_left type in reversed hinges mode');
    });
    //  ------------------------------------------------------------------------
    //  Total daylight calculations for sections of an operable sash:
    //  https://github.com/prossimo-ben/prossimo-app/issues/126
    //  ------------------------------------------------------------------------

    describe('Total daylight calculations for sections of an operable sash', function () {
        let unit;
        let full_root;
        let root_id;
        let sash_list;

        unit = new Unit({
            width: 8 * 12 + 6,      //  2591 mm
            height: 6 * 12 + 8      //  2032 mm
        });

        unit.profile = new Profile({
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

        //  Opening
        equal(sash_list[0].opening.width.toFixed(), '2451', 'Operable sash opening width');
        equal(sash_list[0].opening.height.toFixed(), '1892', 'Operable sash opening height');

        //  Sash frame
        equal(sash_list[0].sash_frame.width.toFixed(), '2519', 'Operable sash sash frame width');
        equal(sash_list[0].sash_frame.height.toFixed(), '1960', 'Operable sash sash frame height');

        //  Glazing
        equal(sash_list[0].filling.width.toFixed(), '2355', 'Operable sash glazing width');
        equal(sash_list[0].filling.height.toFixed(), '1796', 'Operable sash glazing height');

        //  Now we split operable sash with a horizontal mullion
        unit.splitSection(root_id, 'horizontal');
        sash_list = unit.getSashList();

        //  Top section
        equal(sash_list[0].sections[0].filling.width.toFixed(), '2355', 'Top section glazing width');
        equal(sash_list[0].sections[0].filling.height.toFixed(), '852', 'Top section glazing height');

        //  Bottom section (is identical to the top one)
        equal(sash_list[0].sections[1].filling.width.toFixed(), '2355', 'Bottom section glazing width');
        equal(sash_list[0].sections[1].filling.height.toFixed(), '852', 'Bottom section glazing height');
    });
    describe('hasGlazingBars function', function () {
        let unit_1 = new Unit({
            width: 5 * 12 + 6,
            height: 6 * 12 + 10
        });

        let unit_2 = new Unit({
            width: 5 * 12 + 6,
            height: 6 * 12 + 10
        });

        let profile = new Profile({
            frame_width: 70,
            mullion_width: 92,
            sash_frame_width: 82,
            sash_frame_overlap: 34,
            sash_mullion_overlap: 12,
            unit_type: 'Window'
        });

        unit_1.profile = profile;
        unit_2.profile = profile;

        let root_id = unit_2.generateFullRoot().id;

        unit_2.setSectionBars(root_id, {
            vertical: [
                {
                    position: 300
                }
            ],
            horizontal: [
                {
                    position: 300
                }
            ]
        });

        equal(unit_1.hasGlazingBars(), false, 'Unit 1 is not expected to have bars');
        equal(unit_2.hasGlazingBars(), true, 'Unit 2 is expected to have bars');
    });
    //  ------------------------------------------------------------------------
    //  Test sizes for Clear Opening / Egress Clear Opening
    //  ------------------------------------------------------------------------
    describe('getSashOpeningSize function', function () {
        // create default values
        let unitSizes = {
            width: c.mm_to_inches(800),
            height: c.mm_to_inches(1650)
        };

        // set values
        let unit = new Unit({
            width: unitSizes.width,
            height: unitSizes.height
        });

        unit.profile = new Profile({
            frame_width: 70,
            mullion_width: 92,
            sash_frame_width: 82,
            sash_frame_overlap: 34,
            sash_mullion_overlap: 34,
            clear_width_deduction: 50
        });

        // spit sections and add sash
        let root_id = unit.get('root_section').id;

        unit.splitSection(root_id, 'horizontal');
        unit.setSectionMullionPosition(root_id, 930);
        let full_root = unit.generateFullRoot();
        let top_section = full_root.sections[0];
        let bottom_section = full_root.sections[1];

        // get sash list
        let sashList = unit.getSashList();

        //  These tests are supposed to return undefined, because of Fixed type
        equal(unit.getSashOpeningSize(sashList[0].opening), undefined, 'Top sash (Fixed), normal size');
        equal(unit.getSashOpeningSize(sashList[1].opening), undefined, 'Bottom sash (Fixed), normal size');
        equal(
            unit.getSashOpeningSize(sashList[0].opening, 'egress', sashList[0].original_type),
            undefined,
            'Top sash (Fixed), egress size'
        );
        equal(
            unit.getSashOpeningSize(sashList[1].opening, 'egress', sashList[1].original_type),
            undefined,
            'Bottom sash (Fixed), egress size'
        );

        // set types
        unit.setSectionSashType(top_section.id, 'tilt_only');
        unit.setSectionSashType(bottom_section.id, 'tilt_turn_left');

        // get sash list
        sashList = unit.getSashList();
        deepEqual(
            unit.getSashOpeningSize(sashList[0].opening),
            {
                area: 5.782803232273132,
                height: 32.04724409448819,
                width: 25.984251968503937
            },
            'Top sash (Tilt Only), normal size (26″ x 32 1/16″ (5.78 ft<sup>2</sup>))'
        );
        deepEqual(
            unit.getSashOpeningSize(sashList[1].opening),
            {
                area: 4.290925248517166,
                height: 23.77952755905513,
                width: 25.984251968503937
            },
            'Bottom sash (Tilt-turn Left Hinge), normal size (26″ x 23 3/4″ (4.29 ft<sup>2</sup>))'
        );
        equal(
            unit.getSashOpeningSize(sashList[0].opening, 'egress', sashList[0].original_type),
            undefined,
            'Top sash (Tilt Only), egress size'
        );
        deepEqual(
            unit.getSashOpeningSize(sashList[1].opening, 'egress', sashList[1].original_type),
            {
                area: 3.965855153932532,
                height: 23.77952755905513,
                width: 24.015748031496063
            },
            'Bottom sash (Tilt-turn Left Hinge), egress size (24″ x 23 3/4″ (3.97 ft<sup>2</sup>))'
        );
    });
    //  ------------------------------------------------------------------------
    //  Unit weight estimates
    //  ------------------------------------------------------------------------
    describe('Unit weight calculations function', function () {
        let createFilling = function (type, name, weight) {
            let attrs = { type: type, name: name, weight_per_area: weight };

            return {
                get: function (attr) {
                    return attrs[attr];
                }
            };
        };

        // create default values
        let unitSizes = {
            width: c.mm_to_inches(800),
            height: c.mm_to_inches(1650)
        };
        let fillings = _([
            createFilling('glass', 'Test glass', 0.2),
            createFilling('recessed', 'Test recessed', 0.8)
        ]);
        let profileWeight = 1.5;

        // set values
        let unit = new Unit({
            width: unitSizes.width,
            height: unitSizes.height
        });

        unit.profile = new Profile({
            frame_width: 70,
            mullion_width: 92,
            sash_frame_width: 82,
            sash_frame_overlap: 34,
            sash_mullion_overlap: 34,
            weight_per_length: profileWeight
        });
        App.settings = {
            filling_types: fillings
        };

        // spit sections and add sash
        let root_id = unit.get('root_section').id;

        unit.splitSection(root_id, 'horizontal');
        unit.setSectionMullionPosition(root_id, 1308);

        let full_root = unit.generateFullRoot();
        let top_section = full_root.sections[0];
        let bottom_section = full_root.sections[1];

        unit.setSectionSashType(top_section.id, 'tilt_turn_left');
        unit.setSectionSashType(bottom_section.id, 'turn_only_left');

        // round function
        let roundWeight = function (weight) {
            return parseFloat(weight.toFixed(10));
        };

        let stats;

        // run tests for different filling types
        fillings.each(function (filling) {
            // set filling type and get unit stats
            unit.setFillingType(unit.get('root_section').id, filling.get('type'), filling.get('name'));
            stats = unit.getLinearAndAreaStats();

            // tests
            equal(
                roundWeight(stats.glasses.area * filling.get('weight_per_area')),
                roundWeight(stats.glasses.weight),
                'Glasses weight for glass type: "' + filling.get('type') + '"'
            );
        });

        //  Now set different fillings for top and bottom sashes
        unit.setFillingType(top_section.id, fillings._wrapped[0].get('type'), fillings._wrapped[0].get('name'));
        unit.setFillingType(bottom_section.id, fillings._wrapped[1].get('type'), fillings._wrapped[1].get('name'));

        stats = unit.getLinearAndAreaStats();

        //  Check that profile weight is calculated properly
        equal(
            roundWeight((stats.profile_total.linear / 1000) * profileWeight),
            roundWeight(stats.profile_total.weight),
            'Profile weight calculation'
        );

        //  Now compare with pre-calculated values
        equal(stats.profile_total.weight.toFixed(3), '17.370', 'Profile weight matches pre-calculated value');
        equal(stats.glasses.weight.toFixed(3), '0.182', 'Glasses weight matches pre-calculated value');
        equal(stats.unit_total.weight.toFixed(3), `${0.182 + 17.370}`, 'Total unit weight matches pre-calculated value');

        delete App.settings;
    });
});
