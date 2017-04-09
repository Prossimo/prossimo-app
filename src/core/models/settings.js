import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';

import App from '../../main';
import { globalChannel } from '../../utils/radio';
import Profile from './profile';
import ProfileCollection from '../collections/profile-collection';
import FillingTypeCollection from '../collections/filling-type-collection';
import OptionsDictionaryCollection from '../collections/options-dictionary-collection';

//  --------------------------------------------------------------------
//  That's what we use for Units
//  --------------------------------------------------------------------

const GLAZING_BAR_WIDTHS = [12, 22, 44];
const OPENING_DIRECTIONS = ['Inward', 'Outward'];

//  --------------------------------------------------------------------
//  That's what we use for Profiles
//  --------------------------------------------------------------------

const SYSTEMS = ['Workhorse uPVC', 'Pinnacle uPVC'];
const SUPPLIER_SYSTEMS = ['Gaelan S8000', 'Gaelan S9000'];
const CORNER_TYPES = ['Mitered', 'Square (Vertical)', 'Square (Horizontal)'];

//  --------------------------------------------------------------------
// That's what we use for settings
//  --------------------------------------------------------------------

const SETTINGS_PROPERTIES = [
    { name: 'api_base_path', title: 'API Base Path', type: 'string' },
    { name: 'pdf_api_base_path', title: 'PDF API Base Path', type: 'string' },
];

export default Backbone.Model.extend({
    defaults() {
        const defaults = {};

        _.each(SETTINGS_PROPERTIES, function (item) {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        }, this);

        return defaults;
    },
    getDefaultValue(name, type) {
        let default_value = '';

        const type_value_hash = {
            number: 0,
        };

        const name_value_hash = {
            api_base_path: $('meta[name="api-base-path"]').attr('value') || '/api',
            pdf_api_base_path: $('meta[name="pdf-api-base-path"]').attr('value') || '',
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    getPdfDownloadUrl(quote_type) {
        quote_type = _.contains(['quote', 'supplier'], quote_type) ? quote_type : 'quote';

        const base_url = this.get('pdf_api_base_path');
        let url = '/:type/:project_id/:project_name/:quote_id/:quote_name/:revision/:token';
        const replacement_table = {
            ':type': quote_type,
            ':project_id': App.current_project.id,
            ':project_name': encodeURIComponent(App.current_project.get('project_name')),
            ':quote_id': App.current_quote.id,
            ':quote_name': encodeURIComponent(
                App.current_quote.get('is_default') ? '' : App.current_quote.get('name'),
            ),
            ':revision': String(App.current_quote.get('revision')),
            ':token': window.localStorage.getItem('authToken'),
        };

        url = url.replace(/:\w+/g, match => replacement_table[match] || match);

        return base_url + url;
    },
    initialize() {
        this.listenTo(globalChannel, 'app:start', () => {
            this.profiles = new ProfileCollection(null, {
                api_base_path: this.get('api_base_path'),
            });

            this.filling_types = new FillingTypeCollection(null, {
                api_base_path: this.get('api_base_path'),
                append_base_types: true,
            });

            this.dictionaries = new OptionsDictionaryCollection(null, {
                api_base_path: this.get('api_base_path'),
            });

            this.project_settings = null;
            this._dependencies_changed = {};

            //  When any dictionary or dictionary entry is changed, we remember
            //  this fact to trigger an event later, when we switch screens
            this.listenTo(this.dictionaries, 'change entries_change', function () {
                this._dependencies_changed = _.extend({}, this._dependencies_changed, { dictionaries: true });
            });
        });

        this.listenTo(globalChannel, 'auth:initial_login', this.onInitialLogin);
        this.listenTo(globalChannel, 'project_selector:fetch_current:stop', this.setProjectSettings);
    },
    //  We trigger an event when dictionaries / profiles / filling types
    //  have changed, so we get a chance to update units if needed
    //  TODO: trigger events for profiles and filling types
    onScreenChange() {
        _.each(this._dependencies_changed, (value, depencency_name) => {
            if (depencency_name === 'dictionaries') {
                globalChannel.trigger('validate_units:dictionaries');
            }
        }, this);

        this._dependencies_changed = {};
    },
    //  TODO: why don't we call this directly from the current project?
    setProjectSettings() {
        this.project_settings = App.current_project.settings;
    },
    getProjectSettings() {
        return this.project_settings ? this.project_settings : null;
    },
    onInitialLogin() {
        this.fetchData();

        //  If we have a router, we want to monitor all changes
        this.listenTo(App.router, 'route', this.onScreenChange);
    },
    //  We use deferred to wait for 2 requests (profiles and filling types)
    //  to finish before triggering event (and starting to load projects)
    fetchData() {
        const d1 = $.Deferred();
        const d2 = $.Deferred();
        const d3 = $.Deferred();

        globalChannel.trigger('settings:fetch_data:start');

        $.when(d1, d2, d3).done(() => {
            globalChannel.trigger('settings:fetch_data:stop');
        });

        this.profiles.fetch({
            remove: false,
            data: {
                limit: 0,
            },
            //  Validate positions on load
            success(collection) {
                d1.resolve('Loaded profiles');
                collection.validatePositions();
            },
        });

        this.filling_types.fetch({
            remove: false,
            data: {
                limit: 0,
            },
            //  Validate positions on load
            success(collection) {
                d2.resolve('Loaded filling types');
                collection.validatePositions();
                collection.validatePerProfileDefaults();
            },
        });

        this.dictionaries.fetch({
            url: `${this.get('api_base_path')}/dictionaries/full-tree`,
            remove: false,
            data: {
                limit: 0,
            },
            //  Validate positions on load
            success(collection) {
                d3.resolve('Loaded options dictionaries');
                collection.validatePositions();
            },
        });
    },
    getNameTitleTypeHash(names) {
        const name_title_type_hash = {};

        if (!names) {
            names = _.pluck(SETTINGS_PROPERTIES, 'name');
        }

        _.each(SETTINGS_PROPERTIES, (item) => {
            if (_.indexOf(names, item.name) !== -1) {
                name_title_type_hash[item.name] = { title: item.title, type: item.type };
            }
        });

        return name_title_type_hash;
    },
    //  TODO: move all profile-related function to Profile Collection
    getAvailableProfileNames() {
        return this.profiles.map(item => item.get('name'));
    },
    getProfileNamesByIds(ids_array) {
        let name_list = [];

        this.profiles.each((item) => {
            const index = ids_array.indexOf(item.id);

            if (index !== -1) {
                name_list.push({ index, name: item.get('name') });
            }
        }, this);

        name_list = _.pluck(name_list, 'name');

        return name_list;
    },
    getProfileByIdOrDummy(profile_id) {
        const profile = this.profiles.get(profile_id);

        return profile || new Profile({
            is_dummy: true,
        });
    },
    getProfileIdByName(profile_name) {
        const profile = this.profiles.findWhere({ name: profile_name });

        return profile ? profile.get('id') : null;
    },
    getDefaultProfileId() {
        let default_profile_id = 0;

        if (this.profiles.length) {
            default_profile_id = this.profiles.at(0).get('id');
        }

        return default_profile_id;
    },
    getGlazingBarWidths() {
        return GLAZING_BAR_WIDTHS;
    },
    getSystems() {
        return SYSTEMS;
    },
    getSupplierSystems() {
        return SUPPLIER_SYSTEMS;
    },
    getFrameCornerTypes() {
        return CORNER_TYPES;
    },
    getSashCornerTypes() {
        return CORNER_TYPES;
    },
    getOpeningDirections() {
        return OPENING_DIRECTIONS;
    },
});
