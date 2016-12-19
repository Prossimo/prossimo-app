/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

app.session = new app.Session();
app.session.set('no_backend', true);

app.settings = new app.Settings();

function getNames(models) {
    return _.map(models, function (model) {
        return model.get('name');
    });
}


//  ------------------------------------------------------------------------
//  Collection of dictionary entries
//  ------------------------------------------------------------------------

test('dictionary entry collection basic tests', function () {
    var collection = new app.OptionsDictionaryEntryCollection();

    equal(collection.length, 0, 'Collection length is 0 upon creation');

    collection.add([
        {
            name: 'White Plastic Handle'
        },
        {
            name: 'Brass Metal Handle'
        }
    ]);

    equal(collection.length, 2, 'Collection 1 length increased by 2 after adding 2 new entries');

    deepEqual(getNames(collection.models), [
        'White Plastic Handle',
        'Brass Metal Handle'
    ], 'Collection 2 has the expected set of models');

    //  Test getByName function
    var white_plastic = collection.getByName('White Plastic Handle');

    ok(white_plastic instanceof app.OptionsDictionaryEntry, 'getByName returns object of a proper type');
    equal(white_plastic.get('name'), 'White Plastic Handle', 'Name of the object returned by getByName is correct');
});


test('dictionary entry collection getAvailableForProfile, getDefaultForProfile getDefaultOrFirstAvailableForProfile', function () {
    var collection = new app.OptionsDictionaryEntryCollection();

    equal(collection.getAvailableForProfile(1).length, 0, 'getAvailableForProfile empty array upon creation');
    equal(collection.getDefaultForProfile(1), undefined, 'getDefaultForProfile returns empty result upon creation');
    equal(
        collection.getDefaultOrFirstAvailableForProfile(1),
        undefined,
        'getDefaultOrFirstAvailableForProfile returns empty result upon creation'
    );

    //  Now add 2 new items to the collection
    collection.add([
        {
            name: 'White Plastic Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: true
                }
            ]
        },
        {
            name: 'Brass Metal Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 2,
                    is_default: false
                }
            ]
        }
    ]);

    equal(
        collection.getAvailableForProfile(1).length,
        1,
        'getAvailableForProfile returns expected result for profile_id=1'
    );
    equal(
        collection.getAvailableForProfile(2).length,
        1,
        'getAvailableForProfile returns expected result for profile_id=2'
    );

    equal(
        collection.getDefaultForProfile(1).get('name'),
        'White Plastic Handle',
        'getDefaultForProfile returns expected result for profile_id=1'
    );
    equal(collection.getDefaultForProfile(2), undefined, 'getDefaultForProfile returns empty result for profile_id=2');

    equal(
        collection.getDefaultOrFirstAvailableForProfile(1).get('name'),
        'White Plastic Handle',
        'getDefaultOrFirstAvailableForProfile returns expected result for profile_id=1'
    );
    equal(
        collection.getDefaultOrFirstAvailableForProfile(2).get('name'),
        'Brass Metal Handle',
        'getDefaultOrFirstAvailableForProfile returns expected result for profile_id=2'
    );
});


test('dictionary entry collection profile availability functions', function () {
    var entries = new app.OptionsDictionaryEntryCollection([
        {
            name: 'White Plastic Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: false
                },
                {
                    profile_id: 4,
                    is_default: false
                },
                {
                    profile_id: 77,
                    is_default: true
                }
            ]
        },
        {
            name: 'Brown Plastic Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: false
                },
                {
                    profile_id: 4,
                    is_default: true
                }
            ]
        },
        {
            name: 'Red Plastic Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 5,
                    is_default: true
                },
                {
                    profile_id: 6,
                    is_default: false
                }
            ]
        }
    ]);

    deepEqual(
        getNames(entries.models),
        ['White Plastic Handle', 'Brown Plastic Handle', 'Red Plastic Handle'],
        'Names of all entries'
    );

    //  Entry availability functions
    deepEqual(
        getNames(entries.getAvailableForProfile(1)),
        ['White Plastic Handle', 'Brown Plastic Handle'],
        'Entries available for a certain profile'
    );
    deepEqual(
        getNames(entries.getAvailableForProfile(112)),
        [],
        'Entries available for a not existing profile'
    );
    deepEqual(
        getNames(entries.getAvailableForProfile(112)),
        [],
        'Entries available for a not existing profile'
    );

    //  Default entry functions
    equal(
        entries.getDefaultForProfile(5).get('name'),
        'Red Plastic Handle',
        'Get default entry for a certain profile'
    );
    equal(
        entries.getDefaultForProfile(1),
        undefined,
        'Get default entry for a profile with no default entries'
    );
    equal(
        entries.getDefaultForProfile(112),
        undefined,
        'Get default entry for a not existing profile'
    );
});


