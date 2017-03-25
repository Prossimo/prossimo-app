import _ from 'underscore';
import App from '../../main';
import Backbone from 'backbone';
import Schema from '../../schema';
import utils from '../../utils';
import constants from '../../constants';
import UnitOptionCollection from '../collections/inline/unit-option-collection';
import {globalChannel} from '../../utils/radio';

const UNSET_VALUE = '--';

const PRICING_SCHEME_NONE = constants.PRICING_SCHEME_NONE;
const PRICING_SCHEME_PRICING_GRIDS = constants.PRICING_SCHEME_PRICING_GRIDS;
const PRICING_SCHEME_PER_ITEM = constants.PRICING_SCHEME_PER_ITEM;
const PRICING_SCHEME_LINEAR_EQUATION = constants.PRICING_SCHEME_LINEAR_EQUATION;
const UNIT_PROPERTIES = [
    {name: 'mark', title: 'Mark', type: 'string'},
    {name: 'width', title: 'Width (inches)', type: 'number'},
    {name: 'height', title: 'Height (inches)', type: 'string'},
    {name: 'quantity', title: 'Quantity', type: 'number'},
    {name: 'description', title: 'Customer Description', type: 'string'},
    {name: 'notes', title: 'Notes', type: 'string'},
    {name: 'exceptions', title: 'Exceptions', type: 'string'},
    {name: 'glazing_bar_width', title: 'Glazing Bar Width (mm)', type: 'number'},
    {name: 'profile_name', title: 'Profile', type: 'string'},
    {name: 'profile_id', title: 'Profile', type: 'string'},
    {name: 'customer_image', title: 'Customer Image', type: 'string'},
    {name: 'opening_direction', title: 'Opening Direction', type: 'string'},
    {name: 'glazing', title: 'Glass Packet / Panel Type', type: 'string'},
    {name: 'uw', title: 'Uw', type: 'number'},
    {name: 'original_cost', title: 'Original Cost', type: 'number'},
    {name: 'original_currency', title: 'Original Currency', type: 'string'},
    {name: 'conversion_rate', title: 'Conversion Rate', type: 'number'},
    {name: 'supplier_discount', title: 'Supplier Discount', type: 'number'},
    {name: 'price_markup', title: 'Markup', type: 'number'},
    {name: 'discount', title: 'Discount', type: 'number'},
    {name: 'position', title: 'Position', type: 'number'},
    {name: 'unit_options', title: 'Unit Options', type: 'collection:UnitOptionCollection'},
    {name: 'root_section', title: 'Root Section', type: 'object'}
];

//  We only allow editing these attributes for units where
//  `hasOperableSections` is `true`
const OPERABLE_ONLY_PROPERTIES = ['opening_direction'];
//  Same as above, for `hasGlazingBars`
const GLAZING_BAR_PROPERTIES = ['glazing_bar_width'];

const SASH_TYPES = [
    'tilt_turn_left', 'tilt_turn_right', 'fixed_in_frame', 'tilt_only',
    'turn_only_left', 'turn_only_right', 'fixed_in_sash',
    'slide_left', 'slide_right',
    'tilt_slide_left', 'tilt_slide_right',
    // additional types for solid doors
    'flush-turn-right', 'flush-turn-left', 'tilt_only_top_hung',
    'turn_only_right_hinge_hidden_latch', 'turn_only_left_hinge_hidden_latch'
];

const SASH_TYPES_WITH_OPENING = _.without(SASH_TYPES, 'fixed_in_frame');
const OPERABLE_SASH_TYPES = _.without(SASH_TYPES, 'fixed_in_frame', 'fixed_in_sash');
const EGRESS_ENABLED_TYPES = [
    'tilt_turn_right', 'tilt_turn_left', 'turn_only_right', 'turn_only_left',
    'turn_only_right_hinge_hidden_latch', 'turn_only_left_hinge_hidden_latch'
];

const SASH_TYPE_NAME_MAP = {
    // deprecated
    // 'flush-turn-right': 'Flush Panel Right Hinge',
    // 'flush-turn-left': 'Flush Panel Left Hinge',
    slide_left: 'Lift Slide Left',
    slide_right: 'Lift Slide Right',
    tilt_slide_left: 'Tilt Slide Left',
    tilt_slide_right: 'Tilt Slide Right',
    fixed_in_frame: 'Fixed',
    fixed_in_sash: 'Fixed in Sash',
    tilt_only: 'Tilt Only',
    tilt_turn_right: 'Tilt-turn Right Hinge',
    tilt_turn_left: 'Tilt-turn Left Hinge',
    turn_only_right: 'Turn Only Right Hinge',
    turn_only_left: 'Turn Only Left Hinge',
    tilt_only_top_hung: 'Tilt Only Top Hung',
    'slide-right': 'Lift Slide Right',
    'slide-left': 'Lift Slide Left',
    turn_only_right_hinge_hidden_latch: 'Turn Only Right Hinge Hidden Latch',
    turn_only_left_hinge_hidden_latch: 'Turn Only Left Hinge Hidden Latch'
};

const FILLING_TYPES = [
    'glass', 'recessed',
    'interior-flush-panel', 'exterior-flush-panel',
    'full-flush-panel', 'louver'
];

const MULLION_TYPES = [
    'vertical', 'horizontal',
    'vertical_invisible', 'horizontal_invisible'
];

//  TODO: this could return dummy type object or something like that, so we
//  could know when we don't get the right thing, and try to fix that
function getDefaultFillingType(default_glazing_name, profile_id) {
    let dummy_type = {
        fillingType: 'glass',
        fillingName: 'Glass'
    };
    let default_type;

    if (App.settings && default_glazing_name) {
        default_type = App.settings.filling_types.getByName(default_glazing_name);
    }

    if (!default_type && App.settings && profile_id) {
        default_type = App.settings.filling_types.getDefaultOrFirstAvailableForProfile(profile_id);
    }

    return default_type ? {
            fillingType: default_type.get('type'),
            fillingName: default_type.get('name')
        } : dummy_type;
}

function getDefaultBars() {
    return {
        vertical: [],
        horizontal: []
    };
}

function validateBar(opts, type) {
    return {
        id: opts.id || _.uniqueId(),
        type: opts.type || type,
        position: opts.position,
        links: opts.links || [null, null]
    };
}

function getDefaultMeasurements(hasFrame) {
    let result = {};

    hasFrame = hasFrame || false;

    if (hasFrame) {
        result.frame = {
            vertical: ['max', 'max'],
            horizontal: ['max', 'max']
        };
    }

    result.opening = null;
    result.glass = null;

    return result;
}

function getSectionDefaults(section_type, default_glazing_name, profile_id) {
    let isRootSection = ( section_type === 'root_section' );
    let defaultFilling = getDefaultFillingType(default_glazing_name, profile_id);

    return {
        id: _.uniqueId(),
        sashType: 'fixed_in_frame',
        fillingType: defaultFilling.fillingType,
        fillingName: defaultFilling.fillingName,
        bars: getDefaultBars(),
        measurements: getDefaultMeasurements(isRootSection)
    };
}

function getInvertedDivider(type) {
    if (/vertical/.test(type)) {
        type = type.replace(/vertical/g, 'horizontal');
    } else if (/horizontal/.test(type)) {
        type = type.replace(/horizontal/g, 'vertical');
    }

    return type;
}

function findParent(root, childId) {
    if (root.sections.length === 0) {
        return null;
    }

    if (root.sections[0].id === childId || root.sections[1].id === childId) {
        return root;
    }

    return findParent(root.sections[0], childId) || findParent(root.sections[1], childId);
}

