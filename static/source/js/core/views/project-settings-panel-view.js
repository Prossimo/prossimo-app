var app = app || {};

(function () {
    'use strict';

    app.ProjectSettingsPanelView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'project-settings-panel',
        template: app.templates['core/project-settings-panel-view'],
        ui: {
            $container: '.project-settings-container'
        },
        events: {
            'click .js-change-value': 'onChangeValueClick'
        },
        initialize: function () {
            this.setToggles();

            this.listenTo(app.vent, 'project_selector:fetch_current:stop', this.onProjectLoaded);
        },
        onProjectLoaded: function () {
            this.model = app.settings.getProjectSettings();
            this.setToggles();
            this.render();
        },
        onChangeValueClick: function (e) {
            
            var $button = $(e.target);
            var target_param = $button.closest('li').data('param');
            var target_value = $button.data('value');

            this.model.set(target_param, target_value);
            this.render();
        },
        setToggles: function () {
            var data = this.serializeData();

            if ( data.is_model_set ) {
                this.toggles = {};

                //  TODO: we probably want to treat other numbers as well!
                _.each(data.params, function (param_options, key) {
                    if ( param_options.possible_values_number === 2 ) {
                        this.toggles[key] = new app.BaseToggleView(param_options);
                    }
                }, this);
            }
        },
        getParamsSourceData: function () {
            var params_obj = {};

            if ( this.model ) {
                var name_title_type_hash = this.model.getNameTitleTypeHash();
                var possible_values_hash = this.model.getPossibleValuesHash();

                _.each(possible_values_hash, function (item, key) {
                    params_obj[key] = {
                        model: this.model,
                        title: _.findWhere(name_title_type_hash, { name: key }).title,
                        property_name: key,
                        current_value: this.model.get(key),
                        values_list: _.map(item, function (list_item) {
                            return {
                                is_current: this.model.get(key) === list_item.value,
                                value: list_item.value,
                                title: list_item.title
                            };
                        }, this),
                        possible_values_number: item.length
                    };
                }, this);
            }

            return params_obj;
        },
        serializeData: function () {
            return {
                is_model_set: this.model,
                params: this.getParamsSourceData()
            };
        },
        onRender: function () {
            var data = this.serializeData();

            if ( data.is_model_set ) {
                _.each(data.params, function (param_options, key) {
                    if ( param_options.possible_values_number === 2 ) {
                        this.$el.find('li[data-param="' + key + '"] .value').append(this.toggles[key].render().el);
                    }
                }, this);
            }
        }
    });
})();
