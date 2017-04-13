import _ from 'underscore';

import App from '../../../../src/main';
import FillingTypeCollection from '../../../../src/core/collections/filling-type-collection';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

test('Filling type collection tests', function () {
    test('filling type collection basic tests', function () {
        let collection = new FillingTypeCollection();
        let collection_with_base_types = new FillingTypeCollection(null, {append_base_types: true});

        equal(collection.length, 0, 'Collection 1 length is 0 upon creation (no base types)');
        equal(collection_with_base_types.length, 6, 'Collection 2 length is 6 upon creation (it includes base types)');

        collection.add([
            {
                name: 'Test Type',
                type: 'glass'
            },
            {
                name: 'Another Test Type',
                type: 'recessed'
            }
        ]);
        collection_with_base_types.add([
            {
                name: 'Test Type',
                type: 'glass'
            },
            {
                name: 'Another Test Type',
                type: 'recessed'
            }
        ]);

        equal(collection.length, 2, 'Collection 1 length increased by 2 after adding 2 new entries');
        equal(collection_with_base_types.length, 8, 'Collection 2 length increased by 2 after adding 2 new entries');

        deepEqual(_.map(collection_with_base_types.models, function (item) {
            return item.get('name');
        }), [
            'Glass',
            'Recessed',
            'Interior Flush Panel',
            'Exterior Flush Panel',
            'Full Flush Panel',
            'Louver',
            'Test Type',
            'Another Test Type'
        ], 'Collection 2 has the expected set of models');
    });

    test('filling type collection getById, getByName, getNames', function () {
        let collection = new FillingTypeCollection(null, {append_base_types: true});
        let first_item_cid = collection.at(0).cid;

        equal(collection.getById(first_item_cid).get('name'), 'Glass', 'getById returns the expected result upon creation');
        equal(collection.getByName('Glass').get('type'), 'glass', 'getByName returns the expected result upon creation');

        deepEqual(collection.getNames(), [
            'Glass',
            'Recessed',
            'Interior Flush Panel',
            'Exterior Flush Panel',
            'Full Flush Panel',
            'Louver'
        ], 'getNames returns the expected result upon creation');

        //  Now add 2 new items to the collection
        collection.add([
            {
                name: 'Test Type',
                type: 'glass'
            },
            {
                name: 'Another Test Type',
                type: 'recessed'
            }
        ]);

        equal(collection.getByName('Another Test Type').get('type'), 'recessed',
            'getByName returns the expected result for a newly added type'
        );

        deepEqual(collection.getNames(), [
            'Glass',
            'Recessed',
            'Interior Flush Panel',
            'Exterior Flush Panel',
            'Full Flush Panel',
            'Louver',
            'Test Type',
            'Another Test Type'
        ], 'getNames returns the expected result after adding 2 new types');
    });

    test('filling type collection getAvailableForProfile, getDefaultForProfile getDefaultOrFirstAvailableForProfile', function () {
        let collection = new FillingTypeCollection(null, {append_base_types: true});

        equal(collection.getAvailableForProfile(1).length, 6, 'getAvailableForProfile returns base types upon creation');
        equal(collection.getDefaultForProfile(1), undefined, 'getDefaultForProfile returns empty result upon creation');
        equal(
            collection.getDefaultOrFirstAvailableForProfile(1).get('name'),
            'Glass',
            'getDefaultOrFirstAvailableForProfile returns first base type upon creation'
        );

        //  Now add 2 new items to the collection
        collection.add([
            {
                name: 'Test Type',
                type: 'glass',
                filling_type_profiles: [
                    {
                        profile_id: 1,
                        is_default: true
                    }
                ]
            },
            {
                name: 'Another Test Type',
                type: 'recessed',
                filling_type_profiles: [
                    {
                        profile_id: 2,
                        is_default: false
                    }
                ]
            }
        ], {parse: true});

        equal(collection.getAvailableForProfile(1).length, 7, 'getAvailableForProfile returns expected result for profile_id=1');
        equal(collection.getAvailableForProfile(2).length, 7, 'getAvailableForProfile returns expected result for profile_id=2');

        equal(collection.getDefaultForProfile(1).get('name'), 'Test Type', 'getDefaultForProfile returns expected result for profile_id=1');
        equal(collection.getDefaultForProfile(2), undefined, 'getDefaultForProfile returns empty result for profile_id=2');

        equal(
            collection.getDefaultOrFirstAvailableForProfile(1).get('name'),
            'Test Type',
            'getDefaultOrFirstAvailableForProfile returns expected result for profile_id=1'
        );
        equal(
            collection.getDefaultOrFirstAvailableForProfile(2).get('name'),
            'Glass',
            'getDefaultOrFirstAvailableForProfile returns expected result for profile_id=2'
        );
    });

    test('filling type collection getIdsOfAllConnectedProfiles', function () {
        let collection = new FillingTypeCollection();

        deepEqual(
            collection.getIdsOfAllConnectedProfiles(),
            [],
            'getIdsOfAllConnectedProfiles returns empty array for empty collection'
        );

        collection.add([
            {
                name: 'Test Type',
                type: 'glass',
                filling_type_profiles: [
                    {
                        profile_id: 1,
                        is_default: true
                    }
                ]
            },
            {
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
            }
        ], {parse: true});

        deepEqual(
            collection.getIdsOfAllConnectedProfiles(),
            [1, 2],
            'getIdsOfAllConnectedProfiles returns array with 2 ids, after adding two types'
        );

        collection.add({
            name: 'Unnecessary Type',
            type: 'glass',
            filling_type_profiles: [
                {
                    profile_id: 17,
                    is_default: true
                }
            ]
        }, {parse: true});
        collection.setItemAvailabilityForProfile(18, collection.at(1), true);

        deepEqual(
            collection.getIdsOfAllConnectedProfiles(),
            [1, 2, 17, 18],
            'getIdsOfAllConnectedProfiles returns array with 4 ids, after adding more types and more connections'
        );
    });

    test('filling type collection validatePerProfileDefaults', function () {
        let collection = new FillingTypeCollection([
            {
                name: 'Test Type',
                type: 'glass',
                filling_type_profiles: [
                    {
                        profile_id: 1,
                        is_default: true
                    }
                ]
            },
            {
                name: 'Another Test Type',
                type: 'recessed',
                filling_type_profiles: [
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
        ], {parse: true});

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

    test('filling type collection setItemAvailabilityForProfile', function () {
        let collection = new FillingTypeCollection([
            {
                name: 'Test Type',
                type: 'glass',
                filling_type_profiles: [
                    {
                        profile_id: 1,
                        is_default: true
                    }
                ]
            },
            {
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
            }
        ], {parse: true});
        let item_one = collection.at(0);
        let item_two = collection.at(1);

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

        //  Now try to create a duplicated entry in filling_type_profiles array
        collection.setItemAvailabilityForProfile(3, item_two, true);

        deepEqual(
            item_two.getIdsOfProfilesWhereIsAvailable(),
            _.uniq(item_two.getIdsOfProfilesWhereIsAvailable()),
            'filling_type_profiles array should not contain any duplicated entries'
        );
    });

    test('filling type collection setItemAsDefaultForProfile', function () {
        let collection = new FillingTypeCollection([
            {
                name: 'Test Type',
                type: 'glass',
                filling_type_profiles: [
                    {
                        profile_id: 1,
                        is_default: true
                    }
                ]
            },
            {
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
            }
        ], {parse: true});
        let item_one = collection.at(0);
        let item_two = collection.at(1);

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
});
