var app = app || {};

(function () {
    'use strict';

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
        { name: 'api_base_path', title: 'API Base Path', type: 'string' },
        { name: 'pdf_api_base_path', title: 'PDF API Base Path', type: 'string' }
    ];

    app.Settings = Backbone.Model.extend({
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

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
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
                ':id': app.current_project.id,
                ':name': encodeURIComponent(app.current_project.get('project_name')),
                ':revision': String(app.current_project.get('quote_revision')),
                ':token': window.localStorage.getItem('authToken')
            };

            url = url.replace(/:\w+/g, function (match) {
                return replacement_table[match] || match;
            });

            return base_url + url;
        },
        initialize: function () {
            this.profiles = new app.ProfileCollection(null, {
                api_base_path: this.get('api_base_path')
            });

            this.filling_types = new app.FillingTypeCollection(null, {
                api_base_path: this.get('api_base_path')
            });

            this.dictionaries = new app.OptionsDictionaryCollection(null, {
                api_base_path: this.get('api_base_path')
            });

            this.project_settings = null;
            this._dependencies_changed = {};

            this.listenTo(app.vent, 'auth:initial_login', this.onInitialLogin);
            this.listenTo(app.vent, 'project_selector:fetch_current:stop', this.setProjectSettings);

            //  When any dictionary or dictionary entry is changed, we remember
            //  this fact to trigger an event later, when we switch screens
            this.listenTo(this.dictionaries, 'change entries_change', function () {
                this._dependencies_changed = _.extend({}, this._dependencies_changed, { dictionaries: true });
            });
        },
        //  We trigger an event when dictionaries / profiles / filling types
        //  have changed, so we get a chance to update units if needed
        //  TODO: trigger events for profiles and filling types
        onScreenChange: function () {
            _.each(this._dependencies_changed, function (value, depencency_name) {
                if ( depencency_name === 'dictionaries' ) {
                    app.vent.trigger('validate_units:dictionaries');
                }
            }, this);

            this._dependencies_changed = {};
        },
        setProjectSettings: function () {
            this.project_settings = app.current_project.settings;
        },
        getProjectSettings: function () {
            return this.project_settings ? this.project_settings : null;
        },
        onInitialLogin: function () {
            this.fetchData();

            //  If we have a router, we want to monitor all changes
            this.listenTo(app.router, 'route', this.onScreenChange);
        },
        //  We use deferred to wait for 2 requests (profiles and filling types)
        //  to finish before triggering event (and starting to load projects)
        fetchData: function () {
            var d1 = $.Deferred();
            var d2 = $.Deferred();
            var d3 = $.Deferred();

            app.vent.trigger('settings:fetch_data:start');

            $.when(d1, d2, d3).done(function () {
                app.vent.trigger('settings:fetch_data:stop');
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

            if ( !names ) {
                names = _.pluck( SETTINGS_PROPERTIES, 'name' );
            }

            _.each(SETTINGS_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_type_hash[item.name] = { title: item.title, type: item.type };
                }
            });

            return name_title_type_hash;
        },
        getAvailableProfileNames: function () {
            return this.profiles.map(function (item) {
                return item.get('name');
            });
        },
        getProfileNamesByIds: function (ids_array) {
            var name_list = [];

            this.profiles.each(function (item) {
                var index = ids_array.indexOf(item.id);

                if ( index !== -1 ) {
                    name_list.push({ index: index, name: item.get('name') });
                }
            }, this);

            name_list = _.pluck(name_list, 'name');

            return name_list;
        },
        getProfileByIdOrDummy: function (profile_id) {
            var profile = this.profiles.get(profile_id);

            return profile ? profile : new app.Profile({
                is_dummy: true
            });
        },
        getProfileIdByName: function (profile_name) {
            var profile = this.profiles.findWhere({name: profile_name});

            return profile ? profile.get('id') : null;
        },
        getDefaultProfileId: function () {
            var default_profile_id = 0;

            if ( this.profiles.length ) {
                default_profile_id = this.profiles.at(0).get('id');
            }

            return default_profile_id;
        },
        getFillingTypeById: function (cid) {
            return this.filling_types.get(cid);
        },
        getFillingTypeByName: function (name) {
            return this.filling_types.findWhere({ name: name });
        },
        getAvailableFillingTypes: function () {
            return this.filling_types.models;
        },
        getAvailableFillingTypeNames: function () {
            return this.getAvailableFillingTypes().map(function (item) {
                return item.get('name');
            });
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
        getAvailableOptions: function (dictionary_id, profile_id) {
            var available_options = [];
            var target_dictionary = this.dictionaries.get(dictionary_id);

            if ( target_dictionary ) {
                target_dictionary.entries.each(function (entry) {
                    if ( entry.get('profiles').length && _.contains(entry.get('profiles'), profile_id) ) {
                        available_options.push(entry);
                    }
                }, this);
            }

            return available_options;
        },
        //  TODO: shoud use actual per-profile defaults mechanism, right now
        //  it just gets the first option in the list
        getDefaultOption: function (dictionary_id, profile_id) {
            var available_options = this.getAvailableOptions(dictionary_id, profile_id);

            return available_options.length ? available_options[0] : undefined;
        },
        getDictionaryIdByName: function (name) {
            var target_dictionary = this.dictionaries.findWhere({name: name});

            return target_dictionary ? target_dictionary.id : undefined;
        },
        getDictionaryEntryIdByName: function (dictionary_id, name) {
            var target_dictionary = this.dictionaries.get(dictionary_id);
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
})();
