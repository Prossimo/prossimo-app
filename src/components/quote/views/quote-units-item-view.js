import _ from 'underscore';
import Marionette from 'backbone.marionette';

import App from '../../../main';
import { convert, format } from '../../../utils';
import template from '../templates/quote-units-item-view.hbs';
import { getResponsiveMode, getPreviewSize } from '../../../utils/quote-helpers';

export default Marionette.View.extend({
    tagName: 'div',
    className() {
        return `quote-item ${this.model.getRelation()}`;
    },
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
        const show_customer_description = this.display_options.show_customer_image_and_description !== false;
        const project_settings = App.settings.getProjectSettings();

        //  This is the list of params that we want to see in the quote. We
        //  throw out attributes that don't apply to the current unit
        const params_list = _.filter(
            ['rough_opening', 'description', 'opening_direction'],
            (param) => {
                let condition = true;

                if (this.model.isOperableOnlyAttribute(param) && !this.model.hasOperableSections()) {
                    condition = false;
                }

                if (param === 'description' && !show_customer_description) {
                    condition = false;
                }

                return condition;
            }, this);
        const source_hash = this.model.getNameTitleTypeHash(params_list);

        //  Now get list of Unit Options applicable for this unit
        const dictionaries = _.map(App.settings.dictionaries.filter((dictionary) => {
            const rules_and_restrictions = dictionary.get('rules_and_restrictions');
            let is_restricted = false;

            _.each(rules_and_restrictions, (rule) => {
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
            (dictionary_name) => {
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

        return _.map(name_title_hash, (item, key) => ({
            name: key,
            title: item,
            value: params_source[key] !== undefined ?
                params_source[key] : this.model.get(key),
        }));
    },
    /**
     * Get types of all sashes, and group them by type, so we could display
     * something like this:
     *
     * 'Sash # 1: Tilt-turn Left Hinge' or 'All Sashes: Fixed'
     *
     * @return {Array} an array of objects like {
     *     group_title: 'All Sashes',
     *     type: 'Fixed',
     * }
     */
    getSashTypes() {
        const sash_list_source = this.model.getSashList(null, null, this.display_options.show_outside_units_view &&
            this.display_options.show_european_hinge_indicators === false);

        //  Group sashes by type, and sort them by min sash id
        const types = sash_list_source.map((source_item, index) => ({
            key: source_item.type,
            index: index + 1,
        })).reduce((memo, item) => {
            const new_memo = memo;
            let target_group = new_memo.find(group => group.type === item.key);

            if (!target_group) {
                target_group = { type: item.key, entries: [] };
                new_memo.push(target_group);
            }

            target_group.entries.push(item.index);

            return new_memo;
        }, []).sort((a, b) => _.min(a.entries) - _.min(b.entries));

        //  Return properly formatted values
        return types.map((item) => {
            let group_title = item.entries.length === 1 ?
                `Sash <em>#</em>${item.entries[0]}` :
                `Sashes <em>#</em>${item.entries.join(', ')}`;

            if (types.length === 1) {
                group_title = 'All Sashes';
            }

            return {
                group_title,
                type: item.type,
            };
        });
    },
    /**
     * Get glazing names of all sashes, and group them by name, so we could
     * display something like this:
     *
     * 'Sashes # 1.1, 1.2: Glass' or 'All Sashes: Triple Low Gain - Tempered'
     *
     * @return {Array} an array of objects like {
     *     group_title: 'All Sashes',
     *     name: 'Triple Low Gain - Tempered',
     *     type: 'Glass',
     * }
     */
    getGlazingNames() {
        const sash_list_source = this.model.getSashList(null, null, this.display_options.show_outside_units_view &&
            this.display_options.show_european_hinge_indicators === false);

        //  Group sashes by glazing name, and sort them by min sash id
        const glazing_names = sash_list_source.map((source_item, index) => ({
            name: source_item.filling.name,
            sections: source_item.sections,
            index: index + 1,
        })).reduce((memo, item) => {
            const new_memo = memo;

            if (item.sections && item.sections.length > 0) {
                item.sections.forEach((section, section_index) => {
                    let target_group = new_memo.find(group => group.name === section.filling.name);

                    if (!target_group) {
                        target_group = { name: section.filling.name, entries: [] };
                        new_memo.push(target_group);
                    }

                    target_group.entries.push(`${item.index}.${section_index + 1}`);
                });
            } else {
                let target_group = new_memo.find(group => group.name === item.name);

                if (!target_group) {
                    target_group = { name: item.name, entries: [] };
                    new_memo.push(target_group);
                }

                target_group.entries.push(item.index);
            }

            return new_memo;
        }, []).sort((a, b) => _.min(a.entries) - _.min(b.entries));

        //  Return properly formatted values
        return glazing_names.map((item) => {
            let group_title = item.entries.length === 1 ?
                `Sash <em>#</em>${item.entries[0]}` :
                `Sashes <em>#</em>${item.entries.join(', ')}`;

            if (glazing_names.length === 1) {
                group_title = 'All Sashes';
            }

            return {
                group_title,
                name: item.name,
            };
        });
    },
    getCustomerImage() {
        return this.model.get('customer_image');
    },
    getProductImage() {
        const position = this.display_options.show_outside_units_view ? 'outside' : 'inside';
        const responsive_mode = this.getResponsiveMode();
        const title = position === 'inside' ? 'View from Interior' : 'View from Exterior';
        const is_subunit = this.model.isSubunit();
        const preview_size = getPreviewSize({
            type: 'drawing',
            mode: responsive_mode,
            has_customer_image: this.shouldShowCustomerImage() && this.getCustomerImage(),
        });

        return {
            img: this.model.getPreview({
                width: preview_size.width,
                height: preview_size.height,
                mode: 'base64',
                position,
                drawNeighbors: is_subunit,
                topOffset: is_subunit ? 50 : 0,
                hingeIndicatorMode: this.display_options.show_european_hinge_indicators ? 'european' : 'american',
            }),
            title,
        };
    },
    /**
     * We determine a mode to draw a quote entry for this unit
     * @see getResponsiveMode() from quote helpers
     *
     * @return {string} Unit drawing mode
     */
    getResponsiveMode() {
        return getResponsiveMode({
            width_mm: this.model.getWidthMM(),
            height_mm: this.model.getHeightMM(),
        });
    },
    shouldShowCustomerImage() {
        return this.display_options.show_customer_image_and_description !== false &&
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
            is_subunit: this.model.isSubunit(),
            ref_num: this.model.getRefNum(),
            mark: this.model.getMark(),
            responsive_mode: this.getResponsiveMode(),
            description_separate_row: this.getResponsiveMode() === 'extrawide',
            description_params: this.getDescription(),
            sash_types: this.getSashTypes(),
            glazing_names: this.getGlazingNames(),
            notes: this.model.get('notes'),
            exceptions: this.model.get('exceptions'),
            quantity: this.model.getQuantity(),
            customer_image: show_customer_image ? this.getCustomerImage() : '',
            product_image: show_drawings ? this.getProductImage() : '',
            show_price,
            price: show_price ? this.getPrices() : null,
            has_dummy_profile: this.model.hasDummyProfile(),
            profile_name: this.model.get('profile_name') || this.model.get('profile_id') || '',
        };
    },
    initialize() {
        this.display_options = this.options.display_options;
        this.listenTo(this.model, 'change', this.render);
    },
});
