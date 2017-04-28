import _ from 'underscore';
import Marionette from 'backbone.marionette';

import App from '../../../main';
import { convert, format, math } from '../../../utils';
import { preview } from '../../drawing/module/drawing-module';
import template from '../templates/quote-item-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'quote-item',
    template,
    initialize() {
        this.display_options = this.options.display_options;
        this.listenTo(this.model, 'change', this.render);
    },
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
        const view = this;
        const project_settings = App.settings.getProjectSettings();

        //  TODO: this name is a bit misleading
        function getFillingPerimeter(width, height) {
            return view.display_options.show_sizes_in_mm ?
                format.dimensions_mm(width, height) :
                format.dimensions(
                    convert.mm_to_inches(width),
                    convert.mm_to_inches(height),
                    'fraction',
                    'inches_only',
                );
        }

        function getFillingArea(width, height, suffix_format) {
            suffix_format = suffix_format || 'sup';

            const result = view.display_options.show_sizes_in_mm ?
                format.square_meters(math.square_meters(width, height)) :
                format.square_feet(math.square_feet(convert.mm_to_inches(width),
                    convert.mm_to_inches(height)), 2, suffix_format);

            return result;
        }

        function getFillingSize(width, height) {
            const filling_size = getFillingPerimeter(width, height);
            const filling_area = getFillingArea(width, height);

            return `${filling_size} (${filling_area})`;
        }

        function getSectionInfo(source) {
            const result = {};

            result.filling_is_glass = source.filling.type === 'glass';
            result.filling_name = source.filling.name;
            result.filling_size = getFillingSize(source.filling.width, source.filling.height);

            //  Show supplier name for filling if it exists
            if (view.display_options.show_supplier_names && App.settings && source.filling && source.filling.name) {
                const filling_type = App.settings.filling_types.getByName(source.filling.name);

                if (filling_type && filling_type.get('supplier_name')) {
                    result.filling_name = filling_type.get('supplier_name');
                }
            }

            return result;
        }

        const sash_list_source = this.model.getSashList(null, null, this.display_options.show_outside_units_view &&
            this.display_options.show_european_hinge_indicators === false);
        const sashes = [];

        //  This is the list of params that we want to see in the quote. We
        //  throw out attributes that don't apply to the current unit
        const params_list = _.filter(
            ['rough_opening', 'description', 'opening_direction'],
            function (param) {
                let condition = true;

                if (this.model.isOperableOnlyAttribute(param) && !this.model.hasOperableSections()) {
                    condition = false;
                }

                return condition;
            }, this);
        const source_hash = this.model.getNameTitleTypeHash(params_list);

        //  Add section for each sash (Sash #N title + sash properties)
        _.each(sash_list_source, function (source_item, index) {
            const sash_item = {};
            let opening_size_data;
            let egress_opening_size_data;
            let section_info;

            sash_item.name = `Sash #${index + 1}`;
            sash_item.type = source_item.type;

            if (source_item.opening.height && source_item.opening.width) {
                opening_size_data = this.model.getSashOpeningSize(
                    source_item.opening,
                    undefined,
                    undefined,
                    this.display_options.show_sizes_in_mm ? 'mm' : 'inches',
                );

                if (opening_size_data) {
                    sash_item.opening_size = this.display_options.show_sizes_in_mm ?
                        format.dimensions_and_area_mm(
                            opening_size_data.width,
                            opening_size_data.height,
                            opening_size_data.area,
                        ) :
                        format.dimensions_and_area(
                            opening_size_data.width,
                            opening_size_data.height,
                            undefined,
                            undefined,
                            opening_size_data.area,
                        );
                }

                egress_opening_size_data = this.model.getSashOpeningSize(
                    source_item.opening,
                    'egress',
                    source_item.original_type,
                    this.display_options.show_sizes_in_mm ? 'mm' : 'inches',
                );

                if (egress_opening_size_data) {
                    sash_item.egress_opening_size = this.display_options.show_sizes_in_mm ?
                        format.dimensions_and_area_mm(
                            egress_opening_size_data.width,
                            egress_opening_size_data.height,
                            egress_opening_size_data.area,
                        ) :
                        format.dimensions_and_area(
                            egress_opening_size_data.width,
                            egress_opening_size_data.height,
                            undefined,
                            undefined,
                            egress_opening_size_data.area,
                        );
                }
            }

            //  Child sections
            if (source_item.sections.length) {
                let sum = 0;

                sash_item.sections = [];

                _.each(source_item.sections, (section, s_index) => {
                    const section_item = {};

                    section_item.name = `Section #${index + 1}.${s_index + 1}`;
                    section_info = getSectionInfo(section);
                    _.extend(section_item, section_info);

                    if (section_info.filling_is_glass) {
                        sum += parseFloat(getFillingArea(section.filling.width,
                            section.filling.height, 'numeric'));
                    }

                    sash_item.sections.push(section_item);
                }, this);

                sash_item.daylight_sum = sum ? format.square_feet(sum, 2, 'sup') : false;
            } else {
                section_info = getSectionInfo(source_item);
                _.extend(sash_item, section_info);
            }

            sashes.push(sash_item);
        }, this);

        //  Now get list of Unit Options applicable for this unit
        const dictionaries = _.map(App.settings.dictionaries.filter(function (dictionary) {
            const rules_and_restrictions = dictionary.get('rules_and_restrictions');
            let is_restricted = false;

            _.each(rules_and_restrictions, function (rule) {
                const restriction_applies = this.model.checkIfRestrictionApplies(rule);

                if (restriction_applies) {
                    is_restricted = true;
                }
            }, this);

            return !is_restricted;
        }, this), filtered_dictionary => filtered_dictionary.get('name'), this);

        //  Here we form the final list of properties to be shown in the
        //  Product Description column in the specific order. We do it in
        //  four steps:
        //  1. Add Size, Rough Opening and System (or Supplier System)
        //  2. Add properties from the source_hash object, which contains
        //  only those unit attributes that apply to the current unit
        //  3. Add list of Unit Options that apply to the current unit
        //  4. Add Threshold and U Value.
        const name_title_hash = _.extend({
            size: 'Size <small class="size-label">WxH</small>',
            rough_opening: 'Rough Opening <small class="size-label">WxH</small>',
            system: 'System',
        }, _.object(_.pluck(source_hash, 'name'), _.pluck(source_hash, 'title')),
        _.object(dictionaries, dictionaries), {
            threshold: 'Threshold',
            u_value: 'U Value',
        });

        let params_source = {
            system: this.display_options.show_supplier_names ?
                this.model.profile.get('supplier_system') :
                this.model.profile.get('system'),
            size: this.display_options.show_sizes_in_mm ?
                format.dimensions_mm(convert.inches_to_mm(this.model.get('width')), convert.inches_to_mm(this.model.get('height'))) :
                format.dimensions(this.model.get('width'), this.model.get('height'), 'fraction',
                    project_settings && project_settings.get('inches_display_mode')),
            threshold: this.model.profile.isThresholdPossible() ?
                this.model.profile.getThresholdType() : false,
            u_value: this.model.get('uw') ? format.fixed(this.model.getUValue(), 3) : false,
            rough_opening: this.display_options.show_sizes_in_mm ?
                format.dimensions_mm(convert.inches_to_mm(this.model.getRoughOpeningWidth()),
                    convert.inches_to_mm(this.model.getRoughOpeningHeight())) :
                format.dimensions(this.model.getRoughOpeningWidth(), this.model.getRoughOpeningHeight(),
                    null, project_settings.get('inches_display_mode') || null),
        };

        //  Extend unit attributes with options
        params_source = _.extend({}, params_source, _.object(dictionaries, _.map(dictionaries,
            function (dictionary_name) {
                const dictionary_id = App.settings.dictionaries.getDictionaryIdByName(dictionary_name);
                const is_dictionary_hidden = App.settings.dictionaries.get(dictionary_id).get('is_hidden');
                const current_options = dictionary_id ?
                    this.model.getCurrentUnitOptionsByDictionaryId(dictionary_id) : [];

                if (is_dictionary_hidden) {
                    return false;
                }

                //  We assume that we have only one option per dictionary,
                //  although in theory it's possible to have multiple
                const option_name = current_options.length ? (
                    (this.display_options.show_supplier_names && current_options[0].entry.get('supplier_name')) ||
                    current_options[0].entry.get('name')
                ) : false;

                return option_name;
            }, this),
        ));

        const params = _.map(name_title_hash, function (item, key) {
            return {
                name: key,
                title: item,
                value: params_source[key] !== undefined ?
                    params_source[key] : this.model.get(key),
            };
        }, this);

        return {
            sashes,
            params,
        };
    },
    getCustomerImage() {
        return this.model.get('customer_image');
    },
    getProductImage(is_alternative) {
        const position = this.display_options.show_outside_units_view ?
            (!is_alternative ? 'outside' : 'inside') :
            (!is_alternative ? 'inside' : 'outside');
        const preview_size = 600;
        const title = position === 'inside' ? 'View from Interior' : 'View from Exterior';

        return {
            img: preview(this.model, {
                width: preview_size,
                height: preview_size,
                mode: 'base64',
                position,
                hingeIndicatorMode: this.display_options.show_european_hinge_indicators ? 'european' : 'american',
            }),
            title,
        };
    },
    shouldShowCustomerImage() {
        return this.display_options.show_customer_image !== false &&
            this.model.collection && this.model.collection.hasAtLeastOneCustomerImage();
    },
    shouldShowDrawings() {
        const project_settings = App.settings && App.settings.getProjectSettings();
        const show_drawings = !project_settings || project_settings.get('show_drawings_in_quote');

        return show_drawings;
    },
    templateContext() {
        const show_customer_image = this.shouldShowCustomerImage();
        const show_drawings = this.shouldShowDrawings();
        const show_price = this.display_options.show_price !== false;

        return {
            position: parseFloat(this.model.get('position')) + 1,
            mark: this.model.get('mark'),
            description: this.getDescription(),
            notes: this.model.get('notes'),
            exceptions: this.model.get('exceptions'),
            quantity: this.model.get('quantity'),
            customer_image: show_customer_image ? this.getCustomerImage() : '',
            product_image: show_drawings ? this.getProductImage() : '',
            show_price,
            price: show_price ? this.getPrices() : null,
            has_dummy_profile: this.model.hasDummyProfile(),
            profile_name: this.model.get('profile_name') || this.model.get('profile_id') || '',
        };
    },
});
