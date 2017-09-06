import _ from 'underscore';

import App from '../../../../src/main';
import Unit from '../../../../src/core/models/unit';
import Multiunit from '../../../../src/core/models/multiunit';
import UnitCollection from '../../../../src/core/collections/unit-collection';
import MultiunitSubunitCollection from '../../../../src/core/collections/inline/multiunit-subunit-collection';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

describe('Multiunit model', () => {
    test('multiunit model basic tests', () => {
        const multiunit = new Multiunit({
            mark: 'A',
        }, { parse: true });

        equal(multiunit.get('mark'), 'A', 'Multiunit name is properly set');
        ok(
            multiunit.get('multiunit_subunits') instanceof MultiunitSubunitCollection,
            'multiunit_subunits is an instance of MultiunitSubunitCollection',
        );
        ok(_.isObject(multiunit.get('root_section')), 'Multiunit root_section is an object');
    });

    test('multiunit model toJSON', () => {
        const subunit1 = new Unit({ id: 11 });
        const subunit2 = new Unit({ id: 12 });
        const subunit3 = new Unit({ id: 101 });
        const unit_collection = new UnitCollection([subunit1, subunit2, subunit3]);

        const multiunit = new Multiunit({
            mark: 'Whatever',
            description: 'Some description',
            exceptions: 'Some exceptions',
            multiunit_subunits: [{ id: subunit1.id }, { id: subunit2.id }, { id: subunit3.id }],
            root_section: {
                id: 18,
                originCoords: { x: 0, y: 0 },
                connectors: [
                    { id: 1, side: 'right', connects: [11, 12], width: 20, facewidth: 40 },
                    { id: 2, side: 'right', connects: [12, 101], width: 20, facewidth: 40 },
                ],
            },
        }, {
            parse: true,
            units: unit_collection,
        });

        deepEqual(
            multiunit.toJSON(),
            {
                customer_image: '',
                description: 'Some description',
                exceptions: 'Some exceptions',
                mark: 'Whatever',
                multiunit_subunits: [11, 12, 101],
                notes: '',
                position: 0,
                quantity: 1,
                root_section: JSON.stringify({
                    id: 18,
                    originCoords: { x: 0, y: 0 },
                    connectors: [
                        { id: 1, side: 'right', connects: [11, 12], width: 20, facewidth: 40, length: 0 },
                        { id: 2, side: 'right', connects: [12, 101], width: 20, facewidth: 40, length: 0 },
                    ],
                }),
                connector_width: 20,
                connector_face_width: 40,
            },
            'Multiunit should be properly cast to json',
        );
    });

    test('multiunit model parse function', () => {
        const source_data = {
            mark: 'Whatever',
            width: 12,
            height: 300,
            description: 'Some description',
            exceptions: 'Some exceptions',
            multiunit_subunits: [{ id: 11 }, { id: 12 }, { id: 101 }],
            root_section: JSON.stringify({
                id: 18,
                originCoords: { x: 0, y: 0 },
                connectors: [
                    { id: 1, side: 'right', connects: [11, 12], width: 20, facewidth: 40, length: 0 },
                    { id: 2, side: 'right', connects: [12, 101], width: 20, facewidth: 40, length: 0 },
                ],
            }),
        };
        const broken_data = _.extend({}, source_data, { multiunit_subunits: 'broken string', root_section: 'wrong data' });

        const multiunit = new Multiunit(source_data, { parse: true });
        const parsed_data = multiunit.parse(source_data);

        //  Specifically check results of the parse function
        equal(parsed_data.mark, source_data.mark, 'Parsed data correctly preserves attributes included in schema');
        equal(parsed_data.height, undefined, 'Parsed data does not include any nonexistent attributes');

        const multiunit_two = new Multiunit(source_data, { parse: true });

        equal(multiunit_two.get('mark'), source_data.mark, 'Multiunit mark is set correctly');
        equal(multiunit_two.get('multiunit_subunits').length, 3, 'Multiunit multiunit_subunits has the right amount of entries');
        ok(
            multiunit_two.get('multiunit_subunits') instanceof MultiunitSubunitCollection,
            'Multiunit multiunit_subunits is an instance of MultiunitSubunitCollection',
        );
        deepEqual(
            multiunit_two.get('multiunit_subunits').toJSON(),
            [11, 12, 101],
            'Multiunit multiunit_subunits is correctly cast to JSON',
        );
        deepEqual(
            multiunit_two.get('root_section'),
            JSON.parse(source_data.root_section),
            'Multiunit root_section is set correctly',
        );

        const multiunit_three = new Multiunit(broken_data, { parse: true });

        deepEqual(
            multiunit_three.get('multiunit_subunits').length,
            0,
            'Multiunit multiunit_subunits is an empty collection if source data is incorrect',
        );
        ok(
            multiunit_two.get('multiunit_subunits') instanceof MultiunitSubunitCollection,
            'Multiunit multiunit_subunits is an instance of MultiunitSubunitCollection even if source data is incorrect',
        );
        deepEqual(
            _.omit(multiunit_three.get('root_section'), 'id'),
            _.omit(multiunit_three.getDefaultValue('root_section'), 'id'),
            'Multiunit root_section is set to default if source data is incorrect',
        );
        equal(
            multiunit_three.get('root_section').connectors.length,
            0,
            'Multiunit root_section has 0 connectors if source data is incorrect',
        );
    });

    test('multiunit hasOnlyDefaultAttributes function', () => {
        const first_multiunit = new Multiunit();
        const second_multiunit = new Multiunit();
        const third_multiunit = new Multiunit();

        ok(first_multiunit.hasOnlyDefaultAttributes(), 'First multiunit has only default attributes upon creation');
        ok(second_multiunit.hasOnlyDefaultAttributes(), 'Second multiunit has only default attributes upon creation');
        ok(third_multiunit.hasOnlyDefaultAttributes(), 'Third multiunit has only default attributes upon creation');

        first_multiunit.set('mark', 'Nice Multiunit');
        second_multiunit.set('root_section', { id: 'none', connectors: [1, 2, 3] }, { parse: true });
        third_multiunit.set('multiunit_subunits', [{ id: 1 }, { id: 2 }, { id: 3 }], { parse: true });

        notOk(first_multiunit.hasOnlyDefaultAttributes(), 'First multiunit has non-default attributes after calling set');
        notOk(second_multiunit.hasOnlyDefaultAttributes(), 'Second multiunit has non-default attributes after calling set');
        notOk(third_multiunit.hasOnlyDefaultAttributes(), 'Third multiunit has non-default attributes after calling set');
    });

    test('multiunit model validateSubunits function', () => {
        const subunit1 = new Unit({ id: 11 });
        const subunit2 = new Unit({ id: 12 });
        const subunit3 = new Unit({ id: 101 });
        const extra_unit = new Unit({ id: 372 });
        const unit_collection = new UnitCollection([subunit1, subunit2, subunit3, extra_unit]);

        const source_data = {
            mark: 'Some multiunit',
            multiunit_subunits: [{ id: subunit1.id }, { id: subunit2.id }, { id: subunit3.id }],
            root_section: JSON.stringify({
                id: 18,
                originCoords: { x: 0, y: 0 },
                connectors: [
                    { id: 1, side: 'right', connects: [11, 12], width: 20, facewidth: 40, length: 0 },
                    { id: 2, side: 'right', connects: [12, 101], width: 20, facewidth: 40, length: 0 },
                ],
            }),
        };

        const multiunit = new Multiunit(source_data, {
            parse: true,
            units: unit_collection,
        });
        const multiunit_two = new Multiunit(_.extend({},
            source_data,
            {
                multiunit_subunits: [{ id: subunit1.id }, { id: subunit2.id }, { id: subunit3.id }, { id: 5544 }],
            },
        ), {
            parse: true,
            units: unit_collection,
        });
        const multiunit_three = new Multiunit(_.extend({},
            source_data,
            {
                multiunit_subunits: [{ id: subunit1.id }, { id: subunit2.id }, { id: subunit3.id }, { id: extra_unit.id }],
            },
        ), {
            parse: true,
            units: unit_collection,
        });

        multiunit.validateSubunits();
        multiunit_two.validateSubunits();
        multiunit_three.validateSubunits();

        const reference_data = {
            customer_image: '',
            description: '',
            exceptions: '',
            mark: 'Some multiunit',
            multiunit_subunits: [11, 12, 101],
            notes: '',
            position: 0,
            quantity: 1,
            root_section: JSON.stringify({
                id: 18,
                originCoords: { x: 0, y: 0 },
                connectors: [
                    { id: 1, side: 'right', connects: [11, 12], width: 20, facewidth: 40, length: 0 },
                    { id: 2, side: 'right', connects: [12, 101], width: 20, facewidth: 40, length: 0 },
                ],
            }),
            connector_width: 20,
            connector_face_width: 40,
        };

        deepEqual(
            multiunit.toJSON(),
            reference_data,
            'Multiunit should not be affected by validateSubunits if its source data is correct',
        );
        deepEqual(
            multiunit_two.toJSON(),
            reference_data,
            'Multiunit validateSubunits should remove any units not preset in unit collection from multiunit_subunits',
        );
        deepEqual(
            multiunit_three.toJSON(),
            reference_data,
            'Multiunit validateSubunits should remove any units that are not present in connectors from multiunit_subunits',
        );
    });

    test('convert unit to multiunit', () => {
        const unit = new Unit();
        const multiunit = unit.toMultiunit();

        ok(multiunit.isMultiunit(), 'Conversion result is a multiunit');
        ok(unit.isSubunitOf(multiunit), 'The multiunit contains its predecessor as a subunit');
    });
});
