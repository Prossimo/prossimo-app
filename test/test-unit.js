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
app.settings.dictionaries = new app.OptionsDictionaryCollection([
    {
        id: 17,
        position: 0,
        name: 'Interior Handle',
        pricing_scheme: 'PER_ITEM',
        entries: [
            {
                id: 14,
                name: 'White Plastic Handle',
                dictionary_entry_profiles: [
                    { profile_id: 17, is_default: false },
                    { profile_id: 1, is_default: false },
                    { profile_id: 22, is_default: true }
                ]
            },
            {
                id: 77,
                name: 'Red Metal Handle',
                dictionary_entry_profiles: [
                    { profile_id: 17, is_default: false },
                    { profile_id: 1, is_default: true }
                ]
            }
        ]
    },
    {
        id: 32,
        position: 1,
        name: 'Exterior Handle',
        pricing_scheme: 'PER_ITEM',
        entries: [
            {
                id: 53,
                name: 'Blue Metal Hande - External',
                dictionary_entry_profiles: [
                    { profile_id: 17, is_default: false },
                    { profile_id: 1, is_default: false }
                ]
            }
        ]
    },
    {
        id: 19,
        position: 2,
        name: 'External Sill',
        pricing_scheme: 'PRICING_GRIDS',
        rules_and_restrictions: ['IS_OPTIONAL'],
        entries: [
            {
                id: 8,
                name: 'Nice Sill',
                dictionary_entry_profiles: [
                    { profile_id: 17, is_default: false },
                    { profile_id: 1, is_default: false }
                ]
            }
        ]
    }
], { parse: true });


test('Unit model basic tests', function () {
    var unit = new app.Unit();

    equal(unit.get('height'), 0, 'height is 0 upon creation');
    equal(unit.get('width'), 0, 'width is 0 upon creation');
    equal(unit.get('quantity'), 1, 'quantity is 1 upon creation');

    ok(unit.get('unit_options') instanceof Backbone.Collection, 'unit_options is a Backbone.Collection instance');
});


test('Unit parse function', function () {
    var data_to_set = {
        quantity: 15,
        whatever: true,
        unit_options: [
            {
                dictionary_id: 12,
                dictionary_entry_id: 33,
                quantity: 5
            },
            {
                dictionary_id: 5,
                dictionary_entry_id: 13
            }
        ]
    };

    var unit = new app.Unit(data_to_set, { parse: true });

    equal(unit.get('quantity'), 15, 'quantity should be correct');
    equal(unit.get('whatever'), undefined, 'whatever should be undefined');

    ok(unit.get('unit_options') instanceof Backbone.Collection, 'unit_options should be a Backbone.Collection instance');
});


//  TODO: this relies on globally available app.settings.profiles
test('Unit toJSON function', function () {
    var data_to_set = {
        quantity: 15,
        whatever: true,
        root_section: JSON.stringify({
            bars: {
                horizontal: [],
                vertical: []
            },
            fillingName: 'Glass',
            fillingType: 'glass',
            id: '4',
            measurements: {
                frame: {
                    horizontal: ['max', 'max'],
                    vertical: ['max', 'max']
                },
                glass: null,
                opening: null
            },
            sashType: 'fixed_in_frame'
        })
    };

    var unit = new app.Unit(data_to_set, { parse: true });

    deepEqual(
        unit.toJSON(),
        {
            conversion_rate: 0.9,
            customer_image: '',
            description: '',
            discount: 0,
            exceptions: '',
            glazing: 'Glass',
            glazing_bar_width: 12,
            height: '0',
            mark: '',
            notes: '',
            opening_direction: 'Inward',
            original_cost: 0,
            original_currency: 'EUR',
            position: 0,
            price_markup: 2.3,
            profile_id: 1,
            profile_name: '',
            quantity: 15,
            root_section: JSON.stringify({
                bars: {
                    horizontal: [],
                    vertical: []
                },
                fillingName: 'Glass',
                fillingType: 'glass',
                id: '4',
                measurements: {
                    frame: {
                        horizontal: ['max', 'max'],
                        vertical: ['max', 'max']
                    },
                    glass: null,
                    opening: null
                },
                sashType: 'fixed_in_frame'
            }),
            supplier_discount: 0,
            unit_options: [
                {
                    dictionary_entry_id: 77,
                    dictionary_id: 17,
                    quantity: 1
                },
                {
                    dictionary_entry_id: 53,
                    dictionary_id: 32,
                    quantity: 1
                }
            ],
            uw: 0,
            width: 0
        },
        'Unit should be correctly cast to JSON representation'
    );
});


