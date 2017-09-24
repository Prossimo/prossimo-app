import UnitOptionCollection from '../../../../src/core/collections/inline/unit-option-collection';
import UnitOption from '../../../../src/core/models/inline/unit-option';
import DataStore from '../../../../src/core/models/data-store';

const DICTIONARIES = [
    { id: 1, position: 0 },
    { id: 22, position: 1 },
    { id: 77, position: 2 },
    { id: 17, position: 3 },
];

test('Unit option collection test', () => {
    test('UnitOptionCollection basic tests', () => {
        const unit_option_collection = new UnitOptionCollection(null, { parse: true });

        equal(unit_option_collection.length, 0, 'unit_option_collection contains 0 entries by default');

        const unit_option_collection_with_data = new UnitOptionCollection([
            {
                dictionary_id: 17,
                dictionary_entry_id: 33,
                quantity: 5,
            },
            {
                dictionary_id: 4,
                dictionary_entry_id: 41,
            },
        ], { parse: true });

        equal(unit_option_collection_with_data.length, 2, 'unit_option_collection_with_data should contain 2 entries');
        equal(
            unit_option_collection_with_data.at(0).get('dictionary_id'),
            17,
            'Collection item `dictionary_id` attribure is correct',
        );
    });

    test('UnitOptionCollection getByDictionaryId function', () => {
        const unit_option_collection = new UnitOptionCollection([
            {
                dictionary_id: 17,
                dictionary_entry_id: 33,
                quantity: 5,
            },
            {
                dictionary_id: 4,
                dictionary_entry_id: 41,
            },
            {
                dictionary_id: 8,
                dictionary_entry_id: 13,
            },
        ], { parse: true });

        const first_item = unit_option_collection.getByDictionaryId(17);
        const second_item = unit_option_collection.getByDictionaryId(4);
        const nonexistent_item = unit_option_collection.getByDictionaryId(999);

        ok(first_item instanceof UnitOption, 'first_item is a UnitOption object');
        equal(first_item.get('quantity'), 5, 'first_item has quantity set to 5');

        equal(second_item.get('quantity'), 1, 'second_item has quantity set to 1');
        equal(nonexistent_item, undefined, 'getByDictionaryId returns undefined if there is no such item');
    });

    //  See global DICTIONARIES at the beginning if this file,
    //  it includes specific order of dictionaries which we check here
    test('UnitOptionCollection sorting', () => {
        const data_store = new DataStore();

        data_store.dictionaries.reset(DICTIONARIES);

        const unit_option_collection = new UnitOptionCollection([
            {
                dictionary_id: 17,
                dictionary_entry_id: 78,
            },
            {
                dictionary_id: 1,
                dictionary_entry_id: 5,
            },
            {
                dictionary_id: 22,
                dictionary_entry_id: 35,
            },
        ], {
            parse: true,
            dictionaries: data_store.dictionaries,
        });

        deepEqual(
            unit_option_collection.pluck('dictionary_id'),
            [1, 22, 17],
            'Collection is properly sorted on creation',
        );

        unit_option_collection.add({
            dictionary_id: 77,
            is_default: false,
        }, { parse: true });

        deepEqual(
            unit_option_collection.pluck('dictionary_id'),
            [1, 22, 77, 17],
            'Collection is properly sorted after inserting a new item',
        );
    });

    test('UnitOptionCollection parse function', () => {
        const collection_data = [
            {
                dictionary_id: 17,
                dictionary_entry_id: 29,
                quantity: 5,
            },
        ];

        const unit_option_collection = new UnitOptionCollection(
            collection_data,
            { parse: true },
        );
        const first_item = unit_option_collection.at(0);

        equal(first_item.get('quantity'), 5, 'First collection item quantity is correct');
        equal(first_item.get('dictionary_entry_id'), 29, 'First collection item dictionary_entry_id is correct');
    });

    test('UnitOptionCollection toJSON function', () => {
        const unit_option_collection = new UnitOptionCollection(
            [
                {
                    dictionary_id: 17,
                    dictionary_entry_id: 29,
                    quantity: 5,
                },
                {
                    dictionary_id: 1,
                    dictionary_entry_id: 52,
                },
            ],
            { parse: true },
        );

        containSubset(
            unit_option_collection.toJSON(),
            [
                {
                    dictionary_id: 1,
                    dictionary_entry_id: 52,
                    quantity: 1,
                },
                {
                    dictionary_id: 17,
                    dictionary_entry_id: 29,
                    quantity: 5,
                },
            ],
            'UnitOptionCollection toJSON representation should match the expected data',
        );
    });
});
