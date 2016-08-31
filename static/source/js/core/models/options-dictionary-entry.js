var app = app || {};

(function () {
    'use strict';

    //  TODO: validation should prevent setting entry name to UNSET_VALUE
    // var UNSET_VALUE = '--';

    //  TODO: we better have original_cost and original_currency here, similar
    //  to units / accessories, instead of price
    var ENTRY_PROPERTIES = [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'price', title: 'Price', type: 'number' },
        { name: 'data', title: 'Additional Data', type: 'string' },
        { name: 'position', title: 'Position', type: 'number' },
        { name: 'profiles', title: 'Profiles', type: 'array' }
    ];

    function getDefaultEntryData() {
        return _.extend({}, {});
    }

    function getDefaultProfilesList() {
        return [];
    }

    app.OptionsDictionaryEntry = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(ENTRY_PROPERTIES, function (item) {
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

            var name_value_hash = {
                data: getDefaultEntryData(),
                profiles: getDefaultProfilesList()
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        save: function () {
            return Backbone.Model.prototype.saveAndGetId.apply(this, arguments);
        },
        sync: function (method, model, options) {
            var properties_to_omit = ['id'];

            if ( method === 'create' || method === 'update' ) {
                options.attrs = { entry: _.extendOwn(_.omit(model.toJSON(), properties_to_omit), {
                    data: JSON.stringify(model.get('data'))
                }) };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        hasOnlyDefaultAttributes: function () {
            var has_only_defaults = true;

            _.each(this.toJSON(), function (value, key) {
                if ( key !== 'position' && has_only_defaults ) {
                    var property_source = _.findWhere(ENTRY_PROPERTIES, { name: key });
                    var type = property_source ? property_source.type : undefined;

                    if ( key === 'data' ) {
                        if ( JSON.stringify(value) !== JSON.stringify(this.getDefaultValue('data')) ) {
                            has_only_defaults = false;
                        }
                    } else if ( key === 'profiles' ) {
                        if ( JSON.stringify(value) !== JSON.stringify(this.getDefaultValue('profiles')) ) {
                            has_only_defaults = false;
                        }
                    } else if ( this.getDefaultValue(key, type) !== value ) {
                        has_only_defaults = false;
                    }
                }
            }, this);

            return has_only_defaults;
        },
        initialize: function (attributes, options) {
            this.options = options || {};
        }
    });
})();
