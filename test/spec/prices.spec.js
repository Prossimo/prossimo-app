import _ from 'underscore';

import { math as m } from '../../src/utils';
import App from '../../src/main';
import Profile from '../../src/core/models/profile';
import Unit from '../../src/core/models/unit';
import Project from '../../src/core/models/project';
import Quote from '../../src/core/models/quote';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

const settings = App.settings;
const restoreSettings = () => {
    // restore settings
    App.settings = settings;
};

test('Prices tests', () => {
    //  ------------------------------------------------------------------------
    //  Test that inner collections are added properly
    //  ------------------------------------------------------------------------
    test('project basic tests', () => {
        const current_project = new Project({
            client_name: 'Andy Huh',
            client_company_name: 'Cool Project',
            client_phone: '123.456.0001',
            client_email: 'ben@prossimo.us',
            client_address: '98 4th Street Suite 213 Brooklyn, NY 11231',
            project_name: 'Italian Market',
            project_address: '827 Carpenter Lane Philadelphia, PA',
        });

        equal(current_project.get('client_name'), 'Andy Huh', 'Client name should be Andy Huh');
        ok(_.isArray(current_project.quotes.models), 'Quotes collection should be an array');
        equal(current_project.quotes.models.length, 0, 'Quotes collection shoud have no items');
    });

    test('quote basic tests', () => {
        const current_quote = new Quote({
            name: 'One Nice Quote',
        });

        equal(current_quote.get('name'), 'One Nice Quote', 'Quote name should be correct');
        ok(_.isArray(current_quote.units.models), 'Units collection should be an array');
        equal(current_quote.units.models.length, 0, 'Units collection shoud have no items');
        ok(_.isArray(current_quote.extras.models), 'Extras collection should be an array');
        equal(current_quote.extras.models.length, 0, 'Extras collection shoud have no items');
    });

    //  ------------------------------------------------------------------------
    //  Test that prices for a single Unit model are calculated properly
    //  ------------------------------------------------------------------------
    test('single unit tests', () => {
        const current_quote = new Quote();

        current_quote.units.add([
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
                supplier_discount: 15,
            },
        ]);

        const first_unit = current_quote.units.first();

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
    test('single accessory tests', () => {
        const current_quote = new Quote();

        current_quote.extras.add([
            {
                description: 'Grey restrictor cable w/key - 4.25" length',
                quantity: 90,
                original_cost: 10,
                original_currency: 'EUR',
                conversion_rate: 0.91261693,
                price_markup: 1.5,
                discount: 0,
            },
        ]);

        const first_accessory = current_quote.extras.first();

        equal(first_accessory.get('original_cost'), 10, 'Unit original cost is expected to be 10');

        equal(first_accessory.getUnitCost().toFixed(2), '10.96', 'Unit cost converted to USD is expected to be 10.96');
        equal(first_accessory.getUnitPrice().toFixed(2), '16.44', 'Unit end price is expected to be 16.44');
        equal(first_accessory.getSubtotalPrice(), first_accessory.getUnitPrice() * 90, 'Price should be same for a single unit * 90 and for subtotal');
        equal(first_accessory.getUnitPriceDiscounted(), first_accessory.getUnitPrice(), 'Price with zero discount is expected to be same as unit price');
        equal(first_accessory.getSubtotalPrice().toFixed(2), '1479.26', 'Subtotal price is expected to be 1479.26');
    });

    //  ------------------------------------------------------------------------
    //  Test that end quote prices are calculated properly
    //  ------------------------------------------------------------------------
    test('subtotal quote prices', () => {
        const current_quote = new Quote();

        current_quote.units.add([
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
            },
        ]);

        current_quote.extras.add([
            {
                description: 'Grey restrictor cable w/key - 4.25" length',
                quantity: 90,
                original_cost: 10,
                original_currency: 'EUR',
                conversion_rate: 0.91261693,
                price_markup: 1.5,
                discount: 0,
            },
            {
                description: 'Piece of junk',
                quantity: 5,
                original_cost: 15,
                original_currency: 'USD',
                conversion_rate: 1,
                price_markup: 2,
                discount: 0,
            },
            {
                description: 'Optional thingy',
                quantity: 1,
                original_cost: 450,
                original_currency: 'USD',
                conversion_rate: 1,
                price_markup: 2,
                discount: 0,
                extras_type: 'Optional',
            },
            {
                description: 'Hidden costs for freelancers',
                quantity: 1,
                original_cost: 1000,
                original_currency: 'USD',
                conversion_rate: 1,
                price_markup: 1,
                discount: 0,
                extras_type: 'Hidden',
            },
            {
                description: 'Shipping to site',
                quantity: 1,
                original_cost: 1500,
                original_currency: 'USD',
                conversion_rate: 1,
                price_markup: 1,
                discount: 0,
                extras_type: 'Shipping',
            },
            {
                description: 'VAT',
                quantity: 1,
                price_markup: 1.3,
                extras_type: 'Tax',
            },
        ]);

        //  End prices for units
        equal(current_quote.units.getSubtotalPrice().toFixed(2), '2436.84', 'Subtotal for units is expected to be 2436.84');
        equal(current_quote.units.getSubtotalPriceDiscounted().toFixed(2), '1949.47', 'Subtotal w/Discount for units is expected to be 1949.47');

        //  End prices for accessories
        equal(current_quote.extras.getRegularItemsPrice().toFixed(2), '1629.26', 'Subtotal for regular extras is expected to be 1629.26');
        equal(current_quote.extras.getOptionalItemsPrice().toFixed(2), '900.00', 'Subtotal for optional extras is expected to be 900.00');
        equal(current_quote.extras.getHiddenPrice().toFixed(2), '1000.00', 'Subtotal for hidden extras is expected to be 1000.00');
        equal(current_quote.extras.getShippingPrice().toFixed(2), '1500.00', 'Subtotal for shipping is expected to be 1500.00');

        //  End prices for the whole project
        const total_prices = current_quote.getTotalPrices();

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
            (total_prices.gross_profit - current_quote.extras.getHiddenPrice()).toFixed(2),
            'Net Profit should be equal to Gross Profit - Hidden Costs',
        );

        //  Individual price calculation functions should match with `total_prices`
        equal(total_prices.subtotal_units, current_quote.getSubtotalUnitsPrice(), 'getSubtotalUnitsPrice result should match total_prices.subtotal_units');
        equal(total_prices.subtotal_extras, current_quote.getExtrasPrice(), 'getExtrasPrice result should match total_prices.subtotal_extras');
        equal(total_prices.subtotal, current_quote.getSubtotalPrice(), 'getSubtotalPrice result should match total_prices.subtotal');

        // Total Profit should be the same as profit for all units / extras individually
        const subtotal_profit_units = _.reduce(
            current_quote.units.map(unit => unit.getSubtotalProfit()),
            (memo, item) => memo + item,
            0,
        );
        const subtotal_profit_extras = _.reduce(
            _.map(current_quote.extras.getRegularItems(), unit => unit.getSubtotalProfit()),
            (memo, item) => memo + item,
            0,
        );
        const hidden_cost = current_quote.extras.getHiddenPrice();
        const combined_profit = (subtotal_profit_units + subtotal_profit_extras) - hidden_cost;

        equal(total_prices.net_profit.toFixed(2), combined_profit.toFixed(2), 'total_prices.net_profit should match combined profit for units & extras');
    });

    //  ------------------------------------------------------------------------
    //  Test that estimated cost for a unit is calculated properly
    //  ------------------------------------------------------------------------
    test('estimated unit cost', () => {
        const unit = new Unit({
            width: 62,
            height: 96,
        });

        unit.profile = new Profile({
            frame_width: 70,
            mullion_width: 92,
            sash_frame_width: 82,
            sash_frame_overlap: 34,
            sash_mullion_overlap: 34,
            pricing_scheme: 'PRICING_GRIDS',
        });

        let pricing_grids = unit.profile.get('pricing_grids');

        //  Check that areas of default pricing grid tiers are calculated properly
        equal(
            m.square_meters(
                pricing_grids.getByName('fixed').get('data').at(0).get('width'),
                pricing_grids.getByName('fixed').get('data').at(0).get('height'),
            ).toFixed(2),
            '0.25',
            'Fixed small tier area is expected to be 0.25',
        );
        equal(
            m.square_meters(
                pricing_grids.getByName('fixed').get('data').at(1).get('width'),
                pricing_grids.getByName('fixed').get('data').at(1).get('height'),
            ).toFixed(2),
            '1.38',
            'Fixed medium tier area is expected to be 1.38',
        );
        equal(
            m.square_meters(
                pricing_grids.getByName('fixed').get('data').at(2).get('width'),
                pricing_grids.getByName('fixed').get('data').at(2).get('height'),
            ).toFixed(2),
            '7.20',
            'Fixed large tier area is expected to be 7.20',
        );

        equal(
            m.square_meters(
                pricing_grids.getByName('operable').get('data').at(0).get('width'),
                pricing_grids.getByName('operable').get('data').at(0).get('height'),
            ).toFixed(2),
            '0.25',
            'Operable small tier area is expected to be 0.25',
        );
        equal(
            m.square_meters(
                pricing_grids.getByName('operable').get('data').at(1).get('width'),
                pricing_grids.getByName('operable').get('data').at(1).get('height'),
            ).toFixed(2),
            '1.38',
            'Operable medium tier area is expected to be 1.38',
        );
        equal(
            m.square_meters(
                pricing_grids.getByName('operable').get('data').at(2).get('width'),
                pricing_grids.getByName('operable').get('data').at(2).get('height'),
            ).toFixed(2),
            '2.88',
            'Operable large tier area is expected to be 2.88',
        );

        unit.profile.get('pricing_grids').set([
            {
                name: 'fixed',
                data: [
                    {
                        height: 500,
                        width: 500,
                        value: 100,
                    },
                    {
                        height: 914,
                        width: 1514,
                        value: 150,
                    },
                    {
                        height: 2400,
                        width: 3000,
                        value: 300,
                    },
                ],
            },
            {
                name: 'operable',
                data: [
                    {
                        height: 500,
                        width: 500,
                        value: 120,
                    },
                    {
                        width: 1514,
                        height: 914,
                        value: 180,
                    },
                    {
                        height: 1200,
                        width: 2400,
                        value: 350,
                    },
                ],
            },
        ], { parse: true });

        const root_id = unit.get('root_section').id;
        unit.splitSection(root_id, 'horizontal');
        const full_root = unit.generateFullRoot();

        const top_section = full_root.sections[0];
        const bottom_section = full_root.sections[1];

        unit.setSectionSashType(top_section.id, 'fixed_in_sash');
        unit.setSectionSashType(bottom_section.id, 'fixed_in_sash');

        const sections_list = unit.getFixedAndOperableSectionsList();

        //  Areas should be calculated properly
        equal(m.square_meters(sections_list[0].width, sections_list[0].height).toFixed(2), '1.92', 'First section area is expected to be 1.92');
        equal(m.square_meters(sections_list[1].width, sections_list[1].height).toFixed(2), '1.92', 'Second section area is expected to be 1.92');

        //  Types should be determined properly
        equal(sections_list[0].type, 'fixed', 'First section type is expected to be fixed');
        equal(sections_list[1].type, 'fixed', 'Second section type is expected to be fixed');

        pricing_grids = unit.profile.get('pricing_grids');
        const estimated_list = unit.getSectionsListWithEstimatedCost();

        //  Areas of pricing grid tiers should be calculated properly
        equal(
            m.square_meters(
                pricing_grids.getByName('fixed').get('data').at(0).get('width'),
                pricing_grids.getByName('fixed').get('data').at(0).get('height'),
            ).toFixed(2),
            '0.25',
            'Fixed small tier area is expected to be 0.25',
        );
        equal(
            m.square_meters(
                pricing_grids.getByName('fixed').get('data').at(1).get('width'),
                pricing_grids.getByName('fixed').get('data').at(1).get('height'),
            ).toFixed(2),
            '1.38',
            'Fixed medium tier area is expected to be 1.38',
        );
        equal(
            m.square_meters(
                pricing_grids.getByName('fixed').get('data').at(2).get('width'),
                pricing_grids.getByName('fixed').get('data').at(2).get('height'),
            ).toFixed(2),
            '7.20',
            'Fixed large tier area is expected to be 7.20',
        );

        equal(
            m.square_meters(
                pricing_grids.getByName('operable').get('data').at(0).get('width'),
                pricing_grids.getByName('operable').get('data').at(0).get('height'),
            ).toFixed(2),
            '0.25',
            'Operable small tier area is expected to be 0.25',
        );
        equal(
            m.square_meters(
                pricing_grids.getByName('operable').get('data').at(1).get('width'),
                pricing_grids.getByName('operable').get('data').at(1).get('height'),
            ).toFixed(2),
            '1.38',
            'Operable medium tier area is expected to be 1.38',
        );
        equal(
            m.square_meters(
                pricing_grids.getByName('operable').get('data').at(2).get('width'),
                pricing_grids.getByName('operable').get('data').at(2).get('height'),
            ).toFixed(2),
            '2.88',
            'Operable large tier area is expected to be 2.88',
        );

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
    test('unit getUnitOptionsGroupedByPricingScheme function', () => {
        after(restoreSettings);

        App.settings.dictionaries.reset([
            {
                name: 'Interior Finish',
                id: 1,
                pricing_scheme: 'PRICING_GRIDS',
                entries: [
                    {
                        name: 'White Color',
                        id: 5,
                        dictionary_entry_profiles: [
                            { profile_id: 3 },
                        ],
                    },
                ],
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
                            { profile_id: 6 },
                        ],
                    },
                ],
            },
            {
                name: 'Opening Restrictor',
                pricing_scheme: 'PER_OPERABLE_SASH',
                id: 4,
                entries: [
                    {
                        name: 'Basic Restrictor',
                        id: 12,
                        dictionary_entry_profiles: [
                            { profile_id: 3 },
                            { profile_id: 6 },
                        ],
                    },
                ],
            },
        ], { parse: true });

        const unit = new Unit({
            width: 62,
            height: 96,
        });

        unit.profile = new Profile({
            id: 3,
            name: 'Nice and Cool Profile',
            unit_type: 'Window',
        });

        //  Here we basically assign some default options to our unit
        unit.validateUnitOptions();

        let grouped_options = unit.getUnitOptionsGroupedByPricingScheme();

        equal(grouped_options.PER_ITEM.length, 1, 'PER_ITEM group contains one option');
        equal(grouped_options.PER_OPERABLE_SASH.length, 1, 'PER_OPERABLE_SASH group contains one option');
        equal(grouped_options.PRICING_GRIDS.length, 1, 'PRICING_GRIDS group contains one option');

        equal(
            grouped_options.PRICING_GRIDS[0].dictionary_name,
            'Interior Finish',
            'The option inside PRICING_GRIDS group is from Interior Finish dictionary',
        );
        deepEqual(
            grouped_options.PER_ITEM[0],
            {
                dictionary_name: 'Interior Handle',
                option_name: 'White Plastic Handle',
                pricing_data: {
                    scheme: 'PER_ITEM',
                    cost_per_item: 0,
                },
                has_quantity: true,
                is_hidden: false,
                quantity: 1,
            },
            'The option inside PER_ITEM group matches the expected data',
        );
        equal(
            grouped_options.PER_OPERABLE_SASH[0].dictionary_name,
            'Opening Restrictor',
            'The option inside PER_OPERABLE_SASH group is from Opening Restrictor dictionary',
        );

        //  Now we want to restrict one dictionary to DOOR_ONLY and see if this
        //  option won't be included into unit options anymore
        App.settings.dictionaries.get(1).set('rules_and_restrictions', ['DOOR_ONLY']);
        grouped_options = unit.getUnitOptionsGroupedByPricingScheme();

        equal(grouped_options.PER_ITEM.length, 1, 'PER_ITEM group still contains one option');
        equal(grouped_options.PRICING_GRIDS.length, 0, 'PRICING_GRIDS group does not contain any options anymore');
    });


    test('unit getSectionsListWithEstimatedCost, getEstimatedUnitCost functions', () => {
        after(restoreSettings);

        App.settings.dictionaries.reset([
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
                                            { height: 2400, width: 3000, value: 11 },
                                        ],
                                    },
                                    {
                                        name: 'operable',
                                        data: [
                                            { height: 500, width: 500, value: 13 },
                                            { height: 914, width: 1514, value: 12 },
                                            { height: 1200, width: 2400, value: 10 },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
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
                        ],
                    },
                ],
            },
            {
                name: 'Opening Restrictor',
                pricing_scheme: 'PER_OPERABLE_SASH',
                id: 4,
                entries: [
                    {
                        name: 'Basic Restrictor',
                        id: 12,
                        dictionary_entry_profiles: [
                            { profile_id: 3, cost_per_item: 22 },
                        ],
                    },
                ],
            },
            {
                name: 'Additional Outer Profile',
                pricing_scheme: 'PER_FRAME_LENGTH',
                id: 8,
                entries: [
                    {
                        name: 'Basic Outer Profile',
                        id: 13,
                        dictionary_entry_profiles: [
                            { profile_id: 3, cost_per_item: 11 },
                        ],
                    },
                ],
            },
            {
                name: 'Some Per Sill Length Priced Thing',
                pricing_scheme: 'PER_SILL_OR_THRESHOLD_LENGTH',
                id: 9,
                entries: [
                    {
                        name: 'Basic Thing of This Type',
                        id: 15,
                        dictionary_entry_profiles: [
                            { profile_id: 3, cost_per_item: 32.3 },
                        ],
                    },
                ],
            },
        ], { parse: true });

        App.settings.filling_types.reset([
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
                                    { height: 2400, width: 3000, value: 10 },
                                ],
                            },
                            {
                                name: 'operable',
                                data: [
                                    { height: 500, width: 500, value: 11 },
                                    { height: 914, width: 1514, value: 10 },
                                    { height: 1200, width: 2400, value: 8 },
                                ],
                            },
                        ],
                    },
                ],
                pricing_scheme: 'PRICING_GRIDS',
            },
            {
                name: 'Economy Triple Glazed',
                type: 'glass',
                id: 19,
                filling_type_profiles: [
                    {
                        profile_id: 3,
                        pricing_equation_params: [
                            { name: 'fixed', param_a: 11, param_b: 39 },
                            { name: 'operable', param_a: 9, param_b: 62 },
                        ],
                    },
                ],
                pricing_scheme: 'LINEAR_EQUATION',
            },
        ], { parse: true });

        const unit = new Unit({
            width: 62,
            height: 96,
        });

        unit.profile = new Profile({
            id: 3,
            name: 'Nice and Cool Profile',
            unit_type: 'Window',
            pricing_scheme: 'PRICING_GRIDS',
            pricing_grids: [
                {
                    name: 'fixed',
                    data: [
                        { height: 500, width: 500, value: 50 },
                        { height: 914, width: 1514, value: 45 },
                        { height: 2400, width: 3000, value: 40 },
                    ],
                },
                {
                    name: 'operable',
                    data: [
                        { height: 500, width: 500, value: 70 },
                        { height: 914, width: 1514, value: 65 },
                        { height: 1200, width: 2400, value: 60 },
                    ],
                },
            ],
        }, { parse: true });

        unit.validateUnitOptions();
        unit.setFillingType(
            unit.get('root_section').id,
            App.settings.filling_types.at(0).get('type'),
            App.settings.filling_types.at(0).get('name'),
        );

        let sections_list = unit.getSectionsListWithEstimatedCost();
        let estimated_cost = unit.getEstimatedUnitCost();

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
            'Section total_cost is the combination of base, fillling and options cost',
        );

        //  Unit total cost
        equal(estimated_cost.total.toFixed(2), '357.19', 'Unit total cost is correct');
        equal(
            estimated_cost.total,
            estimated_cost.base + estimated_cost.fillings + estimated_cost.options,
            'Unit total cost is the combination of base, filllings and options cost',
        );

        //  ----------------------------------------------------------------
        //  Now set section type to operable, change filling type, and repeat calculations
        //  ----------------------------------------------------------------

        unit.setSectionSashType(unit.get('root_section').id, 'tilt_turn_left');
        unit.setFillingType(
            unit.get('root_section').id,
            App.settings.filling_types.at(1).get('type'),
            App.settings.filling_types.at(1).get('name'),
        );

        sections_list = unit.getSectionsListWithEstimatedCost();
        estimated_cost = unit.getEstimatedUnitCost();

        //  First section base cost
        equal(sections_list[0].price_per_square_meter.toFixed(2), '60.00', 'Section price_per_square_meter is correct');
        equal(sections_list[0].base_cost.toFixed(2), '230.40', 'Section base_cost is correct');

        //  First section filling cost
        equal(sections_list[0].filling_cost.toFixed(2), '96.56', 'Section filling_cost is correct');

        //  First section options cost
        equal(sections_list[0].options.length, 1, 'Section has one priced option');
        equal(sections_list[0].options[0].price_increase.toFixed(2), '10.00', 'First option price_increase is correct');
        equal(sections_list[0].options_cost.toFixed(2), '23.04', 'Section options_cost is correct');

        //  First section total cost
        equal(sections_list[0].total_cost.toFixed(2), '350.00', 'Section total_cost is correct');
        equal(
            sections_list[0].total_cost,
            sections_list[0].base_cost + sections_list[0].filling_cost + sections_list[0].options_cost,
            'Section total_cost is the combination of base, fillling and options cost',
        );

        //  Unit total cost (includes price for interior handle and opening restrictor)
        equal(estimated_cost.total.toFixed(2), '525.16', 'Unit total cost is correct');
        equal(
            estimated_cost.total,
            estimated_cost.base + estimated_cost.fillings + estimated_cost.options,
            'Unit total cost is the combination of base, filllings and options cost',
        );
    });
});
