/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

app.session = new app.Session();
app.session.set('no_backend', true);

test('multiunit model basic tests', function () {
    var multiunit = new app.Multiunit({
        mark: 'A'
    });

    equal(multiunit.get('mark'), 'A', 'Multiunit name is properly set');
    ok(_.isArray(multiunit.get('multiunit_subunits')), 'Multiunit multiunit_subunits is an array');
    ok(_.isObject(multiunit.get('root_section')), 'Multiunit root_section is an object');
});


test('multiunit model toJSON', function () {
    var multiunit = new app.Multiunit({
        mark: 'Whatever',
        description: 'Some description',
        exceptions: 'Some exceptions',
        multiunit_subunits: [11, 12, 101],
        root_section: {
            id: 18,
            connectors: []
        }
    }, { parse: true });

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
            root_section: JSON.stringify({ id: 18, connectors: [] })
        },
        'Multiunit should be properly cast to json'
    );
});


test('multiunit model parse function', function () {
    var source_data = {
        mark: 'Whatever',
        width: 12,
        height: 300,
        description: 'Some description',
        exceptions: 'Some exceptions',
        multiunit_subunits: JSON.stringify([11, 12, 101]),
        root_section: JSON.stringify({
            id: 18,
            connectors: []
        })
    };
    var broken_data = _.extend({}, source_data, { multiunit_subunits: 'broken string', root_section: 'wrong data' });

    var multiunit = new app.Multiunit(source_data, { parse: true });
    var parsed_data = multiunit.parse(source_data);

    //  Specifically check results of the parse function
    equal(parsed_data.mark, source_data.mark, 'Parsed data correctly preserves attributes included in schema');
    equal(parsed_data.height, undefined, 'Parsed data does not include any nonexistent attributes');

    var multiunit_two = new app.Multiunit(source_data, { parse: true });

    equal(multiunit_two.get('mark'), source_data.mark, 'Multiunit mark is set correctly');
    deepEqual(
        multiunit_two.get('multiunit_subunits'),
        JSON.parse(source_data.multiunit_subunits),
        'Multiunit multiunit_subunits is set correctly'
    );
    deepEqual(
        multiunit_two.get('root_section'),
        JSON.parse(source_data.root_section),
        'Multiunit root_section is set correctly'
    );

    var multiunit_three = new app.Multiunit(broken_data, { parse: true });

    deepEqual(
        multiunit_three.get('multiunit_subunits'),
        [],
        'Multiunit multiunit_subunits is empty array if source data is incorrect'
    );
    deepEqual(
        _.keys(multiunit_three.get('root_section')),
        _.keys(multiunit_three.getDefaultValue('root_section')),
        'Multiunit root_section is set to default if source data is incorrect'
    );
    equal(
        _.keys(multiunit_three.get('root_section').connectors.length),
        0,
        'Multiunit root_section has 0 connectors if source data is incorrect'
    );
});


test('multiunit hasOnlyDefaultAttributes function', function () {
    var first_multiunit = new app.Multiunit();
    var second_multiunit = new app.Multiunit();
    var third_multiunit = new app.Multiunit();

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
