/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-len:0 */
/* eslint max-statements:0 */

var m = app.utils.math;

app.session = new app.Session();
app.session.set('no_backend', true);


//  Test that QUnit is working
test('basic test', function () {
    ok(true, 'Passed.');
});


//  ------------------------------------------------------------------------
//  Test that inner collections are added properly
//  ------------------------------------------------------------------------

test('project basic tests', function () {
    var current_project = new app.Project({
        client_name: 'Andy Huh',
        client_company_name: 'Cool Project',
        client_phone: '123.456.0001',
        client_email: 'ben@prossimo.us',
        client_address: '98 4th Street Suite 213 Brooklyn, NY 11231',
        project_name: 'Italian Market',
        project_address: '827 Carpenter Lane Philadelphia, PA'
    });

    equal(current_project.get('client_name'), 'Andy Huh', 'Client name should be Andy Huh');
    ok(_.isArray(current_project.units.models), 'Units collection should be an array');
    equal(current_project.units.models.length, 0, 'Units collection shoud have no items');
    ok(_.isArray(current_project.extras.models), 'Extras collection should be an array');
    equal(current_project.extras.models.length, 0, 'Extras collection shoud have no items');
});


//  ------------------------------------------------------------------------
//  Test that prices for a single Unit model are calculated properly
//  ------------------------------------------------------------------------

test('single unit tests', function () {
    var current_project = new app.Project();

    current_project.units.add([
        {
            mark: 'A',
            width: 30,
            height: 40,
            quantity: 1,
            description: 'Tilt and turn inswing / fixed PVC',
            notes: 'Opening restriction cord included',
            original_cost: 399,
            original_currency: 'EUR',
            conversion_rate: 0.90326078,
            price_markup: 2.3,
            uw: 0.77,
            glazing: '3Std U=.09 SGHC=.5',
            discount: 20,
            supplier_discount: 15
        }
    ]);

    var first_unit = current_project.units.first();

    equal(first_unit.get('mark'), 'A', 'Unit mark is expected to be A');
    equal(first_unit.get('original_cost'), 399, 'Unit original cost is expected to be 399');

    equal(first_unit.getUnitCost().toFixed(2), '441.73', 'Unit cost converted to USD is expected to be 441.73');
    equal(first_unit.getUnitCostDiscounted().toFixed(2), '375.47', 'Unit cost in USD with supplier discount is expected to be 375.47');
    equal(first_unit.getUnitPrice().toFixed(2), '863.59', 'Unit end price is expected to be 863.59');

    equal(first_unit.getSubtotalPrice(), first_unit.getUnitPrice(), 'Price should be same for a single unit and for subtotal');
    equal(first_unit.getUnitPriceDiscounted().toFixed(2), '690.87', 'Price with discount is expected to be 690.87');
    equal(first_unit.getSubtotalPriceDiscounted(), first_unit.getUnitPriceDiscounted(), 'Discounted price should be same for a single unit and for subtotal');

    equal(first_unit.getAreaInSquareFeet().toFixed(2), '8.33', 'Unit area is expected to be 8.33');
    equal(first_unit.getSquareFeetPrice().toFixed(2), '103.63', 'Price per sq.ft is expected to be 103.63');
    equal(first_unit.getSquareFeetPriceDiscounted().toFixed(2), '82.90', 'Discounted price per sq.ft is expected to be 82.90');
});


//  ------------------------------------------------------------------------
//  Test that prices for a single Accessory model are calculated properly
//  ------------------------------------------------------------------------

test('single accessory tests', function () {
    var current_project = new app.Project();

    current_project.extras.add([
        {
            description: 'Grey restrictor cable w/key - 4.25" length',
            quantity: 90,
            original_cost: 10,
            original_currency: 'EUR',
            conversion_rate: 0.91261693,
            price_markup: 1.5,
            discount: 0
        }
    ]);

    var first_accessory = current_project.extras.first();

    equal(first_accessory.get('original_cost'), 10, 'Unit original cost is expected to be 10');

    equal(first_accessory.getUnitCost().toFixed(2), '10.96', 'Unit cost converted to USD is expected to be 10.96');
    equal(first_accessory.getUnitPrice().toFixed(2), '16.44', 'Unit end price is expected to be 16.44');
    equal(first_accessory.getSubtotalPrice(), first_accessory.getUnitPrice() * 90, 'Price should be same for a single unit * 90 and for subtotal');
    equal(first_accessory.getUnitPriceDiscounted(), first_accessory.getUnitPrice(), 'Price with zero discount is expected to be same as unit price');
    equal(first_accessory.getSubtotalPrice().toFixed(2), '1479.26', 'Subtotal price is expected to be 1479.26');
});


