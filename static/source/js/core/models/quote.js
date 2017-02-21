var app = app || {};

(function () {
    'use strict';

    var QUOTE_PROPERTIES = [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'is_default', title: 'Is Default', type: 'boolean' },
        { name: 'quote_date', title: 'Quote Date', type: 'string' },
        { name: 'quote_revision', title: 'Quote Revision', type: 'number' }
    ];

    app.Quote = Backbone.Model.extend({
        schema: app.schema.createSchema(QUOTE_PROPERTIES),
        defaults: function () {
            var defaults = {};

            _.each(QUOTE_PROPERTIES, function (item) {
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
                quote_revision: 1
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        getNameAttribute: function () {
            return 'name';
        },
        hasOnlyDefaultAttributes: function () {
            var has_only_defaults = true;

            _.each(this.toJSON(), function (value, key) {
                if ( key !== 'position' && has_only_defaults ) {
                    var property_source = _.findWhere(QUOTE_PROPERTIES, { name: key });
                    var type = property_source ? property_source.type : undefined;

                    if ( this.getDefaultValue(key, type) !== value ) {
                        has_only_defaults = false;
                    }
                }
            }, this);

            return has_only_defaults;
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( QUOTE_PROPERTIES, 'name' );
            }

            _.each(QUOTE_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_hash.push({ name: item.name, title: item.title, type: item.type });
                }
            });

            return name_title_hash;
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        },
        initialize: function (attributes, options) {
            this.options = options || {};
        }
    });
})();
