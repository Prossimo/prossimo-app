import $ from 'jquery';
import _ from 'underscore';
import Marionette from 'backbone.marionette';

import App from '../../../main';
import { math, format, convert } from '../../../utils';
import constants from '../../../constants';
import template from '../templates/drawing-sidebar-unit-details-view.hbs';

const UNSET_VALUE = '--';
const PRICING_SCHEME_PRICING_GRIDS = constants.PRICING_SCHEME_PRICING_GRIDS;

export default Marionette.View.extend({
    tagName: 'div',
    className: 'drawing-sidebar-unit-details',
    template,
    ui: {
        $tab_container: '.tab-container',
    },
    events: {
        'click .nav-tabs a': 'onTabClick',
    },
    keyShortcuts: {
        pageup: 'goToPrevTab',
        pagedown: 'goToNextTab',
    },
    initialize() {
        this.tabs = {
            unit_properties: {
                title: 'Unit',
            },
            profile_properties: {
                title: 'Profile',
            },
            unit_stats: {
                title: 'Unit Stats',
            },
            unit_estimated_cost: {
                title: 'Est. Cost',
            },
        };
        this.active_tab = 'unit_properties';
    },
    setActiveTab(tab_name) {
        if (_.contains(_.keys(this.tabs), tab_name)) {
            this.active_tab = tab_name;
        }
    },
    onTabClick(e) {
        const target = $(e.target).attr('href').replace('#', '');

        e.preventDefault();
        this.setActiveTab(target);
        this.render();
    },
    goToNextTab() {
        const tabs = _.keys(this.tabs);
        const next_tab = tabs[_.indexOf(tabs, this.active_tab) + 1] || tabs[0];

        this.setActiveTab(next_tab);
        this.render();
    },
    goToPrevTab() {
        const tabs = _.keys(this.tabs);
        const prev_tab = tabs[_.indexOf(tabs, this.active_tab) - 1] || _.last(tabs);

        this.setActiveTab(prev_tab);
        this.render();
    },
    getUnitImage() {
        return this.model.get('customer_image') || null;
    },
    getUnitProperties() {
        const project_settings = App.settings.getProjectSettings();
        let unit_properties = [];
        let params_source = {};

        const relevant_properties = [
            'ref_num', 'mark', 'width', 'height', 'description', 'notes', 'exceptions',
            'uw', 'glazing', 'opening_direction', 'glazing_bar_width',
        ];

        const custom_titles = {
            ref_num: 'Ref #',
        };

        params_source = {
            ref_num: this.model.getRefNum(),
            width: format.dimension(this.model.get('width'), null,
                project_settings && project_settings.get('inches_display_mode')),
            height: format.dimension(this.model.get('height'), null,
                project_settings && project_settings.get('inches_display_mode')),
        };

        unit_properties = _.map(relevant_properties, (prop_name) => {
            const title = custom_titles[prop_name] || this.model.getTitles([prop_name])[0];
            let value = params_source[prop_name] || this.model.get(prop_name);

            if (
                this.model.isOperableOnlyAttribute(prop_name) && !this.model.hasOperableSections()
            ) {
                value = '(Operable Only)';
            } else if (
                this.model.isGlazingBarProperty(prop_name) && !this.model.hasGlazingBars()
            ) {
                value = '(Has no Bars)';
            }

            return {
                title: title || '',
                value: value || '',
            };
        }, this).filter(property => !_.isUndefined(property.value));

        return unit_properties;
    },
    getUnitOptions() {
        const options_list = App.settings.dictionaries.getAvailableDictionaryNames();
        let has_hidden_options = false;
        let unit_options = [];

        unit_options = _.map(options_list, function (dictionary_name) {
            const dictionary_id = App.settings.dictionaries.getDictionaryIdByName(dictionary_name);
            let rules_and_restrictions;
            let is_hidden = false;
            let value = '(None)';
            let is_restricted = false;
            let current_options = [];

            if (dictionary_id) {
                rules_and_restrictions = App.settings.dictionaries.get(dictionary_id).get('rules_and_restrictions');
                is_hidden = App.settings.dictionaries.get(dictionary_id).get('is_hidden');
            }

            _.each(rules_and_restrictions, function (rule) {
                const restriction_applies = this.model.checkIfRestrictionApplies(rule);

                if (restriction_applies && rule === 'DOOR_ONLY') {
                    is_restricted = true;
                    value = '(Doors Only)';
                } else if (restriction_applies && rule === 'OPERABLE_ONLY') {
                    is_restricted = true;
                    value = '(Operable Only)';
                } else if (restriction_applies && rule === 'GLAZING_BARS_ONLY') {
                    is_restricted = true;
                    value = '(Has no Bars)';
                }
            }, this);

            if (!is_restricted) {
                current_options = dictionary_id ? this.model.getCurrentUnitOptionsByDictionaryId(dictionary_id) : [];
                value = current_options.length ? current_options[0].entry.get('name') : UNSET_VALUE;
            }

            if (is_hidden) {
                dictionary_name += '*';
                has_hidden_options = true;
            }

            return {
                title: dictionary_name,
                value,
            };
        }, this);

        return {
            options_list: unit_options,
            has_hidden_options,
        };
    },
    getProfileProperties() {
        const profile = this.model.profile;
        const profile_properties = [];

        const relevant_properties = [
            'name', 'unit_type', 'system', 'frame_width', 'mullion_width',
            'sash_frame_width', 'sash_frame_overlap', 'sash_mullion_overlap',
            'low_threshold', 'threshold_width',
        ];

        if (profile) {
            _.each(relevant_properties, (item) => {
                profile_properties.push({
                    title: profile.getTitles([item]),
                    value: profile.get(item),
                });
            }, this);
        }

        return profile_properties;
    },
    getUnitSashList() {
        const project_settings = App.settings.getProjectSettings();
        const sashes = [];

        function getFillingPerimeter(width, height) {
            return format.dimensions(convert.mm_to_inches(width),
                    convert.mm_to_inches(height), 'fraction', 'inches_only');
        }

        function getFillingArea(width, height, suffix_format) {
            suffix_format = suffix_format || 'sup';

            const result = format.square_feet(math.square_feet(convert.mm_to_inches(width),
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

            return result;
        }

        const sash_list_source = this.model.getSashList(null, null,
            project_settings && project_settings.get('hinge_indicator_mode') === 'american');

        _.each(sash_list_source, function (source_item, index) {
            const sash_item = {};
            let section_info;

            sash_item.name = `Sash #${index + 1}`;
            sash_item.type = source_item.type;

            const opening_size_data = this.model.getSashOpeningSize(source_item.opening);
            sash_item.opening_size = opening_size_data && format.dimensions_and_area(
                opening_size_data.width,
                opening_size_data.height,
                undefined,
                undefined,
                opening_size_data.area,
            );
            const egress_opening_size_data = this.model.getSashOpeningSize(
                source_item.opening,
                'egress',
                source_item.original_type,
            );
            sash_item.egress_opening_size = egress_opening_size_data && format.dimensions_and_area(
                egress_opening_size_data.width,
                egress_opening_size_data.height,
                undefined,
                undefined,
                egress_opening_size_data.area,
            );

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
                });

                sash_item.daylight_sum = sum ? format.square_feet(sum, 2, 'sup') : false;
            } else {
                section_info = getSectionInfo(source_item);
                _.extend(sash_item, section_info);
            }

            sashes.push(sash_item);
        }, this);

        return sashes;
    },
    getUnitStats() {
        const stats_data = [];
        const titles = {
            frame: 'Frame',
            sashes: 'Sash Frames',
            mullions: 'Mullions',
            profile_total: 'Profile Total',
            glasses: 'Fillings',
            openings: 'Openings',
            glazing_bars: 'Glazing Bars',
            unit_total: 'Unit Total',
        };
        const group_titles = {
            linear: 'Total Linear',
            linear_without_intersections: 'Total Linear (Without Intersections)',
            area: 'Total Area',
            area_both_sides: 'Total Area (Both Sides)',
            weight: 'Total Weight',
        };
        const data_groups = _.keys(group_titles);
        const group_data = {};
        const hasBaseFilling = this.model.hasBaseFilling();
        const unit_stats = this.model.getLinearAndAreaStats();

        _.each(unit_stats, function (item, key) {
            _.each(data_groups, (group_name) => {
                if (item[group_name]) {
                    let value;

                    group_data[group_name] = group_data[group_name] || [];

                    if (group_name.indexOf('linear') !== -1) {
                        value = format.dimension_mm(item[group_name]);
                    } else if (group_name === 'weight') {
                        value = format.weight(item[group_name]);
                    } else {
                        value = format.square_meters(item[group_name]);
                    }

                    group_data[group_name].push({
                        key,
                        title: titles[key],
                        value,
                        is_total: (key === 'profile_total' && group_name !== 'weight') || key === 'unit_total',
                    });
                }
            }, this);
        }, this);

        _.each(group_titles, (title, key) => {
            group_data[key] = _.sortBy(group_data[key], param => _.indexOf(
                ['frame', 'sashes', 'mullions', 'profile_total', 'glasses', 'openings', 'glazing_bars', 'unit_total'], param.key,
            ));

            stats_data.push({
                title,
                data: group_data[key],
                hasBaseFilling: title.toLowerCase().indexOf('weight') !== -1 && hasBaseFilling,
            });
        }, this);

        return stats_data;
    },
    getUnitEstimatedCost() {
        const result = {
            sections: [],
            per_item_priced_options: [],
        };
        const unit_cost = this.model.getEstimatedUnitCost();

        result.profile_name = this.model.profile ? this.model.profile.get('name') : UNSET_VALUE;
        result.base_cost = format.fixed(unit_cost.base);
        result.fillings_cost = format.fixed(unit_cost.fillings);
        result.options_cost = format.fixed(unit_cost.options);
        result.total_cost = format.fixed(unit_cost.total);
        result.original_currency = this.model.get('original_currency');
        result.conversion_rate = format.fixed(this.model.get('conversion_rate'), 3);

        //  This is not super nice because we duplicate code from unit.js
        result.converted_cost = format.price_usd(unit_cost.total / parseFloat(result.conversion_rate));

        //  Collect detailed pricing data for sections
        _.each(unit_cost.sections_list, function (source_item, index) {
            const section_item = {};

            section_item.name = `Section #${index + 1}`;
            section_item.type = source_item.type === 'fixed' ? 'Fixed' : 'Operable';

            section_item.height = format.dimension_mm(source_item.height);
            section_item.width = format.dimension_mm(source_item.width);
            section_item.area = format.square_meters(
                math.square_meters(source_item.width, source_item.height),
                2, 'sup');

            section_item.base_pricing_scheme = source_item.base_pricing_scheme;
            section_item.price_per_square_meter = format.fixed(source_item.price_per_square_meter);
            section_item.base_cost = format.fixed(source_item.base_cost);
            section_item.show_price_per_square_meter = (source_item.base_pricing_scheme === PRICING_SCHEME_PRICING_GRIDS);

            //  Add cost for Filling
            section_item.filling_name = source_item.filling_name;
            section_item.filling_pricing_scheme = source_item.filling_pricing_scheme;
            section_item.filling_price_increase = format.percent(source_item.filling_price_increase);
            section_item.filling_cost = format.fixed(source_item.filling_cost);
            section_item.show_filling_price_increase = (source_item.filling_pricing_scheme === PRICING_SCHEME_PRICING_GRIDS);

            //  Add cost for Options
            section_item.options = _.map(source_item.options, (item, item_index) => ({
                index: `Option #${item_index + 1}`,
                dictionary_name: item.dictionary_name,
                pricing_scheme: item.dictionary_pricing_scheme,
                is_hidden: item.is_hidden,
                option_name: item.option_name,
                price_increase: format.percent(item.price_increase),
                cost: format.fixed(item.cost),
                show_price_increase: (item.dictionary_pricing_scheme === PRICING_SCHEME_PRICING_GRIDS),
            }), this);

            section_item.total_cost = format.fixed(source_item.total_cost);

            result.sections.push(section_item);
        }, this);

        let per_item_priced_options_total_cost = 0;

        //  Collect detailed pricing data for per-item-priced options
        _.each(unit_cost.options_list.PER_ITEM, (source_item, index) => {
            const option_item = {};

            option_item.option_index = `Option #${index + 1}`;
            option_item.option_name = source_item.option_name;
            option_item.dictionary_name = source_item.dictionary_name;
            option_item.is_hidden = source_item.is_hidden;
            option_item.cost_per_item = format.fixed(source_item.pricing_data.cost_per_item);
            option_item.quantity = source_item.quantity;
            option_item.cost = format.fixed(source_item.pricing_data.cost_per_item * source_item.quantity);

            per_item_priced_options_total_cost += source_item.pricing_data.cost_per_item * source_item.quantity;

            result.per_item_priced_options.push(option_item);
        }, this);

        result.per_item_priced_options_total_cost = format.fixed(per_item_priced_options_total_cost);

        return result;
    },
    templateContext() {
        const tab_contents = {
            unit_properties: this.getUnitProperties(),
            profile_properties: this.getProfileProperties(),
            unit_stats: this.getUnitStats(),
            unit_estimated_cost: this.getUnitEstimatedCost(),
        };

        return {
            unit_image: this.getUnitImage(),
            unit_sashes: this.getUnitSashList(),
            unit_properties: tab_contents.unit_properties,
            unit_options: this.getUnitOptions(),
            profile_properties: tab_contents.profile_properties,
            unit_stats: tab_contents.unit_stats,
            unit_estimated_cost: tab_contents.unit_estimated_cost,
            tabs: _.each(this.tabs, (item, key) => {
                item.is_active = key === this.active_tab;

                return item;
            }, this),
        };
    },
});
