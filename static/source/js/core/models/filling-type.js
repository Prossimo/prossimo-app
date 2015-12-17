var app = app || {};

(function () {
    'use strict';

    var BASE_TYPES = [
        { name: 'glass', title: 'Glass' },
        { name: 'recessed', title: 'Recessed' },
        { name: 'interior-flush-panel', title: 'Interior Flush Panel' },
        { name: 'exterior-flush-panel', title: 'Exterior Flush Panel' },
        { name: 'full-flush-panel', title: 'Full Flush Panel' },
        { name: 'louver', title: 'Louver' }
    ];

    var FILLING_TYPE_PROPERTIES = [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'type', title: 'Type', type: 'string' },
        { name: 'is_base_type', title: 'Is Base Type', type: 'boolean' }
    ];

    app.FillingType = Backbone.Model.extend({
        defaults: function () {
            var defaults = {};

            _.each(FILLING_TYPE_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        getDefaultValue: function (name, type) {
            var default_value = '';

            var type_value_hash = {
                number: 0,
                boolean: false
            };

            var name_value_hash = {
                type: this.getBaseTypes()[0].name
            };

            if ( _.indexOf(_.keys(type_value_hash), type) !== -1 ) {
                default_value = type_value_hash[type];
            }

            if ( _.indexOf(_.keys(name_value_hash), name) !== -1 ) {
                default_value = name_value_hash[name];
            }

            return default_value;
        },
        // save: function () {
        //     return Backbone.Model.prototype.saveAndGetId.apply(this, arguments);
        // },
        // sync: function (method, model, options) {
        //     if ( method === 'create' || method === 'update' ) {
        //         options.attrs = { project_accessory: _.omit(model.toJSON(), ['id']) };
        //     }

        //     return Backbone.sync.call(this, method, model, options);
        // },
        initialize: function (attributes, options) {
            this.options = options || {};
        },
        //  Return { name: 'name', title: 'Title', type: 'type' } objects for
        //  each item in `names`. If `names` is empty, return everything
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( FILLING_TYPE_PROPERTIES, 'name' );
            }

            _.each(FILLING_TYPE_PROPERTIES, function (item) {
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
        getBaseTypes: function () {
            return BASE_TYPES;
        },
        getTypeTitle: function (name) {
            return _.findWhere(this.getBaseTypes(), { name: name }).get('title');
        }
    });
})();
