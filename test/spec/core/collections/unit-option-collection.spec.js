import {assert} from 'chai';

import App from 'src/main';
import UnitOptionCollection from 'src/core/collections/inline/unit-option-collection';
import UnitOption from 'src/core/models/inline/unit-option';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

test('Unit option collection test', function () {
    before(function () {
        //  This is here to avoid creating side effects inside tests.
        //  TODO: we need to get rid of globals eventually
        App.settings.dictionaries.reset([
            {id: 1, position: 0},
            {id: 22, position: 1},
            {id: 77, position: 2},
            {id: 17, position: 3}
        ], {parse: true});
    });
    test('UnitOptionCollection basic tests', function () {
        let unit_option_collection = new UnitOptionCollection(null, {parse: true});

        equal(unit_option_collection.length, 0, 'unit_option_collection contains 0 entries by default');

        let unit_option_collection_with_data = new UnitOptionCollection([
            {
                dictionary_id: 17,
                dictionary_entry_id: 33,
                quantity: 5
            },
            {
                dictionary_id: 4,
                dictionary_entry_id: 41
            }
        ], {parse: true});

        equal(unit_option_collection_with_data.length, 2, 'unit_option_collection_with_data should contain 2 entries');
        equal(
            unit_option_collection_with_data.at(0).get('dictionary_id'),
            17,
            'Collection item `dictionary_id` attribure is correct'
        );
    });

    test('UnitOptionCollection getByDictionaryId function', function () {
        let unit_option_collection = new UnitOptionCollection([
            {
                dictionary_id: 17,
                dictionary_entry_id: 33,
                quantity: 5
            },
            {
                dictionary_id: 4,
                dictionary_entry_id: 41
            },
            {
                dictionary_id: 8,
                dictionary_entry_id: 13
            }
        ], {parse: true});

        let first_item = unit_option_collection.getByDictionaryId(17);
        let second_item = unit_option_collection.getByDictionaryId(4);
        let nonexistent_item = unit_option_collection.getByDictionaryId(999);

        ok(first_item instanceof UnitOption, 'first_item is a UnitOption object');
        equal(first_item.get('quantity'), 5, 'first_item has quantity set to 5');

        equal(second_item.get('quantity'), 1, 'second_item has quantity set to 1');
        equal(nonexistent_item, undefined, 'getByDictionaryId returns undefined if there is no such item');
    });

    //  See global app.settings.dictionaries at the beginning if this file,
    //  it includes specific order of dictionaries which we check here
    test('UnitOptionCollection sorting', function () {
        let unit_option_collection = new UnitOptionCollection([
            {
                dictionary_id: 17,
                dictionary_entry_id: 78
            },
            {
                dictionary_id: 1,
                dictionary_entry_id: 5
            },
            {
                dictionary_id: 22,
                dictionary_entry_id: 35
            }
        ], {parse: true});

        assert.sameMembers(
            unit_option_collection.pluck('dictionary_id'),
            [1, 22, 17],
            'Collection is properly sorted on creation'
        );

        unit_option_collection.add({
            dictionary_id: 77,
            is_default: false
        }, {parse: true});

        assert.sameMembers(
            unit_option_collection.pluck('dictionary_id'),
            [1, 22, 77, 17],
            'Collection is properly sorted after inserting a new item'
        );
    });

    test('UnitOptionCollection parse function', function () {
        let collection_data = [
            {
                dictionary_id: 17,
                dictionary_entry_id: 29,
                quantity: 5
            }
        ];

        let unit_option_collection = new UnitOptionCollection(
            collection_data,
            {parse: true}
        );
        let first_item = unit_option_collection.at(0);

        equal(first_item.get('quantity'), 5, 'First collection item quantity is correct');
        equal(first_item.get('dictionary_entry_id'), 29, 'First collection item dictionary_entry_id is correct');
    });

    test('UnitOptionCollection toJSON function', function () {
        let unit_option_collection = new UnitOptionCollection(
            [
                {
                    dictionary_id: 17,
                    dictionary_entry_id: 29,
                    quantity: 5
                },
                {
                    dictionary_id: 1,
                    dictionary_entry_id: 52
                }
            ],
            {parse: true}
        );

        containSubset(
            unit_option_collection.toJSON(),
            [
                {
                    dictionary_id: 1,
                    dictionary_entry_id: 52,
                    quantity: 1
                },
                {
                    dictionary_id: 17,
                    dictionary_entry_id: 29,
                    quantity: 5
                }
            ],
            'UnitOptionCollection toJSON representation should match the expected data'
        );
    });
});
