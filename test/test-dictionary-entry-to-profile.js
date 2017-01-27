/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

app.session = new app.Session();
app.session.set('no_backend', true);

app.settings = new app.Settings();


test('DictionaryEntryProfile model basic tests', function () {
    var dep = new app.DictionaryEntryProfile();

    equal(dep.get('profile_id'), 0, 'profile_id is 0 upon creation');
    equal(dep.get('is_default'), false, 'is_default is false upon creation');
    ok(dep.get('pricing_grids') instanceof Backbone.Collection, 'pricing_grids is a Backbone.Collection object');

    equal(dep.get('pricing_grids').length, 2, 'Grids should contain 2 entries by default');
});


test('DictionaryEntryProfile parse function', function () {
    var grids_data_to_set = [
        {
            name: 'fixed',
            data: [
                { height: 500, width: 500, value: 15 },
                { height: 914, width: 1514, value: 12 },
                { height: 2400, width: 3000, value: 10 }
            ]
        },
        {
            name: 'operable',
            data: [
                { height: 500, width: 500, value: 11 },
                { height: 914, width: 1514, value: 10 },
                { height: 1200, width: 2400, value: 8 }
            ]
        }
    ];
    var equation_data_to_set = {
        param_a: 15,
        param_b: 149
    };
    var dep = new app.DictionaryEntryProfile({
        pricing_grids: JSON.parse(JSON.stringify(grids_data_to_set)),
        pricing_equation_params: JSON.parse(JSON.stringify(equation_data_to_set))
    }, { parse: true });

    equal(dep.get('pricing_grids').length, 2, 'pricing_grids should contain 2 entries');
    ok(dep.get('pricing_grids') instanceof Backbone.Collection, 'pricing_grids is a Backbone.Collection object');
    deepEqual(
        dep.get('pricing_grids').at(0).toJSON(),
        grids_data_to_set[0],
        'pricing_grids first entry should be similar to source data first entry'
    );
    ok(
        dep.get('pricing_equation_params') instanceof Backbone.Model,
        'pricing_equation_params is a Backbone.Model object'
    );
    deepEqual(
        dep.get('pricing_equation_params').get('param_a'),
        equation_data_to_set.param_a,
        'pricing_equation_params param_a should be similar to source data param_a'
    );

    //  Now we want it to pass the same set of tests, but the source data is a string
    var another_dep = new app.DictionaryEntryProfile({
        pricing_grids: JSON.stringify(_.clone(grids_data_to_set)),
        pricing_equation_params: JSON.stringify(equation_data_to_set)
    }, { parse: true });

    equal(another_dep.get('pricing_grids').length, 2, 'pricing_grids should contain 2 entries');
    ok(another_dep.get('pricing_grids') instanceof Backbone.Collection, 'pricing_grids is a Backbone.Collection object');
    deepEqual(
        another_dep.get('pricing_grids').at(0).toJSON(),
        grids_data_to_set[0],
        'pricing_grids first entry should be similar to source data first entry'
    );
    ok(
        another_dep.get('pricing_equation_params') instanceof Backbone.Model,
        'pricing_equation_params is a Backbone.Model object'
    );
    deepEqual(
        another_dep.get('pricing_equation_params').get('param_a'),
        equation_data_to_set.param_a,
        'pricing_equation_params param_a should be similar to source data param_a'
    );

    //  We want to make sure no extra data survives the parse step
    var extra_dep = new app.DictionaryEntryProfile({
        profile_id: 33,
        profile: {
            id: 12,
            name: 'Random Profile'
        },
        id: 12,
        pricing_grids: JSON.parse(JSON.stringify(grids_data_to_set))
    }, { parse: true });

    equal(extra_dep.get('pricing_grids').length, 2, 'pricing_grids should contain 2 entries');
    equal(extra_dep.get('profile_id'), 33, 'profile_id should be correct');
    equal(extra_dep.get('id'), undefined, 'id should be undefined');
    equal(extra_dep.get('profile'), undefined, 'profile should be undefined');
});


test('DictionaryEntryProfile toJSON function', function () {
    var default_dep = new app.DictionaryEntryProfile();

    deepEqual(
        default_dep.toJSON(),
        {
            profile_id: 0,
            is_default: false,
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
            ]),
            pricing_equation_params: JSON.stringify({
                param_a: 0,
                param_b: 0
            })
        },
        'Default DictionaryEntryProfile should be correctly cast to JSON representation'
    );

    var another_dep = new app.DictionaryEntryProfile({
        profile_id: 15,
        is_default: true,
        pricing_grids: [
            {
                data: [
                    { height: 500, width: 500, value: 15 },
                    { height: 914, width: 1514, value: 12 },
                    { height: 2400, width: 3000, value: 10 }
                ],
                name: 'fixed'
            }
        ],
        pricing_equation_params: {
            param_a: 15,
            param_b: 149
        }
    }, { parse: true });

    deepEqual(
        another_dep.toJSON(),
        {
            profile_id: 15,
            is_default: true,
            cost_per_item: 0,
            pricing_grids: JSON.stringify([
                {
                    name: 'fixed',
                    data: [
                        { height: 500, width: 500, value: 15 },
                        { height: 914, width: 1514, value: 12 },
                        { height: 2400, width: 3000, value: 10 }
                    ]
                }
            ]),
            pricing_equation_params: JSON.stringify({
                param_a: 15,
                param_b: 149
            })
        },
        'DictionaryEntryProfile should be correctly cast to JSON representation'
    );
});