//  ------------------------------------------------------------------------
//  Test that end project prices are calculated properly
//  ------------------------------------------------------------------------

test('subtotal project prices', function () {
    var current_project = new app.Project();

    current_project.units.add([
        {
            mark: 'A',
            width: 30,
            height: 40,
            quantity: 1,
            description: 'Tilt and turn inswing / fixed PVC',
            notes: 'Opening restriction cord included',
            original_cost: 399,
            original_currency: 'EUR',
            conversion_rate: 0.90326078,
            price_markup: 2.3,
            uw: 0.77,
            glazing: '3Std U=.09 SGHC=.5',
            discount: 20,
            root_section: '{"id":"101"}'
        },
        {
            mark: 'B1',
            width: 38,
            height: 24,
            quantity: 2,
            description: 'Tilt and turn inswing above / removable ac sash below. PVC',
            notes: 'Opening restriction cord included',
            original_cost: 279,
            original_currency: 'EUR',
            conversion_rate: 0.90326078,
            price_markup: 2.3,
            uw: 0.78,
            glazing: '3Std U=.09 SGHC=.5',
            discount: 20,
            root_section: '{"id":"102"}'
        }
    ]);

    current_project.multiunits.add([
        {
            multiunit_subunits: ["101", "102"],
            mark: 'A',
            width: 68.78740,
            height: 40,
            quantity: 1,
            description: 'Site-mulled multi frame unit',
            notes: 'Assembled on site',
            root_section: '{"id":"99999","connectors":[{"id":"1","side":"right","connects":["101","102"],"width":20,"facewidth":40}]}'
        }
    ]);

    current_project.extras.add([
        {
            description: 'Grey restrictor cable w/key - 4.25" length',
            quantity: 90,
            original_cost: 10,
            original_currency: 'EUR',
            conversion_rate: 0.91261693,
            price_markup: 1.5,
            discount: 0
        },
        {
            description: 'Piece of junk',
            quantity: 5,
            original_cost: 15,
            original_currency: 'USD',
            conversion_rate: 1,
            price_markup: 2,
            discount: 0
        },
        {
            description: 'Optional thingy',
            quantity: 1,
            original_cost: 450,
            original_currency: 'USD',
            conversion_rate: 1,
            price_markup: 2,
            discount: 0,
            extras_type: 'Optional'
        },
        {
            description: 'Hidden costs for freelancers',
            quantity: 1,
            original_cost: 1000,
            original_currency: 'USD',
            conversion_rate: 1,
            price_markup: 1,
            discount: 0,
            extras_type: 'Hidden'
        },
        {
            description: 'Shipping to site',
            quantity: 1,
            original_cost: 1500,
            original_currency: 'USD',
            conversion_rate: 1,
            price_markup: 1,
            discount: 0,
            extras_type: 'Shipping'
        },
        {
            description: 'VAT',
            quantity: 1,
            price_markup: 1.3,
            extras_type: 'Tax'
        }
    ]);

    //  End prices for units
    equal(current_project.units.getSubtotalPrice().toFixed(2), '2436.84', 'Subtotal for units is expected to be 2436.84');
    equal(current_project.units.getSubtotalPriceDiscounted().toFixed(2), '1949.47', 'Subtotal w/Discount for units is expected to be 1949.47');

    //  End prices for accessories
    equal(current_project.extras.getRegularItemsPrice().toFixed(2), '1629.26', 'Subtotal for regular extras is expected to be 1629.26');
    equal(current_project.extras.getOptionalItemsPrice().toFixed(2), '900.00', 'Subtotal for optional extras is expected to be 900.00');
    equal(current_project.extras.getHiddenPrice().toFixed(2), '1000.00', 'Subtotal for hidden extras is expected to be 1000.00');
    equal(current_project.extras.getShippingPrice().toFixed(2), '1500.00', 'Subtotal for shipping is expected to be 1500.00');

    //  End prices for the whole project
    var total_prices = current_project.getTotalPrices();
    equal(total_prices.subtotal_units.toFixed(2), '1949.47', 'Subtotal price for units is expected to be 1949.47');
    equal(total_prices.subtotal_extras.toFixed(2), '1629.26', 'Subtotal price for extras is expected to be 1629.26');
    equal(total_prices.subtotal.toFixed(2), '3578.73', 'Subtotal price for the whole order is expected to be 3578.73');
    equal(total_prices.shipping.toFixed(2), '1500.00', 'Shipping is expected to be 1500.00');
    equal(total_prices.tax.toFixed(2), '1073.62', 'Tax is expected to be 1073.62');
    equal(total_prices.grand_total.toFixed(2), '6152.35', 'Grand total is expected to be 6152.35');
    equal(total_prices.total_cost.toFixed(2), '5694.29', 'Total cost is expected to be 5694.29');
    equal(total_prices.net_profit.toFixed(2), '458.06', 'Net Profit is expected to be 458.06');
    equal(total_prices.gross_profit.toFixed(2), '1458.06', 'Gross Profit is expected to be 1458.06');
    equal(total_prices.net_profit_percent.toFixed(2), '7.45', 'Net Profit is expected to be 7.45% of Grand Total');
    equal(
        total_prices.net_profit.toFixed(2),
        (total_prices.gross_profit - current_project.extras.getHiddenPrice()).toFixed(2),
        'Net Profit should be equal to Gross Profit - Hidden Costs'
    );

    //  Individual price calculation functions should match with `total_prices`
    equal(total_prices.subtotal_units, current_project.getSubtotalUnitsPrice(), 'getSubtotalUnitsPrice result should match total_prices.subtotal_units');
    equal(total_prices.subtotal_extras, current_project.getExtrasPrice(), 'getExtrasPrice result should match total_prices.subtotal_extras');
    equal(total_prices.subtotal, current_project.getSubtotalPrice(), 'getSubtotalPrice result should match total_prices.subtotal');

    // Total Profit should be the same as profit for all units / extras individually
    var subtotal_profit_units = _.reduce(current_project.units.map(function (unit) {
        return unit.getSubtotalProfit();
    }), function (memo, item) {
        return memo + item;
    }, 0);
    var subtotal_profit_extras = _.reduce(_.map(current_project.extras.getRegularItems(), function (unit) {
        return unit.getSubtotalProfit();
    }), function (memo, item) {
        return memo + item;
    }, 0);
    var hidden_cost = current_project.extras.getHiddenPrice();
    var combined_profit = subtotal_profit_units + subtotal_profit_extras - hidden_cost;

    equal(total_prices.net_profit.toFixed(2), combined_profit.toFixed(2), 'total_prices.net_profit should match combined profit for units & extras');
});


