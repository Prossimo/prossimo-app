/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

app.session = new app.Session();
app.session.set('no_backend', true);

app.settings = new app.Settings();


test('FillingTypeProfile model basic tests', function () {
    var ftp = new app.FillingTypeProfile();

    equal(ftp.get('profile_id'), 0, 'profile_id is 0 upon creation');
    equal(ftp.get('is_default'), false, 'is_default is false upon creation');
    ok(ftp.get('pricing_grids') instanceof Backbone.Collection, 'pricing_grids is a Backbone.Collection object');

    equal(ftp.get('pricing_grids').length, 2, 'Grids should contain 2 entries by default');
});


test('FillingTypeProfile parse function', function () {
    var data_to_set = [
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
    var ftp = new app.FillingTypeProfile({
        pricing_grids: JSON.parse(JSON.stringify(data_to_set))
    }, { parse: true });

    equal(ftp.get('pricing_grids').length, 2, 'pricing_grids should contain 2 entries');
    ok(ftp.get('pricing_grids') instanceof Backbone.Collection, 'pricing_grids is a Backbone.Collection object');
    deepEqual(
        ftp.get('pricing_grids').at(0).toJSON(),
        data_to_set[0],
        'pricing_grids first entry should be similar to source data first entry'
    );

    //  Now we want it to pass the same set of tests, but the source data is a string
    var another_ftp = new app.FillingTypeProfile({
        pricing_grids: JSON.stringify(_.clone(data_to_set))
    }, { parse: true });

    equal(another_ftp.get('pricing_grids').length, 2, 'pricing_grids should contain 2 entries');
    ok(another_ftp.get('pricing_grids') instanceof Backbone.Collection, 'pricing_grids is a Backbone.Collection object');
    deepEqual(
        another_ftp.get('pricing_grids').at(0).toJSON(),
        data_to_set[0],
        'pricing_grids first entry should be similar to source data first entry'
    );
});


test('FillingTypeProfile toJSON function', function () {
    var default_ftp = new app.FillingTypeProfile();

    deepEqual(
        default_ftp.toJSON(),
        {
            profile_id: 0,
            is_default: false,
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
        'Default FillingTypeProfile should be correctly cast to JSON representation'
    );

    var another_ftp = new app.FillingTypeProfile({
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

    deepEqual(
        another_ftp.toJSON(),
        {
            profile_id: 15,
            is_default: true,
            pricing_grids: JSON.stringify([
                {
                    name: 'fixed',
                    data: [
                        { height: 500, width: 500, value: 15 },
                        { height: 914, width: 1514, value: 12 },
                        { height: 2400, width: 3000, value: 10 }
                    ]
                }
            ])
        },
        'FillingTypeProfile should be correctly cast to JSON representation'
    );
});


test('FillingTypeProfile change events bubble up properly', function () {
    var ftp = new app.FillingTypeProfile({
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

    var grid_collection = ftp.get('pricing_grids');
    var grid_item = grid_collection.getByName('fixed').get('data').at(0);

    var ftp_event_counter = 0;
    var grid_collection_event_counter = 0;
    var item_event_counter = 0;

    ftp.on('change', function () {
        ftp_event_counter += 1;
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
        ftp_event_counter,
        grid_collection_event_counter,
        'Number of change events on the FillingTypeProfile should match the number of events on the grid collection'
    );
    equal(
        ftp_event_counter,
        item_event_counter,
        'Number of change events on the FillingTypeProfile should match the number of events on the grid item'
    );

    //  Now destroy one grid item
    grid_item.off();
    grid_item.destroy();

    equal(
        ftp_event_counter,
        grid_collection_event_counter,
        'Number of change events on the FillingTypeProfile should match the number of events on the grid collection'
    );
    equal(
        ftp_event_counter,
        item_event_counter,
        'Number of change events on the FillingTypeProfile should match the number of events on the grid item'
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
        ftp_event_counter,
        grid_collection_event_counter,
        'Number of change events on the FillingTypeProfile should match the number of events on the grid collection'
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
        ftp_event_counter,
        grid_collection_event_counter,
        'Number of change events on the FillingTypeProfile should match the number of events on the grid collection'
    );

    ftp.off();
    grid_collection.off();
});