const Unit = Backbone.Model.extend({
    schema: Schema.createSchema(UNIT_PROPERTIES),
    defaults: function () {
        let defaults = {};

        _.each(UNIT_PROPERTIES, function (item) {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        }, this);

        return defaults;
    },
    getNameAttribute: function () {
        return 'mark';
    },
    //  TODO: stuff inside name_value_hash gets evaluated for each
    //  attribute, but we actually want it to be evaluated only for the
    //  corresponding attribute (see example for root_section)
    getDefaultValue: function (name, type) {
        let default_value = '';

        let type_value_hash = {
            number: 0
        };

        let name_value_hash = {
            height: '0',
            original_currency: 'EUR',
            conversion_rate: 0.9,
            price_markup: 2.3,
            quantity: 1,
            root_section: name === 'root_section' ? getSectionDefaults(name) : '',
            unit_options: name === 'unit_options' ? this.getDefaultUnitOptions() : []
        };

        if (App.settings) {
            name_value_hash.glazing_bar_width = App.settings.getGlazingBarWidths()[0];
            name_value_hash.opening_direction = App.settings.getOpeningDirections()[0];
            name_value_hash.glazing = App.settings.filling_types.getNames()[0];
        }

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    sync: function (method, model, options) {
        if (method === 'create' || method === 'update') {
            options.attrs = {unit: model.toJSON()};
        }

        return Backbone.sync.call(this, method, model, options);
    },
    toJSON: function () {
        let properties_to_omit = ['id'];
        let json = Backbone.Model.prototype.toJSON.apply(this, arguments);

        json.root_section = JSON.stringify(this.get('root_section'));
        json.unit_options = this.get('unit_options').toJSON();

        return _.omit(json, properties_to_omit);
    },
    parse: function (data) {
        let unit_data = data && data.unit ? data.unit : data;
        let parsed_data = Schema.parseAccordingToSchema(unit_data, this.schema);

        if (parsed_data && parsed_data.unit_options) {
            parsed_data.unit_options = new UnitOptionCollection(
                utils.object.extractObjectOrNull(parsed_data.unit_options),
                {parse: true}
            );
        }

        return parsed_data;
    },
    initialize: function (attributes, options) {
        this.options = options || {};
        this.profile = null;

        if (!this.options.proxy) {

            this.validateOpeningDirection();
            this.validateRootSection();
            this.setProfile();
            this.on('change:profile_id', function () {
                this.setProfile({validate_filling_types: true});
            }, this);
            this.on('change:glazing', this.onGlazingUpdate, this);

            //  If we know that something was changed in dictionaries,
            //  we have to re-validate our unit options
            //  TODO: we want to do the same thing for filling types
            this.listenTo(globalChannel, 'validate_units:dictionaries', function () {
                if (this.isParentQuoteActive()) {
                    this.validateUnitOptions();
                }
            });

            //  Same as above, but when this unit's quote becomes active
            this.listenTo(globalChannel, 'current_quote_changed', function () {
                if (this.isParentQuoteActive()) {
                    this.validateUnitOptions();
                }
            });

            //  If we just created a unit, we want to set root_section
            //  considering the id of this unit's profile
            //  TODO: this might be not optimal place to do this since
            //  it doesn't work for fixtures and might not work in some
            //  other conditions
            if (this.isNew() && App.session && App.session.get('no_backend') !== true) {
                let profile_id = this.profile && this.profile.id;
                let glazing_name = this.get('glazing');

                if (
                    JSON.stringify(_.omit(this.getDefaultValue('root_section'), 'id')) ===
                    JSON.stringify(_.omit(this.get('root_section'), 'id'))
                ) {
                    this.set('root_section', getSectionDefaults('root_section', glazing_name, profile_id));
                }
            }

            this.listenTo(this.get('unit_options'), 'change update reset', function () {
                this.persist('unit_options', this.get('unit_options'));
            });
        }
    },
    //  TODO: this should happen on parse. Also, why only this property is
    //  validated?
    validateOpeningDirection: function () {
        if (!App.settings) {
            return;
        }

        if (!_.contains(App.settings.getOpeningDirections(), this.get('opening_direction'))) {
            this.set('opening_direction', App.settings.getOpeningDirections()[0]);
        }
    },
    //  TODO: this function should be improved
    //  The idea is to call this function on model init (maybe not only)
    //  and check whether root section could be used by our drawing code or
    //  should it be reset to defaults.
    //  TODO: this should be done at parse step
    validateRootSection: function () {
        let root_section = this.get('root_section');
        let root_section_parsed;

        if (_.isString(root_section)) {
            try {
                root_section_parsed = JSON.parse(root_section);
            } catch (error) {
                // Do nothing
            }

            if (root_section_parsed) {
                this.set('root_section', this.validateSection(root_section_parsed, true));
                return;
            }
        }

        if (!_.isObject(root_section)) {
            this.set('root_section', this.getDefaultValue('root_section'));
        }
    },
    //  Check if some of the section values aren't valid and try to fix that
    validateSection: function (current_section, is_root) {
        //  Replace deprecated sash types with more adequate values
        if (current_section.sashType === 'flush-turn-left') {
            current_section.sashType = 'turn_only_left';
            current_section.fillingType = 'full-flush-panel';
        } else if (current_section.sashType === 'flush-turn-right') {
            current_section.sashType = 'turn_only_right';
            current_section.fillingType = 'full-flush-panel';
        }

        if (!current_section.bars) {
            current_section.bars = getDefaultBars();
        } else {
            _.each(current_section.bars, function (barType, type) {
                _.each(barType, function (bar, index) {
                    current_section.bars[type][index] = validateBar(bar, type);
                });
            });
        }

        if (!current_section.measurements) {
            current_section.measurements = getDefaultMeasurements(is_root);
        }

        //  TODO: this duplicates code from splitSection, so ideally
        //  it should be moved to a new helper function
        if (current_section.measurements && !current_section.measurements.mullion && current_section.divider) {
            let measurementType = getInvertedDivider(current_section.divider).replace(/_invisible/, '');

            current_section.measurements.mullion = {};
            current_section.measurements.mullion[measurementType] = ['center', 'center'];
        }

        _.each(current_section.sections, function (section) {
            section = this.validateSection(section, false);
        }, this);

        return current_section;
    },
    getDefaultUnitOptions: function () {
        let default_options = new UnitOptionCollection();

        if (App.settings) {
            App.settings.dictionaries.each(function (dictionary) {
                let dictionary_id = dictionary.id;
                let profile_id = this.profile && this.profile.id;
                let rules = dictionary.get('rules_and_restrictions');
                let is_optional = _.contains(rules, 'IS_OPTIONAL');

                if (!is_optional && dictionary_id && profile_id) {
                    //  TODO: we need to call this directly on `dictionary` iterable
                    let option = App.settings.dictionaries.getDefaultOrFirstAvailableOption(dictionary_id, profile_id);

                    if (option && option.id && dictionary.id) {
                        default_options.add({
                            dictionary_id: dictionary.id,
                            dictionary_entry_id: option.id
                        });
                    }
                }
            }, this);
        }

        return default_options;
    },
    resetUnitOptionsToDefaults: function () {
        let current_options = this.get('unit_options');
        let default_options = this.getDefaultUnitOptions();
        if (JSON.stringify(current_options.toJSON()) !== JSON.stringify(default_options.toJSON())) {
            this.get('unit_options').reset(default_options.models);
        }
    },
    validateUnitOptions: function () {
        let default_options = this.getDefaultUnitOptions();
        let current_options = this.get('unit_options');
        let options_to_set = new UnitOptionCollection();

        if (App.settings) {
            App.settings.dictionaries.each(function (dictionary) {
                let dictionary_id = dictionary.id;
                let profile_id = this.profile && this.profile.id;

                if (dictionary_id && profile_id) {
                    let current_option = current_options.findWhere({dictionary_id: dictionary_id});
                    let default_option = default_options.findWhere({dictionary_id: dictionary_id});
                    let target_entry = current_option &&
                        dictionary.entries.get(current_option.get('dictionary_entry_id'));

                    if (current_option && target_entry) {
                        options_to_set.add(current_option);
                    } else if (default_option) {
                        options_to_set.add(default_option);
                    }
                }
            }, this);
        }

        this.get('unit_options').set(options_to_set.models);
    },
    getCurrentFillingsList: function (current_root) {
        let section_result;
        let result = [];

        current_root = current_root || this.generateFullRoot();

        _.each(current_root.sections, function (section) {
            section_result = this.getCurrentFillingsList(section);

            if (current_root.divider === 'vertical' || current_root.divider === 'vertical_invisible') {
                result = section_result.concat(result);
            } else {
                result = result.concat(section_result);
            }
        }, this);

        if (current_root.sections.length === 0) {
            result.unshift({
                name: current_root.fillingName,
                type: current_root.fillingType
            });
        }

        return result;
    },
    //  The idea here is to check if all the filling types we got are valid
    //  for the currently selected profile. If this is not the case, we
    //  want to automatically change all of them to the default type for
    //  this profile
    //  TODO: change only those not available, not all types
    //  TODO: it's not a proper name, but it's the same as
    //  validateUnitOptions we have above
    //  TODO: this needs tests
    validateFillingTypes: function () {
        //  Do nothing in case of dummy profile or no profile
        if (this.isNew() || !this.profile || this.hasDummyProfile() || !App.settings) {
            return;
        }

        let glazing = this.get('glazing');
        let current_fillings_list = _.pluck(this.getCurrentFillingsList(), 'name');
        let complete_fillings_list = _.union(current_fillings_list, [glazing]);

        let available_for_profile_list = _.difference(
            _.map(App.settings.filling_types.getAvailableForProfile(this.profile.id), function (item) {
                return item.get('name');
            }),
            _.pluck(App.settings.filling_types.getBaseTypes(), 'title')
        );
        let invalid_flag = false;

        _.find(complete_fillings_list, function (filling_name) {
            if (_.contains(available_for_profile_list, filling_name) === false) {
                invalid_flag = true;
                return true;
            }
        }, this);

        //  TODO: maybe we could do only one call here?
        if (invalid_flag) {
            this.persist('glazing', getDefaultFillingType(undefined, this.profile.id).fillingName);
            this.onGlazingUpdate();
        }
    },
    validate: function (attributes, options) {
        let error_obj = null;

        //  Simple type validation for numbers and booleans
        _.find(attributes, function (value, key) {
            let attribute_obj = this.getNameTitleTypeHash([key]);

            attribute_obj = attribute_obj.length === 1 ? attribute_obj[0] : null;

            if (attribute_obj && attribute_obj.type === 'number' &&
                (!_.isNumber(value) || _.isNaN(value))
            ) {
                error_obj = {
                    attribute_name: key,
                    error_message: attribute_obj.title + ' can\'t be set to "' + value + '", it should be a number'
                };

                return false;
            } else if (attribute_obj && attribute_obj.type === 'boolean' && !_.isBoolean(value)) {
                error_obj = {
                    attribute_name: key,
                    error_message: attribute_obj.title + ' can\'t be set to "' + value + '", it should be a boolean'
                };

                return false;
            }
        }, this);

        if (options.validate && error_obj) {
            return error_obj;
        }
    },
    setProfile: function (options) {
        let default_options = {
            validate_filling_types: false
        };

        options = _.defaults({}, options, default_options);

        this.profile = null;

        //  Assign the default profile id to a newly created unit
        if (App.settings && !this.get('profile_id') && !this.get('profile_name')) {
            this.set('profile_id', App.settings.getDefaultProfileId());
        }

        if (App.settings) {
            this.profile = App.settings.getProfileByIdOrDummy(this.get('profile_id'));
        }

        //  Store profile name so in case when profile was deleted we can
        //  have its old name for the reference
        if (this.profile && !this.hasDummyProfile()) {
            this.set('profile_name', this.profile.get('name'));
        }

        this.validateUnitOptions();

        if (options.validate_filling_types) {
            this.validateFillingTypes();
        }
    },
    hasDummyProfile: function () {
        return this.profile && this.profile.get('is_dummy');
    },
    hasOnlyDefaultAttributes: function () {
        let has_only_defaults = true;

        _.each(this.toJSON(), function (value, key) {
            if (key !== 'position' && has_only_defaults) {
                let property_source = _.findWhere(UNIT_PROPERTIES, {name: key});
                let type = property_source ? property_source.type : undefined;

                if (key === 'profile_id') {
                    if (App.settings && App.settings.getDefaultProfileId() !== value) {
                        has_only_defaults = false;
                    }
                } else if (key === 'profile_name') {
                    let profile = App.settings && App.settings.getProfileByIdOrDummy(this.get('profile_id'));

                    if (profile && profile.get('name') !== value) {
                        has_only_defaults = false;
                    }
                } else if (key === 'root_section') {
                    if (JSON.stringify(_.omit(this.getDefaultValue('root_section'), 'id')) !==
                        JSON.stringify(_.omit(JSON.parse(value), 'id'))
                    ) {
                        has_only_defaults = false;
                    }
                } else if (key === 'unit_options') {
                    if (JSON.stringify(this.getDefaultUnitOptions().toJSON()) !== JSON.stringify(value)) {
                        has_only_defaults = false;
                    }
                } else if (this.getDefaultValue(key, type) !== value) {
                    has_only_defaults = false;
                }
            }
        }, this);

        return has_only_defaults;
    },
    onGlazingUpdate: function () {
        let filling_type;
        let glazing = this.get('glazing');

        if (glazing && App.settings) {
            filling_type = App.settings.filling_types.getByName(glazing);

            if (filling_type) {
                this.setFillingType(
                    this.get('root_section').id,
                    filling_type.get('type'),
                    filling_type.get('name')
                );
            }
        }
    },
    //  Return { name: 'name', title: 'Title' } pairs for each item in
    //  `names` array. If the array is empty, return all possible pairs
    getNameTitleTypeHash: function (names) {
        let name_title_hash = [];

        if (!names) {
            names = _.pluck(UNIT_PROPERTIES, 'name');
        }

        _.each(UNIT_PROPERTIES, function (item) {
            if (_.indexOf(names, item.name) !== -1) {
                name_title_hash.push({name: item.name, title: item.title, type: item.type});
            }
        });

        return name_title_hash;
    },
    getTitles: function (names) {
        let name_title_hash = this.getNameTitleTypeHash(names);

        return _.pluck(name_title_hash, 'title');
    },
    getProfileProperties: function () {
        return App.settings ? App.settings.getProfileProperties(this.get('profile')) : {};
    },
    getRefNum: function () {
        return this.collection ? this.collection.indexOf(this) + 1 : -1;
    },
    getWidthMM: function () {
        return utils.convert.inches_to_mm(this.get('width'));
    },
    getHeightMM: function () {
        return utils.convert.inches_to_mm(this.get('height'));
    },
    getRoughOpeningWidth: function () {
        return parseFloat(this.get('width')) + 1;
    },
    getRoughOpeningHeight: function () {
        return parseFloat(this.get('height')) + 1;
    },
    getAreaInSquareFeet: function () {
        return utils.math.square_feet(this.get('width'), this.get('height'));
    },
    getTotalSquareFeet: function () {
        return this.getAreaInSquareFeet() * parseFloat(this.get('quantity'));
    },
    getAreaInSquareMeters: function () {
        let c = utils.convert;

            return utils.math.square_meters(c.inches_to_mm(this.get('width')), c.inches_to_mm(this.get('height')));
        },
        getUnitCost: function () {
            return parseFloat(this.get('original_cost')) / parseFloat(this.get('conversion_rate'));
        },
        getSubtotalCost: function () {
            return this.getUnitCost() * parseFloat(this.get('quantity'));
        },
        getUnitCostDiscounted: function () {
            return this.getUnitCost() * (100 - parseFloat(this.get('supplier_discount'))) / 100;
        },
        getSubtotalCostDiscounted: function () {
            return this.getUnitCostDiscounted() * parseFloat(this.get('quantity'));
        },
        getUnitPrice: function () {
            return this.getUnitCostDiscounted() * parseFloat(this.get('price_markup'));
        },
        getSubtotalPrice: function () {
            return this.getUnitPrice() * parseFloat(this.get('quantity'));
        },
        getUValue: function () {
            return parseFloat(this.get('uw')) * 0.176;
        },
        getUnitPriceDiscounted: function () {
            return this.getUnitPrice() * (100 - parseFloat(this.get('discount'))) / 100;
        },
        getSubtotalPriceDiscounted: function () {
            return this.getSubtotalPrice() * (100 - parseFloat(this.get('discount'))) / 100;
        },
        getSubtotalProfit: function () {
            return this.getSubtotalPriceDiscounted() - this.getSubtotalCostDiscounted();
        },
        getSquareFeetPrice: function () {
            return this.getTotalSquareFeet() ? this.getSubtotalPrice() / this.getTotalSquareFeet() : 0;
        },
        getSquareFeetPriceDiscounted: function () {
            return this.getTotalSquareFeet() ? this.getSubtotalPriceDiscounted() / this.getTotalSquareFeet() : 0;
        },
        preparePricingDataForExport: function (options) {
            var default_options = {
                include_project: true,
                include_quote: true,
                include_dimensions_mm: true,
                include_supplier_cost_original: true,
                include_supplier_cost_converted: true,
                include_supplier_discount: true,
                include_price: true,
                include_discount: true,
                include_profile: true,
                include_options: true,
                include_sections: true
            };

            options = _.extend({}, default_options, options);

            var sections_list = this.getFixedAndOperableSectionsList();
            var parent_project = this.getParentProject();
            var parent_quote = this.getParentQuote();

            var pricing_data = {};

            //  Project info
            if ( options.include_project && parent_project ) {
                pricing_data = _.extend({}, pricing_data, {
                    project_id: parent_project.id,
                    project_name: parent_project.get('project_name')
                });
            }

            //  Quote info
            if ( options.include_quote && parent_quote ) {
                pricing_data = _.extend({}, pricing_data, {
                    quote_id: parent_quote.id,
                    quote_name: parent_quote.getName()
                });
            }

            //  Base unit info, always included
            pricing_data = _.extend({}, pricing_data, {
                mark: this.get('mark'),
                quantity: this.get('quantity'),
                width: this.get('width'),
                height: this.get('height')
            });

            //  Dimensions in mm
            if ( options.include_dimensions_mm ) {
                pricing_data = _.extend({}, pricing_data, {
                    width_mm: this.getWidthMM(),
                    height_mm: this.getHeightMM()
                });
            }

            //  Supplier cost part 1
            if ( options.include_supplier_cost_original ) {
                pricing_data = _.extend({}, pricing_data, {
                    original_cost: this.get('original_cost'),
                    original_currency: this.get('original_currency'),
                    conversion_rate: this.get('conversion_rate')
                });
            }

            //  Supplier cost part 2
            if ( options.include_supplier_cost_converted ) {
                pricing_data = _.extend({}, pricing_data, {
                    unit_cost: this.getUnitCost(),
                    subtotal_cost: this.getSubtotalCost()
                });
            }

            //  Supplier cost with discount
            if ( options.include_supplier_discount ) {
                pricing_data = _.extend({}, pricing_data, {
                    supplier_discount: this.get('supplier_discount'),
                    unit_cost_with_discount: this.getUnitCostDiscounted(),
                    subtotal_cost_with_discount: this.getSubtotalCostDiscounted()
                });
            }

            //  Our markup and price
            if ( options.include_price ) {
                pricing_data = _.extend({}, pricing_data, {
                    price_markup: this.get('price_markup'),
                    unit_price: this.getUnitPrice(),
                    subtotal_price: this.getSubtotalPrice()
                });
            }

            //  Our price with discount
            if ( options.include_discount ) {
                pricing_data = _.extend({}, pricing_data, {
                    discount: this.get('discount'),
                    unit_price_with_discount: this.getUnitPriceDiscounted(),
                    subtotal_price_with_discount: this.getSubtotalPriceDiscounted()
                });
            }

            if ( options.include_profile ) {
                pricing_data = _.extend({}, pricing_data, {
                    profile_name: this.profile.get('name'),
                    unit_type: this.profile.get('unit_type')
                });
            }

            var custom_titles = {
                project_id: 'Project ID',
                project_name: 'Project Name',
                quote_id: 'Quote ID',
                quote_name: 'Quote Name',
                width_mm: 'Width (mm)',
                height_mm: 'Height (mm)',
                unit_cost: 'Unit Cost',
                subtotal_cost: 'Subtotal Cost',
                unit_cost_with_discount: 'Unit Cost w/D',
                subtotal_cost_with_discount: 'Subtotal Cost w/D',
                unit_price: 'Unit Price',
                unit_price_with_discount: 'Unit Price w/D',
                subtotal_price: 'Subtotal Price',
                subtotal_price_with_discount: 'Subtotal Price w/D',
                profile_name: 'Profile Name',
                unit_type: 'Unit Type'
            };

            pricing_data = _.map(pricing_data, function (value, key) {
                return { title: this.getTitles([key])[0] || custom_titles[key], value: value };
            }, this);

            if ( options.include_options ) {
                var option_dictionaries = app.settings.dictionaries.getAvailableDictionaryNames();

                _.each(option_dictionaries, function (dictionary_name) {
                    var target_dictionary_id = app.settings.dictionaries.getDictionaryIdByName(dictionary_name);
                    var target_dictionary = app.settings.dictionaries.get(target_dictionary_id);
                    var current_options = target_dictionary_id ?
                        this.getCurrentUnitOptionsByDictionaryId(target_dictionary_id) : [];
                    var is_restricted = false;

                    _.each(target_dictionary.get('rules_and_restrictions'), function (rule) {
                        if ( this.checkIfRestrictionApplies(rule) ) {
                            is_restricted = true;
                        }
                    }, this);

                    pricing_data.push({
                        title: dictionary_name,
                        value: !is_restricted && current_options.length ?
                            current_options[0].entry.get('name') :
                            UNSET_VALUE
                    });
                }, this);
            }

            if ( options.include_sections ) {
                _.each(sections_list, function (section_data, index) {
                    pricing_data.push({
                        title: 'Sash ' + (index + 1) + ' Type',
                        value: section_data.type === 'fixed' ? 'Fixed' : 'Operable'
                    });
                    pricing_data.push({
                        title: 'Sash ' + (index + 1) + ' Area (m2)',
                        value: section_data.width / 1000 * section_data.height / 1000
                    });
                    pricing_data.push({
                        title: 'Sash ' + (index + 1) + ' Filling',
                        value: section_data.filling_name
                    });
                }, this);
            }

            return pricing_data;
        },getSection: function (sectionId) {
            return findSection(this.generateFullRoot(), sectionId);
        },
        //  Right now we think that door is something where profile
        //  returns `true` on `hasOutsideHandle` call
        isDoorType: function () {
            let is_door_type = false;

        if (this.profile && this.profile.hasOutsideHandle()) {
            is_door_type = true;
        }

        return is_door_type;
    },
    isOpeningDirectionOutward: function () {
        return this.get('opening_direction') === 'Outward';
    },
    isCircularPossible: function (sashId) {
        let root = this.generateFullRoot();

        return !findParent(root, sashId) && !root.trapezoidHeights;
    },
    getCircleRadius: function () {
        let root = this.generateFullRoot();

        if (root.circular) {
            return root.radius;
        }

        return null;
    },
    isArchedPossible: function (sashId) {
        let root = this.generateFullRoot();

        if (root.trapezoidHeights) {
            return false;
        }

        if (findSection(root, sashId).sashType !== 'fixed_in_frame') {
            return false;
        }

        if (root.id === sashId && root.sections.length === 0) {
            return true;
        }

        let parent = findParent(root, sashId);

        if (!parent) {
            return false;
        }

        let childId = sashId;

        while (parent) {
            if (parent.sashType !== 'fixed_in_frame') {
                return false;
            }
            // arched section should be only on top (index 0)
            if (parent.sections[0].id !== childId) {
                return false;
            }

            // and it should be horizontal mullions only
            if (!(parent.divider === 'horizontal' || parent.divider === 'horizontal_invisible')) {
                return false;
            }

            childId = parent.id;
            parent = findParent(root, childId);
        }

        return true;
    },
    //  FIXME: this uses while true
    getArchedPosition: function () {
        let root = this.get('root_section');

        if (root.arched) {
            return root.archPosition;
        }

        while (true) {
            let topSection = root.sections && root.sections[0] && root.sections[0];

            if (topSection && topSection.arched) {
                return root.position;
            }

            if (!topSection) {
                return null;
            }

            root = topSection;
        }

        return null;
    },
    isRootSection: function (sectionId) {
        return this.get('root_section').id === sectionId;
    },
    //  If reverse_hinges is true, we replace "Left" with "Right" and
    //  "Right" with "Left" in sash name
    getSashName: function (type, reverse_hinges) {
        reverse_hinges = reverse_hinges || false;

        if (_.indexOf(_.keys(SASH_TYPE_NAME_MAP), type) === -1) {
            throw new Error('Unrecognized sash type: ' + type);
        }

        let string = SASH_TYPE_NAME_MAP[type];

        if (reverse_hinges) {
            if (/Right/.test(string)) {
                string = string.replace(/Right/g, 'Left');
            } else if (/Left/.test(string)) {
                string = string.replace(/Left/g, 'Right');
            }
        }

        return string;
    },
    _updateSection: function (sectionId, func) {
        // HAH, dirty deep clone, rewrite when you have good mood for it
        // we have to make deep clone and backbone will trigger change event
        let rootSection = JSON.parse(JSON.stringify(this.get('root_section')));
        let sectionToUpdate = findSection(rootSection, sectionId);

        func(sectionToUpdate);

        this.persist('root_section', rootSection);
    },
    setCircular: function (sectionId, opts) {
        //  Deep clone, same as above
        let root_section = JSON.parse(JSON.stringify(this.get('root_section')));
        let section = findSection(root_section, sectionId);
        let update_data = {};

        if (opts.radius) {
            update_data.width = opts.radius * 2;
            update_data.height = opts.radius * 2;
        }

        //  Set circular and reset bars
        if (opts.circular !== undefined) {
            section.circular = !!opts.circular;
            section.bars = getDefaultBars();
        }

        //  Set or reset radius
        if (section.circular) {
            section.radius = utils.convert.inches_to_mm(opts.radius);
        } else {
            section.radius = 0;
        }

        update_data.root_section = root_section;
        this.persist(update_data);
    },
    toggleCircular: function (sectionId, val) {
        if (this.isRootSection(sectionId)) {
            let section = this.getSection(sectionId);
            let radius = Math.min(this.get('width'), this.get('height')) / 2;

            this.setCircular(sectionId, {
                circular: val || !section.circular,
                radius: radius
            });
        }
    },
    getCircleSashData: function (sectionId) {
        let root;
        let section = this.getSection(sectionId);
        let result = {};

        result.sashParams = section.sashParams;
        result.edges = {
            top: !!section.mullionEdges.top || false,
            right: !!section.mullionEdges.right || false,
            bottom: !!section.mullionEdges.bottom || false,
            left: !!section.mullionEdges.left || false
        };

        // If we have a mullions all around the sash — it's rectangle!
        // If we have no mullions around the sash — it's a circle!
        // But if we have mullions at few edges — it's an arc!
        if (result.edges.top === result.edges.right &&
            result.edges.top === result.edges.bottom &&
            result.edges.top === result.edges.left
        ) {
            result.type = (result.edges.top === true) ? 'rect' : 'circle';
        } else {
            result.type = 'arc';
        }

        // In this method we calculate the same data for arc and circle
        // But other methods could use this helpful information about type.
        // For example, it used in unit-drawer.js
        if (result.type === 'circle' || result.type === 'arc') {
            root = this.generateFullRoot();

            result.circle = {
                x: root.sashParams.x,
                y: root.sashParams.y
            };
            result.radius = Math.min(root.sashParams.width, root.sashParams.height) / 2;
        }

        return result;
    },
    setSectionSashType: function (sectionId, type) {
        if (!_.includes(SASH_TYPES, type)) {
            console.error('Unrecognized sash type: ' + type);
            return;
        }

        let full = this.generateFullRoot();
        let fullSection = findSection(full, sectionId);

        // Update section
        this._updateSection(sectionId, function (section) {
            section.sashType = type;
            section.measurements.opening = false;
            section.measurements.glass = false;
        });

        //  Change all nested sections recursively
        _.each(fullSection.sections, function (childSection) {
            this.setSectionSashType(childSection.id, 'fixed_in_frame');
        }, this);
    },
    setSectionBars: function (sectionId, bars) {
        this._updateSection(sectionId, function (section) {
            section.bars = bars;
        });
    },
    setSectionMeasurements: function (sectionId, measurements) {
        this._updateSection(sectionId, function (section) {
            section.measurements = measurements;
        });
    },
    getMeasurementStates: function (type) {
        let defaults = {
            mullion: [{
                value: 'min',
                viewname: 'Without mullion'
            }, {
                value: 'center',
                viewname: 'Center of mullion',
                default: true
            }, {
                value: 'max',
                viewname: 'With mullion'
            }],
            frame: [{
                value: 'max',
                viewname: 'With frame',
                default: true
            }, {
                value: 'min',
                viewname: 'Without frame'
            }]
        };

        return defaults[type];
    },
    getMeasurementEdges: function (section_id, type) {
        let section_data = this.getSection(section_id);
        let edges = {top: 'frame', right: 'frame', bottom: 'frame', left: 'frame'};

        _.each(section_data.mullionEdges, function (edge, key) {
            edges[key] = 'mullion';
        });

        if (type) {
            if (type === 'vertical' || type === 'vertical_invisible') {
                delete edges.top;
                delete edges.bottom;
            } else {
                delete edges.left;
                delete edges.right;
            }
        }

        return edges;
    },
    getInvertedMeasurementVal: function (val) {
        return (val === 'min') ? 'max' :
            (val === 'max') ? 'min' :
                (val === 'center') ? 'center' :
                    val;
    },
    getBar: function (sectionId, id) {
        let found = null;
        let section = this.getSection(sectionId);

        _.each(section.bars, function (arr) {
            _.each(arr, function (bar) {
                if (bar.id === id) {
                    found = bar;
                    return;
                }
            });
        });

        return found;
    },
    // @TODO: Add method, that checks for correct values of measurement data
    // @TODO: Add method, that drops measurement data to default
    setFillingType: function (sectionId, type, name) {
        if (!_.includes(FILLING_TYPES, type)) {
            console.error('Unknow filling type: ' + type);
            return;
        }

        this._updateSection(sectionId, function (section) {
            section.fillingType = type;
            section.fillingName = name;
        });

        //  We also change all nested sections recursively
        let full = this.generateFullRoot();
        let fullSection = findSection(full, sectionId);

        _.each(fullSection.sections, function (childSection) {
            this.setFillingType(childSection.id, type, name);
        }, this);
    },
    setSectionMullionPosition: function (id, pos) {
        this._updateSection(id, function (section) {
            if (section.minPosition && section.minPosition > pos) {
                pos = section.minPosition;
            }

            section.position = parseFloat(pos);
        });
    },
    removeMullion: function (sectionId) {
        this._updateSection(sectionId, function (section) {
            section.divider = null;
            section.sections = [];
            section.position = null;
        });
    },
    removeSash: function (sectionId) {
        let glazing_name = this.get('glazing');
        let profile_id = this.profile && this.profile.id;
        this._updateSection(sectionId, function (section) {
            section.sashType = 'fixed_in_frame';
            _.assign(section, getDefaultFillingType(glazing_name, profile_id));
            section.divider = null;
            section.sections = [];
            section.position = null;
        });
    },
    splitSection: function (sectionId, type) {
        if (!_.includes(MULLION_TYPES, type)) {
            console.error('Unknow mullion type', type);
            return;
        }

        this._updateSection(sectionId, function (section) {

            let full = this.generateFullRoot();
            let fullSection = findSection(full, sectionId);
            let measurementType = getInvertedDivider(type).replace(/_invisible/, '');
            let position;

            if (type === 'horizontal' || type === 'horizontal_invisible') {
                position = fullSection.openingParams.y + fullSection.openingParams.height / 2;

                if (this.isTrapezoid()) {
                    let corners = this.getMainTrapezoidInnerCorners();
                    let crossing = this.getLineCrossingY(position, corners.left, corners.right);
                    let heights = this.getTrapezoidHeights();
                    let width = this.getInMetric('width', 'mm');
                    let minHeight = (heights.left > heights.right) ? heights.right : heights.left;
                    let maxHeight = (heights.left < heights.right) ? heights.right : heights.left;

                    if (crossing >= -100 && crossing <= width + 100) {
                        position = maxHeight - minHeight + 200;
                        section.minPosition = position;

                        if (position > fullSection.sashParams.y + fullSection.sashParams.height) {
                            return false;
                        }
                    }
                }
                // section.position = position;
            } else {
                position = fullSection.openingParams.x + fullSection.openingParams.width / 2;
            }

            section.divider = type;
            section.sections = [getSectionDefaults(), getSectionDefaults()];
            // Drop mullion dimension-points
            section.measurements.mullion = {};
            section.measurements.mullion[measurementType] = ['center', 'center'];
            // Drop overlay glassSize metrics (openingSize still actually)
            section.measurements.glass = false;

            // Reset bars parameter
            section.bars = getDefaultBars();

            if (section.fillingType && section.fillingName) {
                section.sections[0].fillingType = section.sections[1].fillingType = section.fillingType;
                section.sections[0].fillingName = section.sections[1].fillingName = section.fillingName;
            }

            section.position = position;

        }.bind(this));
    },
    // after full calulcalation section will be something like:
    // {
    //     id: 5,
    //     sashType: 'none', // top-right, top-left, none, top, right, left, slide-right, slide-left
    //     panelType: 'glass' // or 'solid'. works for doors
    //     openingParams: { x, y, width, height },
    //     divider: 'vertical',    // or horizontal
    //     position: 50,       // position of center of mullion from top left point of unit
    //     sections: [{
    //         id: 6,
    //         mullionEdges : {right : true},
    //         openingParams: {}
    //     }, {
    //         id: 7,
    //         mullionEdges : {left : true},
    //         openingParams: {}
    //     }]
    // }
    generateFullRoot: function (rootSection, openingParams) {
        rootSection = rootSection || JSON.parse(JSON.stringify(this.get('root_section')));
        let defaultParams = {
            x: 0,
            y: 0,
            width: this.getInMetric('width', 'mm'),
            height: this.getInMetric('height', 'mm')
        };

        if (rootSection.id === this.get('root_section').id) {
            defaultParams = {
                x: this.profile.get('frame_width'),
                y: this.profile.get('frame_width'),
                width: this.getInMetric('width', 'mm') - this.profile.get('frame_width') * 2,
                height: this.getInMetric('height', 'mm') - this.profile.get('frame_width') * 2
            };
        }

        if (rootSection.id === this.get('root_section').id &&
            this.profile.isThresholdPossible() &&
            this.profile.get('low_threshold')) {
            defaultParams = {
                x: this.profile.get('frame_width'),
                y: this.profile.get('frame_width'),
                width: this.getInMetric('width', 'mm') - this.profile.get('frame_width') * 2,
                height: this.getInMetric('height', 'mm') -
                this.profile.get('frame_width') - this.profile.get('threshold_width')
            };
            rootSection.thresholdEdge = true;
        }

        openingParams = openingParams || defaultParams;
        rootSection.openingParams = openingParams;
        rootSection.mullionEdges = rootSection.mullionEdges || {};
        rootSection.glassParams = {};
        rootSection.sashParams = {};

        let hasFrame = (rootSection.sashType !== 'fixed_in_frame');
        let topOverlap = 0;
        let bottomOverlap = 0;
        let leftOverlap = 0;
        let rightOverlap = 0;
        let frameOverlap = this.profile.get('sash_frame_overlap');
        let mullionOverlap = this.profile.get('sash_mullion_overlap');
        let thresholdOverlap = mullionOverlap;

        if (hasFrame) {
            topOverlap = rootSection.mullionEdges.top ? mullionOverlap : frameOverlap;
            bottomOverlap = rootSection.mullionEdges.bottom ? mullionOverlap : frameOverlap;

            if (rootSection.mullionEdges.left === 'vertical') {
                leftOverlap = mullionOverlap;
            } else if (rootSection.mullionEdges.left === 'vertical_invisible') {
                leftOverlap = this.profile.get('mullion_width') / 2;
            } else {
                leftOverlap = frameOverlap;
            }

            if (rootSection.mullionEdges.right === 'vertical') {
                rightOverlap = mullionOverlap;
            } else if (rootSection.mullionEdges.right === 'vertical_invisible') {
                rightOverlap = this.profile.get('mullion_width') / 2;
            } else {
                rightOverlap = frameOverlap;
            }
        }

        if (hasFrame && rootSection.thresholdEdge) {
            bottomOverlap = thresholdOverlap;
        }

        rootSection.sashParams.width = rootSection.openingParams.width + leftOverlap + rightOverlap;
        rootSection.sashParams.height = rootSection.openingParams.height + topOverlap + bottomOverlap;
        rootSection.sashParams.x = rootSection.openingParams.x - leftOverlap;
        rootSection.sashParams.y = rootSection.openingParams.y - topOverlap;

        let frameWidth = hasFrame ? this.profile.get('sash_frame_width') : 0;

        rootSection.glassParams.x = rootSection.sashParams.x + frameWidth;
        rootSection.glassParams.y = rootSection.sashParams.y + frameWidth;
        rootSection.glassParams.width = rootSection.sashParams.width - frameWidth * 2;
        rootSection.glassParams.height = rootSection.sashParams.height - frameWidth * 2;

        let position = rootSection.position;

        if (rootSection.sections && rootSection.sections.length) {
            let mullionAttrs = {
                x: null, y: null, width: null, height: null
            };

            if (rootSection.divider === 'vertical' || rootSection.divider === 'vertical_invisible') {
                mullionAttrs.x = position - this.profile.get('mullion_width') / 2;
                mullionAttrs.y = rootSection.glassParams.y;
                mullionAttrs.width = this.profile.get('mullion_width');
                mullionAttrs.height = rootSection.glassParams.height;

            } else {
                mullionAttrs.x = rootSection.glassParams.x;
                mullionAttrs.y = position - this.profile.get('mullion_width') / 2;
                mullionAttrs.width = rootSection.glassParams.width;
                mullionAttrs.height = this.profile.get('mullion_width');
            }

            rootSection.mullionParams = mullionAttrs;
        }

        // Vars for use in the following map callback
        let parentHasFrame = hasFrame;
        let isParentLeft = openingParams.isLeft;
        let isParentRight = openingParams.isRight;
        let isParentTop = openingParams.isTop;
        let isParentBottom = openingParams.isBottom;
        rootSection.sections = _.map(rootSection.sections, function (sectionData, i) {
            let sectionParams = {
                x: null, y: null, width: null, height: null
            };
            let isVertical = rootSection.divider === 'vertical' || rootSection.divider === 'vertical_invisible';
            let isHorizontal = rootSection.divider === 'horizontal' || rootSection.divider === 'horizontal_invisible';
            let isFirst = i === 0;
            let isLeft = isVertical && !isFirst;  // Is this left section when looking from outside?
            let isRight = isVertical && isFirst;
            let isTop = isHorizontal && isFirst;
            let isBottom = isHorizontal && !isFirst;
            let isDoorProfile = this.isDoorType();
            let sashFrameWidth = this.profile.get('sash_frame_width');
            let sashFrameOverlap = this.profile.get('sash_frame_overlap');
            let sashMullionOverlap = this.profile.get('sash_mullion_overlap');
            let mullionWidth = this.profile.get('mullion_width');
            let sashFrameGlassOverlap = sashFrameWidth - sashFrameOverlap;
            let overlapDifference = sashFrameOverlap - sashMullionOverlap;
            let trim = function (amount, sides) {
                if (sides === 'all') {
                    sides = ['top', 'right', 'bottom', 'left'];
                }
                if (_.isString(sides)) {
                    sides = [sides];
                }

                sides.forEach(function (side) {
                    if (side === 'top') {
                        sectionParams.y += amount;
                        sectionParams.height -= amount;
                    } else if (side === 'right') {
                        sectionParams.x += amount;
                        sectionParams.width -= amount;
                    } else if (side === 'bottom') {
                        sectionParams.height -= amount;
                    } else if (side === 'left') {
                        sectionParams.width -= amount;
                    }
                });
            };

            // Set section data & glass sizes
            sectionData.mullionEdges = _.clone(rootSection.mullionEdges);
            sectionData.thresholdEdge = rootSection.thresholdEdge;
            sectionData.parentId = rootSection.id;
            sectionParams.x = openingParams.x;
            sectionParams.y = openingParams.y;

            if (isLeft) {
                sectionParams.x = position + mullionWidth / 2;
                sectionParams.width = openingParams.width + openingParams.x -
                    position - mullionWidth / 2;
                sectionParams.height = openingParams.height;
                sectionData.mullionEdges.left = rootSection.divider;


            } else if (isRight) {
                sectionParams.width = position - rootSection.openingParams.x - mullionWidth / 2;
                sectionParams.height = openingParams.height;
                sectionData.mullionEdges.right = rootSection.divider;
            } else if (isTop) {
                sectionParams.width = openingParams.width;
                sectionParams.height = position - rootSection.openingParams.y - mullionWidth / 2;
                sectionData.mullionEdges.bottom = rootSection.divider;
                sectionData.thresholdEdge = false;
            } else if (isBottom) {
                sectionParams.y = position + mullionWidth / 2;
                sectionParams.width = openingParams.width;
                sectionParams.height = openingParams.height + openingParams.y - position -
                    mullionWidth / 2;
                sectionData.mullionEdges.top = rootSection.divider;
            }
            // Trim glasses inside subdivided framed sashes
            if (isLeft && parentHasFrame) {
                trim(sashFrameGlassOverlap, ['bottom', 'left', 'top']);
            } else if (isRight && parentHasFrame) {
                trim(sashFrameGlassOverlap, ['top', 'right', 'bottom']);
            } else if (isTop && parentHasFrame) {
                trim(sashFrameGlassOverlap, ['left', 'top', 'right']);
            } else if (isBottom && parentHasFrame) {
                trim(sashFrameGlassOverlap, ['right', 'bottom', 'left']);
            }

            // Trim glasses inside subdivided framed sashes in door profiles
            if (isDoorProfile && parentHasFrame && (isLeft || isRight)) {
                trim(overlapDifference, 'bottom');
            } else if (isDoorProfile && parentHasFrame && isBottom) {
                trim(overlapDifference, 'bottom');
            }

            // Trim glasses inside subdivided framed sashes overlapping a parent mullion on one side
            if (parentHasFrame && isParentLeft && (isTop || isBottom || isRight)) {
                trim(overlapDifference, 'right');
            } else if (parentHasFrame && isParentRight && (isTop || isBottom || isLeft)) {
                trim(overlapDifference, 'left');
            } else if (parentHasFrame && isParentTop && (isLeft || isRight || isBottom)) {
                trim(overlapDifference, 'bottom');
            } else if (parentHasFrame && isParentBottom && (isLeft || isRight || isTop)) {
                trim(overlapDifference, 'top');
            }

            // Save data to be referred as parent data in child sections
            sectionParams.isLeft = isLeft;
            sectionParams.isRight = isRight;
            sectionParams.isTop = isTop;
            sectionParams.isBottom = isBottom;

            return this.generateFullRoot(sectionData, sectionParams);
        }.bind(this));
        return rootSection;
    },
    generateFullReversedRoot: function (rootSection) {
        rootSection = rootSection || this.generateFullRoot();
        let width = this.getInMetric('width', 'mm');

        rootSection.openingParams.x = width - rootSection.openingParams.x - rootSection.openingParams.width;
        rootSection.glassParams.x = width - rootSection.glassParams.x - rootSection.glassParams.width;
        rootSection.sashParams.x = width - rootSection.sashParams.x - rootSection.sashParams.width;

        if (rootSection.divider === 'vertical' || rootSection.divider === 'vertical_invisible') {
            rootSection.position = width - rootSection.position;
            rootSection.sections = rootSection.sections.reverse();
            rootSection.mullionParams.x = width - rootSection.mullionParams.x - this.profile.get('mullion_width');
        }

        if (rootSection.divider === 'horizontal' || rootSection.divider === 'horizontal_invisible') {
            rootSection.mullionParams.x = width - rootSection.mullionParams.x - rootSection.mullionParams.width;
        }

        let type = rootSection.sashType;

        if (type.indexOf('left') >= 0) {
            type = type.replace('left', 'right');
        } else if (type.indexOf('right') >= 0) {
            type = type.replace('right', 'left');
        }

        rootSection.sashType = type;
        rootSection.sections = _.map(rootSection.sections, function (sectionData) {
            let temp = sectionData.mullionEdges.left;

            sectionData.mullionEdges.left = sectionData.mullionEdges.right;
            sectionData.mullionEdges.right = temp;
            return this.generateFullReversedRoot(sectionData);
        }.bind(this));
        return rootSection;
    },
    // it is not possible to add sash inside another sash
    // so this function check all parent
    canAddSashToSection: function (sectionId) {
        let fullRoot = this.generateFullRoot();
        let section = findSection(fullRoot, sectionId);

        if (section.parentId === undefined) {
            return true;
        }

        let parentSection = findSection(fullRoot, section.parentId);

        if (parentSection.sashType !== 'fixed_in_frame') {
            return false;
        }

        return this.canAddSashToSection(section.parentId);
    },
    flatterSections: function (rootSection) {
        rootSection = rootSection || this.get('root_section');
        let sections = [];

        if (rootSection.sections) {
            sections = _.concat(_.map(rootSection.sections, function (s) {
                return this.flatterSections(s);
            }));
        } else {
            sections = [rootSection];
        }

        return sections;
    },
    getMullions: function (rootSection) {
        rootSection = rootSection || this.get('root_section');
        let mullions = [];

        if (rootSection.sections && rootSection.sections.length) {
            mullions.push({
                type: rootSection.divider,
                position: rootSection.position,
                id: rootSection.id,
                sections: [rootSection.sections[0], rootSection.sections[1]]
            });

            let submullions = _.map(rootSection.sections, function (s) {
                return this.getMullions(s);
            }.bind(this));

            mullions = mullions.concat(submullions);
        } else {
            mullions = [];
        }

        return _.flatten(mullions);
    },
    getRevertedMullions: function () {
        return this.getMullions(this.generateFullReversedRoot());
    },
    getMullion: function (id) {
        return _.find(this.getMullions(), function (mullion) {
            return mullion.id === id;
        });
    }, getInMetric: function (attr, metric) {
        if (!metric || (['mm', 'inches'].indexOf(metric) === -1)) {
            throw new Error('Set metric! "mm" or "inches"');
        }

        if (metric === 'inches') {
            return this.get(attr);
        }

        return utils.convert.inches_to_mm(this.get(attr));
    },
    //  Inches by default, mm optional
    updateDimension: function (attr, val, metric) {
        let rootSection = this.get('root_section');
        let possible_metrics = ['mm', 'inches'];
        let possible_dimensions = ['width', 'height', 'height_max', 'height_min'];

        if (!attr || possible_dimensions.indexOf(attr) === -1) {
            throw new Error('Wrong dimension. Possible values: ' + possible_dimensions.join(', '));
        }

        if (metric && possible_metrics.indexOf(metric) === -1) {
            throw new Error('Wrong metric. Possible values: ' + possible_metrics.join(', '));
        }

        // Convert to inches if metric is present and it isn't inches. No metric means inches
        if (_.isArray(val) && (metric && metric !== 'inches')) {
            val = val.map(utils.convert.mm_to_inches);
        } else if (metric && metric !== 'inches') {
            val = utils.convert.mm_to_inches(val);
        }

        if (this.getCircleRadius() !== null) {
            let full_root = this.generateFullRoot();

            this.setCircular(full_root.id, {
                radius: val / 2
            });
        } else if (attr === 'height' && _.isArray(val) && val.length > 1) {
            rootSection.trapezoidHeights = [val[0], val[1]];
            rootSection.circular = false;
            rootSection.arched = false;
            let params = {
                corners: this.getMainTrapezoidInnerCorners(),
                minHeight: (val[0] > val[1]) ? val[1] : val[0],
                maxHeight: (val[0] < val[1]) ? val[1] : val[0]
            };

            this.checkHorizontalSplit(rootSection, params);
            this.persist(attr, (val[0] > val[1]) ? val[0] : val[1]);
        } else if (attr === 'height' && !_.isArray(val) && this.isTrapezoid()) {
            rootSection.trapezoidHeights = false;
            this.persist('height', val);
        } else if (attr === 'height_max') {
            if (this.isTrapezoid()) {
                this.updateTrapezoidHeight('max', val);
            } else {
                this.persist('height', val);
            }
        } else if (attr === 'height_min') {
            this.updateTrapezoidHeight('min', val);
        } else {
            this.persist(attr, val);
        }
    },
    clearFrame: function () {
        let rootId = this.get('root_section').id;
        let profile_id = this.profile && this.profile.id;
        let glazing_name = this.get('glazing');

        //  Similar to removeMullion but affects more properties
        this._updateSection(rootId, function (section) {
            section.divider = null;
            section.sections = [];
            section.position = null;
            section.sashType = 'fixed_in_frame';
            _.assign(section, getDefaultFillingType(glazing_name, profile_id));
        });
    },
    //  Here we get a list with basic sizes for each piece of the unit:
    //  frame, sashes, mullions, openings, glasses. Each piece got width,
    //  height, and some also got frame_width
    getSizes: function (current_root) {
        current_root = current_root || this.generateFullRoot();

        let result = {
            sashes: [],
            glasses: [],
            openings: [],
            mullions: [],
            glazing_bars: []
        };

        if (!result.frame) {
            result.frame = {
                width: utils.convert.inches_to_mm(this.get('width')),
                height: utils.convert.inches_to_mm(this.get('height')),
                frame_width: this.profile.get('frame_width')
            };
        }

        _.each(current_root.sections, function (sec) {
            let subSizes = this.getSizes(sec);

            result.sashes = result.sashes.concat(subSizes.sashes);
            result.glasses = result.glasses.concat(subSizes.glasses);
            result.openings = result.openings.concat(subSizes.openings);
            result.mullions = result.mullions.concat(subSizes.mullions);
            result.glazing_bars = result.glazing_bars.concat(subSizes.glazing_bars);
        }, this);

        if (current_root.sections.length === 0) {
            result.glasses.push({
                name: current_root.fillingName,
                type: current_root.fillingType,
                width: current_root.glassParams.width,
                height: current_root.glassParams.height
            });
        }

        if (current_root.divider) {
            result.mullions.push({
                type: current_root.divider,
                width: current_root.mullionParams.width,
                height: current_root.mullionParams.height
            });
        }

        if (current_root.bars.horizontal.length) {
            _.each(current_root.bars.horizontal, function () {
                result.glazing_bars.push({
                    type: 'horizontal',
                    width: current_root.glassParams.width,
                    height: this.get('glazing_bar_width'),
                    intersections: current_root.bars.vertical.length
                });
            }, this);
        }

        if (current_root.bars.vertical.length) {
            _.each(current_root.bars.vertical, function () {
                result.glazing_bars.push({
                    type: 'vertical',
                    width: this.get('glazing_bar_width'),
                    height: current_root.glassParams.height,
                    intersections: current_root.bars.horizontal.length
                });
            }, this);
        }

        if (current_root.sashType !== 'fixed_in_frame') {
            result.sashes.push({
                width: current_root.sashParams.width,
                height: current_root.sashParams.height,
                frame_width: this.profile.get('sash_frame_width')
            });

            result.openings.push({
                width: current_root.openingParams.width,
                height: current_root.openingParams.height
            });
        }

        return result;
    },
    hasBaseFilling: function () {
        let has_base_filling = false;
        let sizes = this.getSizes();

        if (App.settings && App.settings.filling_types) {
            _.find(sizes.glasses, function (glass) {
                let is_base = App.settings.filling_types.find(function (filling) {
                    return filling.get('name') === glass.name && filling.get('is_base_type') === true;
                });

                if (is_base) {
                    has_base_filling = true;
                    return true;
                }
            });
        }

        return has_base_filling;
    },
    //  Get linear and area size stats for various parts of the window.
    //  These values could be used as a base to calculate estimated
    //  cost of options for the unit
    getLinearAndAreaStats: function () {
        let profileWeight = this.profile.get('weight_per_length');
        let fillingWeight = {};

        if (App.settings && App.settings.filling_types) {
            App.settings.filling_types.each(function (filling) {
                fillingWeight[filling.get('name')] = filling.get('weight_per_area');
            });
        }

        let sizes = this.getSizes();
        let result = {
            frame: {
                linear: 0,
                linear_without_intersections: 0,
                area: 0,
                area_both_sides: 0
            },
            sashes: {
                linear: 0,
                linear_without_intersections: 0,
                area: 0,
                area_both_sides: 0
            },
            glasses: {
                area: 0,
                area_both_sides: 0,
                weight: 0
            },
            openings: {
                area: 0
            },
            mullions: {
                linear: 0,
                area: 0,
                area_both_sides: 0
            },
            glazing_bars: {
                linear: 0,
                linear_without_intersections: 0,
                area: 0,
                area_both_sides: 0
            },
            profile_total: {
                linear: 0,
                linear_without_intersections: 0,
                area: 0,
                area_both_sides: 0,
                weight: 0
            },
            unit_total: {
                weight: 0
            }
        };

        function getProfilePerimeter(width, height) {
            return (width + height) * 2;
        }

        function getProfilePerimeterWithoutIntersections(width, height, frame_width) {
            return (width + height) * 2 - frame_width * 4;
        }

        function getBarLengthWithoutIntersections(length, bar_width, intersections_number) {
            return length - bar_width * intersections_number;
        }

        function getArea(width, height) {
            return utils.math.square_meters(width, height);
        }

        result.frame.linear = getProfilePerimeter(sizes.frame.width, sizes.frame.height);
        result.frame.linear_without_intersections =
            getProfilePerimeterWithoutIntersections(sizes.frame.width, sizes.frame.height, sizes.frame.frame_width);
        result.frame.area = getArea(result.frame.linear_without_intersections, sizes.frame.frame_width);
        result.frame.area_both_sides = result.frame.area * 2;

        _.each(sizes.sashes, function (sash) {
            let sash_perimeter = getProfilePerimeter(sash.width, sash.height);
            let sash_perimeter_without_intersections =
                getProfilePerimeterWithoutIntersections(sash.width, sash.height, sash.frame_width);

            result.sashes.linear += sash_perimeter;
            result.sashes.linear_without_intersections += sash_perimeter_without_intersections;
            result.sashes.area += getArea(sash_perimeter_without_intersections, sash.frame_width);
            result.sashes.area_both_sides += getArea(sash_perimeter_without_intersections, sash.frame_width) * 2;
        });

        _.each(sizes.mullions, function (mullion) {
            if (mullion.type === 'vertical') {
                result.mullions.linear += mullion.height;
                result.mullions.area += getArea(mullion.height, mullion.width);
                result.mullions.area_both_sides += getArea(mullion.height, mullion.width) * 2;
            } else {
                result.mullions.linear += mullion.width;
                result.mullions.area += getArea(mullion.width, mullion.height);
                result.mullions.area_both_sides += getArea(mullion.width, mullion.height) * 2;
            }
        });

        _.each(sizes.glazing_bars, function (bar) {
            if (bar.type === 'vertical') {
                result.glazing_bars.linear += bar.height;
                result.glazing_bars.linear_without_intersections += bar.height;
                result.glazing_bars.area += getArea(bar.height, bar.width);
                result.glazing_bars.area_both_sides += getArea(bar.height, bar.width) * 2;
            } else {
                result.glazing_bars.linear += bar.width;
                result.glazing_bars.linear_without_intersections +=
                    getBarLengthWithoutIntersections(bar.width, bar.height, bar.intersections);
                result.glazing_bars.area += getArea(bar.width, bar.height);
                result.glazing_bars.area_both_sides += getArea(bar.width, bar.height) * 2;
            }
        });

        _.each(sizes.openings, function (opening) {
            result.openings.area += getArea(opening.width, opening.height);
        });

        let hasBaseFilling = this.hasBaseFilling();

        _.each(sizes.glasses, function (glass) {
            let area = getArea(glass.width, glass.height);

            result.glasses.area += area;
            result.glasses.area_both_sides += getArea(glass.width, glass.height) * 2;

            if (fillingWeight[glass.name]) {
                result.glasses.weight += area * fillingWeight[glass.name];
            }
        });

        result.profile_total.linear = result.frame.linear + result.sashes.linear + result.mullions.linear;
        result.profile_total.linear_without_intersections = result.frame.linear_without_intersections +
            result.sashes.linear_without_intersections + result.mullions.linear;
        result.profile_total.area = result.frame.area + result.sashes.area + result.mullions.area;
        result.profile_total.area_both_sides = result.profile_total.area * 2;
        result.profile_total.weight = (result.profile_total.linear / 1000) * profileWeight;

        //  Calculate total unit weight, but only if there are no base fillings
        if (hasBaseFilling) {
            result.glasses.weight = -1;
        } else {
            result.unit_total.weight = result.profile_total.weight + result.glasses.weight;
        }

        return result;
    },
    //  Returns sizes in mms
    getSashList: function (current_root, parent_root, reverse_hinges) {
        let current_sash = {
            opening: {},
            sash_frame: {},
            filling: {},
            sections: []
        };
        let section_result;
        let filling_type;
        let result = {
            sashes: [],
            sections: []
        };
        let type = 'sashes';

        current_root = current_root || this.generateFullRoot();
        current_sash.id = current_root.id;

        if (current_root.sashType !== 'fixed_in_frame') {
            type = 'sections';
        }

        _.each(current_root.sections, function (section) {
            section_result = this.getSashList(section, current_root, reverse_hinges);

            if (current_root.divider === 'vertical' || current_root.divider === 'vertical_invisible') {
                result[type] = section_result.concat(result[type]);
            } else {
                result[type] = result[type].concat(section_result);
            }
        }, this);

        if (_.indexOf(SASH_TYPES_WITH_OPENING, current_root.sashType) !== -1) {
            current_sash.opening.width = current_root.openingParams.width;
            current_sash.opening.height = current_root.openingParams.height;
            current_sash.sash_frame.width = current_root.sashParams.width;
            current_sash.sash_frame.height = current_root.sashParams.height;
        }

        if (current_root.sections.length === 0 ||
            ((current_root.sashType === 'fixed_in_frame') && (current_root.sections.length === 0)) ||
            ((current_root.sashType !== 'fixed_in_frame') && (current_root.sections.length))
        ) {
            current_sash.original_type = current_root.sashType;
            current_sash.type = this.getSashName(current_root.sashType, reverse_hinges);
            current_sash.filling.width = current_root.glassParams.width;
            current_sash.filling.height = current_root.glassParams.height;

            current_sash.divider = current_root.divider;

            if (current_root.fillingType && current_root.fillingName) {
                current_sash.filling.type = current_root.fillingType;
                current_sash.filling.name = current_root.fillingName;
            } else if (parent_root && parent_root.fillingType && parent_root.fillingName) {
                current_sash.filling.type = parent_root.fillingType;
                current_sash.filling.name = parent_root.fillingName;
                //  If there is no filling data provided for this section,
                //  we just show default filling info
            } else {
                let profile_id = this.profile && this.profile.id;
                let glazing_name = this.get('glazing');

                filling_type = getDefaultFillingType(glazing_name, profile_id);
                current_sash.filling.type = filling_type.fillingType;
                current_sash.filling.name = filling_type.fillingName;
            }

            if (current_root.sections.length) {
                current_sash.sections = result.sections;
            }

            result.sashes.unshift(current_sash);
        }

        return result.sashes;
    },
    //  This function is used to "slice" unit into a set of fixed and
    //  operable sections, meaning we just draw some imaginary lines so
    //  that each part of the unit should belong to some section. And for
    //  every sash, we not only use size of the sash itself, but add size
    //  of the surrounding frame (and sometimes mullion) to this "section",
    //  so each part of the unit belongs to some section, and we could use
    //  this list of sections as a source for cost estimation
    //
    //  Returns sizes in mms
    getFixedAndOperableSectionsList: function (current_root) {
        let profile = this.profile;
        let current_area = {};
        let section_result;
        let result = [];

        current_root = current_root || this.generateFullRoot();

        _.each(current_root.sections, function (section) {
            section_result = this.getFixedAndOperableSectionsList(section);

            if (current_root.divider === 'vertical' || current_root.divider === 'vertical_invisible') {
                result = section_result.concat(result);
            } else {
                result = result.concat(section_result);
            }
        }, this);

        if (_.indexOf(OPERABLE_SASH_TYPES, current_root.sashType) !== -1) {
            current_area.type = 'operable';
        } else {
            current_area.type = 'fixed';
        }

        if (current_root.sections.length === 0) {
            current_area.width = current_root.openingParams.width;
            current_area.height = current_root.openingParams.height;
            current_area.filling_name = current_root.fillingName;

            _.each(['top', 'right', 'bottom', 'left'], function (position) {
                let measurement = position === 'top' || position === 'bottom' ?
                    'height' : 'width';

                if (current_root.mullionEdges[position]) {
                    current_area[measurement] += profile.get('mullion_width') / 2;
                } else {
                    current_area[measurement] += profile.get('frame_width');
                }

            }, this);

            if (current_root.thresholdEdge) {
                current_area.height -= profile.get('frame_width');
                current_area.height += profile.get('threshold_width');
            }

            result.unshift(current_area);
        }

        return result;
    },
    getUnitOptionsGroupedByPricingScheme: function () {
        let connected_options = this.getCurrentUnitOptions();
        let profile_id = this.profile.id;
        let result = {};

        result[PRICING_SCHEME_PRICING_GRIDS] = [];
        result[PRICING_SCHEME_PER_ITEM] = [];
        result[PRICING_SCHEME_LINEAR_EQUATION] = [];

        _.each(connected_options, function (option) {
            let pricing_data = option.entry.getPricingDataForProfile(profile_id);

                if ( !option.is_restricted && pricing_data && pricing_data.scheme !== PRICING_SCHEME_NONE ) {
                    result[pricing_data.scheme].push({
                        dictionary_name: option.dictionary.get('name'),
                        is_hidden: option.dictionary.get('is_hidden'),option_name: option.entry.get('name'),
                        pricing_data: pricing_data,
                        has_quantity: option.has_quantity,
                        quantity: option.quantity
                    });
                }
            }, this);

        return result;
    },
    getSectionsListWithEstimatedCost: function () {
        let profile_pricing_data = this.profile.getPricingData();
        let sections_list = this.getFixedAndOperableSectionsList();
        let options_grouped_by_scheme = this.getUnitOptionsGroupedByPricingScheme();


        _.each(sections_list, function (section) {
            section.price_per_square_meter = 0;

            section.base_cost = 0;

            //  Add base cost for profile
            if (profile_pricing_data && profile_pricing_data.scheme === PRICING_SCHEME_PRICING_GRIDS) {
                section.price_per_square_meter = profile_pricing_data.pricing_grids.getValueForGrid(section.type,
                        {
                            height: section.height,
                            width: section.width
                        }) || 0;

                section.base_pricing_scheme = PRICING_SCHEME_PRICING_GRIDS;
                section.base_cost = utils.math.square_meters(section.width, section.height) *
                    section.price_per_square_meter;
            } else if (profile_pricing_data && profile_pricing_data.scheme === PRICING_SCHEME_LINEAR_EQUATION) {
                let params_source = profile_pricing_data.pricing_equation_params.getByName(section.type);
                let profile_param_a = params_source.get('param_a') || 0;
                let profile_param_b = params_source.get('param_b') || 0;

                section.base_pricing_scheme = PRICING_SCHEME_LINEAR_EQUATION;
                section.base_cost =
                    profile_param_a * section.height / 1000 * section.width / 1000 + profile_param_b;
            }

            section.filling_price_increase = 0;
            section.filling_cost = 0;

            //  Add cost increase for fillings
            if (App.settings && App.settings.filling_types) {
                let filling_type = App.settings.filling_types.getByName(section.filling_name);
                let ft_pricing_data = filling_type &&
                    filling_type.getPricingDataForProfile(this.profile.id);

                //  If we have correct pricing scheme and data for filling
                if (ft_pricing_data && ft_pricing_data.scheme === PRICING_SCHEME_PRICING_GRIDS) {
                    section.filling_price_increase = ft_pricing_data.pricing_grids.getValueForGrid(
                            section.type,
                            {
                                height: section.height,
                                width: section.width
                            }
                        ) || 0;
                    section.filling_pricing_scheme = PRICING_SCHEME_PRICING_GRIDS;
                    section.filling_cost = section.base_cost * section.filling_price_increase / 100;
                } else if (ft_pricing_data && ft_pricing_data.scheme === PRICING_SCHEME_LINEAR_EQUATION) {
                    let ft_params_source = ft_pricing_data.pricing_equation_params.getByName(section.type);
                    let ft_param_a = ft_params_source.get('param_a') || 0;
                    let ft_param_b = ft_params_source.get('param_b') || 0;

                    section.filling_pricing_scheme = PRICING_SCHEME_LINEAR_EQUATION;
                    section.filling_cost =
                        ft_param_a * section.height / 1000 * section.width / 1000 + ft_param_b;
                }
            }

            section.options_cost = 0;
            section.options = [];

            //  Now add costs for all grid-based options
            _.each(options_grouped_by_scheme[PRICING_SCHEME_PRICING_GRIDS], function (option_data) {
                let option_pricing_data = option_data.pricing_data;
                let option_cost = 0;
                let price_increase = option_pricing_data.pricing_grids.getValueForGrid(
                        section.type,
                        {
                            height: section.height,
                            width: section.width
                        }
                    ) || 0;

                option_cost = section.base_cost * price_increase / 100;
                section.options_cost += option_cost;

                    section.options.push({
                        dictionary_name: option_data.dictionary_name,
                        dictionary_pricing_scheme: PRICING_SCHEME_PRICING_GRIDS,
                        is_hidden: option_data.is_hidden,option_name: option_data.option_name,
                        price_increase: price_increase,
                        cost: option_cost
                    });
                }, this);

            //  Add costs for options with equation-based pricing
            _.each(options_grouped_by_scheme[PRICING_SCHEME_LINEAR_EQUATION], function (option_data) {
                let option_pricing_data = option_data.pricing_data.pricing_equation_params.getByName(section.type);
                let option_cost = 0;
                let param_a = option_pricing_data.get('param_a') || 0;
                let param_b = option_pricing_data.get('param_b') || 0;
                let price_increase = 0;

                option_cost = param_a * section.height / 1000 * section.width / 1000 + param_b;
                section.options_cost += option_cost;

                    section.options.push({
                        dictionary_name: option_data.dictionary_name,
                        dictionary_pricing_scheme: PRICING_SCHEME_LINEAR_EQUATION,
                        is_hidden: option_data.is_hidden,option_name: option_data.option_name,
                        price_increase: price_increase,
                        cost: option_cost
                    });
                }, this);

            section.total_cost = section.base_cost + section.filling_cost + section.options_cost;
        }, this);

        return sections_list;
    },
    getEstimatedUnitCost: function () {
        let sections_list = this.getSectionsListWithEstimatedCost();
        let options_list = this.getUnitOptionsGroupedByPricingScheme();
        let unit_cost = {
            total: 0,
            base: 0,
            fillings: 0,
            options: 0, sections_list: sections_list,
            options_list: options_list,
            real_cost: {
                total: this.get('original_cost'),
                difference: 0
            }
        };

        _.each(sections_list, function (section) {
            unit_cost.total += section.total_cost;
            unit_cost.base += section.base_cost;
            unit_cost.fillings += section.filling_cost;
            unit_cost.options += section.options_cost;
        }, this);

        //  Now add cost for all per-item priced options
        _.each(options_list[PRICING_SCHEME_PER_ITEM], function (option) {
            unit_cost.total += option.pricing_data.cost_per_item * option.quantity;
            unit_cost.options += option.pricing_data.cost_per_item * option.quantity;
        }, this);

        unit_cost.real_cost.difference = unit_cost.total ?
            (unit_cost.real_cost.total - unit_cost.total) / unit_cost.total * 100 :
            (unit_cost.real_cost.total ? 100 : 0);
        return unit_cost;
    },
    //  Check if unit has at least one operable section. This could be used
    //  to determine whether we should allow editing handles and such stuff
    hasOperableSections: function (current_root) {
        let has_operable_sections = false;

        current_root = current_root || this.generateFullRoot();

        if (_.contains(OPERABLE_SASH_TYPES, current_root.sashType)) {
            has_operable_sections = true;
        } else {
            _.each(current_root.sections, function (section) {
                let section_is_operable = has_operable_sections || this.hasOperableSections(section);

                if (section_is_operable) {
                    has_operable_sections = true;
                }
            }, this);
        }

        return has_operable_sections;
    },
    isOperableOnlyAttribute: function (attribute_name) {
        return _.indexOf(OPERABLE_ONLY_PROPERTIES, attribute_name) !== -1;
    },
    //  Check if any of unit sections has glazing bars. This could be used
    //  to determine whether we should allow editing related properties
    hasGlazingBars: function (current_root) {
        let has_glazing_bars = false;

        current_root = current_root || this.generateFullRoot();

        if (current_root.bars.horizontal.length > 0 || current_root.bars.vertical.length > 0) {
            has_glazing_bars = true;
        } else {
            _.each(current_root.sections, function (section) {
                let section_has_glazing_bars = has_glazing_bars || this.hasGlazingBars(section);

                if (section_has_glazing_bars) {
                    has_glazing_bars = true;
                }
            }, this);
        }

        return has_glazing_bars;
    },
    isGlazingBarProperty: function (attribute_name) {
        return _.indexOf(GLAZING_BAR_PROPERTIES, attribute_name) !== -1;
    },
    getInvertedDivider: function (type) {
        return getInvertedDivider(type);
    },
    isCircleWindow: function () {
        return (this.getCircleRadius() !== null);
    },
    isArchedWindow: function () {
        return (this.getArchedPosition() !== null);
    },
    isEgressEnabledType: function (sash_type) {
        return _.indexOf(EGRESS_ENABLED_TYPES, sash_type) !== -1;
    },
    //  Source is in mms. Result is in inches by default, millimeters optional
    getSashOpeningSize: function (openingSizes_mm, sizeType, sashType, result_metric) {
        let possible_metrics = ['mm', 'inches'];
        let c = utils.convert;
        let m = utils.math;
        let result;

        if (result_metric && possible_metrics.indexOf(result_metric) === -1) {
            throw new Error('Wrong metric. Possible values: ' + possible_metrics.join(', '));
        }

        //  Set inches by default
        if (!result_metric) {
            result_metric = 'inches';
        }

        if (sizeType === 'egress') {
            let clear_width_deduction = this.profile.get('clear_width_deduction');

            if (clear_width_deduction && this.isEgressEnabledType(sashType)) {
                openingSizes_mm.width -= clear_width_deduction;
            } else {
                return undefined;
            }
        }

        if (openingSizes_mm && openingSizes_mm.height && openingSizes_mm.width) {
            let opening_area = (result_metric === 'inches') ?
                m.square_feet(
                    c.mm_to_inches(openingSizes_mm.width),
                    c.mm_to_inches(openingSizes_mm.height)
                ) :
                m.square_meters(openingSizes_mm.width, openingSizes_mm.height);

            result = {
                height: (result_metric === 'inches') ?
                    c.mm_to_inches(openingSizes_mm.height) :
                    openingSizes_mm.height,
                width: (result_metric === 'inches') ?
                    c.mm_to_inches(openingSizes_mm.width) :
                    openingSizes_mm.width,
                area: opening_area
            };
        }

        return result;
    },
    //  Get list of options that are currently selected for this unit
    getCurrentUnitOptions: function () {
        let options_list = this.get('unit_options');
        let result = [];

        if (App.settings) {
            options_list.each(function (list_item) {
                let option_data = {
                    is_restricted: false,
                    restrictions: [],
                    has_quantity: false,
                    quantity: undefined
                };
                let target_dictionary = App.settings.dictionaries.get(list_item.get('dictionary_id'));

                if (target_dictionary) {
                    let target_entry = target_dictionary.entries.get(list_item.get('dictionary_entry_id'));

                    if (target_entry) {
                        option_data.dictionary = target_dictionary;
                        option_data.entry = target_entry;

                        _.each(target_dictionary.get('rules_and_restrictions'), function (rule) {
                            if (this.checkIfRestrictionApplies(rule)) {
                                option_data.is_restricted = true;
                                option_data.restrictions.push(rule);
                            }
                        }, this);

                        option_data.has_quantity = target_dictionary.hasQuantity();

                        if (option_data.has_quantity) {
                            option_data.quantity = list_item.get('quantity');
                        }
                        result.push(option_data);
                    }
                }
            }, this);
        }

        return result;
    },
    //  Get list of options that are currently selected for this unit,
    //  filtered by certain dictionary, e.g. "Interior Handle"
    getCurrentUnitOptionsByDictionaryId: function (dictionary_id) {
        return _.filter(this.getCurrentUnitOptions(), function (unit_option) {
            return unit_option.dictionary.id === dictionary_id;
        }, this);
    },
    //  Get list of all possible variants from a certain dictionary that
    //  could be selected for this unit
    //  TODO: why do we need this function in unit.js if we could call it
    //  on dictionary collection?
    getAvailableOptionsByDictionaryId: function (dictionary_id) {
        let result = [];
        let profile_id = this.profile && this.profile.id;

        if (App.settings && profile_id) {
            result = App.settings.dictionaries.getAvailableOptions(dictionary_id, profile_id, true);
        }

        return result;
    },
    checkIfRestrictionApplies: function (restriction) {
        let restriction_applies = false;

        if (restriction === 'DOOR_ONLY' && !this.isDoorType()) {
            restriction_applies = true;
        } else if (restriction === 'OPERABLE_ONLY' && !this.hasOperableSections()) {
            restriction_applies = true;
        } else if (restriction === 'GLAZING_BARS_ONLY' && !this.hasGlazingBars()) {
            restriction_applies = true;
        }

        return restriction_applies;
    },
    persistOption: function (dictionary_id, dictionary_entry_id, quantity) {
        let current_unit_options = this.get('unit_options');
        //  New collection contains options from all dictionaries except
        //  for the one we're going to update
        let new_unit_options = new UnitOptionCollection(current_unit_options.filter(function (unit_option) {
                return unit_option.get('dictionary_id') !== dictionary_id;
            }, this),
            {parse: true}
        );

        if (dictionary_entry_id) {
            new_unit_options.add({
                dictionary_id: dictionary_id,
                dictionary_entry_id: dictionary_entry_id,
                quantity: quantity || 1
            });

        }

            //  When arrays are the same, do nothing, otherwise persist
            if ( JSON.stringify(current_unit_options.toJSON()) !== JSON.stringify(new_unit_options.toJSON()) ) {
                this.get('unit_options').reset( new_unit_options.models);
            }
        },
        getParentProject: function () {
            return this.collection && this.collection.options.project;
        },
        getParentQuote: function () {
            return this.collection && this.collection.options.quote;
        },//  Check if this unit belongs to the project which is currently active
        isParentQuoteActive: function () {
            let is_active = false;

        if (App.current_quote && this.collection && this.collection.options.quote &&
            this.collection.options.quote === App.current_quote
        ) {
            is_active = true;
        }

        return is_active;
    },
    /* trapezoid start */
    isTrapezoid: function () {
        let root = this.generateFullRoot();

        return root.trapezoidHeights;
    },

    /* Determines if the unit has at least one horizontal mullion */
    hasHorizontalMullion: function () {
        return this.getMullions().reduce(function (previous, current) {
            return previous || (current.type === 'horizontal' || current.type === 'horizontal_invisible');
        }, false);
    },
    /* eslint-disable no-else-return */

    /* Determines the number of vertical metric columns on the unit drawing's left and right sides
     * Duplicates logic from MetricsDrawer /static/source/js/drawing/module/metrics-drawer.js */
    leftMetricCount: function (isInsideView) {

        // Inside view //

        // Trapezoid units have reversed metrics on the inside view, except for arched trapezoids
        if (isInsideView && this.isTrapezoid() && !this.isArchedWindow()) {
            return this.rightMetricCount();
        }

        // All views //

        // Trapezoid units always have one metric on the left
        if (this.isTrapezoid()) {
            return 1;

            // Arched units always have two metrics on the left
        } else if (this.isArchedWindow()) {
            return 2;

            // For regular units, at least one horizontal mullion adds the second metric
        } else {
            return (this.hasHorizontalMullion()) ? 2 : 1;
        }
    },

    /* Determines the number of vertical metric columns on the unit drawing's right side
     * Duplicates logic from MetricsDrawer /static/source/js/drawing/module/metrics-drawer.js */
    rightMetricCount: function (isInsideView) {

        // Inside view //

        // Trapezoid units have reversed metrics on the inside view, except for arched trapezoids
        if (isInsideView && this.isTrapezoid() && !this.isArchedWindow()) {
            return this.leftMetricCount();
        }

        // All views //

        // Arched trapezoid units always have two metrics on the right
        if (this.isTrapezoid() && this.isArchedWindow()) {
            return 2;

            // For regular trapezoid units, at least one horizontal mullion adds the second metric
        } else if (this.isTrapezoid()) {
            return (this.hasHorizontalMullion()) ? 2 : 1;

            // Non-trapezoid units don't have metrics on the right
        } else {
            return 0;
        }
    },
    /* eslint-enable no-else-return */
    getTrapezoidHeights: function (inside) {
        if (typeof inside !== 'undefined') {
            this.inside = inside;
        }

        let heights = this.get('root_section').trapezoidHeights;
        let left = utils.convert.inches_to_mm(heights[0]);
        let right = utils.convert.inches_to_mm(heights[1]);

        return (this.inside) ? {left: right, right: left} : {left: left, right: right};
    },
    getTrapezoidMaxHeight: function () {
        let heights = this.getTrapezoidHeights();

        return ( heights.left > heights.right ) ? heights.left : heights.right;
    },
    getTrapezoidInnerCorners: function (params) {
        let heights = params.heights;
        let width = params.width;
        let frameWidth = params.frameWidth;
        let maxHeight = params.maxHeight;
        let corners = {};

        if (typeof heights === 'object') {
            let cornerLeft = Math.abs(
                    ( Math.atan(( ( maxHeight - heights.right ) - ( maxHeight - heights.left ) ) / ( width - 0 )) -
                    Math.atan(( maxHeight - ( maxHeight - heights.left ) ) / ( 0 - 0 )) ) / Math.PI * 180
                ) / 2;
            let cornerRight = Math.abs(90 - cornerLeft);

            corners = {
                left: {
                    x: frameWidth,
                    y: maxHeight - heights.left + ( Math.tan(( 90 - cornerLeft ) / 180 * Math.PI) * frameWidth )
                },
                right: {
                    x: width - frameWidth,
                    y: maxHeight - heights.right + ( Math.tan(( 90 - cornerRight ) / 180 * Math.PI) * frameWidth )
                }
            };
        }

        return corners;
    },
    getMainTrapezoidInnerCorners: function () {
        return this.getTrapezoidInnerCorners({
            heights: this.getTrapezoidHeights(),
            width: this.getInMetric('width', 'mm'),
            frameWidth: this.profile.get('frame_width'),
            maxHeight: this.getTrapezoidMaxHeight()
        });
    },
    getTrapezoidCrossing: function (start, finish) {
        let corners = this.getMainTrapezoidInnerCorners();
        let x1 = start.x;
        let y1 = start.y;
        let x2 = finish.x;
        let y2 = finish.y;
        let x3 = corners.left.x;
        let y3 = corners.left.y;
        let x4 = corners.right.x;
        let y4 = corners.right.y;
        let diff = ( ( ( y4 - y3 ) * ( x2 - x1 ) ) - ( ( x4 - x3 ) * ( y2 - y1 ) ) );
        let Ua = ( ( ( x4 - x3 ) * ( y1 - y3 ) ) - ( ( y4 - y3 ) * ( x1 - x3 ) ) ) / diff;
        let Ub = ( ( ( x2 - x1 ) * ( y1 - y3 ) ) - ( ( y2 - y1 ) * ( x1 - x3 ) ) ) / diff;

        return ( Ua >= 0 && Ua <= 1 && Ub >= 0 && Ub <= 1 ) ?
            {x: x1 + ( Ua * (x2 - x1) ), y: y1 + ( Ua * (y2 - y1) )} :
            false;
    },
    getLineCrossingX: function (x, start, finish) {
        return ( 0 - ( ( start.y - finish.y ) * x ) - ( ( start.x * finish.y ) - ( finish.x * start.y ) ) ) /
            ( finish.x - start.x );
    },
    getLineCrossingY: function (y, start, finish) {
        return ( 0 - ( ( finish.x - start.x ) * y ) - ( ( start.x * finish.y ) - ( finish.x * start.y ) ) ) /
            ( start.y - finish.y );
    },
    getFrameOffset: function () {
        return 34;
    },
    updateTrapezoidHeight: function (type, val) {

        if (this.isTrapezoid()) {
            let height;
            let rootSection = this.get('root_section');
            let heights = rootSection.trapezoidHeights;

            if (type === 'min') {
                if (heights[0] > heights[1]) {
                    heights[1] = val;
                } else {
                    heights[0] = val;
                }
            } else {
                if (heights[0] > heights[1]) {
                    heights[0] = val;
                } else {
                    heights[1] = val;
                }
            }

            if (heights[0] === heights[1]) {
                rootSection.trapezoidHeights = false;
                height = heights[0];
            } else {
                let params = {
                    corners: this.getMainTrapezoidInnerCorners(),
                    minHeight: (heights[0] > heights[1]) ? heights[1] : heights[0],
                    maxHeight: (heights[0] < heights[1]) ? heights[1] : heights[0]
                };

                height = params.maxHeight;
                rootSection.trapezoidHeights = heights;
                this.checkHorizontalSplit(rootSection, params);
                this.persist('root_section', rootSection);
            }

            if (this.get('height') === height) {
                this.trigger('change', this);
            } else {
                this.updateDimension('height', height);
            }

        }
    },
    checkHorizontalSplit: function (rootSection, params) {
        if (rootSection.sections && rootSection.sections.length) {
            for (let i = 0; i < rootSection.sections.length; i++) {
                this.checkHorizontalSplit(rootSection.sections[i], params);
            }
        }

        if (rootSection.divider && rootSection.divider === 'horizontal' && rootSection.position) {
            let crossing = this.getLineCrossingY(rootSection.position, params.corners.left, params.corners.right);

            if (crossing >= -100) {
                let maxHeight = utils.convert.inches_to_mm(params.maxHeight);
                let minHeight = utils.convert.inches_to_mm(params.minHeight);
                let position = maxHeight - minHeight + 250;

                rootSection.minPosition = rootSection.position = position;
            }
        }
    },
    getTrapezoidHeight: function () {
        let trapezoidHeights = this.get('root_section').trapezoidHeights;

        return (trapezoidHeights) ? trapezoidHeights[0] + ' | ' + trapezoidHeights[1] : this.get('height');
    },
    getTrapezoidHeightMM: function () {
        let trapezoidHeights = this.get('root_section').trapezoidHeights;

        if (trapezoidHeights) {
            trapezoidHeights = [
                utils.convert.inches_to_mm(trapezoidHeights[0]),
                utils.convert.inches_to_mm(trapezoidHeights[1])
            ];
        }

        return trapezoidHeights || utils.convert.inches_to_mm(this.get('height'));
    }
    /* trapezoid end */
});

// static function
// it will find section with passed id from passed section and all its children
// via nested search
export const findSection = function (section, sectionId) {
    function findNested(sec, id) {
        if (sec.id === id) {
            return sec;
        }

        if (!sec.sections) {
            return null;
        }

        for (let i = 0; i < sec.sections.length; i++) {
            let founded = findNested(sec.sections[i], sectionId);

            if (founded) {
                return founded;
            }
        }
    }

    return findNested(section, sectionId);
};
export default Unit;
