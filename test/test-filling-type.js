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


test('filling type model basic tests', function () {
    var filling = new app.FillingType();

    equal(filling.get('type'), 'glass', 'Filling gets "glass" type by default');
    ok(
        filling.get('filling_type_profiles') instanceof Backbone.Collection,
        'Profiles is an instance of Backbone.Collection upon filling creation'
    );
    equal(filling.get('filling_type_profiles').length, 0, 'Profiles is an empty collection upon filling creation');

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
        filling_two.get('filling_type_profiles').pluck('profile_id'),
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


test('filling type toJSON function', function () {
    var filling = new app.FillingType({
        name: 'Insulated PVC Panel',
        type: 'recessed',
        filling_type_profiles: [
            {
                profile_id: 3,
                is_default: true
            }
        ]
    }, { parse: true });

    deepEqual(
        filling.toJSON(),
        {
            name: 'Insulated PVC Panel',
            type: 'recessed',
            position: 0,
            supplier_name: '',
            weight_per_area: 0,
            filling_type_profiles: [
                {
                    profile_id: 3,
                    is_default: true,
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
        'Filling type should be properly cast to json'
    );
});


test('filling type hasOnlyDefaultAttributes function', function () {
    var new_filling = new app.FillingType();
    var another_new_filling = new app.FillingType();

    ok(new_filling.hasOnlyDefaultAttributes(), 'Filling type has only default attributes upon creation');
    ok(another_new_filling.hasOnlyDefaultAttributes(), 'Another filling type has only default attributes upon creation');

    new_filling.set('name', 'Nice Filling');
    another_new_filling.setProfileAvailability(1, true, true);

    notOk(new_filling.hasOnlyDefaultAttributes(), 'Filling type has non-default attributes after calling set');
    notOk(
        new_filling.hasOnlyDefaultAttributes(),
        'Another filling has type non-default attributes after calling setProfileAvailability'
    );
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
    }, { parse: true });
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
    }, { parse: true });
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
    }, { parse: true });
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
    }, { parse: true });
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
    }, { parse: true });

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
    }, { parse: true });
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
    }, { parse: true });
    var base_filling = new app.FillingType({
        is_base_type: true
    });

    deepEqual(
        normal_filling.getIdsOfProfilesWhereIsDefault(),
        [1, 2],
        'Normal filling should be default for 2 profiles'
    );
    deepEqual(
        base_filling.getIdsOfProfilesWhereIsDefault(),
        [],
        'Base-type filling should not be default for any profile'
    );
});
