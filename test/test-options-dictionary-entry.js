/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

app.session = new app.Session();
app.session.set('no_backend', true);

app.settings = new app.Settings();

//  This is here to avoid creating side effects inside tests.
//  TODO: we need to get rid of globals eventually
app.settings.profiles = new app.ProfileCollection([
    { id: 1, position: 0 },
    { id: 2, position: 1 },
    { id: 3, position: 2 },
    { id: 22, position: 3 },
    { id: 77, position: 4 },
    { id: 17, position: 5 }
], { parse: true });


//  ------------------------------------------------------------------------
//  Single dictionary entry
//  ------------------------------------------------------------------------

test('dictionary entry basic test', function () {
    var entry = new app.OptionsDictionaryEntry({
        name: 'White Plastic Handle',
        price: 15
    });

    ok(entry.get('name'), 'Entry name should be defined');

    //  Another entry, to test profiles sorting on load
    var entry_two = new app.OptionsDictionaryEntry({
        name: 'White Plastic Handle',
        dictionary_entry_profiles: [
            {
                profile_id: 3,
                is_default: true
            },
            {
                profile_id: 1,
                is_default: true
            },
            {
                profile_id: 2,
                is_default: true
            }
        ]
    }, { parse: true });

    deepEqual(
        entry_two.get('dictionary_entry_profiles').pluck('profile_id'),
        [1, 2, 3],
        'dictionary_entry_profiles should be sorted on parse'
    );
});


test('dictionary entry parse function', function () {
    var entry = new app.OptionsDictionaryEntry({
        name: 'White Plastic Handle',
        price: 15,
        data: 'some garbled string'
    }, { parse: true });

    deepEqual(entry.get('data'), {}, 'Entry data is set to empty object on parse in case of problematic source data');
});


test('dictionary entry toJSON function', function () {
    var entry = new app.OptionsDictionaryEntry({
        name: 'White Plastic Handle',
        dictionary_entry_profiles: [
            {
                profile_id: 3,
                is_default: true
            }
        ]
    }, { parse: true });

    deepEqual(
        entry.toJSON(),
        {
            name: 'White Plastic Handle',
            position: 0,
            supplier_name: '',
            data: JSON.stringify({}),
            dictionary_entry_profiles: [
                {
                    profile_id: 3,
                    is_default: true,
                    cost_per_item: 0,
                    pricing_grids: JSON.stringify([
                        {
                            name: 'fixed',
                            data: [
                                { height: 500, width: 500, value: 0 },
                                { height: 914, width: 1514, value: 0 },
                                { height: 2400, width: 3000, value: 0 }
                            ]
                        },
                        {
                            name: 'operable',
                            data: [
                                { height: 500, width: 500, value: 0 },
                                { height: 914, width: 1514, value: 0 },
                                { height: 1200, width: 2400, value: 0 }
                            ]
                        }
                    ])
                }
            ]
        },
        'Dictionary entry should be properly cast to json'
    );
});


test('dictionary entry hasOnlyDefaultAttributes attributes', function (assert) {
    var entry = new app.OptionsDictionaryEntry();
    var another_entry = new app.OptionsDictionaryEntry();

    ok(entry.hasOnlyDefaultAttributes(), 'Entry has only default attributes upon creation');
    ok(another_entry.hasOnlyDefaultAttributes(), 'Another entry has only default attributes upon creation');

    entry.set('name', 'Whatever Name');
    another_entry.setProfileAvailability(1, true, true);

    assert.notOk(entry.hasOnlyDefaultAttributes(), 'Entry has non-default attributes after calling set()');
    assert.notOk(
        another_entry.hasOnlyDefaultAttributes(),
        'Another entry has non-default attributes after calling setProfileAvailability'
    );
});


test('dictionary entry isAvailableForProfile function', function () {
    var entry = new app.OptionsDictionaryEntry({
        name: 'White Plastic Handle',
        price: 15,
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
    }, { parse: true });
    var entry_two = new app.OptionsDictionaryEntry({
        name: 'Brass Metal Handle',
        dictionary_entry_profiles: [
            {
                profile_id: 1,
                is_default: false
            },
            {
                profile_id: 4,
                is_default: false
            }
        ]
    }, { parse: true });

    ok(entry.isAvailableForProfile(1), 'Should be available');
    notOk(entry.isAvailableForProfile(2), 'Should not be available');
    ok(entry.isAvailableForProfile(4), 'Should be available');
    ok(entry.isAvailableForProfile(77), 'Should be available');

    ok(entry_two.isAvailableForProfile(4), 'Should be available');
    notOk(entry_two.isAvailableForProfile(77), 'Should not be available');
});


test('dictionary entry isDefaultForProfile function', function () {
    var entry = new app.OptionsDictionaryEntry({
        name: 'White Plastic Handle',
        price: 15,
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
    }, { parse: true });
    var entry_two = new app.OptionsDictionaryEntry({
        name: 'Brass Metal Handle',
        dictionary_entry_profiles: [
            {
                profile_id: 1,
                is_default: true
            },
            {
                profile_id: 77,
                is_default: false
            }
        ]
    }, { parse: true });

    ok(entry.isDefaultForProfile(4), 'Should be set as default');
    notOk(entry.isDefaultForProfile(1), 'Should not be set as default');
    notOk(entry.isDefaultForProfile(2), 'Should not be set as default');

    notOk(entry_two.isDefaultForProfile(4), 'Should not be set as default');
    ok(entry_two.isDefaultForProfile(1), 'Should be set as default');
    notOk(entry_two.isDefaultForProfile(2), 'Should not be set as default');
});


