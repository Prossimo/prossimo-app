import App from '../../../../src/main';
import MultiunitSubunitCollection from '../../../../src/core/collections/inline/multiunit-subunit-collection';
import MultiunitSubunit from '../../../../src/core/models/inline/multiunit-subunit';
import UnitCollection from '../../../../src/core/collections/unit-collection';
import Unit from '../../../../src/core/models/unit';

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

    test('MultiunitSubunit getUnitCollection, getUnit functions', () => {
        const data = [{
            id: 5,
            mark: 'A',
            width: 30,
            height: 40,
        }, {
            id: 6,
            mark: 'B1',
            width: 38,
            height: 24,
        }];
        const unit_collection = new UnitCollection(data, { parse: true });
        const multiunit_subunit_collection = new MultiunitSubunitCollection([
            {
                unit_id: 5,
            },
            {
                unit_id: 6,
            },
        ], {
            parse: true,
            units: unit_collection,
        });
        const test_subunit = multiunit_subunit_collection.at(0);

        equal(test_subunit.get('unit_id'), 5, 'Test subunit unit_id should be set properly');

        ok(test_subunit.getUnitCollection() instanceof UnitCollection, 'getUnitCollection should return an instance of UnitCollection');
        equal(test_subunit.getUnitCollection().length, 2, 'getUnitCollection should return UnitCollection with 2 items');

        ok(test_subunit.getUnit() instanceof Unit, 'getUnit should return an instance of Unit');
        equal(test_subunit.getUnit().get('mark'), 'A', 'getUnit should return Unit with proper attributes');
    });

    test('Subunit change events bubble up properly', () => {
        const data = [{
            id: 5,
            mark: 'A',
            width: 30,
            height: 40,
        }, {
            id: 6,
            mark: 'B1',
            width: 38,
            height: 24,
        }];
        const unit_collection = new UnitCollection(data, { parse: true });
        const multiunit_subunit_collection = new MultiunitSubunitCollection([
            {
                unit_id: 5,
            },
            {
                unit_id: 6,
            },
        ], {
            parse: true,
            units: unit_collection,
        });
        const test_unit = unit_collection.at(0);
        const test_subunit = multiunit_subunit_collection.at(0);

        let collection_event_counter = 0;
        let subunit_event_counter = 0;
        let unit_event_counter = 0;

        multiunit_subunit_collection.on('change', () => {
            collection_event_counter += 1;
        });

        test_subunit.on('change update', () => {
            subunit_event_counter += 1;
        });

        test_unit.on('change destroy', () => {
            unit_event_counter += 1;
        });

        //  Change attribute for some unit
        test_unit.persist('width', 32);

        equal(
            collection_event_counter,
            subunit_event_counter,
            'Number of change events on the collection should match the number of events on subunit',
        );
        equal(
            collection_event_counter,
            unit_event_counter,
            'Number of change events on the subunit should match the number of events on the linked unit',
        );
    });
});
