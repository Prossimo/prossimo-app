import _ from 'underscore';
import App from '../src/main';
import PricingGrid, {Grid} from '../src/core/models/inline/pricing-grid';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

test('Pricing grid', function () {
    test('pricing grid model basic tests', function () {
        let grid = new PricingGrid();

        equal(grid.get('name'), '', 'Name is empty upon creation');
        ok(grid.get('data') instanceof Grid, 'Grid data is a Grid object');
        equal(grid.get('data').length, 3, 'Grid should contain 3 entries by default');
    });

    test('pricing grid parse function', function () {
        let data_to_set = [
            { height: 500, width: 500, value: 15 },
            { height: 914, width: 1514, value: 12 },
            { height: 2400, width: 3000, value: 10 }
        ];
        let grid = new PricingGrid({
            data: _.clone(data_to_set)
        }, { parse: true });

        equal(grid.get('data').length, 3, 'Grid should contain 3 entries');
        ok(grid.get('data') instanceof Grid, 'Grid data is a Grid object');
        deepEqual(
            grid.get('data').at(0).toJSON(),
            data_to_set[0],
            'Grid first entry should be similar to source data first entry'
        );

        //  Now we want it to pass the same set of tests, but the source data is a string
        let another_grid = new PricingGrid({
            data: JSON.stringify(_.clone(data_to_set))
        }, { parse: true });

        equal(another_grid.get('data').length, 3, 'Grid should contain 3 entries');
        ok(another_grid.get('data') instanceof Grid, 'Grid data is a Grid object');
        deepEqual(
            another_grid.get('data').at(0).toJSON(),
            data_to_set[0],
            'Grid first entry should be similar to source data first entry'
        );

        //  We want to check that data in the old format would be still compatible
        let data_in_old_format = [
            { title: 'Small', height: 500, width: 500, price_per_square_meter: 15 },
            { title: 'Medium', height: 914, width: 1514, price_per_square_meter: 12 },
            { title: 'Large', height: 2400, width: 3000, price_per_square_meter: 10 }
        ];

        let compatible_grid = new PricingGrid({
            data: JSON.stringify(_.clone(data_in_old_format))
        }, { parse: true });

        deepEqual(
            compatible_grid.get('data').at(0).toJSON(),
            data_to_set[0],
            'Old data format should be parsed correctly'
        );
    });

    test('pricing grid getValue function', function () {
        let grid = new PricingGrid();

        equal(grid.getValue({ width: 0, height: 0 }), 0, 'Grid Value for a random area should be 0 by default');
        equal(grid.getValue({ width: 100, height: 100 }), 0, 'Grid Value for a random area should be 0 by default');
        equal(grid.getValue({ width: 10000, height: 10000 }), 0, 'Grid Value for a random area should be 0 by default');

        let another_grid = new PricingGrid({
            data: [
                { height: 500, width: 500, value: 15 },
                { height: 914, width: 1514, value: 12 },
                { height: 2400, width: 3000, value: 10 }
            ]
        }, { parse: true });

        //  Edge cases
        equal(
            another_grid.getValue({ width: 100, height: 100 }),
            15,
            'Grid Value for smaller than a minimal area should be the same as for the minimal area'
        );
        equal(
            another_grid.getValue({ width: 500, height: 500 }),
            15,
            'Grid Value for a minimal area should be the exact match'
        );
        equal(
            another_grid.getValue({ width: 1514, height: 914 }),
            12,
            'Grid Value for a medium area should be the exact match'
        );
        equal(
            another_grid.getValue({ width: 914, height: 1514 }),
            12,
            'width and height should be interchangeable'
        );
        equal(
            another_grid.getValue({ width: 2400, height: 3000 }),
            10,
            'Grid Value for a maximal area should be the exact match'
        );
        equal(
            another_grid.getValue({ width: 150000, height: 150000 }),
            10,
            'Grid Value for a larger than a maximal area should be the same as for the maximal area'
        );

        //  In-between numbers
        equal(
            another_grid.getValue({ width: 1000, height: 1000 }).toFixed(2),
            '13.02',
            'Grid Value for an in-between area should be interpolated properly'
        );
        equal(
            another_grid.getValue({ width: 2000, height: 2500 }).toFixed(2),
            '10.76',
            'Grid Value for an in-between area should be interpolated properly'
        );
    });

    test('pricing grid toJSON function', function () {
        let default_grid = new PricingGrid({
            name: 'default'
        });

        deepEqual(
            default_grid.toJSON(),
            {
                data: [
                    { height: 500, width: 500, value: 0 },
                    { height: 914, width: 1514, value: 0 },
                    { height: 2400, width: 3000, value: 0 }
                ],
                name: 'default'
            },
            'Default Grid should be correctly cast to JSON representation'
        );

        let fixed_grid = new PricingGrid({
            name: 'fixed',
            data: [
                { height: 500, width: 500, value: 15 },
                { height: 914, width: 1514, value: 12 },
                { height: 2400, width: 3000, value: 10 }
            ]
        }, { parse: true });

        deepEqual(
            fixed_grid.toJSON(),
            {
                data: [
                    { height: 500, width: 500, value: 15 },
                    { height: 914, width: 1514, value: 12 },
                    { height: 2400, width: 3000, value: 10 }
                ],
                name: 'fixed'
            },
            'Grid should be correctly cast to JSON representation'
        );
    });

    test('pricing grid change events bubble up properly', function () {
        let grid = new PricingGrid({
            name: 'fixed',
            data: [
                { height: 500, width: 500, value: 15 },
                { height: 914, width: 1514, value: 12 },
                { height: 2400, width: 3000, value: 10 }
            ]
        }, { parse: true });

        let data = grid.get('data');
        let grid_item = grid.get('data').at(0);
        let grid_event_counter = 0;
        let data_event_counter = 0;
        let item_event_counter = 0;

        grid.on('change', function () {
            grid_event_counter += 1;
        });

        data.on('change update', function () {
            data_event_counter += 1;
        });

        grid_item.on('change destroy', function () {
            item_event_counter += 1;
        });

        //  Change value for some grid item
        grid_item.persist('value', 20);

        equal(
            grid_event_counter,
            data_event_counter,
            'Number of change events on the grid should match the number of events on the item collection'
        );
        equal(
            grid_event_counter,
            item_event_counter,
            'Number of change events on the grid should match the number of events on the item'
        );

        //  Now destroy one grid item
        grid_item.off();
        grid_item.destroy();

        equal(
            grid_event_counter,
            data_event_counter,
            'Number of change events on the grid should match the number of events on the item collection'
        );
        equal(
            grid_event_counter,
            item_event_counter,
            'Number of change events on the grid should match the number of events on the item'
        );

        //  Now add new item to the collection
        data.add({ height: 500, width: 500, value: 15 });

        equal(
            grid_event_counter,
            data_event_counter,
            'Number of change events on the grid should match the number of events on the item collection'
        );

        //  Now reset the collection
        grid.get('data').set([
            { height: 500, width: 500, value: 15 },
            { height: 914, width: 1514, value: 12 },
            { height: 2400, width: 3000, value: 10 }
        ], { parse: true });

        equal(
            grid_event_counter,
            data_event_counter,
            'Number of change events on the grid should match the number of events on the item collection'
        );

        grid.off();
        data.off();
    });
});