test('dictionary entry setProfileAvailability function', function () {
    var entry = new app.OptionsDictionaryEntry({
        name: 'White Plastic Handle',
        dictionary_entry_profiles: [
            {
                profile_id: 1,
                is_default: true
            },
            {
                profile_id: 2,
                is_default: true
            },
            {
                profile_id: 54,
                is_default: false
            }
        ]
    }, { parse: true });

    equal(entry.isAvailableForProfile(1), true, 'Should be available for profile_id=1 upon creation');
    equal(entry.isAvailableForProfile(2), true, 'Should be available for profile_id=2 upon creation');
    equal(entry.isAvailableForProfile(54), true, 'Should be available for profile_id=54 upon creation');

    //  Make it not available for profile_id=54
    entry.setProfileAvailability(54, false);

    equal(entry.isAvailableForProfile(54), false, 'Should no longer be available for profile_id=54');

    //  Make it available for profile_id=5
    entry.setProfileAvailability(5, true);

    equal(entry.isAvailableForProfile(5), true, 'Should be available for profile_id=5 after made available');
    equal(entry.isDefaultForProfile(5), false, 'Should not be set as default for profile_id=5 after made available');

    //  Now make it not available for profile_id=5
    entry.setProfileAvailability(5, false);

    equal(entry.isAvailableForProfile(5), false, 'Should not be available for profile_id=5 after made not available');
    equal(entry.isDefaultForProfile(5), false, 'Should not be set as default for profile_id=5, obviously');

    //  Now we add back profile_id=54
    entry.setProfileAvailability(54, true);

    equal(entry.isAvailableForProfile(54), true, 'Should be available again for profile_id=54');

    //  And more than thatm we also like to make it default for profile_id=54
    entry.setProfileAvailability(54, true, true);

    equal(entry.isAvailableForProfile(54), true, 'Should be available for profile_id=54');
    equal(entry.isDefaultForProfile(54), true, 'Should be set as default for profile_id=54');

    //  Now make it not default for profile_id=54
    entry.setProfileAvailability(54, true, false);

    equal(entry.isAvailableForProfile(54), true, 'Should be still available for profile_id=54');
    equal(entry.isDefaultForProfile(54), false, 'Should not be set as default for profile_id=54');

    //  Now check that make making it available for profile_id=54 again won't
    //  create a duplicated entry in dictionary_entry_profiles list
    entry.setProfileAvailability(54, true, false);

    equal(entry.isAvailableForProfile(54), true, 'Should be still available for profile_id=54');
    equal(entry.isDefaultForProfile(54), false, 'Should not be set as default for profile_id=54');
    deepEqual(
        entry.getIdsOfProfilesWhereIsAvailable(),
        _.uniq(entry.getIdsOfProfilesWhereIsAvailable()),
        'dictionary_entry_profiles array should not contain any duplicated entries'
    );

    //  Now make item not available for all profiles
    entry.setProfileAvailability(1, false);
    entry.setProfileAvailability(2, false);
    entry.setProfileAvailability(54, false);

    equal(entry.isAvailableForProfile(1), false, 'Should not be available for profile_id=1');
    deepEqual(entry.getIdsOfProfilesWhereIsAvailable(), [], 'List of profiles where is available should be empty');
});


test('dictionary entry getIdsOfProfilesWhereIsAvailable function', function () {
    var entry = new app.OptionsDictionaryEntry({
        name: 'White Plastic Handle',
        dictionary_entry_profiles: [
            {
                profile_id: 1,
                is_default: true
            },
            {
                profile_id: 2,
                is_default: true
            },
            {
                profile_id: 54,
                is_default: false
            }
        ]
    }, { parse: true });
    var not_connected_entry = new app.OptionsDictionaryEntry({
        name: 'Brass Metal Handle'
    });

    deepEqual(
        entry.getIdsOfProfilesWhereIsAvailable(),
        [1, 2, 54],
        'Entry should be available for 3 profiles'
    );
    deepEqual(
        not_connected_entry.getIdsOfProfilesWhereIsAvailable(),
        [],
        'Not connected Entry should not be available for any profile'
    );
});


test('dictionary entry getIdsOfProfilesWhereIsDefault function', function () {
    var entry = new app.OptionsDictionaryEntry({
        name: 'White Plastic Handle',
        dictionary_entry_profiles: [
            {
                profile_id: 1,
                is_default: true
            },
            {
                profile_id: 2,
                is_default: true
            },
            {
                profile_id: 54,
                is_default: false
            }
        ]
    }, { parse: true });
    var not_connected_entry = new app.OptionsDictionaryEntry({
        name: 'Brass Metal Handle'
    });

    deepEqual(
        entry.getIdsOfProfilesWhereIsDefault(),
        [1, 2],
        'Entry should be default for 2 profiles'
    );
    deepEqual(
        not_connected_entry.getIdsOfProfilesWhereIsDefault(),
        [],
        'Not connected Entry should not be default for any profile'
    );
});
