/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

app.session = new app.Session();
app.session.set('no_backend', true);


test('profile model basic tests', function () {
    var profile = new app.Profile();

    equal(profile.get('unit_type'), 'Window', 'unit_type is Window upon creation');

    ok(
        profile.get('pricing_grids') instanceof Backbone.Collection,
        'pricing_grids is an instance of Backbone.Collection upon profile creation'
    );
    ok(
        profile.get('pricing_equation_params') instanceof Backbone.Collection,
        'pricing_equation_params is an instance of Backbone.Collection upon profile creation'
    );
});


test('profile parse function', function () {
    var grids_data_to_set = [
        {
            name: 'fixed',
            data: [
                { title: 'Small', height: 500, width: 500, price_per_square_meter: 15 },
                { title: 'Medium', height: 914, width: 1514, price_per_square_meter: 12 },
                { title: 'Large', height: 2400, width: 3000, price_per_square_meter: 10 }
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
    var equation_data_to_set = [
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
    var profile = new app.Profile({
        pricing_grids: JSON.parse(JSON.stringify(grids_data_to_set)),
        pricing_equation_params: JSON.parse(JSON.stringify(equation_data_to_set))
    }, { parse: true });

    equal(profile.get('pricing_grids').length, 2, 'pricing_grids should contain 2 entries');
    ok(profile.get('pricing_grids') instanceof Backbone.Collection, 'pricing_grids is a Backbone.Collection object');
    deepEqual(
        profile.get('pricing_grids').toJSON(),
        [
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
        ],
        'pricing_grids should be parsed properly'
    );
    ok(
        profile.get('pricing_equation_params') instanceof Backbone.Collection,
        'pricing_equation_params is a Backbone.Collection object'
    );
    deepEqual(
        profile.get('pricing_equation_params').get('param_a'),
        equation_data_to_set.param_a,
        'pricing_equation_params param_a should be similar to source data param_a'
    );

    //  Now we want it to pass the same set of tests, but the source data is a string
    var another_profile = new app.Profile({
        pricing_grids: JSON.stringify(_.clone(grids_data_to_set)),
        pricing_equation_params: JSON.stringify(equation_data_to_set)
    }, { parse: true });

    equal(another_profile.get('pricing_grids').length, 2, 'pricing_grids should contain 2 entries');
    ok(another_profile.get('pricing_grids') instanceof Backbone.Collection, 'pricing_grids is a Backbone.Collection object');
    //  Second is similar, but the first one is not, this is intended
    deepEqual(
        another_profile.get('pricing_grids').at(1).toJSON(),
        grids_data_to_set[1],
        'pricing_grids second entry should be similar to source data first entry'
    );
    ok(
        another_profile.get('pricing_equation_params') instanceof Backbone.Collection,
        'pricing_equation_params is a Backbone.Collection object'
    );
    deepEqual(
        another_profile.get('pricing_equation_params').get('param_a'),
        equation_data_to_set.param_a,
        'pricing_equation_params param_a should be similar to source data param_a'
    );

    //  We want to make sure no extra data survives the parse step
    var extra_profile = new app.Profile({
        wait_what: '',
        pricing_grids: JSON.parse(JSON.stringify(grids_data_to_set))
    }, { parse: true });

    equal(extra_profile.get('pricing_grids').length, 2, 'pricing_grids should contain 2 entries');
    equal(extra_profile.get('wait_what'), undefined, 'wait_what attribute should be undefined');
});


test('profile toJSON function', function () {
    var default_profile = new app.Profile();

    var data_to_set = {
        name: 'Some random profile',
        threshold_width: 33,
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
                    { height: 500, width: 500, value: 15 },
                    { height: 914, width: 1514, value: 90 },
                    { height: 2400, width: 3000, value: 13 }
                ]
            },
            {
                name: 'operable',
                data: [
                    { height: 500, width: 500, value: 22 },
                    { height: 914, width: 1514, value: 33 },
                    { height: 1200, width: 2400, value: 44 }
                ]
            }
        ])
    };
    var predefined_profile = new app.Profile(
        JSON.parse(JSON.stringify(data_to_set)),
        { parse: true }
    );

    deepEqual(
        default_profile.toJSON(),
        {
            clear_width_deduction: 0,
            frame_corners: '',
            frame_u_value: 0,
            frame_width: 0,
            low_threshold: false,
            mullion_width: 0,
            name: '',
            position: 0,
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
            ]),
            pricing_scheme: 'LINEAR_EQUATION',
            sash_corners: '',
            sash_frame_overlap: 0,
            sash_frame_width: 0,
            sash_mullion_overlap: 0,
            spacer_thermal_bridge_value: 0,
            supplier_system: '',
            system: '',
            threshold_width: 20,
            unit_type: 'Window',
            weight_per_length: 0
        },
        'Default profile should be properly cast to JSON'
    );

    deepEqual(
        predefined_profile.toJSON(),
        {
            clear_width_deduction: 0,
            frame_corners: '',
            frame_u_value: 0,
            frame_width: 0,
            low_threshold: false,
            mullion_width: 0,
            name: 'Some random profile',
            position: 0,
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
                        { height: 500, width: 500, value: 15 },
                        { height: 914, width: 1514, value: 90 },
                        { height: 2400, width: 3000, value: 13 }
                    ]
                },
                {
                    name: 'operable',
                    data: [
                        { height: 500, width: 500, value: 22 },
                        { height: 914, width: 1514, value: 33 },
                        { height: 1200, width: 2400, value: 44 }
                    ]
                }
            ]),
            pricing_scheme: 'LINEAR_EQUATION',
            sash_corners: '',
            sash_frame_overlap: 0,
            sash_frame_width: 0,
            sash_mullion_overlap: 0,
            spacer_thermal_bridge_value: 0,
            supplier_system: '',
            system: '',
            threshold_width: 33,
            unit_type: 'Window',
            weight_per_length: 0
        },
        'Predefined profile should be properly cast to JSON'
    );
});


test('profile hasOnlyDefaultAttributes function', function () {
    var new_profile = new app.Profile();
    var another_new_profile = new app.Profile();

    ok(new_profile.hasOnlyDefaultAttributes(), 'Profile has only default attributes upon creation');
    ok(another_new_profile.hasOnlyDefaultAttributes(), 'Another profile has only default attributes upon creation');

    new_profile.set('name', 'Some Profile');
    another_new_profile.get('pricing_grids').set('Something random');

    notOk(new_profile.hasOnlyDefaultAttributes(), 'Profile has non-default attributes after calling set');
    notOk(
        another_new_profile.hasOnlyDefaultAttributes(),
        'Another profile has type non-default attributes after calling set on pricing_grids'
    );
});
