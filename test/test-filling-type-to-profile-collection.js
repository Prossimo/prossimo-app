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
    { id: 22, position: 1 },
    { id: 77, position: 2 },
    { id: 17, position: 3 }
], { parse: true });


test('FillingTypeProfileCollection basic tests', function () {
    var ftp_collection = new app.FillingTypeProfileCollection(null, { parse: true });

    ok(ftp_collection instanceof Backbone.Collection, 'ftp_collection is a Backbone.Collection object');
    equal(ftp_collection.length, 0, 'ftp_collection contains 0 entries by default');

    var ftps_collection_with_data = new app.FillingTypeProfileCollection([
        {
            profile_id: 17,
            is_default: false
        },
        {
            profile_id: 22,
            is_default: true
        }
    ], { parse: true });

    equal(ftps_collection_with_data.length, 2, 'ftps_collection_with_data should contain 2 entries');
    ok(
        ftps_collection_with_data.at(0).get('pricing_grids') instanceof Backbone.Collection,
        'Collection item `pricing_grids` attribure is instantiated with a Backbone.Collection object'
    );
});


test('FillingTypeProfileCollection getByProfileId function', function () {
    var ftp_collection = new app.FillingTypeProfileCollection([
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
    ], { parse: true });

    var default_item = ftp_collection.getByProfileId(22);
    var nondefault_item = ftp_collection.getByProfileId(1);
    var nonexistent_item = ftp_collection.getByProfileId(999);

    ok(default_item instanceof Backbone.Model, 'default_item is a Backbone.Model object');
    equal(default_item.get('is_default'), true, 'default_item has is_default set to true');

    equal(nondefault_item.get('is_default'), false, 'nondefault_item has is_default set to false');
    equal(nonexistent_item, undefined, 'getByProfileId returns undefined if there is no such item');
});


//  See global app.settings.profiles at the beginning if this file,
//  it includes specific order of profiles which we check here
test('FillingTypeProfileCollection sorting', function () {
    var ftp_collection = new app.FillingTypeProfileCollection([
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
    ], { parse: true });

    deepEqual(
        ftp_collection.pluck('profile_id'),
        [1, 22, 17],
        'Collection is properly sorted on creation'
    );

    ftp_collection.add({
        profile_id: 77,
        is_default: false
    }, { parse: true });

    deepEqual(
        ftp_collection.pluck('profile_id'),
        [1, 22, 77, 17],
        'Collection is properly sorted after inserting a new item'
    );
});


test('FillingTypeProfileCollection parse function', function () {
    var collection_data = [
        {
            profile_id: 17,
            is_default: true,
            pricing_grids: JSON.stringify([
                {
                    name: 'fixed',
                    data: [
                        { height: 500, width: 500, value: 55 },
                        { height: 914, width: 1514, value: 50 },
                        { height: 2400, width: 3000, value: 45 }
                    ]
                },
                {
                    name: 'operable',
                    data: [
                        { height: 500, width: 500, value: 70 },
                        { height: 914, width: 1514, value: 65 },
                        { height: 1200, width: 2400, value: 50 }
                    ]
                }
            ])
        }
    ];

    var ftp_collection = new app.FillingTypeProfileCollection(
        collection_data,
        { parse: true }
    );
    var first_item = ftp_collection.at(0);
    var fixed_grid_data = first_item.get('pricing_grids').getByName('fixed').get('data');

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


test('FillingTypeProfileCollection toJSON function', function () {
    var ftp_collection = new app.FillingTypeProfileCollection(
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
        { parse: true }
    );

    deepEqual(
        ftp_collection.toJSON(),
        [
            {
                profile_id: 1,
                is_default: false,
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
                ]),
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
            },
            {
                profile_id: 17,
                is_default: false,
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
                ]),
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
        ],
        'FillingTypeProfileCollection toJSON representation should match the expected data'
    );
});


test('FillingTypeProfileCollection event propagation', function () {
    var collection_data = [
        {
            profile_id: 17,
            is_default: false,
            pricing_grids: JSON.stringify([
                {
                    name: 'fixed',
                    data: [
                        { height: 500, width: 500, value: 55 },
                        { height: 914, width: 1514, value: 50 },
                        { height: 2400, width: 3000, value: 45 }
                    ]
                },
                {
                    name: 'operable',
                    data: [
                        { height: 500, width: 500, value: 70 },
                        { height: 914, width: 1514, value: 65 },
                        { height: 1200, width: 2400, value: 50 }
                    ]
                }
            ])
        }
    ];

    var ftp_collection = new app.FillingTypeProfileCollection(
        collection_data,
        { parse: true }
    );

    var ftp = ftp_collection.at(0);
    var fixed_grid_first_item = ftp.get('pricing_grids').getByName('fixed').get('data').at(0);

    var ftp_collection_event_counter = 0;
    var ftp_event_counter = 0;
    var item_event_counter = 0;

    ftp_collection.on('change', function () {
        ftp_collection_event_counter += 1;
    });

    ftp.on('change update', function () {
        ftp_event_counter += 1;
    });

    fixed_grid_first_item.on('change destroy', function () {
        item_event_counter += 1;
    });

    fixed_grid_first_item.persist('value', 20);

    equal(
        ftp_collection_event_counter,
        ftp_event_counter,
        'Number of change events on the collection should match the number of events on the single FillingTypeProfile'
    );
    equal(
        ftp_collection_event_counter,
        item_event_counter,
        'Number of change events on the collection should match the number of events on the grid item'
    );

    ftp_collection.off();
    ftp.off();
    fixed_grid_first_item.off();
});