test('dictionary entry collection getIdsOfAllConnectedProfiles', function () {
    var collection = new app.OptionsDictionaryEntryCollection();

    deepEqual(
        collection.getIdsOfAllConnectedProfiles(),
        [],
        'getIdsOfAllConnectedProfiles returns empty array for empty collection'
    );

    collection.add([
        {
            name: 'White Plastic Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: true
                }
            ]
        },
        {
            name: 'Red Plastic Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: false
                },
                {
                    profile_id: 2,
                    is_default: true
                }
            ]
        }
    ]);

    deepEqual(
        collection.getIdsOfAllConnectedProfiles(),
        [1, 2],
        'getIdsOfAllConnectedProfiles returns array with 2 ids, after adding two types'
    );

    collection.add({
        name: 'Unnecessary Handle',
        dictionary_entry_profiles: [
            {
                profile_id: 17,
                is_default: true
            }
        ]
    });
    collection.setItemAvailabilityForProfile(18, collection.at(1), true);

    deepEqual(
        collection.getIdsOfAllConnectedProfiles(),
        [1, 2, 17, 18],
        'getIdsOfAllConnectedProfiles returns array with 4 ids, after adding more types and more connections'
    );
});


test('dictionary entry collection validatePerProfileDefaults', function () {
    var collection = new app.OptionsDictionaryEntryCollection([
        {
            name: 'White Plastic Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: true
                }
            ]
        },
        {
            name: 'Brass Metal Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: true
                },
                {
                    profile_id: 2,
                    is_default: true
                }
            ]
        }
    ]);

    equal(collection.at(0).isDefaultForProfile(1), true, 'First collection item is set as default for profile_id=1');
    equal(collection.at(1).isDefaultForProfile(1), true, 'Second collection item is set as default for profile_id=1');
    equal(collection.at(1).isDefaultForProfile(2), true, 'Second collection item is set as default for profile_id=2');

    collection.validatePerProfileDefaults();

    equal(
        collection.at(0).isDefaultForProfile(1),
        true,
        'First collection item is still set as default for profile_id=1 after validation'
    );
    equal(
        collection.at(1).isDefaultForProfile(1),
        false,
        'Second collection item is no longer set as default for profile_id=1 after validation'
    );
    equal(
        collection.at(1).isDefaultForProfile(2),
        true,
        'Second collection item is still set as default for profile_id=2 after validation'
    );
});


test('dictionary entry collection setItemAvailabilityForProfile', function () {
    var collection = new app.OptionsDictionaryEntryCollection([
        {
            name: 'White Plastic Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: true
                }
            ]
        },
        {
            name: 'Brass Metal Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: false
                },
                {
                    profile_id: 2,
                    is_default: true
                }
            ]
        }
    ]);
    var item_one = collection.at(0);
    var item_two = collection.at(1);

    equal(item_one.isAvailableForProfile(1), true, 'First collection item is available for profile_id=1');
    equal(item_two.isAvailableForProfile(1), true, 'Second collection item is available for profile_id=1');
    equal(item_two.isAvailableForProfile(2), true, 'Second collection item is available for profile_id=2');

    collection.setItemAvailabilityForProfile(3, item_one, true);
    collection.setItemAvailabilityForProfile(3, item_two, true);

    equal(item_one.isAvailableForProfile(3), true, 'First collection item is available for profile_id=3');
    equal(item_two.isAvailableForProfile(3), true, 'Second collection item is available for profile_id=3');

    collection.setItemAvailabilityForProfile(1, item_one, false);
    collection.setItemAvailabilityForProfile(1, item_two, false);

    equal(item_one.isAvailableForProfile(1), false, 'First collection item is not available for profile_id=1');
    equal(item_two.isAvailableForProfile(1), false, 'Second collection item is not available for profile_id=1');

    //  Now try to create a duplicated entry in dictionary_entry_profiles array
    collection.setItemAvailabilityForProfile(3, item_two, true);

    deepEqual(
        item_two.getIdsOfProfilesWhereIsAvailable(),
        _.uniq(item_two.getIdsOfProfilesWhereIsAvailable()),
        'dictionary_entry_profiles array should not contain any duplicated entries'
    );
});


test('dictionary entry collection setItemAsDefaultForProfile', function () {
    var collection = new app.OptionsDictionaryEntryCollection([
        {
            name: 'White Plastic Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: true
                }
            ]
        },
        {
            name: 'Brass Metal Handle',
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: false
                },
                {
                    profile_id: 2,
                    is_default: true
                }
            ]
        }
    ]);
    var item_one = collection.at(0);
    var item_two = collection.at(1);

    equal(item_one.isDefaultForProfile(1), true, 'First collection item is set as default for profile_id=1');
    equal(item_two.isDefaultForProfile(1), false, 'Second collection item is not set as default for profile_id=1');
    equal(item_two.isDefaultForProfile(2), true, 'Second collection item is set as default for profile_id=2');

    //  Just flip default item for profile 1
    collection.setItemAsDefaultForProfile(1, item_two);

    equal(item_one.isDefaultForProfile(1), false, 'First collection item is no longer set as default for profile_id=1');
    equal(item_two.isDefaultForProfile(1), true, 'Second collection item is now set as default for profile_id=1');
    equal(item_two.isDefaultForProfile(2), true, 'Second collection item is still set as default for profile_id=2');

    //  Now we want to set one item as default for a completely different
    //  profile, the one it wasn't available before
    collection.setItemAsDefaultForProfile(3, item_one);

    equal(item_one.isAvailableForProfile(3), true, 'First collection item is now available for profile_id=3');
    equal(item_one.isDefaultForProfile(3), true, 'First collection item is now set as default for profile_id=3');
});