test('Unit hasOnlyDefaultAttributes function', function () {
    var unit_one = new app.Unit({ profile_id: 1 });
    var unit_two = new app.Unit({ profile_id: 1 });
    var unit_three = new app.Unit({ profile_id: 1 });
    var unit_four = new app.Unit({ profile_id: 1 });

    ok(unit_one.hasOnlyDefaultAttributes(), 'Unit 1 has only default attributes upon creation');
    ok(unit_two.hasOnlyDefaultAttributes(), 'Unit 2 has only default attributes upon creation');
    ok(unit_three.hasOnlyDefaultAttributes(), 'Unit 3 has only default attributes upon creation');
    ok(unit_four.hasOnlyDefaultAttributes(), 'Unit 4 has only default attributes upon creation');

    unit_one.set('mark', 'ABCD');
    unit_two.set('profile_id', 17);
    unit_three.toggleCircular(unit_three.get('root_section').id, true);
    unit_four.get('unit_options').reset();

    notOk(unit_one.hasOnlyDefaultAttributes(), 'Unit 1 has non-default attributes after calling set');
    notOk(unit_two.hasOnlyDefaultAttributes(), 'Unit 2 has non-default attributes after changing profile');
    notOk(unit_three.hasOnlyDefaultAttributes(), 'Unit 3 has non-default attributes after making changes to root_section');
    notOk(unit_four.hasOnlyDefaultAttributes(), 'Unit 4 has non-default attributes after making changes to unit_options');
});


//  TODO: This relies on globally available app.settings.dictionaries, we need
//  to get rid of globals eventually
test('Unit getDefaultUnitOptions function', function () {
    var unit = new app.Unit({
        profile_id: 1
    });

    var another_unit = new app.Unit({
        profile_id: 17
    });

    deepEqual(
        unit.getDefaultUnitOptions().toJSON(),
        [
            {
                dictionary_entry_id: 77,
                dictionary_id: 17,
                quantity: 1
            },
            {
                dictionary_entry_id: 53,
                dictionary_id: 32,
                quantity: 1
            }
        ],
        'getDefaultUnitOptions for unit returns the expected result'
    );

    deepEqual(
        another_unit.getDefaultUnitOptions().toJSON(),
        [
            {
                dictionary_entry_id: 14,
                dictionary_id: 17,
                quantity: 1
            },
            {
                dictionary_entry_id: 53,
                dictionary_id: 32,
                quantity: 1
            }
        ],
        'getDefaultUnitOptions for another unit returns the expected result'
    );
});


