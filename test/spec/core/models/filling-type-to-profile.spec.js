import _ from 'underscore';

import App from 'src/main';
import FillingTypeProfile from 'src/core/models/inline/filling-type-to-profile';
import FillingType from 'src/core/models/filling-type';
import PricingGridCollection from 'src/core/collections/inline/pricing-grid-collection';
import PricingEquationParamsCollection from 'src/core/collections/inline/pricing-equation-params-collection';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

test('FillingTypeProfile model tests', function () {
    test('basic tests', function () {
        let ftp = new FillingTypeProfile();

        equal(ftp.get('profile_id'), 0, 'profile_id is 0 upon creation');
        equal(ftp.get('is_default'), false, 'is_default is false upon creation');
        ok(ftp.get('pricing_grids') instanceof PricingGridCollection, 'pricing_grids is a PricingGridCollection object');

        equal(ftp.get('pricing_grids').length, 2, 'Grids should contain 2 entries by default');
    });

    test('parse function', function () {
        let data_to_set = [
            {
                name: 'fixed',
                data: [
                    {height: 500, width: 500, value: 15},
                    {height: 914, width: 1514, value: 12},
                    {height: 2400, width: 3000, value: 10}
                ]
            },
            {
                name: 'operable',
                data: [
                    {height: 500, width: 500, value: 11},
                    {height: 914, width: 1514, value: 10},
                    {height: 1200, width: 2400, value: 8}
                ]
            }
        ];
        let equation_data_to_set = [
            {
                name: 'fixed',
                param_a: 15,
                param_b: 149
            },
            {
                name: 'operable',
                param_a: 17,
                param_b: 184
            }
        ];
        let ftp = new FillingTypeProfile({
            pricing_grids: JSON.parse(JSON.stringify(data_to_set)),
            pricing_equation_params: JSON.parse(JSON.stringify(equation_data_to_set))
        }, {parse: true});

        equal(ftp.get('pricing_grids').length, 2, 'pricing_grids should contain 2 entries');
        ok(ftp.get('pricing_grids') instanceof PricingGridCollection, 'pricing_grids is a PricingGridCollection object');
        deepEqual(
            ftp.get('pricing_grids').at(0).toJSON(),
            data_to_set[0],
            'pricing_grids first entry should be similar to source data first entry'
        );
        ok(
            ftp.get('pricing_equation_params') instanceof PricingEquationParamsCollection,
            'pricing_equation_params is a PricingEquationParamsCollection object'
        );
        deepEqual(
            ftp.get('pricing_equation_params').get('param_a'),
            equation_data_to_set.param_a,
            'pricing_equation_params param_a should be similar to source data param_a'
        );

        //  Now we want it to pass the same set of tests, but the source data is a string
        let another_ftp = new FillingTypeProfile({
            pricing_grids: JSON.stringify(_.clone(data_to_set)),
            pricing_equation_params: JSON.stringify(equation_data_to_set)
        }, {parse: true});

        equal(another_ftp.get('pricing_grids').length, 2, 'pricing_grids should contain 2 entries');
        ok(another_ftp.get('pricing_grids') instanceof PricingGridCollection, 'pricing_grids is a PricingGridCollection object');
        deepEqual(
            another_ftp.get('pricing_grids').at(0).toJSON(),
            data_to_set[0],
            'pricing_grids first entry should be similar to source data first entry'
        );
        ok(
            another_ftp.get('pricing_equation_params') instanceof PricingEquationParamsCollection,
            'pricing_equation_params is a PricingEquationParamsCollection object'
        );
        deepEqual(
            another_ftp.get('pricing_equation_params').get('param_a'),
            equation_data_to_set.param_a,
            'pricing_equation_params param_a should be similar to source data param_a'
        );

        //  We want to make sure no extra data survives at the parse step
        let extra_ftp = new FillingTypeProfile({
            profile_id: 33,
            profile: {
                id: 12,
                name: 'Random Profile'
            },
            id: 12,
            pricing_grids: JSON.parse(JSON.stringify(data_to_set))
        }, {parse: true});

        equal(extra_ftp.get('pricing_grids').length, 2, 'pricing_grids should contain 2 entries');
        equal(extra_ftp.get('profile_id'), 33, 'profile_id should be correct');
        equal(extra_ftp.get('id'), undefined, 'id should be undefined');
        equal(extra_ftp.get('profile'), undefined, 'profile should be undefined');
    });

    test('toJSON function', function () {
        let default_ftp = new FillingTypeProfile();

        deepEqual(
            default_ftp.toJSON(),
            {
                profile_id: 0,
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
                ])
            },
            'Default FillingTypeProfile should be correctly cast to JSON representation'
        );

        let another_ftp = new FillingTypeProfile({
            profile_id: 15,
            is_default: true,
            pricing_equation_params: JSON.stringify([
                {
                    name: 'fixed',
                    param_a: 12,
                    param_b: 177
                },
                {
                    name: 'operable',
                    param_a: 17,
                    param_b: 184
                }
            ]),
            pricing_grids: [
                {
                    data: [
                        {height: 500, width: 500, value: 15},
                        {height: 914, width: 1514, value: 12},
                        {height: 2400, width: 3000, value: 10}
                    ],
                    name: 'fixed'
                }
            ]
        }, {parse: true});

        deepEqual(
            another_ftp.toJSON(),
            {
                profile_id: 15,
                is_default: true,
                pricing_equation_params: JSON.stringify([
                    {
                        name: 'fixed',
                        param_a: 12,
                        param_b: 177
                    },
                    {
                        name: 'operable',
                        param_a: 17,
                        param_b: 184
                    }
                ]),
                pricing_grids: JSON.stringify([
                    {
                        name: 'fixed',
                        data: [
                            {height: 500, width: 500, value: 15},
                            {height: 914, width: 1514, value: 12},
                            {height: 2400, width: 3000, value: 10}
                        ]
                    }
                ])
            },
            'FillingTypeProfile should be correctly cast to JSON representation'
        );
    });

    test('getPricingData function', function () {
        let parent_filling_type = new FillingType({pricing_scheme: 'PRICING_GRIDS'});
        let default_ftp = new FillingTypeProfile();
        parent_filling_type.get('filling_type_profiles').add(default_ftp);
        let pricing_data = default_ftp.getPricingData();

        equal(pricing_data.scheme, 'PRICING_GRIDS', 'getPricingData().scheme matches the expected scheme');
        deepEqual(
            pricing_data.pricing_grids.toJSON(),
            [
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
            ],
            'getPricingData().pricing_grids matches the expected data'
        );
    });

    test('change events bubble up properly', function () {
        let ftp = new FillingTypeProfile({
            profile_id: 15,
            is_default: true,
            pricing_grids: [
                {
                    data: [
                        {height: 500, width: 500, value: 15},
                        {height: 914, width: 1514, value: 12},
                        {height: 2400, width: 3000, value: 10}
                    ],
                    name: 'fixed'
                }
            ]
        }, {parse: true});

        let grid_collection = ftp.get('pricing_grids');
        let grid_item = grid_collection.getByName('fixed').get('data').at(0);

        let ftp_event_counter = 0;
        let grid_collection_event_counter = 0;
        let item_event_counter = 0;

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
                {height: 500, width: 500, value: 15},
                {height: 914, width: 1514, value: 12},
                {height: 1200, width: 2400, value: 10}
            ],
            name: 'operable'
        }, {parse: true});

        equal(
            ftp_event_counter,
            grid_collection_event_counter,
            'Number of change events on the FillingTypeProfile should match the number of events on the grid collection'
        );

        //  Now reset the collection
        grid_collection.set([
            {
                data: [
                    {height: 500, width: 500, value: 0},
                    {height: 914, width: 1514, value: 0},
                    {height: 2400, width: 3000, value: 0}
                ],
                name: 'fixed'
            }
        ], {parse: true});

        equal(
            ftp_event_counter,
            grid_collection_event_counter,
            'Number of change events on the FillingTypeProfile should match the number of events on the grid collection'
        );

        ftp.off();
        grid_collection.off();
    });
});
