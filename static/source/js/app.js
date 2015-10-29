var app = app || {};

$(document).ready(function () {
    'use strict';

    app.router = new app.AppRouter();

    //  Register a communication channel for all events in the app
    app.vent = {};
    _.extend(app.vent, Backbone.Events);

    app.current_project = new app.Project({
        client_name: 'Andy Huh',
        client_company_name: 'Fentrend',
        client_phone: '917.468.0506',
        client_email: 'ben@prossimo.us',
        client_address: '98 4th Street Suite 213 Brooklyn, NY 11231',
        project_name: 'Italian Market',
        project_address: '827 Carpenter Lane Philadelphia, PA'
    });

    app.current_project.windows.add([
        {
            mark: 'A',
            width: 30,
            height: 40,
            quantity: 1,
            type: 'Casement',
            description: 'Tilt and turn inswing / fixed PVC',
            notes: 'Opening restriction cord included',
            system: 'Gealan S9000',
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
            system: 'Gealan S9000',
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

    app.main_region = new Marionette.Region({
        el: '#main'
    });

    app.main_docs_import_view = new app.MainDocsImportView();
    app.main_drawing_view = new app.MainDrawingWindowsView();
    app.main_quote_view = new app.MainQuoteView();

    app.main_navigation = new app.MainNavigationView({
        docs_import: {
            title: 'Docs',
            path: 'docs',
            icon_name: 'file',
            showCallback: function () {
                app.main_region.show(app.main_docs_import_view, { preventDestroy: true });
            }
        },
        drawing_windows: {
            title: 'Drawing',
            path: 'drawing',
            icon_name: 'pencil',
            showCallback: function () {
                app.main_region.show(app.main_drawing_view, { preventDestroy: true });
            }
        },
        quote: {
            title: 'Quote',
            path: 'quote',
            icon_name: 'shopping-cart',
            showCallback: function () {
                app.main_region.show(app.main_quote_view, { preventDestroy: true });
            }
        }
    });

    Backbone.history.start({ pushState: true });
    app.paste_image_helper = new app.PasteImageHelper();

    if ( Backbone.history.fragment === '' ) {
        app.router.navigate('/docs/', { trigger: true });
    }
});
