import _ from 'underscore';
import Backbone from 'backbone';

import App from '../../main';
import Schema from '../../schema';
import QuoteCollection from '../collections/quote-collection';
import ProjectFileCollection from '../collections/project-file-collection';
import ProjectSettings from './inline/project-settings';

const PROJECT_PROPERTIES = [
    { name: 'client_name', title: 'Client Name', type: 'string' },
    { name: 'client_company_name', title: 'Company', type: 'string' },
    { name: 'client_phone', title: 'Phone', type: 'string' },
    { name: 'client_email', title: 'Email', type: 'string' },
    { name: 'client_address', title: 'Client Address', type: 'string' },
    { name: 'project_name', title: 'Project Name', type: 'string' },
    { name: 'project_address', title: 'Project Address', type: 'string' },
    { name: 'shipping_notes', title: 'Shipping Notes', type: 'string' },
    { name: 'project_notes', title: 'Project Notes', type: 'string' },
    { name: 'lead_time', title: 'Lead Time', type: 'number' },
    { name: 'frontapp_thread_id', title: 'Frontapp Thread ID', type: 'string' },
    { name: 'frontapp_gdrive_folder_id', title: 'Frontapp GDrive Folder ID', type: 'string' },
    { name: 'dapulse_pulse_id', title: 'Dapulse Pulse ID', type: 'string' },
    { name: 'extra_id_data', title: 'Extra ID Data', type: 'string' },
    { name: 'settings', title: 'Settings', type: 'model:ProjectSettings' },
];

