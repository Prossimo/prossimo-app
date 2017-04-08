import App from '../src/main';
import DictionaryEntryProfile from '../src/core/models/inline/dictionary-entry-to-profile';
import PricingGridCollection from '../src/core/collections/inline/pricing-grid-collection';
import DictionaryEntryProfileCollection from '../src/core/collections/inline/dictionary-entry-to-profile-collection';
import {assert} from 'chai';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

test('DictionaryEntryProfileCollection tests', function () {
    before(function () {
        //  This is here to avoid creating side effects inside tests.
        //  TODO: we need to get rid of globals eventually
        App.settings.profiles.reset([
            {id: 1, position: 0},
            {id: 22, position: 1},
            {id: 77, position: 2},
            {id: 17, position: 3}
        ], {parse: true});
    });

    test('DictionaryEntryProfileCollection basic tests', function () {
        let dep_collection = new DictionaryEntryProfileCollection(null, {parse: true});

        ok(dep_collection instanceof DictionaryEntryProfileCollection, 'dep_collection is a Backbone.Collection object');
        equal(dep_collection.length, 0, 'dep_collection contains 0 entries by default');

        let deps_collection_with_data = new DictionaryEntryProfileCollection([
            {
                profile_id: 17,
                is_default: false
            },
            {
                profile_id: 22,
                is_default: true
            }
        ], {parse: true});

        equal(deps_collection_with_data.length, 2, 'deps_collection_with_data should contain 2 entries');
        ok(
            deps_collection_with_data.at(0).get('pricing_grids') instanceof PricingGridCollection,
            'Collection item `pricing_grids` attribure is instantiated with a Backbone.Collection object'
        );
    });

    test('DictionaryEntryProfileCollection getByProfileId function', function () {
        let dep_collection = new DictionaryEntryProfileCollection([
            {
                profile_id: 17,
                is_default: false
            },
            {
                profile_id: 1,
                is_default: false
            },
            {
                profile_id: 22,
                is_default: true
            }
        ], {parse: true});

        let default_item = dep_collection.getByProfileId(22);
        let nondefault_item = dep_collection.getByProfileId(1);
        let nonexistent_item = dep_collection.getByProfileId(999);

        ok(default_item instanceof DictionaryEntryProfile, 'default_item is a Backbone.Model object');
        equal(default_item.get('is_default'), true, 'default_item has is_default set to true');

        equal(nondefault_item.get('is_default'), false, 'nondefault_item has is_default set to false');
        equal(nonexistent_item, undefined, 'getByProfileId returns undefined if there is no such item');
    });

    //  See global app.settings.profiles at the beginning if this file,
    //  it includes specific order of profiles which we check here
    test('DictionaryEntryProfileCollection sorting', function () {
        let dep_collection = new DictionaryEntryProfileCollection([
            {
                profile_id: 17,
                is_default: false
            },
            {
                profile_id: 1,
                is_default: false
            },
            {
                profile_id: 22,
                is_default: true
            }
        ], {parse: true});

        assert.sameMembers(
            dep_collection.pluck('profile_id'),
            [1, 22, 17],
            'Collection is properly sorted on creation'
        );

        dep_collection.add({
            profile_id: 77,
            is_default: false
        }, {parse: true});

        assert.sameMembers(
            dep_collection.pluck('profile_id'),
            [1, 22, 77, 17],
            'Collection is properly sorted after inserting a new item'
        );
    });

    test('DictionaryEntryProfileCollection parse function', function () {
        let collection_data = [
            {
                profile_id: 17,
                is_default: true,
                pricing_grids: JSON.stringify([
                    {
                        name: 'fixed',
                        data: [
                            {height: 500, width: 500, value: 55},
                            {height: 914, width: 1514, value: 50},
                            {height: 2400, width: 3000, value: 45}
                        ]
                    },
                    {
                        name: 'operable',
                        data: [
                            {height: 500, width: 500, value: 70},
                            {height: 914, width: 1514, value: 65},
                            {height: 1200, width: 2400, value: 50}
                        ]
                    }
                ])
            }
        ];

        let dep_collection = new DictionaryEntryProfileCollection(
            collection_data,
            {parse: true}
        );
        let first_item = dep_collection.at(0);
        let fixed_grid_data = first_item.get('pricing_grids').getByName('fixed').get('data');

        equal(fixed_grid_data.length, 3, 'Fixed Grid has 3 grid items');

        equal(
            fixed_grid_data.at(0).get('value'),
            55,
            'Value for the first item of a Fixed grid'
        );
        equal(
            fixed_grid_data.at(1).get('height'),
            914,
            'Height for the second item of an Fixed grid'
        );
    });

    test('DictionaryEntryProfileCollection toJSON function', function () {
        let dep_collection = new DictionaryEntryProfileCollection(
            [
                {
                    profile_id: 17,
                    is_default: false
                },
                {
                    profile_id: 1,
                    is_default: false
                }
            ],
            {parse: true}
        );

        it('DictionaryEntryProfileCollection toJSON representation should match the expected data', () => {
            expect(dep_collection.toJSON()).to.containSubset([
                {
                    profile_id: 1,
                    is_default: false,
                    cost_per_item: 0,
                    pricing_grids: JSON.stringify([
                        {
                            name: 'fixed',
                            data: [
                                {height: 500, width: 500, value: 0},
                                {height: 914, width: 1514, value: 0},
                                {height: 2400, width: 3000, value: 0}
                            ]
                        },
                        {
                            name: 'operable',
                            data: [
                                {height: 500, width: 500, value: 0},
                                {height: 914, width: 1514, value: 0},
                                {height: 1200, width: 2400, value: 0}
                            ]
                        }
                    ]),
                    pricing_equation_params: JSON.stringify([
                        {
                            name: 'fixed',
                            param_a: 0,
                            param_b: 0
                        },
                        {
                            name: 'operable',
                            param_a: 0,
                            param_b: 0
                        }
                    ])
                },
                {
                    profile_id: 17,
                    is_default: false,
                    cost_per_item: 0,
                    pricing_grids: JSON.stringify([
                        {
                            name: 'fixed',
                            data: [
                                {height: 500, width: 500, value: 0},
                                {height: 914, width: 1514, value: 0},
                                {height: 2400, width: 3000, value: 0}
                            ]
                        },
                        {
                            name: 'operable',
                            data: [
                                {height: 500, width: 500, value: 0},
                                {height: 914, width: 1514, value: 0},
                                {height: 1200, width: 2400, value: 0}
                            ]
                        }
                    ]),
                    pricing_equation_params: JSON.stringify([
                        {
                            name: 'fixed',
                            param_a: 0,
                            param_b: 0
                        },
                        {
                            name: 'operable',
                            param_a: 0,
                            param_b: 0
                        }
                    ])
                }
            ]);
        });
    });

    test('DictionaryEntryProfileCollection event propagation', function () {
        let collection_data = [
            {
                profile_id: 17,
                is_default: false,
                pricing_grids: JSON.stringify([
                    {
                        name: 'fixed',
                        data: [
                            {height: 500, width: 500, value: 55},
                            {height: 914, width: 1514, value: 50},
                            {height: 2400, width: 3000, value: 45}
                        ]
                    },
                    {
                        name: 'operable',
                        data: [
                            {height: 500, width: 500, value: 70},
                            {height: 914, width: 1514, value: 65},
                            {height: 1200, width: 2400, value: 50}
                        ]
                    }
                ])
            }
        ];

        let dep_collection = new DictionaryEntryProfileCollection(
            collection_data,
            {parse: true}
        );

        let dep = dep_collection.at(0);
        let fixed_grid_first_item = dep.get('pricing_grids').getByName('fixed').get('data').at(0);

        let dep_collection_event_counter = 0;
        let dep_event_counter = 0;
        let item_event_counter = 0;

        dep_collection.on('change', function () {
            dep_collection_event_counter += 1;
        });

        dep.on('change update', function () {
            dep_event_counter += 1;
        });

        fixed_grid_first_item.on('change destroy', function () {
            item_event_counter += 1;
        });

        fixed_grid_first_item.persist('value', 20);

        equal(
            dep_collection_event_counter,
            dep_event_counter,
            'Number of change events on the collection should match the number of events on the single DictionaryEntryProfile'
        );
        equal(
            dep_collection_event_counter,
            item_event_counter,
            'Number of change events on the collection should match the number of events on the grid item'
        );

        dep_collection.off();
        dep.off();
        fixed_grid_first_item.off();
    });
});
