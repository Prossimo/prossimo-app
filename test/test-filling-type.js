/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

app.session = new app.Session();
app.session.set('no_backend', true);

app.settings = new app.Settings();

test('filling type model basic tests', function () {
    var filling = new app.FillingType();

    equal(filling.get('type'), 'glass', 'Filling gets "glass" type by default');
    deepEqual(filling.get('filling_type_profiles'), [], 'Profiles is just an empty array upon filling creation');

    //  Another entry, to test profiles sorting on load
    var filling_two = new app.FillingType({
        name: 'Insulated PVC Panel',
        type: 'recessed',
        filling_type_profiles: [
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
        _.pluck(filling_two.get('filling_type_profiles'), 'profile_id'),
        [1, 2, 3],
        'filling_type_profiles should be sorted on parse'
    );
});


test('filling type getBaseTypes function', function () {
    var filling = new app.FillingType();

    deepEqual(filling.getBaseTypes(), [
        { name: 'glass', title: 'Glass' },
        { name: 'recessed', title: 'Recessed' },
        { name: 'interior-flush-panel', title: 'Interior Flush Panel' },
        { name: 'exterior-flush-panel', title: 'Exterior Flush Panel' },
        { name: 'full-flush-panel', title: 'Full Flush Panel' },
        { name: 'louver', title: 'Louver' }
    ], 'getBaseTypes returns expected response');
});


test('filling type getBaseTypeTitle function', function () {
    var filling_one = new app.FillingType({ type: 'glass' });
    var filling_two = new app.FillingType({ type: 'recessed' });

    equal(filling_one.getBaseTypeTitle(), 'Glass', 'Proper title for "glass" base type is "Glass"');
    equal(filling_two.getBaseTypeTitle(), 'Recessed', 'Proper title for "recessed" base type is "Recessed"');
});


test('filling type isAvailableForProfile function', function () {
    var filling_one = new app.FillingType({
        name: 'Test Type',
        type: 'glass',
        filling_type_profiles: [
            {
                profile_id: 1,
                is_default: true
            }
        ]
    });
    var filling_two = new app.FillingType({
        name: 'Another Test Type',
        type: 'recessed',
        filling_type_profiles: [
            {
                profile_id: 1,
                is_default: false
            },
            {
                profile_id: 2,
                is_default: true
            }
        ]
    });
    var base_filling = new app.FillingType({
        is_base_type: true
    });

    equal(filling_one.isAvailableForProfile(1), true, 'Filling one should be available for profile_id=1');
    equal(filling_two.isAvailableForProfile(1), true, 'Filling two should be available for profile_id=1');
    equal(filling_one.isAvailableForProfile(2), false, 'Filling one should not be available for profile_id=2');
    equal(filling_two.isAvailableForProfile(2), true, 'Filling two should be available for profile_id=2');

    equal(base_filling.isAvailableForProfile(2), true, 'Base-Type filling should be available for a random profile');
    equal(base_filling.isAvailableForProfile(744), true, 'Base-Type filling should be available for a random profile');
});


test('filling type isDefaultForProfile function', function () {
    var filling_one = new app.FillingType({
        name: 'Test Type',
        type: 'glass',
        filling_type_profiles: [
            {
                profile_id: 1,
                is_default: true
            }
        ]
    });
    var filling_two = new app.FillingType({
        name: 'Another Test Type',
        type: 'recessed',
        filling_type_profiles: [
            {
                profile_id: 1,
                is_default: false
            },
            {
                profile_id: 2,
                is_default: true
            }
        ]
    });
    var base_filling = new app.FillingType({
        is_base_type: true
    });

    equal(filling_one.isDefaultForProfile(1), true, 'Filling one should be default for profile_id=1');
    equal(filling_two.isDefaultForProfile(1), false, 'Filling two should not be default for profile_id=1');
    equal(filling_one.isDefaultForProfile(2), false, 'Filling one should not be default for profile_id=2');
    equal(filling_two.isDefaultForProfile(2), true, 'Filling two should be default for profile_id=2');

    equal(base_filling.isDefaultForProfile(1), false, 'Base-Type filling should not be default for a random profile');
    equal(base_filling.isDefaultForProfile(899), false, 'Base-Type filling should not be default for a random profile');
});


test('filling type setProfileAvailability function', function () {
    var filling = new app.FillingType({
        name: 'Test Type',
        type: 'glass',
        filling_type_profiles: [
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
    });

    equal(filling.isAvailableForProfile(1), true, 'Should be available for profile_id=1 upon creation');
    equal(filling.isAvailableForProfile(2), true, 'Should be available for profile_id=2 upon creation');
    equal(filling.isAvailableForProfile(54), true, 'Should be available for profile_id=54 upon creation');

    //  Make it not available for profile_id=54
    filling.setProfileAvailability(54, false);

    equal(filling.isAvailableForProfile(54), false, 'Should no longer be available for profile_id=54');

    //  Make it available for profile_id=5
    filling.setProfileAvailability(5, true);

    equal(filling.isAvailableForProfile(5), true, 'Should be available for profile_id=5 after made available');
    equal(filling.isDefaultForProfile(5), false, 'Should not be set as default for profile_id=5 after made available');

    //  Now make it not available for profile_id=5
    filling.setProfileAvailability(5, false);

    equal(filling.isAvailableForProfile(5), false, 'Should not be available for profile_id=5 after made not available');
    equal(filling.isDefaultForProfile(5), false, 'Should not be set as default for profile_id=5, obviously');

    //  Now we add back profile_id=54
    filling.setProfileAvailability(54, true);

    equal(filling.isAvailableForProfile(54), true, 'Should be available again for profile_id=54');

    //  And more than thatm we also like to make it default for profile_id=54
    filling.setProfileAvailability(54, true, true);

    equal(filling.isAvailableForProfile(54), true, 'Should be available for profile_id=54');
    equal(filling.isDefaultForProfile(54), true, 'Should be set as default for profile_id=54');

    //  Now make it not default for profile_id=54
    filling.setProfileAvailability(54, true, false);

    equal(filling.isAvailableForProfile(54), true, 'Should be still available for profile_id=54');
    equal(filling.isDefaultForProfile(54), false, 'Should not be set as default for profile_id=54');

    //  Now check that make making it available for profile_id=54 again won't
    //  create a duplicated entry in filling_type_profiles list
    filling.setProfileAvailability(54, true, false);

    equal(filling.isAvailableForProfile(54), true, 'Should be still available for profile_id=54');
    equal(filling.isDefaultForProfile(54), false, 'Should not be set as default for profile_id=54');
    deepEqual(
        filling.getIdsOfProfilesWhereIsAvailable(),
        _.uniq(filling.getIdsOfProfilesWhereIsAvailable()),
        'filling_type_profiles array should not contain any duplicated entries'
    );

    //  Now make item not available for all profiles
    filling.setProfileAvailability(1, false);
    filling.setProfileAvailability(2, false);
    filling.setProfileAvailability(54, false);

    equal(filling.isAvailableForProfile(1), false, 'Should not be available for profile_id=1');
    deepEqual(filling.getIdsOfProfilesWhereIsAvailable(), [], 'List of profiles where is available should be empty');
});


test('filling type getIdsOfProfilesWhereIsAvailable function', function () {
    var normal_filling = new app.FillingType({
        name: 'Test Type',
        type: 'glass',
        filling_type_profiles: [
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
    });
    var base_filling = new app.FillingType({
        is_base_type: true
    });

    deepEqual(
        normal_filling.getIdsOfProfilesWhereIsAvailable(),
        [1, 2, 54],
        'Normal filling should be available for 3 profiles'
    );
    deepEqual(
        base_filling.getIdsOfProfilesWhereIsAvailable(),
        [],
        'Base-type filling should not be explicitly available for any profile'
    );
});


test('filling type getIdsOfProfilesWhereIsDefault function', function () {
    var normal_filling = new app.FillingType({
        name: 'Test Type',
        type: 'glass',
        filling_type_profiles: [
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
    });
    var base_filling = new app.FillingType({
        is_base_type: true
    });

    deepEqual(
        normal_filling.getIdsOfProfilesWhereIsDefault(),
        [1, 2],
        'Normal filling should be available for 3 profiles'
    );
    deepEqual(
        base_filling.getIdsOfProfilesWhereIsDefault(),
        [],
        'Base-type filling should not be default for any profile'
    );
});