//  ------------------------------------------------------------------------
//  Test that estimated cost for a unit is calculated properly
//  ------------------------------------------------------------------------

test('estimated unit cost', function () {
    var unit;
    var root_id;
    var full_root;
    var top_section;
    var bottom_section;
    var sections_list;
    var estimated_list;
    var pricing_grids;

    unit = new app.Unit({
        width: 62,
        height: 96
    });

    unit.profile = new app.Profile({
        frame_width: 70,
        mullion_width: 92,
        sash_frame_width: 82,
        sash_frame_overlap: 34,
        sash_mullion_overlap: 34
    });

    pricing_grids = unit.profile.getPricingGrids();

    //  Check that areas of default pricing grid tiers are calculated properly
    equal(m.square_meters(pricing_grids.fixed[0].width, pricing_grids.fixed[0].height).toFixed(2), '0.25', 'Fixed small tier area is expected to be 0.25');
    equal(m.square_meters(pricing_grids.fixed[1].width, pricing_grids.fixed[1].height).toFixed(2), '1.38', 'Fixed medium tier area is expected to be 1.38');
    equal(m.square_meters(pricing_grids.fixed[2].width, pricing_grids.fixed[2].height).toFixed(2), '7.20', 'Fixed large tier area is expected to be 7.20');

    equal(m.square_meters(pricing_grids.operable[0].width, pricing_grids.operable[0].height).toFixed(2), '0.25', 'Operable small tier area is expected to be 0.25');
    equal(m.square_meters(pricing_grids.operable[1].width, pricing_grids.operable[1].height).toFixed(2), '1.38', 'Operable medium tier area is expected to be 1.38');
    equal(m.square_meters(pricing_grids.operable[2].width, pricing_grids.operable[2].height).toFixed(2), '2.88', 'Operable large tier area is expected to be 2.88');

    unit.profile.set('pricing_grids', {
        fixed: [
            {
                title: 'Small',
                height: 500,
                width: 500,
                price_per_square_meter: 100
            },
            {
                title: 'Medium',
                height: 914,
                width: 1514,
                price_per_square_meter: 150
            },
            {
                title: 'Large',
                height: 2400,
                width: 3000,
                price_per_square_meter: 300
            }
        ],
        operable: [
            {
                title: 'Small',
                height: 500,
                width: 500,
                price_per_square_meter: 120
            },
            {
                title: 'Medium',
                height: 914,
                width: 1514,
                price_per_square_meter: 180
            },
            {
                title: 'Large',
                height: 1200,
                width: 2400,
                price_per_square_meter: 350
            }
        ]
    });

    root_id = unit.get('root_section').id;
    unit.splitSection(root_id, 'horizontal');
    full_root = unit.generateFullRoot();

    top_section = full_root.sections[0];
    bottom_section = full_root.sections[1];

    unit.setSectionSashType(top_section.id, 'fixed_in_sash');
    unit.setSectionSashType(bottom_section.id, 'fixed_in_sash');

    sections_list = unit.getFixedAndOperableSectionsList();

    //  Areas should be calculated properly
    equal(m.square_meters(sections_list[0].width, sections_list[0].height).toFixed(2), '1.92', 'First section area is expected to be 1.92');
    equal(m.square_meters(sections_list[1].width, sections_list[1].height).toFixed(2), '1.92', 'Second section area is expected to be 1.92');

    //  Types should be determined properly
    equal(sections_list[0].type, 'fixed', 'First section type is expected to be fixed');
    equal(sections_list[1].type, 'fixed', 'Second section type is expected to be fixed');

    pricing_grids = unit.profile.getPricingGrids();
    estimated_list = unit.getSectionsListWithEstimatedCost();

    //  Areas of pricing grid tiers should be calculated properly
    equal(m.square_meters(pricing_grids.fixed[0].width, pricing_grids.fixed[0].height).toFixed(2), '0.25', 'Fixed small tier area is expected to be 0.25');
    equal(m.square_meters(pricing_grids.fixed[1].width, pricing_grids.fixed[1].height).toFixed(2), '1.38', 'Fixed medium tier area is expected to be 1.38');
    equal(m.square_meters(pricing_grids.fixed[2].width, pricing_grids.fixed[2].height).toFixed(2), '7.20', 'Fixed large tier area is expected to be 7.20');

    equal(m.square_meters(pricing_grids.operable[0].width, pricing_grids.operable[0].height).toFixed(2), '0.25', 'Operable small tier area is expected to be 0.25');
    equal(m.square_meters(pricing_grids.operable[1].width, pricing_grids.operable[1].height).toFixed(2), '1.38', 'Operable medium tier area is expected to be 1.38');
    equal(m.square_meters(pricing_grids.operable[2].width, pricing_grids.operable[2].height).toFixed(2), '2.88', 'Operable large tier area is expected to be 2.88');

    //  Price per square meter should be calculated properly
    equal(estimated_list[0].price_per_square_meter.toFixed(2), '163.83', 'First section: price / square meter');
    equal(estimated_list[1].price_per_square_meter.toFixed(2), '163.83', 'Second section: price / square meter');

    //  Estimated base cost should be calculated properly
    equal(estimated_list[0].base_cost.toFixed(2), '314.55', 'First section: estimated base cost');
    equal(estimated_list[1].base_cost.toFixed(2), '314.55', 'Second section: estimated base cost');
});


