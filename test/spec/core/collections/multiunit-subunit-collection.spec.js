import App from '../../../../src/main';
import MultiunitSubunitCollection from '../../../../src/core/collections/inline/multiunit-subunit-collection';
import MultiunitSubunit from '../../../../src/core/models/inline/multiunit-subunit';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

test('MultiunitSubunit collection test', () => {
    test('MultiunitSubunitCollection basic tests', () => {
        const subunit_collection = new MultiunitSubunitCollection(null, { parse: true });

        equal(subunit_collection.length, 0, 'subunit_collection contains 0 entries by default');

        const subunit_collection_with_data = new MultiunitSubunitCollection([
            {
                unit_id: 17,
            },
            {
                unit_id: 11,
            },
        ], { parse: true });

        equal(subunit_collection_with_data.length, 2, 'subunit_collection_with_data should contain 2 entries');
        equal(
            subunit_collection_with_data.at(0).get('unit_id'),
            17,
            'Collection item `unit_id` attribure is correct',
        );
    });

    test('MultiunitSubunitCollection getByUnitId function', () => {
        const subunit_collection = new MultiunitSubunitCollection([
            {
                unit_id: 17,
            },
            {
                unit_id: 11,
            },
        ], { parse: true });

        const first_item = subunit_collection.getByUnitId(17);
        const nonexistent_item = subunit_collection.getByUnitId(999);

        ok(first_item instanceof MultiunitSubunit, 'first_item is a MultiunitSubunit object');

        equal(nonexistent_item, undefined, 'getByUnitId returns undefined if there is no such item');
    });

    test('MultiunitSubunitCollection parse function', () => {
        const collection_data = [
            {
                id: 554,
                unit_id: 17,
            },
            {
                id: 43,
                unit_id: 11,
            },
        ];

        const subunit_collection = new MultiunitSubunitCollection(
            collection_data,
            { parse: true },
        );
        const first_item = subunit_collection.at(0);

        equal(first_item.get('unit_id'), 17, 'First collection item unit_id is correct');
    });

    test('MultiunitSubunitCollection toJSON function', () => {
        const subunit_collection = new MultiunitSubunitCollection(
            [
                {
                    id: 554,
                    unit_id: 17,
                },
                {
                    id: 43,
                    unit_id: 11,
                },
            ],
            { parse: true },
        );

        containSubset(
            subunit_collection.toJSON(),
            [17, 11],
            'MultiunitSubunitCollection toJSON representation should match the expected data',
        );
    });
});
