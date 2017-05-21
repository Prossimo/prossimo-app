import Marionette from 'backbone.marionette';

import App from '../../../main';
import QuoteUnitsTableView from './quote-units-table-view';
import { convert, format } from '../../../utils';
import template from '../templates/quote-multiunits-item-view.hbs';

export default Marionette.View.extend({
    className: 'quote-unit-group multiunit',
    template,
    getPrices() {
        const unit_price = this.model.getUnitPrice();
        const subtotal_price = this.model.getSubtotalPrice();
        const discount = this.model.get('discount');
        const unit_price_discounted = this.model.getUnitPriceDiscounted();
        const subtotal_price_discounted = this.model.getSubtotalPriceDiscounted();

        return {
            unit: format.price_usd(unit_price),
            subtotal: format.price_usd(subtotal_price),
            discount: discount ? format.percent(discount) : null,
            unit_discounted: discount ? format.price_usd(unit_price_discounted) : null,
            subtotal_discounted: discount ? format.price_usd(subtotal_price_discounted) : null,
        };
    },
    getDescription() {
        const project_settings = App.settings.getProjectSettings();
        const subunits = this.model.get('multiunit_subunits').map((subunit_link) => {
            const subunit = subunit_link.getUnit();
            const size = this.display_options.show_sizes_in_mm ?
                format.dimensions_mm(convert.inches_to_mm(subunit.get('width')), convert.inches_to_mm(subunit.get('height'))) :
                format.dimensions(subunit.get('width'), subunit.get('height'), 'fraction',
                    project_settings && project_settings.get('inches_display_mode'));

            return {
                ref_num: subunit.getRefNum(),
                mark: subunit.getMark(),
                size,
                description: subunit.get('description'),
                notes: subunit.get('notes'),
            };
        }, this);

        const params = {
            size: {
                title: 'Size <small class="size-label">WxH</small>',
                value: this.display_options.show_sizes_in_mm ?
                    format.dimensions_mm(convert.inches_to_mm(this.model.getWidth()), convert.inches_to_mm(this.model.getHeight())) :
                    format.dimensions(this.model.getWidth(), this.model.getHeight(), 'fraction'),
            },
            description: {
                title: this.model.getTitles(['description'])[0],
                value: this.model.get('description'),
            },
        };

        return {
            params,
            subunits,
        };
    },
    shouldShowDrawings() {
        const project_settings = App.settings && App.settings.getProjectSettings();
        const show_drawings = !project_settings || project_settings.get('show_drawings_in_quote');

        return show_drawings;
    },
    shouldShowCustomerImage() {
        return this.display_options.show_customer_image !== false &&
            this.model.collection && this.model.collection.hasAtLeastOneCustomerImage();
    },
    getCustomerImage() {
        return this.model.get('customer_image');
    },
    getProductImage() {
        const position = this.display_options.show_outside_units_view ? 'outside' : 'inside';
        const preview_size = 600;
        const title = position === 'inside' ? 'View from Interior' : 'View from Exterior';

        return {
            img: this.model.getPreview({
                width: preview_size,
                height: preview_size,
                mode: 'base64',
                position,
                hingeIndicatorMode: this.display_options.show_european_hinge_indicators ? 'european' : 'american',
            }),
            title,
        };
    },
    templateContext() {
        const show_customer_image = this.shouldShowCustomerImage();
        const show_drawings = this.shouldShowDrawings();
        const show_price = this.display_options.show_price !== false;

        return {
            ref_num: this.model.getRefNum(),
            mark: this.model.get('mark'),
            description: this.getDescription(),
            notes: this.model.get('notes'),
            quantity: this.model.get('quantity'),
            customer_image: show_customer_image ? this.getCustomerImage() : '',
            product_image: show_drawings ? this.getProductImage() : '',
            show_price,
            price: show_price ? this.getPrices() : null,
        };
    },
    regions: {
        subunits_container: {
            el: '.subunits-container',
        },
    },
    onRender() {
        this.showChildView('subunits_container', new QuoteUnitsTableView({
            project: this.options.project,
            quote: this.options.quote,
            collection: this.options.units,
            filter: child => child.isSubunitOf(this.model),
            display_options: this.display_options,
        }));
    },
    initialize() {
        this.display_options = this.options.display_options;
        this.listenTo(this.model, 'change', this.render);
    },
});