test('DictionaryEntryProfile getPricingData function', function () {
    var default_dep = new app.DictionaryEntryProfile();

    //  Just a single DEP item, no collection, meaning no parent dictionary
    deepEqual(
        default_dep.getPricingData(),
        { scheme: 'NONE' },
        'getPricingData returns NONE scheme with no data for a single dep with no collection'
    );

    var dictionary = new app.OptionsDictionary({
        name: 'Interior Handle',
        entries: [{
            name: 'White Plastic No Lock',
            dictionary_entry_profiles: [
                { profile_id: 15, is_default: false }
            ]
        }]
    }, { parse: true });

    //  An item within collection which is a child of a default dictionary
    var dep_within_collection = dictionary.entries.at(0).get('dictionary_entry_profiles').at(0);

    deepEqual(
        dep_within_collection.getPricingData(),
        { scheme: 'NONE' },
        'getPricingData returns NONE scheme with no data for a dep within a collection'
    );

    //  Now change scheme for the parent dictionary
    dictionary.set('pricing_scheme', 'PRICING_GRIDS');

    equal(dep_within_collection.getPricingData().scheme, 'PRICING_GRIDS', 'scheme matches the expected');
    deepEqual(
        dep_within_collection.getPricingData().pricing_grids.toJSON(),
        [
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
        ],
        'getPricingData() returns the expected pricing_grids'
    );

    //  Now change scheme for the parent dictionary again
    dictionary.set('pricing_scheme', 'PER_ITEM');

    equal(dep_within_collection.getPricingData().scheme, 'PER_ITEM', 'scheme matches the expected');
    equal(
        dep_within_collection.getPricingData().cost_per_item,
        0,
        'getPricingData() returns the expected matches the expected cost_per_item'
    );
});


test('DictionaryEntryProfile change events bubble up properly', function () {
    var dep = new app.DictionaryEntryProfile({
        profile_id: 15,
        is_default: true,
        pricing_grids: [
            {
                data: [
                    { height: 500, width: 500, value: 15 },
                    { height: 914, width: 1514, value: 12 },
                    { height: 2400, width: 3000, value: 10 }
                ],
                name: 'fixed'
            }
        ]
    }, { parse: true });

    var grid_collection = dep.get('pricing_grids');
    var grid_item = grid_collection.getByName('fixed').get('data').at(0);

    var dep_event_counter = 0;
    var grid_collection_event_counter = 0;
    var item_event_counter = 0;

    dep.on('change', function () {
        dep_event_counter += 1;
    });

    grid_collection.on('change update', function () {
        grid_collection_event_counter += 1;
    });

    grid_item.on('change destroy', function () {
        item_event_counter += 1;
    });

    //  Change value for some grid item
    grid_item.persist('value', 20);

    equal(
        dep_event_counter,
        grid_collection_event_counter,
        'Number of change events on the DictionaryEntryProfile should match the number of events on the grid collection'
    );
    equal(
        dep_event_counter,
        item_event_counter,
        'Number of change events on the DictionaryEntryProfile should match the number of events on the grid item'
    );

    //  Now destroy one grid item
    grid_item.off();
    grid_item.destroy();

    equal(
        dep_event_counter,
        grid_collection_event_counter,
        'Number of change events on the DictionaryEntryProfile should match the number of events on the grid collection'
    );
    equal(
        dep_event_counter,
        item_event_counter,
        'Number of change events on the DictionaryEntryProfile should match the number of events on the grid item'
    );

    //  Now add new item to the collection
    grid_collection.add({
        data: [
            { height: 500, width: 500, value: 15 },
            { height: 914, width: 1514, value: 12 },
            { height: 1200, width: 2400, value: 10 }
        ],
        name: 'operable'
    }, { parse: true });

    equal(
        dep_event_counter,
        grid_collection_event_counter,
        'Number of change events on the DictionaryEntryProfile should match the number of events on the grid collection'
    );

    //  Now reset the collection
    grid_collection.set([
        {
            data: [
                { height: 500, width: 500, value: 0 },
                { height: 914, width: 1514, value: 0 },
                { height: 2400, width: 3000, value: 0 }
            ],
            name: 'fixed'
        }
    ], { parse: true });

    equal(
        dep_event_counter,
        grid_collection_event_counter,
        'Number of change events on the DictionaryEntryProfile should match the number of events on the grid collection'
    );

    dep.off();
    grid_collection.off();
});
