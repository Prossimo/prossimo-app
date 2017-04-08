import App from '../src/main';
import PricingGridCollection from '../src/core/collections/inline/pricing-grid-collection';
import PricingGrid from '../src/core/models/inline/pricing-grid';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

test('Pricing grid collection', function () {
    test('basic tests', function () {
        let grids = new PricingGridCollection(null, {parse: true});

        ok(grids instanceof PricingGridCollection, 'Grids are a Backbone.Collection object');
        equal(grids.length, 0, 'Grids contain 0 entries by default');

        let full_grids = new PricingGridCollection([
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
        ], {parse: true});

        equal(full_grids.length, 2, 'Full Grids should contain 2 entries');
    });

    test('pricing grid collection append_default_grids option tests', function () {
        let grids = new PricingGridCollection(null, {append_default_grids: true});

        equal(grids.length, 2, 'Grids contain 2 entries if instantiated with append_default_grids');

        deepEqual(
            grids.toJSON(),
            [{
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
                }],
            'Grids data should match the expected'
        );
    });

    test('pricing grid collection getByName function', function () {
        let grids = new PricingGridCollection([
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
        ], {parse: true});

        let fixed_grid = grids.getByName('fixed');
        let nonexistent_grid = grids.getByName('whatever');

        ok(fixed_grid instanceof PricingGrid, 'Fixed Grid is a Backbone.Model object');
        equal(fixed_grid.get('data').length, 3, 'Fixed Grid has 3 grid items');

        equal(nonexistent_grid, undefined, 'getByName returns undefined if there is no such grid');
    });

    test('pricing grid collection json string parsing', function () {
        let collection_data = [
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
        ];

        let collection_data_old_format = [
            {
                name: 'fixed',
                data: [
                    {title: 'Small', height: 500, width: 500, price_per_square_meter: 55},
                    {title: 'Medium', height: 914, width: 1514, price_per_square_meter: 50},
                    {title: 'Large', height: 2400, width: 3000, price_per_square_meter: 45}
                ]
            },
            {
                name: 'operable',
                data: [
                    {title: 'Small', height: 500, width: 500, price_per_square_meter: 70},
                    {title: 'Medium', height: 914, width: 1514, price_per_square_meter: 65},
                    {title: 'Large', height: 1200, width: 2400, price_per_square_meter: 50}
                ]
            }
        ];

        let collection_data_old_format_2 = {
            fixed: [
                {title: 'Small', height: 500, width: 500, price_per_square_meter: 55},
                {title: 'Medium', height: 914, width: 1514, price_per_square_meter: 50},
                {title: 'Large', height: 2400, width: 3000, price_per_square_meter: 45}
            ],
            operable: [
                {title: 'Small', height: 500, width: 500, price_per_square_meter: 70},
                {title: 'Medium', height: 914, width: 1514, price_per_square_meter: 65},
                {title: 'Large', height: 1200, width: 2400, price_per_square_meter: 60}
            ]
        };

        //  We're testing the old data format here, but it still should work fine
        let grids = new PricingGridCollection(
            JSON.stringify(collection_data_old_format),
            {parse: true}
        );

        equal(grids.getByName('fixed').get('data').length, 3, 'Fixed Grid has 3 grid items');

        equal(
            grids.getByName('fixed').get('data').at(0).get('value'),
            collection_data[0].data[0].value,
            'Value for the first item of a Fixed grid'
        );
        equal(
            grids.getByName('fixed').get('data').at(0).get('title'),
            undefined,
            'Title for the first item of a Fixed grid (non-existing property, should be ignored on parse)'
        );
        equal(
            grids.getByName('operable').get('data').at(1).get('height'),
            collection_data[1].data[1].height,
            'Height for the second item of an Operable grid'
        );

        //  And this should work fine as well
        let grids_2 = new PricingGridCollection(
            JSON.stringify(collection_data_old_format_2),
            {parse: true}
        );

        equal(grids_2.getByName('fixed').get('data').length, 3, 'Fixed Grid has 3 grid items');

        equal(
            grids_2.getByName('fixed').get('data').at(0).get('value'),
            collection_data[0].data[0].value,
            'Value for the first item of a Fixed grid'
        );
        equal(
            grids_2.getByName('fixed').get('data').at(0).get('title'),
            undefined,
            'Title for the first item of a Fixed grid (non-existing property, should be ignored on parse)'
        );
        equal(
            grids_2.getByName('operable').get('data').at(1).get('height'),
            collection_data[1].data[1].height,
            'Height for the second item of an Operable grid'
        );
    });

    test('pricing grid collection toJSON function', function () {
        let collection_data = [
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
        ];

        let grids = new PricingGridCollection(
            JSON.stringify(collection_data),
            {parse: true}
        );

        deepEqual(
            grids.toJSON(),
            collection_data,
            'Grid collection toJSON representation should match the source data format'
        );
    });

    test('pricing grid collection event propagation', function () {
        let collection_data = [
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
        ];

        let grids = new PricingGridCollection(
            JSON.stringify(collection_data),
            {parse: true}
        );

        let fixed_grid = grids.getByName('fixed');
        let fixed_grid_first_item = fixed_grid.get('data').at(0);
        let collection_event_counter = 0;
        let grid_event_counter = 0;
        let item_event_counter = 0;

        grids.on('change', function () {
            collection_event_counter += 1;
        });

        fixed_grid.on('change update', function () {
            grid_event_counter += 1;
        });

        fixed_grid_first_item.on('change destroy', function () {
            item_event_counter += 1;
        });

        fixed_grid_first_item.persist('value', 20);

        equal(
            collection_event_counter,
            grid_event_counter,
            'Number of change events on the collection should match the number of events on the grid'
        );
        equal(
            grid_event_counter,
            item_event_counter,
            'Number of change events on the grid should match the number of events on the item'
        );

        grids.off();
        fixed_grid.off();
        fixed_grid_first_item.off();
    });
});
