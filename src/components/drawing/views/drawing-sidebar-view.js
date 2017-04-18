import $ from 'jquery';
import _ from 'underscore';
import Marionette from 'backbone.marionette';

import App from '../../../main';
import { math, format, convert } from '../../../utils';
import constants from '../../../constants';
import template from '../templates/drawing-sidebar-view.hbs';

const UNSET_VALUE = '--';

const PRICING_SCHEME_PRICING_GRIDS = constants.PRICING_SCHEME_PRICING_GRIDS;

export default Marionette.View.extend({
    tagName: 'div',
    className: 'drawing-sidebar',
    template,
    ui: {
        $select: '.selectpicker',
        $prev: '.js-prev-unit',
        $next: '.js-next-unit',
        $sidebar_toggle: '.js-sidebar-toggle',
        $tab_container: '.tab-container',
    },
    events: {
        'change @ui.$select': 'onChange',
        'click @ui.$prev': 'onPrevBtn',
        'click @ui.$next': 'onNextBtn',
        'click .nav-tabs a': 'onTabClick',
        'click @ui.$sidebar_toggle': 'onSidebarToggle',
    },
    keyShortcuts: {
        left: 'onPrevBtn',
        right: 'onNextBtn',
        pageup: 'goToPrevTab',
        pagedown: 'goToNextTab',
    },
    initialize() {
        this.tabs = {
            active_unit_properties: {
                title: 'Unit',
            },
            active_unit_profile_properties: {
                title: 'Profile',
            },
            active_unit_stats: {
                title: 'Unit Stats',
            },
            active_unit_estimated_cost: {
                title: 'Est. Cost',
            },
        };
        this.active_tab = 'active_unit_properties';

        this.listenTo(this.options.parent_view.active_unit, 'all', this.render);
        this.listenTo(this.options.parent_view, 'drawing_view:onSetState', this.render);
        this.listenTo(App.current_project.settings, 'change', this.render);
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
    selectUnit(model) {
        this.$el.trigger({
            type: 'unit-selected',
            model,
        });

        this.render();
    },
    onChange() {
        this.selectUnit(this.collection.get(this.ui.$select.val()));
    },
    onNextBtn() {
        const collection_size = this.templateContext().unit_list.length;
        let next_index;

        if (collection_size > 1 && this.options.parent_view.active_unit) {
            next_index = this.collection.indexOf(this.options.parent_view.active_unit) + 1;

            if (next_index >= collection_size) {
                next_index = 0;
            }

            this.selectUnit(this.collection.at(next_index));
        }
    },
    onPrevBtn() {
        const collection_size = this.templateContext().unit_list.length;
        let prev_index;

        if (collection_size > 1 && this.options.parent_view.active_unit) {
            prev_index = this.collection.indexOf(this.options.parent_view.active_unit) - 1;

            if (prev_index < 0) {
                prev_index = collection_size - 1;
            }

            this.selectUnit(this.collection.at(prev_index));
        }
    },
    //  This is not very cool because it breaks "don't store state in html"
    //  rule, but it's better than rewriting everything
    goToNextTab() {
        const $active_tab = this.ui.$tab_container.find('.active');
        const $next_tab = $active_tab.next().length ? $active_tab.next() : $active_tab.siblings().first();

        $next_tab.find('a').trigger('click');
    },
    goToPrevTab() {
        const $active_tab = this.ui.$tab_container.find('.active');
        const $prev_tab = $active_tab.prev().length ? $active_tab.prev() : $active_tab.siblings().last();

        $prev_tab.find('a').trigger('click');
    },
    onSidebarToggle() {
        this.$el.trigger({ type: 'sidebar-toggle' });
    },
    getActiveUnitImage() {
        let active_unit_image = null;

        if (this.options.parent_view.active_unit &&
            this.options.parent_view.active_unit.get('customer_image')
        ) {
            active_unit_image = this.options.parent_view.active_unit.get('customer_image');
        }

        return active_unit_image;
    },
    getActiveUnitProperties() {
        const f = format;
        let active_unit_properties = [];
        let params_source = {};
        const project_settings = App.settings.getProjectSettings();
        let active_unit;

        const relevant_properties = [
            'mark', 'width', 'height', 'description', 'notes', 'exceptions',
            'uw', 'glazing', 'opening_direction', 'glazing_bar_width',
        ];

        if (this.options.parent_view.active_unit) {
            active_unit = this.options.parent_view.active_unit;

            params_source = {
                width: f.dimension(active_unit.get('width'), null,
                    project_settings && project_settings.get('inches_display_mode')),
                height: f.dimension(active_unit.get('height'), null,
                    project_settings && project_settings.get('inches_display_mode')),
            };

            active_unit_properties = _.map(relevant_properties, prop_name => ({
                title: active_unit.getTitles([prop_name]),
                value() {
                    let val = params_source[prop_name] || active_unit.get(prop_name);

                    if (active_unit.isOperableOnlyAttribute(prop_name) && !active_unit.hasOperableSections()) {
                        val = '(Operable Only)';
                    } else if (active_unit.isGlazingBarProperty(prop_name) && !active_unit.hasGlazingBars()) {
                        val = '(Has no Bars)';
                    }

                    return val;
                },
            }), this);
        }

        return active_unit_properties;
    },
    getActiveUnitOptions() {
        let active_unit_options = [];
        let has_hidden_options = false;
        const options_list = App.settings.dictionaries.getAvailableDictionaryNames();
        let active_unit;

        if (this.options.parent_view.active_unit) {
            active_unit = this.options.parent_view.active_unit;

            active_unit_options = _.map(options_list, function (dictionary_name) {
                const dictionary_id = App.settings.dictionaries.getDictionaryIdByName(dictionary_name);
                let rules_and_restrictions;
                let is_hidden = false;
                let value = '(None)';
                let is_restricted = false;
                let current_options = [];

                if (dictionary_id) {
                    rules_and_restrictions = App.settings.dictionaries.get(dictionary_id)
                        .get('rules_and_restrictions');
                    is_hidden = App.settings.dictionaries.get(dictionary_id)
                        .get('is_hidden');
                }

                _.each(rules_and_restrictions, (rule) => {
                    const restriction_applies = active_unit.checkIfRestrictionApplies(rule);

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
                    current_options = dictionary_id ?
                        active_unit.getCurrentUnitOptionsByDictionaryId(dictionary_id) : [];
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
        }

        return {
            options_list: active_unit_options,
            has_hidden_options,
        };
    },
    getActiveUnitProfileProperties() {
        const active_unit_profile_properties = [];
        let active_unit_profile;

        const relevant_properties = [
            'name', 'unit_type', 'system', 'frame_width', 'mullion_width',
            'sash_frame_width', 'sash_frame_overlap', 'sash_mullion_overlap',
            'low_threshold', 'threshold_width',
        ];

        if (this.options.parent_view.active_unit &&
            this.options.parent_view.active_unit.profile
        ) {
            active_unit_profile = this.options.parent_view.active_unit.profile;
            _.each(relevant_properties, (item) => {
                active_unit_profile_properties.push({
                    title: active_unit_profile.getTitles([item]),
                    value: active_unit_profile.get(item),
                });
            });
        }

        return active_unit_profile_properties;
    },
    getActiveUnitSashList() {
        const project_settings = App.settings.getProjectSettings();
        const f = format;
        const c = convert;
        const m = math;
        let sash_list_source;
        const sashes = [];

        function getFillingPerimeter(width, height) {
            return f.dimensions(c.mm_to_inches(width),
                c.mm_to_inches(height), 'fraction', 'inches_only');
        }

        function getFillingArea(width, height, suffix_format) {
            suffix_format = suffix_format || 'sup';

            const result = f.square_feet(m.square_feet(c.mm_to_inches(width),
                c.mm_to_inches(height)), 2, suffix_format);

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

        if (this.options.parent_view.active_unit) {
            sash_list_source = this.options.parent_view.active_unit.getSashList(null, null,
                project_settings && project_settings.get('hinge_indicator_mode') === 'american');

            _.each(sash_list_source, function (source_item, index) {
                const sash_item = {};
                let section_info;

                sash_item.name = `Sash #${index + 1}`;
                sash_item.type = source_item.type;

                const opening_size_data = this.options.parent_view.active_unit.getSashOpeningSize(source_item.opening);
                sash_item.opening_size = opening_size_data && f.dimensions_and_area(
                    opening_size_data.width,
                    opening_size_data.height,
                    undefined,
                    undefined,
                    opening_size_data.area,
                );

                const egress_opening_size_data = this.options.parent_view.active_unit.getSashOpeningSize(
                    source_item.opening,
                    'egress',
                    source_item.original_type,
                );
                sash_item.egress_opening_size = egress_opening_size_data && f.dimensions_and_area(
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

                    sash_item.daylight_sum = sum ? f.square_feet(sum, 2, 'sup') : false;
                } else {
                    section_info = getSectionInfo(source_item);
                    _.extend(sash_item, section_info);
                }

                sashes.push(sash_item);
            }, this);
        }

        return sashes;
    },
    getActiveUnitStats() {
        let unit_stats;
        const f = format;
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

        if (this.options.parent_view.active_unit) {
            const group_titles = {
                linear: 'Total Linear',
                linear_without_intersections: 'Total Linear (Without Intersections)',
                area: 'Total Area',
                area_both_sides: 'Total Area (Both Sides)',
                weight: 'Total Weight',
            };
            const data_groups = _.keys(group_titles);
            const group_data = {};
            const hasBaseFilling = this.options.parent_view.active_unit.hasBaseFilling();

            unit_stats = this.options.parent_view.active_unit.getLinearAndAreaStats();

            _.each(unit_stats, function (item, key) {
                _.each(data_groups, (group_name) => {
                    if (item[group_name]) {
                        let value;

                        group_data[group_name] = group_data[group_name] || [];

                        if (group_name.indexOf('linear') !== -1) {
                            value = f.dimension_mm(item[group_name]);
                        } else if (group_name === 'weight') {
                            value = f.weight(item[group_name]);
                        } else {
                            value = f.square_meters(item[group_name]);
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
                group_data[key] = _.sortBy(group_data[key], param => _.indexOf(['frame', 'sashes', 'mullions', 'profile_total', 'glasses',
                    'openings', 'glazing_bars', 'unit_total'], param.key));

                stats_data.push({
                    title,
                    data: group_data[key],
                    hasBaseFilling: title.toLowerCase().indexOf('weight') !== -1 && hasBaseFilling,
                });
            }, this);
        }

        return stats_data;
    },
    getActiveUnitEstimatedCost() {
        const f = format;
        const m = math;
        let active_unit_profile;
        const result = {
            sections: [],
            per_item_priced_options: [],
        };

        if (this.options.parent_view.active_unit) {
            active_unit_profile = this.options.parent_view.active_unit.profile;
            const unit_cost = this.options.parent_view.active_unit.getEstimatedUnitCost();

            result.profile_name = active_unit_profile ? active_unit_profile.get('name') : UNSET_VALUE;
            result.base_cost = f.fixed(unit_cost.base);
            result.fillings_cost = f.fixed(unit_cost.fillings);
            result.options_cost = f.fixed(unit_cost.options);
            result.total_cost = f.fixed(unit_cost.total);
            result.original_currency = this.options.parent_view.active_unit.get('original_currency');
            result.conversion_rate = f.fixed(this.options.parent_view.active_unit.get('conversion_rate'), 3);

            //  This is not super nice because we duplicate code from unit.js
            result.converted_cost = f.price_usd(unit_cost.total / parseFloat(result.conversion_rate));

            //  Collect detailed pricing data for sections
            _.each(unit_cost.sections_list, function (source_item, index) {
                const section_item = {};

                section_item.name = `Section #${index + 1}`;
                section_item.type = source_item.type === 'fixed' ? 'Fixed' : 'Operable';

                section_item.height = f.dimension_mm(source_item.height);
                section_item.width = f.dimension_mm(source_item.width);
                section_item.area = f.square_meters(
                    m.square_meters(source_item.width, source_item.height),
                    2, 'sup');

                section_item.base_pricing_scheme = source_item.base_pricing_scheme;
                section_item.price_per_square_meter = f.fixed(source_item.price_per_square_meter);
                section_item.base_cost = f.fixed(source_item.base_cost);
                section_item.show_price_per_square_meter =
                    (source_item.base_pricing_scheme === PRICING_SCHEME_PRICING_GRIDS);

                //  Add cost for Filling
                section_item.filling_name = source_item.filling_name;
                section_item.filling_pricing_scheme = source_item.filling_pricing_scheme;
                section_item.filling_price_increase = f.percent(source_item.filling_price_increase);
                section_item.filling_cost = f.fixed(source_item.filling_cost);
                section_item.show_filling_price_increase =
                    (source_item.filling_pricing_scheme === PRICING_SCHEME_PRICING_GRIDS);

                //  Add cost for Options
                section_item.options = _.map(source_item.options, (item, item_index) => ({
                    index: `Option #${item_index + 1}`,
                    dictionary_name: item.dictionary_name,
                    pricing_scheme: item.dictionary_pricing_scheme,
                    is_hidden: item.is_hidden,
                    option_name: item.option_name,
                    price_increase: f.percent(item.price_increase),
                    cost: f.fixed(item.cost),
                    show_price_increase: (item.dictionary_pricing_scheme === PRICING_SCHEME_PRICING_GRIDS),
                }), this);

                section_item.total_cost = f.fixed(source_item.total_cost);

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
                option_item.cost_per_item = f.fixed(source_item.pricing_data.cost_per_item);
                option_item.quantity = source_item.quantity;
                option_item.cost = f.fixed(source_item.pricing_data.cost_per_item * source_item.quantity);

                per_item_priced_options_total_cost += source_item.pricing_data.cost_per_item * source_item.quantity;

                result.per_item_priced_options.push(option_item);
            }, this);

            result.per_item_priced_options_total_cost = f.fixed(per_item_priced_options_total_cost);
        }

        return result;
    },
    templateContext() {
        const tab_contents = {
            active_unit_properties: this.getActiveUnitProperties(),
            active_unit_profile_properties: this.getActiveUnitProfileProperties(),
            active_unit_stats: this.getActiveUnitStats(),
            active_unit_estimated_cost: this.getActiveUnitEstimatedCost(),
        };

        return {
            unit_list: this.collection.map(function (item) {
                return {
                    is_selected: this.options.parent_view.active_unit &&
                        item.cid === this.options.parent_view.active_unit.cid,
                    reference_id: item.getRefNum(),
                    cid: item.cid,
                    mark: item.get('mark'),
                    dimensions: format.dimensions(item.get('width'), item.get('height'), 'fraction'),
                };
            }, this),
            active_unit_image: this.getActiveUnitImage(),
            active_unit_sashes: this.getActiveUnitSashList(),
            active_unit_properties: tab_contents.active_unit_properties,
            active_unit_options: this.getActiveUnitOptions(),
            active_unit_profile_properties: tab_contents.active_unit_profile_properties,
            active_unit_stats: tab_contents.active_unit_stats,
            active_unit_estimated_cost: tab_contents.active_unit_estimated_cost,
            tabs: _.each(this.tabs, function (item, key) {
                item.is_active = key === this.active_tab;

                return item;
            }, this),
        };
    },
    onRender() {
        this.ui.$select.selectpicker({
            showSubtext: true,
        });
    },
});