//  ------------------------------------------------------------------------
//  Test some estimation-related functions, inc. priced fillings / options
//  ------------------------------------------------------------------------

test('unit getUnitOptionsGroupedByPricingScheme function', function () {
    app.settings = new app.Settings();

    app.settings.dictionaries = new app.OptionsDictionaryCollection([
        {
            name: 'Interior Finish',
            id: 1,
            pricing_scheme: 'PRICING_GRIDS',
            entries: [
                {
                    name: 'White Color',
                    id: 5,
                    dictionary_entry_profiles: [
                        { profile_id: 3 }
                    ]
                }
            ]
        },
        {
            name: 'Interior Handle',
            pricing_scheme: 'PER_ITEM',
            id: 2,
            entries: [
                {
                    name: 'White Plastic Handle',
                    id: 7,
                    dictionary_entry_profiles: [
                        { profile_id: 3 },
                        { profile_id: 6 }
                    ]
                }
            ]
        }
    ], { parse: true });

    var unit = new app.Unit({
        width: 62,
        height: 96
    });

    unit.profile = new app.Profile({
        id: 3,
        name: 'Nice and Cool Profile',
        unit_type: 'Window'
    });

    //  Here we basically assign some default options to our unit
    unit.validateUnitOptions();

    var grouped_options = unit.getUnitOptionsGroupedByPricingScheme();

    equal(grouped_options.PER_ITEM.length, 1, 'PER_ITEM group contains one option');
    equal(grouped_options.PRICING_GRIDS.length, 1, 'PRICING_GRIDS group contains one option');

    equal(
        grouped_options.PRICING_GRIDS[0].dictionary_name,
        'Interior Finish',
        'The option inside PRICING_GRIDS group is from Interior Finish dictionary'
    );
    deepEqual(
        grouped_options.PER_ITEM[0],
        {
            dictionary_name: 'Interior Handle',
            option_name: 'White Plastic Handle',
            pricing_data: {
                scheme: 'PER_ITEM',
                cost_per_item: 0
            }
        },
        'The option inside PER_ITEM group matches the expected data'
    );

    //  Now we want to restrict one dictionary to DOOR_ONLY and see if this
    //  option won't be included into unit options anymore
    app.settings.dictionaries.get(1).set('rules_and_restrictions', ['DOOR_ONLY']);
    grouped_options = unit.getUnitOptionsGroupedByPricingScheme();

    equal(grouped_options.PER_ITEM.length, 1, 'PER_ITEM group still contains one option');
    equal(grouped_options.PRICING_GRIDS.length, 0, 'PRICING_GRIDS group does not contain any options anymore');

    delete app.settings.dictionaries;
    delete app.settings;
});


