/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-len:0 */
/* eslint max-statements:0 */

var m = app.utils.math;
app.no_backend = true;


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
            type: 'Casement',
            description: 'Tilt and turn inswing / fixed PVC',
            notes: 'Opening restriction cord included',
            internal_color: 'Dark grey matte laminate',
            external_color: 'Dark grey matte laminate',
            gasket_color: 'Black',
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
            type: 'Casement',
            description: 'Tilt and turn inswing / fixed PVC',
            notes: 'Opening restriction cord included',
            internal_color: 'Dark grey matte laminate',
            external_color: 'Dark grey matte laminate',
            gasket_color: 'Black',
            original_cost: 399,
            original_currency: 'EUR',
            conversion_rate: 0.90326078,
            price_markup: 2.3,
            uw: 0.77,
            glazing: '3Std U=.09 SGHC=.5',
            discount: 20
        },
        {
            mark: 'B1',
            width: 38,
            height: 24,
            quantity: 2,
            type: 'Casement ganged to fixed',
            description: 'Tilt and turn inswing above / removable ac sash below. PVC',
            notes: 'Opening restriction cord included',
            internal_color: 'Dark grey matte laminate',
            external_color: 'Dark grey matte laminate',
            gasket_color: 'Black',
            original_cost: 279,
            original_currency: 'EUR',
            conversion_rate: 0.90326078,
            price_markup: 2.3,
            uw: 0.78,
            glazing: '3Std U=.09 SGHC=.5',
            discount: 20
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
            description: 'Hidden costs for dealing with annoying client',
            quantity: 1,
            original_cost: 2000,
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
    equal(current_project.extras.getHiddenPrice().toFixed(2), '2000.00', 'Subtotal for hidden extras is expected to be 2000.00');
    equal(current_project.extras.getShippingPrice().toFixed(2), '1500.00', 'Subtotal for shipping is expected to be 1500.00');

    //  Hidden multiplier
    equal(current_project.getHiddenMultiplier().toFixed(5), '2.02592', 'Hidden multiplier is expected to be 2.02592');

    //  End prices for the whole project
    var total_prices = current_project.getTotalPrices();
    equal(total_prices.subtotal_units.toFixed(2), '1949.47', 'Subtotal price for units is expected to be 1949.47');
    equal(total_prices.subtotal_units_with_hidden.toFixed(2), '3949.47', 'Subtotal price for units with hidden cost is expected to be 3949.47');
    equal(total_prices.subtotal_extras.toFixed(2), '1629.26', 'Subtotal price for extras is expected to be 1629.26');
    equal(total_prices.subtotal.toFixed(2), '5578.73', 'Subtotal price for the whole order is expected to be 5578.73');
    equal(total_prices.shipping.toFixed(2), '1500.00', 'Shipping is expected to be 1500.00');
    equal(total_prices.tax.toFixed(2), '1673.62', 'Tax is expected to be 1673.62');
    equal(total_prices.grand_total.toFixed(2), '8752.35', 'Grand total is expected to be 8752.35');

    //  Individual price calculation functions should match with `total_prices`
    equal(total_prices.subtotal_units, current_project.getSubtotalUnitsPrice(), 'getSubtotalUnitsPrice result should match total_prices.subtotal_units');
    equal(total_prices.subtotal_units_with_hidden, current_project.getSubtotalUnitsPrice() + current_project.getHiddenPrice(),
        'getSubtotalUnitsPrice + getHiddenPrice result should match total_prices.subtotal_units_with_hidden');
    equal(total_prices.subtotal_extras, current_project.getExtrasPrice(), 'getExtrasPrice result should match total_prices.subtotal_extras');
    equal(total_prices.subtotal, current_project.getSubtotalPrice(), 'getSubtotalPrice result should match total_prices.subtotal');
});


//  ------------------------------------------------------------------------
//  Test that estimated prices for a unit are calculated properly
//  ------------------------------------------------------------------------

test('estimated unit prices', function () {
    var unit;
    var root_id;
    var full_root;
    var top_section;
    var bottom_section;
    var sections_list;

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

});
