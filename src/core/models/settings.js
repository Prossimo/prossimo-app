import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';
import App from '../../main';
import {globalChannel} from '../../utils/radio';

import Profile from './profile';
import ProfileCollection from '../collections/profile-collection';
import FillingTypeCollection from '../collections/filling-type-collection';
import OptionsDictionaryCollection from '../collections/options-dictionary-collection';

//  --------------------------------------------------------------------
//  That's what we use for Units
//  --------------------------------------------------------------------

var GLAZING_BAR_WIDTHS = [12, 22, 44];
var OPENING_DIRECTIONS = ['Inward', 'Outward'];

//  --------------------------------------------------------------------
//  That's what we use for Profiles
//  --------------------------------------------------------------------

var SYSTEMS = ['Workhorse uPVC', 'Pinnacle uPVC'];
var SUPPLIER_SYSTEMS = ['Gaelan S8000', 'Gaelan S9000'];
var CORNER_TYPES = ['Mitered', 'Square (Vertical)', 'Square (Horizontal)'];

//  --------------------------------------------------------------------
// That's what we use for settings
//  --------------------------------------------------------------------

var SETTINGS_PROPERTIES = [
    {name: 'api_base_path', title: 'API Base Path', type: 'string'},
    {name: 'pdf_api_base_path', title: 'PDF API Base Path', type: 'string'}
];

