import _ from 'underscore';

import App from '../../../../src/main';
import Unit from '../../../../src/core/models/unit';
import Multiunit from '../../../../src/core/models/multiunit';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

describe('Multiunit model', () => {
    test('multiunit model basic tests', () => {
        const multiunit = new Multiunit({
            mark: 'A',
        });

        equal(multiunit.get('mark'), 'A', 'Multiunit name is properly set');
        ok(_.isArray(multiunit.get('multiunit_subunits')), 'Multiunit multiunit_subunits is an array');
        ok(_.isObject(multiunit.get('root_section')), 'Multiunit root_section is an object');
    });

    test('multiunit model toJSON', () => {
        const subunit1 = new Unit({ id: 11 });
        const subunit2 = new Unit({ id: 12 });
        const subunit3 = new Unit({ id: 101 });
        const multiunit = new Multiunit({
            mark: 'Whatever',
            description: 'Some description',
            exceptions: 'Some exceptions',
            multiunit_subunits: [11, 12, 101],
            root_section: {
                id: 18,
                connectors: [
                    { id: 1, side: 'right', connects: [11, 12], width: 20, facewidth: 40 },
                    { id: 2, side: 'right', connects: [12, 101], width: 20, facewidth: 40 },
                ],
            },
        }, {
            parse: true,
            subunits: [subunit1, subunit2, subunit3],
        });

        deepEqual(
            multiunit.toJSON(),
            {
                customer_image: '',
                description: 'Some description',
                exceptions: 'Some exceptions',
                mark: 'Whatever',
                multiunit_subunits: JSON.stringify([11, 12, 101]),
                notes: '',
                position: 0,
                quantity: 1,
                root_section: JSON.stringify({ id: 18, connectors: [] }),
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
            multiunit_subunits: JSON.stringify([11, 12, 101]),
            root_section: JSON.stringify({
                id: 18,
                connectors: [],
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
        deepEqual(
            multiunit_two.get('multiunit_subunits'),
            JSON.parse(source_data.multiunit_subunits),
            'Multiunit multiunit_subunits is set correctly',
        );
        deepEqual(
            multiunit_two.get('root_section'),
            JSON.parse(source_data.root_section),
            'Multiunit root_section is set correctly',
        );

        const multiunit_three = new Multiunit(broken_data, { parse: true });

        deepEqual(
            multiunit_three.get('multiunit_subunits'),
            [],
            'Multiunit multiunit_subunits is empty array if source data is incorrect',
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
        second_multiunit.set('root_section', { id: 'none', connectors: [1, 2, 3] });
        third_multiunit.set('multiunit_subunits', [1, 2, 3]);

        notOk(first_multiunit.hasOnlyDefaultAttributes(), 'First multiunit has non-default attributes after calling set');
        notOk(second_multiunit.hasOnlyDefaultAttributes(), 'Second multiunit has non-default attributes after calling set');
        notOk(third_multiunit.hasOnlyDefaultAttributes(), 'Third multiunit has non-default attributes after calling set');
    });

    test('convert unit to multiunit', () => {
        const unit = new Unit();
        const multiunit = unit.toMultiunit();

        ok(multiunit.isMultiunit(), 'Conversion result is a multiunit');
        ok(unit.isSubunitOf(multiunit), 'The multiunit contains its predecessor as a subunit');
    });
});
