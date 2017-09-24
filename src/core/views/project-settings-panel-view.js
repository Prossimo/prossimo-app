import _ from 'underscore';
import Marionette from 'backbone.marionette';
import $ from 'jquery';

import { globalChannel } from '../../utils/radio';
import template from '../../templates/core/project-settings-panel-view.hbs';
import BaseToggleView from './base/base-toggle-view';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'project-settings-panel',
    template,
    ui: {
        $container: '.project-settings-container',
    },
    events: {
        'click .js-change-value': 'onChangeValueClick',
    },
    initialize() {
        this.setToggles();

        this.listenTo(globalChannel, 'project_selector:fetch_current:stop', this.onProjectLoaded);
    },
    onProjectLoaded() {
        this.model = this.options.data_store.getProjectSettings();
        this.setToggles();
        this.render();
    },
    onChangeValueClick(e) {
        const $button = $(e.target);
        const target_param = $button.closest('li').data('param');
        const target_value = $button.data('value');

        this.model.set(target_param, target_value);
        this.render();
    },
    setToggles() {
        const data = this.templateContext();

        if (data.is_model_set) {
            this.toggles = {};

            //  TODO: we probably want to treat other numbers as well!
            _.each(data.params, (param_options, key) => {
                if (param_options.possible_values_number === 2) {
                    this.toggles[key] = new BaseToggleView(param_options);
                }
            });
        }
    },
    getParamsSourceData() {
        const params_obj = {};

        if (this.model) {
            const name_title_type_hash = this.model.getNameTitleTypeHash();
            const possible_values_hash = this.model.getPossibleValuesHash();

            _.each(possible_values_hash, (item, key) => {
                params_obj[key] = {
                    model: this.model,
                    title: _.findWhere(name_title_type_hash, { name: key }).title,
                    property_name: key,
                    current_value: this.model.get(key),
                    values_list: _.map(item, list_item => ({
                        is_current: this.model.get(key) === list_item.value,
                        value: list_item.value,
                        title: list_item.title,
                    })),
                    possible_values_number: item.length,
                };
            });
        }

        return params_obj;
    },
    templateContext() {
        return {
            is_model_set: this.model,
            params: this.getParamsSourceData(),
        };
    },
    onRender() {
        const data = this.templateContext();

        if (data.is_model_set) {
            _.each(data.params, (param_options, key) => {
                if (param_options.possible_values_number === 2) {
                    this.$el.find(`li[data-param="${key}"] .value`).append(this.toggles[key].render().el);
                }
            });
        }
    },
});