export default Backbone.Model.extend({
    defaults: function () {
        var defaults = {};

        _.each(SETTINGS_PROPERTIES, function (item) {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        }, this);

        return defaults;
    },
    getDefaultValue: function (name, type) {
        var default_value = '';

        var type_value_hash = {
            number: 0
        };

        var name_value_hash = {
            api_base_path: $('meta[name="api-base-path"]').attr('value') || '/api',
            pdf_api_base_path: $('meta[name="pdf-api-base-path"]').attr('value') || ''
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    getPdfDownloadUrl: function (quote_type) {
        quote_type = _.contains(['quote', 'supplier'], quote_type) ? quote_type : 'quote';

        var base_url = this.get('pdf_api_base_path');
        var url = '/:type/:id/:name/:revision/:token';
        var replacement_table = {
            ':type': quote_type,
            ':id': App.current_project.id,
            ':name': encodeURIComponent(App.current_project.get('project_name')),
            ':revision': String(App.current_project.get('quote_revision')),
            ':token': window.localStorage.getItem('authToken')
        };

        url = url.replace(/:\w+/g, function (match) {
            return replacement_table[match] || match;
        });

        return base_url + url;
    },
    initialize: function () {
        this.listenTo(globalChannel, 'app:start', () => {
            this.profiles = new ProfileCollection(null, {
                api_base_path: this.get('api_base_path')
            });

            this.filling_types = new FillingTypeCollection(null, {
                api_base_path: this.get('api_base_path')
            });

            this.dictionaries = new OptionsDictionaryCollection(null, {
                api_base_path: this.get('api_base_path')
            });

            this.project_settings = null;
            this._dependencies_changed = {};

            //  When any dictionary or dictionary entry is changed, we remember
            //  this fact to trigger an event later, when we switch screens
            this.listenTo(this.dictionaries, 'change entries_change', function () {
                this._dependencies_changed = _.extend({}, this._dependencies_changed, {dictionaries: true});
            });
        });


        this.listenTo(globalChannel, 'auth:initial_login', this.onInitialLogin);
        this.listenTo(globalChannel, 'project_selector:fetch_current:stop', this.setProjectSettings);
    },
    //  We trigger an event when dictionaries / profiles / filling types
    //  have changed, so we get a chance to update units if needed
    //  TODO: trigger events for profiles and filling types
    onScreenChange: function () {
        _.each(this._dependencies_changed, function (value, depencency_name) {
            if (depencency_name === 'dictionaries') {
                globalChannel.trigger('validate_units:dictionaries');
            }
        }, this);

        this._dependencies_changed = {};
    },
    setProjectSettings: function () {
        this.project_settings = App.current_project.settings;
    },
    getProjectSettings: function () {
        return this.project_settings ? this.project_settings : null;
    },
    onInitialLogin: function () {
        this.fetchData();

        //  If we have a router, we want to monitor all changes
        this.listenTo(App.router, 'route', this.onScreenChange);
    },
    //  We use deferred to wait for 2 requests (profiles and filling types)
    //  to finish before triggering event (and starting to load projects)
    fetchData: function () {
        var d1 = $.Deferred();
        var d2 = $.Deferred();
        var d3 = $.Deferred();

        globalChannel.trigger('settings:fetch_data:start');

        $.when(d1, d2, d3).done(function () {
            globalChannel.trigger('settings:fetch_data:stop');
        });

        this.profiles.fetch({
            remove: false,
            data: {
                limit: 0
            },
            //  Validate positions on load
            success: function (collection) {
                d1.resolve('Loaded profiles');
                collection.validatePositions();
            }
        });

        this.filling_types.fetch({
            remove: false,
            data: {
                limit: 0
            },
            //  Validate positions on load
            success: function (collection) {
                d2.resolve('Loaded filling types');
                collection.validatePositions();
                collection.validatePerProfileDefaults();
            }
        });

        this.dictionaries.fetch({
            url: this.get('api_base_path') + '/dictionaries/full-tree',
            remove: false,
            data: {
                limit: 0
            },
            //  Validate positions on load
            success: function (collection) {
                d3.resolve('Loaded options dictionaries');
                collection.validatePositions();
            }
        });
    },
    getNameTitleTypeHash: function (names) {
        var name_title_type_hash = {};

        if (!names) {
            names = _.pluck(SETTINGS_PROPERTIES, 'name');
        }

        _.each(SETTINGS_PROPERTIES, function (item) {
            if (_.indexOf(names, item.name) !== -1) {
                name_title_type_hash[item.name] = {title: item.title, type: item.type};
            }
        });

        return name_title_type_hash;
    },
    //  TODO: move all profile-related function to Profile Collection
    getAvailableProfileNames: function () {
        return this.profiles.map(function (item) {
            return item.get('name');
        });
    },
    getProfileNamesByIds: function (ids_array) {
        var name_list = [];

        this.profiles.each(function (item) {
            var index = ids_array.indexOf(item.id);

            if (index !== -1) {
                name_list.push({index: index, name: item.get('name')});
            }
        }, this);

        name_list = _.pluck(name_list, 'name');

        return name_list;
    },
    getProfileByIdOrDummy: function (profile_id) {
        var profile = this.profiles.get(profile_id);

        return profile ? profile : new Profile({
            is_dummy: true
        });
    },
    getProfileIdByName: function (profile_name) {
        var profile = this.profiles.findWhere({name: profile_name});

        return profile ? profile.get('id') : null;
    },
    getDefaultProfileId: function () {
        var default_profile_id = 0;

        if (this.profiles.length) {
            default_profile_id = this.profiles.at(0).get('id');
        }

        return default_profile_id;
    },
    getGlazingBarWidths: function () {
        return GLAZING_BAR_WIDTHS;
    },
    getSystems: function () {
        return SYSTEMS;
    },
    getSupplierSystems: function () {
        return SUPPLIER_SYSTEMS;
    },
    getFrameCornerTypes: function () {
        return CORNER_TYPES;
    },
    getSashCornerTypes: function () {
        return CORNER_TYPES;
    },
    getOpeningDirections: function () {
        return OPENING_DIRECTIONS;
    },
    //  TODO: move all Options-related functions to Dictionary Collection
    getAvailableOptions: function (dictionary_id, profile_id, put_default_first) {
        var target_dictionary = this.dictionaries.get(dictionary_id);
        var available_options = [];
        var default_option;

        put_default_first = put_default_first || false;

        if (target_dictionary) {
            available_options = target_dictionary.entries.getAvailableForProfile(profile_id);
            default_option = target_dictionary.entries.getDefaultForProfile(profile_id);
        }

        //  Union merges arrays and removes duplicates
        if (put_default_first && default_option && available_options.length > 1) {
            available_options = _.union([default_option], available_options);
        }

        return available_options;
    },
    getDefaultOption: function (dictionary_id, profile_id) {
        var target_dictionary = this.dictionaries.get(dictionary_id);
        var default_option;

        if (target_dictionary) {
            default_option = target_dictionary.entries.getDefaultForProfile(profile_id);
        }

        return default_option || undefined;
    },
    getFirstAvailableOption: function (dictionary_id, profile_id) {
        var available_options = this.getAvailableOptions(dictionary_id, profile_id);

        return available_options.length ? available_options[0] : undefined;
    },
    //  This function use a composition of two functions above
    getDefaultOrFirstAvailableOption: function (dictionary_id, profile_id) {
        var target_option = this.getDefaultOption(dictionary_id, profile_id);

        if (!target_option) {
            target_option = this.getFirstAvailableOption(dictionary_id, profile_id);
        }

        return target_option;
    },
    getDictionaryIdByName: function (name) {
        var target_dictionary = this.dictionaries.findWhere({name: name});

        return target_dictionary ? target_dictionary.id : undefined;
    },
    getDictionaryEntryIdByName: function (dictionary_id, name) {
        var target_dictionary = this.dictionaries.get(dictionary_id);

        if (!target_dictionary) {
            throw new Error('No dictionary with id=' + dictionary_id);
        }

        var target_entry = target_dictionary.entries.findWhere({name: name});

        return target_entry ? target_entry.id : undefined;
    },
    getAvailableDictionaries: function () {
        return this.dictionaries;
    },
    getAvailableDictionaryNames: function () {
        return this.getAvailableDictionaries().pluck('name');
    }
});