test('unit getSectionsListWithEstimatedCost, getEstimatedUnitCost functions', function () {
    app.settings = new app.Settings();

    app.settings.dictionaries = new app.OptionsDictionaryCollection([
        {
            name: 'Interior Finish',
            id: 1,
            pricing_scheme: 'PRICING_GRIDS',
            entries: [
                {
                    name: 'White Color',
                    id: 5,
                    dictionary_entry_profiles: [
                        {
                            profile_id: 3,
                            pricing_grids: [
                                {
                                    name: 'fixed',
                                    data: [
                                        { height: 500, width: 500, value: 15 },
                                        { height: 914, width: 1514, value: 14 },
                                        { height: 2400, width: 3000, value: 11 }
                                    ]
                                },
                                {
                                    name: 'operable',
                                    data: [
                                        { height: 500, width: 500, value: 13 },
                                        { height: 914, width: 1514, value: 12 },
                                        { height: 1200, width: 2400, value: 10 }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            name: 'Interior Handle',
            pricing_scheme: 'PER_ITEM',
            id: 2,
            entries: [
                {
                    name: 'White Plastic Handle',
                    id: 7,
                    dictionary_entry_profiles: [
                        { profile_id: 3, cost_per_item: 14 },
                        { profile_id: 6 }
                    ]
                }
            ]
        }
    ], { parse: true });

    app.settings.filling_types = new app.FillingTypeCollection([
        {
            name: 'Triple Glazed Low-e: U=.11 SHGC=.5 VT=.71',
            type: 'glass',
            id: 18,
            filling_type_profiles: [
                {
                    profile_id: 3,
                    pricing_grids: [
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
                    ]
                }
            ]
        }
    ], { parse: true });

    var unit = new app.Unit({
        width: 62,
        height: 96
    });

    unit.profile = new app.Profile({
        id: 3,
        name: 'Nice and Cool Profile',
        unit_type: 'Window',
        pricing_grids: {
            fixed: [
                { title: 'Small', height: 500, width: 500, price_per_square_meter: 50 },
                { title: 'Medium', height: 914, width: 1514, price_per_square_meter: 45 },
                { title: 'Large', height: 2400, width: 3000, price_per_square_meter: 40 }
            ],
            operable: [
                { title: 'Small', height: 500, width: 500, price_per_square_meter: 70 },
                { title: 'Medium', height: 914, width: 1514, price_per_square_meter: 65 },
                { title: 'Large', height: 1200, width: 2400, price_per_square_meter: 60 }
            ]
        }
    });

    unit.validateUnitOptions();
    unit.setFillingType(
        unit.get('root_section').id,
        app.settings.filling_types.at(0).get('type'),
        app.settings.filling_types.at(0).get('name')
    );

    var sections_list = unit.getSectionsListWithEstimatedCost();
    var estimated_cost = unit.getEstimatedUnitCost();

    //  First section base cost
    equal(sections_list[0].width.toFixed(2), '1574.80', 'Section width is correct');
    equal(sections_list[0].height.toFixed(2), '2438.40', 'Section height is correct');
    equal(sections_list[0].price_per_square_meter.toFixed(2), '42.89', 'Section price_per_square_meter is correct');
    equal(sections_list[0].base_cost.toFixed(2), '164.69', 'Section base_cost is correct');

    //  First section filling cost
    equal(sections_list[0].filling_price_increase.toFixed(2), '11.16', 'Section filling_price_increase is correct');
    equal(sections_list[0].filling_cost.toFixed(2), '18.37', 'Section filling_cost is correct');

    //  First section options cost
    equal(sections_list[0].options.length, 1, 'Section has one priced option');
    equal(sections_list[0].options[0].price_increase.toFixed(2), '12.73', 'First option price_increase is correct');
    equal(sections_list[0].options_cost.toFixed(2), '20.97', 'Section options_cost is correct');

    //  First section total cost
    equal(sections_list[0].total_cost.toFixed(2), '204.03', 'Section total_cost is correct');
    equal(
        sections_list[0].total_cost,
        sections_list[0].base_cost + sections_list[0].filling_cost + sections_list[0].options_cost,
        'Section total_cost is the combination of base, fillling and options cost'
    );

    //  Unit total cost
    equal(estimated_cost.total.toFixed(2), '218.03', 'Unit total cost is correct');
    equal(
        estimated_cost.total,
        estimated_cost.base + estimated_cost.fillings + estimated_cost.options,
        'Unit total cost is the combination of base, filllings and options cost'
    );
});


//  ------------------------------------------------------------------------
//  Test that prices for a single Multiunit model are calculated properly
//  ------------------------------------------------------------------------

test('single multiunit tests', function () {
    var current_project = new app.Project();

    current_project.units.add([
        {
            mark: 'A',
            width: 62,
            height: 96,
            quantity: 1,
            glazing_bar_width: 12,
            description: 'Tilt and turn inswing / fixed PVC',
            notes: 'Opening restriction cord included',
            profile_id: 9991,
            original_cost: 399,
            original_currency: 'EUR',
            conversion_rate: 0.90326078,
            price_markup: 2.3,
            uw: 0.77,
            glazing: '3Std U=.09 SGHC=.5',
            discount: 20,
            root_section: '{"id":"106"}'
        },
        {
            mark: '11 W 126th Unit H/I',
            width: 145,
            height: 90,
            quantity: 1,
            profile_id: 9993,
            original_cost: 321,
            glazing: 'Triple Low Gain - Tempered',
            root_section: '{"id":"19991"}'
        },
        {
            mark: 'Moyers Residence Unit A',
            width: 36.75,
            height: 72.75,
            quantity: 1,
            profile_id: 9991,
            original_cost: 111,
            glazing: 'Triple Standard - Ug=.09 SGHC=.50 LT=71%',
            root_section: '{"id":"10565"}'
        }
    ]);

    current_project.multiunits.add([
        {
            multiunit_subunits: ["106", "10565", "19991"],
            mark: 'A',
            width: 207.78740,
            height: 169.53740,
            quantity: 1,
            description: 'Site-mulled multi frame unit',
            notes: 'Assembled on site',
            root_section: '{"id":"99999","connectors":[{"id":"123","side":"bottom","connects":["106","10565"],"width":20,"facewidth":40},{"id":"130","side":"right","connects":["106","19991"],"width":20,"facewidth":40}]}'
        }
    ]);

    var multiunit = current_project.multiunits.first();

    equal(multiunit.get('mark'), 'A', 'Unit mark is expected to be A');

    equal(multiunit.getUnitPrice().toFixed(2), '2119.99', 'Multiunit end price is expected to be 2119.99');

    equal(multiunit.getSubtotalPrice(), multiunit.getUnitPrice(), 'Price should be same for a single multiunit and for subtotal');
    equal(multiunit.getUnitPriceDiscounted().toFixed(2), '1916.79', 'Price with discount is expected to be 1916.79');
    equal(multiunit.getSubtotalPriceDiscounted(), multiunit.getUnitPriceDiscounted(), 'Discounted price should be same for a single multiunit and for subtotal');
});
