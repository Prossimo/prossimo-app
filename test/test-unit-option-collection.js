/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

app.session = new app.Session();
app.session.set('no_backend', true);

app.settings = new app.Settings();

//  This is here to avoid creating side effects inside tests.
//  TODO: we need to get rid of globals eventually
app.settings.dictionaries = new app.OptionsDictionaryCollection([
    { id: 1, position: 0 },
    { id: 22, position: 1 },
    { id: 77, position: 2 },
    { id: 17, position: 3 }
], { parse: true });


test('UnitOptionCollection basic tests', function () {
    var unit_option_collection = new app.UnitOptionCollection(null, { parse: true });

    ok(unit_option_collection instanceof Backbone.Collection, 'unit_option_collection is a Backbone.Collection object');
    equal(unit_option_collection.length, 0, 'unit_option_collection contains 0 entries by default');

    var unit_option_collection_with_data = new app.UnitOptionCollection([
        {
            dictionary_id: 17,
            dictionary_entry_id: 33,
            quantity: 5
        },
        {
            dictionary_id: 4,
            dictionary_entry_id: 41
        }
    ], { parse: true });

    equal(unit_option_collection_with_data.length, 2, 'unit_option_collection_with_data should contain 2 entries');
    equal(
        unit_option_collection_with_data.at(0).get('dictionary_id'),
        17,
        'Collection item `dictionary_id` attribure is correct'
    );
});


test('UnitOptionCollection getByDictionaryId function', function () {
    var unit_option_collection = new app.UnitOptionCollection([
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
    ], { parse: true });

    var first_item = unit_option_collection.getByDictionaryId(17);
    var second_item = unit_option_collection.getByDictionaryId(4);
    var nonexistent_item = unit_option_collection.getByDictionaryId(999);

    ok(first_item instanceof Backbone.Model, 'first_item is a Backbone.Model object');
    equal(first_item.get('quantity'), 5, 'first_item has quantity set to 5');

    equal(second_item.get('quantity'), 1, 'second_item has quantity set to 1');
    equal(nonexistent_item, undefined, 'getByDictionaryId returns undefined if there is no such item');
});


//  See global app.settings.dictionaries at the beginning if this file,
//  it includes specific order of dictionaries which we check here
test('UnitOptionCollection sorting', function () {
    var unit_option_collection = new app.UnitOptionCollection([
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
    ], { parse: true });

    deepEqual(
        unit_option_collection.pluck('dictionary_id'),
        [1, 22, 17],
        'Collection is properly sorted on creation'
    );

    unit_option_collection.add({
        dictionary_id: 77,
        is_default: false
    }, { parse: true });

    deepEqual(
        unit_option_collection.pluck('dictionary_id'),
        [1, 22, 77, 17],
        'Collection is properly sorted after inserting a new item'
    );
});


test('UnitOptionCollection parse function', function () {
    var collection_data = [
        {
            dictionary_id: 17,
            dictionary_entry_id: 29,
            quantity: 5
        }
    ];

    var unit_option_collection = new app.UnitOptionCollection(
        collection_data,
        { parse: true }
    );
    var first_item = unit_option_collection.at(0);

    equal(first_item.get('quantity'), 5, 'First collection item quantity is correct');
    equal(first_item.get('dictionary_entry_id'), 29, 'First collection item dictionary_entry_id is correct');
});


test('UnitOptionCollection toJSON function', function () {
    var unit_option_collection = new app.UnitOptionCollection(
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
        { parse: true }
    );

    deepEqual(
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