export default Backbone.Model.extend({
    schema: Schema.createSchema(PROJECT_PROPERTIES),
    defaults() {
        const defaults = {};

        _.each(PROJECT_PROPERTIES, (item) => {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        });

        return defaults;
    },
    getDefaultValue(name, type) {
        let default_value = '';

        const type_value_hash = {
            number: 0,
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        return default_value;
    },
    getNameAttribute() {
        return 'project_name';
    },
    getAttributeType(attribute_name) {
        const name_title_hash = this.getNameTitleTypeHash();
        const target_attribute = _.findWhere(name_title_hash, { name: attribute_name });

        return target_attribute ? target_attribute.type : undefined;
    },
    sync(method, model, options) {
        const properties_to_omit = ['id'];

        if (method === 'update' || method === 'create') {
            const extended_props = {
                settings: JSON.stringify(model.settings.toJSON()),
            };

            //  The logic here:
            //  - When we want to link specific files to the project, we
            //    include `files` array containing UUIDs for files we want
            //    to link. This is especially useful on project creation
            //  - When we want to unlink some file from project, we remove
            //    UUID for this file from `files` array and send it
            //  - So, if we want to unlink all files from project, we
            //    include empty `files` array in our request
            //  - However, in most cases when we intend to just update some
            //    properties of our project, we don't have to include
            //    `files` array in our request at all, and this guarantees
            //    that there won't be any changes with linked files
            if (method === 'create') {
                extended_props.files = model.getUuidsForFiles();
            }

            options.attrs = {
                project: _.extendOwn(
                    _.omit(model.toJSON(), properties_to_omit),
                    extended_props,
                ),
            };
        }

        //  If we're fetching a specific project from the server, we want
        //  to remember that fact and don't fetch again in the future. This
        //  could be counter-productive in multi-user setup though, as we
        //  need to constantly monitor changes made by other users, but
        //  that should be a separate concern
        if (method === 'read') {
            const successCallback = options.success;

            //  This is similar to what they do in the original Model.fetch
            options.success = (response) => {
                model._wasFetched = true;

                if (successCallback) {
                    successCallback.call(model, response, options);
                }
            };
        }

        return Backbone.sync.call(this, method, model, options);
    },
    parse(data) {
        const project_data = data && data.project ? data.project : data;
        const filtered_data = Schema.parseAccordingToSchema(project_data, this.schema);

        if (project_data && project_data.files) {
            filtered_data.files = project_data.files;
        }

        if (project_data && project_data.quotes) {
            filtered_data.quotes = project_data.quotes;
        }

        return filtered_data;
    },
    getUuidsForFiles() {
        return this.get('files') || (this.files && this.files.getUuids());
    },
    initialize(attributes, options) {
        this.options = options || {};
        //  Was it fetched from the server already? This flag could be used
        //  to tell whether we need to request data from server
        this._wasFetched = false;
        //  Was it fully loaded already? This means it was fetched and all
        //  dependencies (files etc.) were processed correctly. This flag
        //  could be used to tell if it's good to render any views
        this._wasLoaded = false;

        if (!this.options.proxy) {
            this.files = new ProjectFileCollection(null, { project: this });
            this.settings = new ProjectSettings(null, { project: this });
            this.quotes = new QuoteCollection(null, { project: this });

            this.on('sync', this.setDependencies, this);
            this.on('set_active', this.setDependencies, this);
            this.listenTo(this.settings, 'change', this.updateSettings);
        }
    },
    setDependencies(model, response, options) {
        let changed_flag = false;

        //  If response is empty or there was an error
        if (
            (!response && App.session.get('no_backend') !== true) ||
            (options && options.xhr && options.xhr.status && options.xhr.status !== 200)
        ) {
            return;
        }

        if (this.get('quotes')) {
            this.quotes.set(this.get('quotes'), { parse: true });
            this.quotes.trigger('loaded');
            this.unset('quotes', { silent: true });
            changed_flag = true;
        }

        if (this.get('files')) {
            this.files.set(this.get('files'), { parse: true });
            this.unset('files', { silent: true });
            changed_flag = true;
        }

        if (this.get('settings')) {
            this.settings.set(this.parseSettings(this.get('settings')), { silent: true });
            this.unset('settings', { silent: true });
            changed_flag = true;
        }

        if (changed_flag) {
            this.trigger('set_dependencies');
        }

        if (!this._wasLoaded) {
            this._wasLoaded = true;
            this.trigger('fully_loaded');
        }
    },
    //  TODO: this should actually be part of model.parse step
    parseSettings(source_data) {
        let settings_object = {};
        let source_data_parsed;

        if (_.isString(source_data)) {
            try {
                source_data_parsed = JSON.parse(source_data);
            } catch (error) {
                // Do nothing
            }

            if (source_data_parsed) {
                settings_object = source_data_parsed;
            }
        }

        return settings_object;
    },
    //  TODO: We persist settings, but we don't necessarily need it to be
    //  set as a property on our model. Or do we (it gives change event)?
    updateSettings() {
        this.persist('settings', this.settings.toJSON());
    },
    //  Return { name: 'name', title: 'Title' } pairs for each item in
    //  `names` array. If the array is empty, return all possible pairs
    getNameTitleTypeHash(names) {
        const name_title_hash = [];

        if (!names) {
            names = _.pluck(PROJECT_PROPERTIES, 'name');
        }

        _.each(PROJECT_PROPERTIES, (item) => {
            if (_.indexOf(names, item.name) !== -1) {
                name_title_hash.push({ name: item.name, title: item.title, type: item.type });
            }
        });

        return name_title_hash;
    },
    getTitles(names) {
        const name_title_hash = this.getNameTitleTypeHash(names);

        return _.pluck(name_title_hash, 'title');
    },
    preparePricingDataForExport(options) {
        if (options.quote_mode && !_.contains(['current', 'default', 'all'], options.quote_mode)) {
            throw new Error(`Unexpected quote_mode: ${options.quote_mode}`);
        }

        const quote_mode = options.quote_mode || 'current';
        let quotes_units_data = [];
        const current_quote = App.current_quote;
        const default_quote = this.quotes.getDefaultQuote();

        if (quote_mode === 'current') {
            quotes_units_data = current_quote ?
                current_quote.preparePricingDataForExport(options) :
                [];
        } else if (quote_mode === 'default') {
            quotes_units_data = default_quote ?
                default_quote.preparePricingDataForExport(options) :
                [];
        } else if (quote_mode === 'all') {
            quotes_units_data = _.flatten(
                this.quotes.invoke('preparePricingDataForExport', options),
                true,
            );
        }

        return quotes_units_data;
    },
});
