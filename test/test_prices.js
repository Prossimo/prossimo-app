//  Test that QUnit is working
test('basic test', function () {
    ok(true, "Passed.");
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
    ok(_.isArray(current_project.windows.models), 'Windows collection should be an array');
    equal(current_project.windows.models.length, 0, 'Windows collection shoud have no items');
    ok(_.isArray(current_project.extras.models), 'Extras collection should be an array');
    equal(current_project.extras.models.length, 0, 'Extras collection shoud have no items');
});


//  ------------------------------------------------------------------------
//  Test that prices for a single Window model are calculated properly
//  ------------------------------------------------------------------------

test('single window tests', function () {
    var current_project = new app.Project();

    current_project.windows.add([
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
        }
    ]);

    var first_window = current_project.windows.first();

    equal(first_window.get('mark'), 'A', 'Unit mark is expected to be A');
    equal(first_window.get('original_cost'), 399, 'Unit original cost is expected to be 399');

    equal(first_window.getUnitCost().toFixed(2), '441.73', 'Unit cost converted to USD is expected to be 441.73');
    equal(first_window.getUnitPrice().toFixed(2), '1015.99', 'Unit end price is expected to be 1015.99');
    equal(first_window.getSubtotalPrice(), first_window.getUnitPrice(), 'Price should be same for a single unit and for subtotal');
    equal(first_window.getUnitPriceDiscounted().toFixed(2), '812.79', 'Price with discount is expected to be 812.79');
    equal(first_window.getSubtotalPriceDiscounted(), first_window.getUnitPriceDiscounted(), 'Discounted price should be same for a single unit and for subtotal');
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

    current_project.windows.add([
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

    //  End prices for windows
    equal(current_project.windows.getSubtotalPrice().toFixed(2), '2436.84', 'Subtotal for windows is expected to be 2436.84');
    equal(current_project.windows.getSubtotalPriceDiscounted().toFixed(2), '1949.47', 'Subtotal w/Discount for windows is expected to be 1949.47');

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
});
