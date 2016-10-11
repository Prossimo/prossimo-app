var app = app || {};

(function () {
    'use strict';

    var PROJECT_PROPERTIES = [
        { name: 'client_name', title: 'Client Name', type: 'string' },
        { name: 'client_company_name', title: 'Company', type: 'string' },
        { name: 'client_phone', title: 'Phone', type: 'string' },
        { name: 'client_email', title: 'Email', type: 'string' },
        { name: 'client_address', title: 'Client Address', type: 'string' },
        { name: 'project_name', title: 'Project Name', type: 'string' },
        { name: 'project_address', title: 'Project Address', type: 'string' },
        { name: 'quote_date', title: 'Quote Date', type: 'string' },
        { name: 'quote_revision', title: 'Quote Revision', type: 'number' },
        { name: 'shipping_notes', title: 'Shipping Notes', type: 'string'},
        { name: 'project_notes', title: 'Project Notes', type: 'string'},
        { name: 'settings', title: 'Settings', type: 'object' }
    ];

    app.Project = Backbone.Model.extend({
        schema: app.schema.createSchema(PROJECT_PROPERTIES),
        defaults: function () {
            var defaults = {};

            _.each(PROJECT_PROPERTIES, function (item) {
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
        save: function () {
            return Backbone.Model.prototype.saveAndGetId.apply(this, arguments);
        },
        sync: function (method, model, options) {
            var properties_to_omit = ['id'];

            if ( method === 'update' || method === 'create' ) {
                options.attrs = { project: _.extendOwn(_.omit(model.toJSON(), properties_to_omit), {
                    settings: JSON.stringify(model.settings.toJSON())
                }) };
            }

            //  If we're fetching a specific project from the server, we want
            //  to remember that fact and don't fetch again in the future. This
            //  could be counter-productive in multi-user setup though, as we
            //  need to constantly monitor changes made by other users, but
            //  that should be a separate concern
            if ( method === 'read' ) {
                var successCallback = options.success;

                //  This is similar to what they do in the original Model.fetch
                options.success = function (response) {
                    model._wasFetched = true;

                    if ( successCallback ) {
                        successCallback.call(model, response, options);
                    }
                };
            }

            return Backbone.sync.call(this, method, model, options);
        },
        parse: function (data) {
            var project_data = data && data.project ? data.project : data;
            var filtered_data = app.schema.parseAccordingToSchema(project_data, this.schema);

            //  This is different from other dependencies because we don't use
            //  schema for project-file currently. This is also the reason we
            //  don't use { parse: true } for files in setDependencies() here
            if ( project_data && project_data.files ) {
                filtered_data.files = _.map(project_data.files, function (file) {
                    return _.pick(file, function (value) {
                        return !_.isNull(value);
                    });
                });
            }

            if ( project_data && project_data.accessories ) {
                filtered_data.accessories = project_data.accessories;
            }

            if ( project_data && project_data.units ) {
                filtered_data.units = project_data.units;
            }

            return filtered_data;
        },
        initialize: function (attributes, options) {
            this.options = options || {};
            //  Was it fetched from the server already? This flag could be used
            //  to tell whether we need to request data from server
            this._wasFetched = false;
            //  Was it fully loaded already? This means it was fetched and all
            //  dependencies (units etc.) were processed correctly. This flag
            //  could be used to tell if it's good to render any views
            this._wasLoaded = false;

            if ( !this.options.proxy ) {
                this.units = new app.UnitCollection(null, { project: this });
                this.extras = new app.AccessoryCollection(null, { project: this });
                this.files = new app.ProjectFileCollection(null, { project: this });
                this.settings = new app.ProjectSettings(null, { project: this });

                this.on('sync', this.setDependencies, this);
                this.on('set_active', this.setDependencies, this);
                this.listenTo(this.settings, 'change', this.updateSettings);
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

            if ( this.get('units') ) {
                this.units.set(this.get('units'), { parse: true });
                this.unset('units', { silent: true });
                changed_flag = true;
            }

            if ( this.get('accessories') ) {
                this.extras.set(this.get('accessories'), { parse: true });
                this.extras.trigger('loaded');
                this.unset('accessories', { silent: true });
                changed_flag = true;
            }

            if ( this.get('files') ) {
                this.files.set(this.get('files'), { parse: true });
                this.unset('files', { silent: true });
                changed_flag = true;
            }

            if ( this.get('settings') ) {
                this.settings.set(this.parseSettings(this.get('settings')), { silent: true });
                this.unset('settings', { silent: true });
                changed_flag = true;
            }

            if ( changed_flag ) {
                this.trigger('set_dependencies');
            }

            if ( !this._wasLoaded ) {
                this._wasLoaded = true;
                this.trigger('fully_loaded');
            }
        },
        parseSettings: function (source_data) {
            var settings_object = {};
            var source_data_parsed;

            if ( _.isString(source_data) ) {
                try {
                    source_data_parsed = JSON.parse(source_data);
                } catch (error) {
                    // Do nothing
                }

                if ( source_data_parsed ) {
                    settings_object = source_data_parsed;
                }
            }

            return settings_object;
        },
        //  TODO: We persist settings, but we don't necessarily need it to be
        //  set as a property on our model. Or do we (it gives change event)?
        updateSettings: function () {
            this.persist('settings', this.settings.toJSON());
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( PROJECT_PROPERTIES, 'name' );
            }

            _.each(PROJECT_PROPERTIES, function (item) {
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
        getQuoteNumber: function () {
            return this.isNew() ? '--' : this.id;
        },
        getSubtotalUnitsPrice: function () {
            return this.units.getSubtotalPriceDiscounted();
        },
        getExtrasPrice: function () {
            return this.extras.getRegularItemsPrice();
        },
        //  This is what we use as tax base. Subtotal price for units + extras,
        //  but no shipping or optional extras
        getSubtotalPrice: function () {
            var subtotal_units_price = this.getSubtotalUnitsPrice();
            var extras_price = this.extras.getRegularItemsPrice();

            return subtotal_units_price + extras_price;
        },
        getTax: function () {
            var total_tax_percent = this.extras.getTotalTaxPercent();
            var subtotal = this.getSubtotalPrice();
            var tax = (total_tax_percent / 100) * subtotal;

            return tax;
        },
        getGrandTotal: function () {
            var subtotal = this.getSubtotalPrice();
            var shipping_price = this.extras.getShippingPrice();
            var tax = this.getTax();

            var grand_total = subtotal + shipping_price + tax;

            return grand_total;
        },
        getTotalCost: function () {
            var subtotal_units_cost = this.units.getSubtotalCostDiscounted();
            var extras_cost = this.extras.getRegularItemsCost();
            var shipping = this.extras.getShippingPrice();
            var hidden = this.extras.getHiddenPrice();
            var tax = this.getTax();

            return subtotal_units_cost + extras_cost + shipping + hidden + tax;
        },
        getProfit: function () {
            return this.getGrandTotal() - this.getTotalCost();
        },
        getTotalPrices: function () {
            var subtotal_units_price = this.getSubtotalUnitsPrice();
            var extras_price = this.getExtrasPrice();
            var optional_extras_price = this.extras.getOptionalItemsPrice();

            var shipping_price = this.extras.getShippingPrice();
            var total_tax_percent = this.extras.getTotalTaxPercent();

            var subtotal = this.getSubtotalPrice();
            var tax = this.getTax();
            var grand_total = this.getGrandTotal();

            var total_cost = this.getTotalCost();
            var profit = this.getProfit();
            var profit_percent = grand_total ? profit / grand_total * 100 : 0;

            //  TODO: this value should be customizable, not just 50% always,
            //  when it'll be customizable, it should also be tested. Maybe it
            //  could be a special type of accessory? Or just a project attr?
            var deposit_percent = 50;
            var deposit_on_contract = (deposit_percent / 100) * grand_total;
            var balance_due_at_delivery = grand_total - deposit_on_contract;

            return {
                subtotal_units: subtotal_units_price,
                subtotal_extras: extras_price,
                subtotal_optional_extras: optional_extras_price,
                subtotal: subtotal,
                tax_percent: total_tax_percent,
                tax: tax,
                shipping: shipping_price,
                grand_total: grand_total,
                total_cost: total_cost,
                profit: profit,
                profit_percent: profit_percent,
                deposit_percent: deposit_percent,
                deposit_on_contract: deposit_on_contract,
                balance_due_at_delivery: balance_due_at_delivery
            };
        }
    });
})();
