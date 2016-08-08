var app = app || {};

(function () {
    'use strict';

    var DICTIONARY_PROPERTIES = [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'populates_attribute', title: 'Populates Attribute', type: 'string' },
        { name: 'position', title: 'Position', type: 'number' }
    ];

    app.OptionsDictionary = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(DICTIONARY_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getNameAttribute: function () {
            return 'name';
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            var type_value_hash = {
                number: 0
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            return default_value;
        },
        parse: function (data) {
            return data;
        },
        save: function () {
            return Backbone.Model.prototype.saveAndGetId.apply(this, arguments);
        },
        //  TODO: populates_attribute should also be sent
        sync: function (method, model, options) {
            var properties_to_omit = ['id', 'entries', 'populates_attribute'];

            if ( method === 'create' || method === 'update' ) {
                options.attrs = { dictionary: _.omit(model.toJSON(), properties_to_omit) };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        validate: function (attributes, options) {
            var error_obj = null;

            //  Simple type validation for numbers and booleans
            _.find(attributes, function (value, key) {
                var attribute_obj = this.getNameTitleTypeHash([key]);

                attribute_obj = attribute_obj.length === 1 ? attribute_obj[0] : null;

                if ( attribute_obj && attribute_obj.type === 'number' &&
                    (!_.isNumber(value) || _.isNaN(value))
                ) {
                    error_obj = {
                        attribute_name: key,
                        error_message: attribute_obj.title + ' can\'t be set to "' + value + '", it should be a number'
                    };

                    return false;
                } else if ( attribute_obj && attribute_obj.type === 'boolean' && !_.isBoolean(value) ) {
                    error_obj = {
                        attribute_name: key,
                        error_message: attribute_obj.title + ' can\'t be set to "' + value + '", it should be a boolean'
                    };

                    return false;
                }
            }, this);

            if ( options.validate && error_obj ) {
                return error_obj;
            }
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( DICTIONARY_PROPERTIES, 'name' );
            }

            _.each(DICTIONARY_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_hash.push({ name: item.name, title: item.title, type: item.type });
                }
            });

            return name_title_hash;
        },
        getAttributeType: function (attribute_name) {
            var name_title_hash = this.getNameTitleTypeHash();
            var target_attribute = _.findWhere(name_title_hash, {name: attribute_name});

            return target_attribute ? target_attribute.type : undefined;
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        },
        initialize: function (attributes, options) {
            this.options = options || {};
            //  Was it fully loaded already? This means it was fetched and all
            //  dependencies (units etc.) were processed correctly. This flag
            //  could be used to tell if it's good to render any views
            this._wasLoaded = false;

            if ( !this.options.proxy ) {
                this.entries = new app.OptionsDictionaryEntryCollection(null, { dictionary: this });
                this.on('add', this.setDependencies, this);
            }
        },
        setDependencies: function (model, response, options) {
            var changed_flag = false;

            //  If response is empty or there was an error
            if ( !response && app.session.get('no_backend') !== true ||
                options && options.xhr && options.xhr.status && options.xhr.status !== 200
            ) {
                return;
            }

            if ( this.get('entries') ) {
                this.entries.set(this.get('entries'));
                this.unset('entries', { silent: true });
                changed_flag = true;
            }

            if ( changed_flag ) {
                this.trigger('set_dependencies');
            }

            if ( !this._wasLoaded ) {
                this._wasLoaded = true;
                this.trigger('fully_loaded');
            }
        }
    });
})();
