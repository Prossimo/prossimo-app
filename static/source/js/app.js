var app = app || {};

$(document).ready(function () {
    'use strict';

    app.router = new app.AppRouter();

    //  Register a communication channel for all events in the app
    app.vent = {};
    _.extend(app.vent, Backbone.Events);

    //  Object to hold project-independent properties
    app.settings = new app.Settings();

    app.settings.profiles.add([
        {
            name: 'Default Profile',
            frameWidth: 70,
            mullionWidth: 92,
            sashFrameWidth: 82,
            sashFrameOverlap: 34,
            sashMullionOverlap: 12,
            system: 'Gealan S9000'
        },
        {
            name: 'Alternative Profile',
            frameWidth: 90,
            mullionWidth: 112,
            sashFrameWidth: 102,
            sashFrameOverlap: 36,
            sashMullionOverlap: 14,
            system: 'Gealan S9000'
        }
    ]);

    app.current_project = new app.Project({
        client_name: 'Andy Huh',
        client_company_name: 'Fentrend',
        client_phone: '917.468.0506',
        client_email: 'ben@prossimo.us',
        client_address: '98 4th Street Suite 213 Brooklyn, NY 11231',
        project_name: 'Italian Market',
        project_address: '827 Carpenter Lane Philadelphia, PA'
    });

    app.current_project.units.add([
        {
            mark: 'A',
            width: 62,
            height: 96,
            quantity: 1,
            type: 'Casement',
            description: 'Tilt and turn inswing / fixed PVC',
            notes: 'Opening restriction cord included',
            profile_name: 'Default Profile',
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
            width: 36,
            height: 78,
            quantity: 2,
            type: 'Casement ganged to fixed',
            description: 'Tilt and turn inswing above / removable ac sash below. PVC',
            notes: 'Opening restriction cord included',
            profile_name: 'Default Profile',
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

    app.current_project.extras.add([
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

    app.main_region = new Marionette.Region({
        el: '#main'
    });

    app.main_navigation = new app.MainNavigationView({
        docs_import: {
            title: 'Docs',
            path: 'docs',
            icon_name: 'file',
            showCallback: function () {
                app.main_region.show(new app.MainDocsImportView());
            }
        },
        drawing: {
            title: 'Drawing',
            path: 'drawing',
            icon_name: 'pencil',
            showCallback: function () {
                app.main_region.show(new app.MainDrawingView());
            }
        },
        quote: {
            title: 'Quote',
            path: 'quote',
            icon_name: 'shopping-cart',
            showCallback: function () {
                app.main_region.show(new app.MainQuoteView());
            }
        },
        supplier_request: {
            title: 'Supplier',
            path: 'supplier',
            icon_name: 'send',
            showCallback: function () {
                app.main_region.show(new app.MainSupplierRequestView());
            }
        },
        settings: {
            title: 'Settings',
            path: 'settings',
            icon_name: 'cog',
            showCallback: function () {
                app.main_region.show(new app.MainSettingsView());
            }
        }
    });

    Backbone.history.start({ pushState: true });
    app.paste_image_helper = new app.PasteImageHelper();

    if ( Backbone.history.fragment === '' ) {
        app.router.navigate('/docs/', { trigger: true });
    }
});
