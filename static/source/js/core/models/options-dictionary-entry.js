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
                data: getDefaultEntryData()
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
        initialize: function (attributes, options) {
            this.options = options || {};
        }
    });
})();
