var app = app || {};

$(document).ready(function () {
    'use strict';

    var test_project = new app.Project({
        id: 9999,
        client_name: 'Andy Huh',
        client_company_name: 'Fentrend',
        client_phone: '917.468.0506',
        client_email: 'ben@prossimo.us',
        client_address: '98 4th Street Suite 213 Brooklyn, NY 11231',
        project_name: 'Italian Market (Local, no backend)',
        project_address: '827 Carpenter Lane Philadelphia, PA',
        no_backend: true
    });

    test_project.files.add([
        {
            name: 'developer-specs-REV1_2_Public.pdf',
            type: 'pdf',
            url: '/test/pdf/developer-specs-REV1_2_Public.pdf'
        },
        {
            name: 'helloworld.pdf',
            type: 'pdf',
            url: '/test/pdf/helloworld.pdf'
        }
    ]);

    test_project.units.add([
        {
            mark: 'A',
            width: 62,
            height: 96,
            quantity: 1,
            glazing_bar_width: 20,
            type: 'Casement',
            description: 'Tilt and turn inswing / fixed PVC',
            notes: 'Opening restriction cord included',
            profile_name: 'Default Profile (test)',
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
            customer_image: app.test_images['1'].url
        },
        {
            mark: 'B1',
            width: 36,
            height: 78,
            quantity: 2,
            glazing_bar_width: 20,
            type: 'Casement ganged to fixed',
            description: 'Tilt and turn inswing above / removable ac sash below. PVC',
            notes: 'Opening restriction cord included',
            profile_name: 'Alternative Profile (test)',
            internal_color: 'Dark grey matte laminate',
            external_color: 'Dark grey matte laminate',
            gasket_color: 'Black',
            original_cost: 279,
            original_currency: 'EUR',
            conversion_rate: 0.90326078,
            price_markup: 2.3,
            uw: 0.78,
            glazing: '3Std U=.09 SGHC=.5',
            discount: 20,
            customer_image: app.test_images['2'].url
        }
    ]);

    test_project.extras.add([
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


    app.projects.add(test_project);
});
