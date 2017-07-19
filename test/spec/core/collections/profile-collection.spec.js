import _ from 'underscore';

import App from '../../../../src/main';
import ProfileCollection from '../../../../src/core/collections/profile-collection';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

test('Profile collection tests', () => {
    test('profile collection basic tests', () => {
        const collection = new ProfileCollection();

        equal(collection.length, 0, 'Collection length is 0 upon creation');

        collection.add([
            { name: 'Test Profile' },
            { name: 'Another Test Profile' },
        ]);

        equal(collection.length, 2, 'Collection length increased by 2 after adding 2 new entries');

        deepEqual(
            _.map(collection.models, item => item.get('name')),
            [
                'Test Profile',
                'Another Test Profile',
            ],
            'Collection has the expected set of models',
        );
    });

    test('profile collection getAvailableProfileNames, getProfileNamesByIds', () => {
        const collection = new ProfileCollection([
            {
                id: 44,
                name: 'Test Profile',
            },
            {
                id: 2,
                name: 'Another Test Profile',
            },
            {
                id: 18,
                name: 'Nice Test Profile',
            },
        ]);

        deepEqual(collection.getAvailableProfileNames(), [
            'Test Profile',
            'Another Test Profile',
            'Nice Test Profile',
        ], 'getAvailableProfileNames returns the expected result');

        deepEqual(collection.getProfileNamesByIds([44, 18]), [
            'Test Profile',
            'Nice Test Profile',
        ], 'getProfileNamesByIds returns the expected result for an array of 2 ids');
        deepEqual(collection.getProfileNamesByIds([]), [], 'getProfileNamesByIds returns empty result for an empty array');
    });

    test('profile collection getProfileByIdOrDummy, getProfileIdByName, getDefaultProfileId', () => {
        const collection = new ProfileCollection([
            {
                id: 44,
                name: 'Test Profile',
            },
            {
                id: 2,
                name: 'Another Test Profile',
            },
            {
                id: 18,
                name: 'Nice Test Profile',
            },
        ]);
        const empty_collection = new ProfileCollection();

        const profile_by_id = collection.getProfileByIdOrDummy(2);
        const dummy = collection.getProfileByIdOrDummy(144);

        equal(profile_by_id.get('name'), 'Another Test Profile', 'getProfileByIdOrDummy should return the expected profile');
        equal(profile_by_id.get('is_dummy'), undefined, 'getProfileByIdOrDummy should return non-dummy profile for existing id');
        equal(dummy.get('is_dummy'), true, 'getProfileByIdOrDummy should return dummy profile for non-existing id');

        const id_by_name = collection.getProfileIdByName('Nice Test Profile');
        const id_by_wrong_name = collection.getProfileIdByName('Whatever');

        equal(id_by_name, 18, 'getProfileIdByName should return the expected id for existing profile');
        equal(id_by_wrong_name, null, 'getProfileIdByName should return null for non-existing profile');

        const default_for_collection = collection.getDefaultProfileId();
        const default_for_empty_collection = empty_collection.getDefaultProfileId();

        equal(default_for_collection, 44, 'getDefaultProfileId returns the id of the first profile in collection');
        equal(default_for_empty_collection, undefined, 'getDefaultProfileId returns the undefined for an empty collection');
    });
});
