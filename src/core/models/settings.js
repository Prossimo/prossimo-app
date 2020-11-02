import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';

import App from '../../main';
import { globalChannel } from '../../utils/radio';
import ProfileCollection from '../collections/profile-collection';
import FillingTypeCollection from '../collections/filling-type-collection';
import OptionsDictionaryCollection from '../collections/options-dictionary-collection';

const SETTINGS_PROPERTIES = [
    { name: 'api_base_path', title: 'API Base Path', type: 'string' },
    { name: 'pdf_api_base_path', title: 'PDF API Base Path', type: 'string' },
];

export default Backbone.Model.extend({
    defaults() {
        const defaults = {};

        _.each(SETTINGS_PROPERTIES, (item) => {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        });

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
        const current_quote_type = _.contains(['quote', 'supplier'], quote_type) ? quote_type : 'quote';
        const base_url = this.get('pdf_api_base_path');
        const replacement_table = {
            ':type': current_quote_type,
            ':quote_id': String(App.current_quote.getNumber()),
            ':project_name': encodeURIComponent(App.current_project.get('project_name')),
            ':quote_name': encodeURIComponent(App.current_quote.get('name')),
            ':revision': String(App.current_quote.get('revision')),
            ':token': window.localStorage.getItem('authToken'),
        };
        let url = '/:type/:quote_id/:project_name/:quote_name/:revision/:token';

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
            this.listenTo(this.dictionaries, 'change entries_change', () => {
                this._dependencies_changed = _.extend({}, this._dependencies_changed, { dictionaries: true });
            });
        });

        this.listenTo(globalChannel, 'auth:initial_login', this.onInitialLogin);
        this.listenTo(globalChannel, 'project_selector:fetch_current:stop', this.setProjectSettings);
    },
    //  We trigger an event when dictionaries / profiles / filling types
    //  have changed, so we get a chance to update units if needed
    //  TODO: trigger events for profiles and filling types
    //  TODO: instead of sending events, we should update units inside current
    //  project or quote (projects should be contained inside this model)
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
    //  We use deferred to wait for 3 requests (profiles, fillings, options)
    //  to finish before triggering event (and starting to load projects)
    fetchData() {
        // Remove the deferred settings
        // const d1 = $.Deferred();
        // const d2 = $.Deferred();
        // const d3 = $.Deferred();

        globalChannel.trigger('settings:fetch_data:start');

        // $.when(d1, d2, d3).done(() => {
        //     globalChannel.trigger('settings:fetch_data:stop');
        // });

        this.profiles.fetch({
            remove: false,
            data: {
                limit: 0,
            },
            //  Validate positions on load
            success(collection) {
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
                globalChannel.trigger('settings:fetch_data:stop');
                collection.validatePositions();
            },
        });
    },
    getNameTitleTypeHash(names) {
        const selected_names = names || _.pluck(SETTINGS_PROPERTIES, 'name');
        const name_title_type_hash = {};

        _.each(SETTINGS_PROPERTIES, (item) => {
            if (_.indexOf(selected_names, item.name) !== -1) {
                name_title_type_hash[item.name] = { title: item.title, type: item.type };
            }
        });

        return name_title_type_hash;
    },
});