test('Unit getCurrentUnitOptions, getCurrentUnitOptionsByDictionaryId, getUnitOptionsGroupedByPricingScheme functions', function () {
    var unit = new app.Unit({
        profile_id: 1
    });
    var current_options = unit.getCurrentUnitOptions();
    var first_option = current_options[0];

    equal(current_options.length, 2, 'getCurrentUnitOptions returns array with 2 elements');
    deepEqual(
        first_option.dictionary.toJSON(),
        {
            name: 'Interior Handle',
            position: 0,
            pricing_scheme: 'PER_ITEM',
            rules_and_restrictions: '[]'
        },
        'First option contains correct dictionary link'
    );
    deepEqual(
        first_option.entry.toJSON(),
        {
            data: '{}',
            dictionary_entry_profiles: [
                {
                    cost_per_item: 0,
                    is_default: true,
                    pricing_equation_params: '[{"name":"fixed","param_a":0,"param_b":0},{"name":"operable","param_a":0,"param_b":0}]',
                    pricing_grids: '[{"name":"fixed","data":[{"height":500,"width":500,"value":0},{"height":914,"width":1514,"value":0},{"height":2400,"width":3000,"value":0}]},{"name":"operable","data":[{"height":500,"width":500,"value":0},{"height":914,"width":1514,"value":0},{"height":1200,"width":2400,"value":0}]}]',
                    profile_id: 1
                },
                {
                    cost_per_item: 0,
                    is_default: false,
                    pricing_equation_params: '[{"name":"fixed","param_a":0,"param_b":0},{"name":"operable","param_a":0,"param_b":0}]',
                    pricing_grids: '[{"name":"fixed","data":[{"height":500,"width":500,"value":0},{"height":914,"width":1514,"value":0},{"height":2400,"width":3000,"value":0}]},{"name":"operable","data":[{"height":500,"width":500,"value":0},{"height":914,"width":1514,"value":0},{"height":1200,"width":2400,"value":0}]}]',
                    profile_id: 17
                }
            ],
            name: 'Red Metal Handle',
            position: 1,
            supplier_name: ''
        },
        'First option contains correct entry link'
    );

    var options_by_dictionary = unit.getCurrentUnitOptionsByDictionaryId(17);

    equal(options_by_dictionary.length, 1, 'getCurrentUnitOptionsByDictionaryId returns array with 1 element');
    equal(
        JSON.stringify(options_by_dictionary[0].entry.toJSON()),
        JSON.stringify(first_option.entry.toJSON()),
        'getCurrentUnitOptionsByDictionaryId returns the expected entry'
    );

    var grouped_by_scheme = unit.getUnitOptionsGroupedByPricingScheme();

    equal(grouped_by_scheme.PER_ITEM.length, 2, 'PER_ITEM group contains 2 elements');
    equal(grouped_by_scheme.PRICING_GRIDS.length, 0, 'PRICING_GRIDS group contains 0 elements');
});


test('Unit persistOption function', function () {
    var unit = new app.Unit({
        profile_id: 1
    });
    var current_options = unit.getCurrentUnitOptions();

    equal(current_options.length, 2, 'getCurrentUnitOptions returns array with 2 elements');
    equal(current_options[0].dictionary.get('name'), 'Interior Handle', 'First option is from Interior Handle dictionary');
    equal(current_options[0].entry.get('name'), 'Red Metal Handle', 'First option is Red Metal Handle');

    //  Persist the same Red Metal Handle we already have there
    unit.persistOption(17, 77);
    current_options = unit.getCurrentUnitOptions();

    equal(current_options.length, 2, 'getCurrentUnitOptions still returns array with 2 elements');
    equal(current_options[0].entry.get('name'), 'Red Metal Handle', 'First option is still Red Metal Handle');

    //  Persist some different handle, it should replace the existing one
    unit.persistOption(17, 14);
    current_options = unit.getCurrentUnitOptions();

    equal(current_options.length, 2, 'getCurrentUnitOptions still returns array with 2 elements');
    equal(current_options[0].entry.get('name'), 'White Plastic Handle', 'First option is now White Plastic Handle');
    equal(current_options[0].quantity, 1, 'First option quantity is 1');

    //  Don't change the option, but update its quantity
    unit.persistOption(17, 14, 5);
    current_options = unit.getCurrentUnitOptions();

    equal(current_options.length, 2, 'getCurrentUnitOptions still returns array with 2 elements');
    equal(current_options[0].entry.get('name'), 'White Plastic Handle', 'First option is still White Plastic Handle');
    equal(current_options[0].quantity, 5, 'First option quantity is now 5');

    //  Remove the option
    unit.persistOption(17, false);
    current_options = unit.getCurrentUnitOptions();

    equal(current_options.length, 1, 'getCurrentUnitOptions now returns array with only 1 element');
    equal(current_options[0].entry.get('name'), 'Blue Metal Hande - External', 'First option is Blue Metal Hande - External');
});
