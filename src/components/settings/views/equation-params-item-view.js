import Marionette from 'backbone.marionette';

import BaseInputView from '../../../core/views/base/base-input-view';
import template from '../templates/equation-params-item-view.hbs';

export default Marionette.View.extend({
    className: 'equation-params-set',
    template,
    ui: {
        $param_a_container: '.param-a-container',
        $param_b_container: '.param-b-container',
    },
    onRender() {
        this.ui.$param_a_container.append(this.param_a_view.render().el);
        this.ui.$param_b_container.append(this.param_b_view.render().el);
    },
    onBeforeDestroy() {
        if (this.param_a_view) {
            this.param_a_view.destroy();
        }

        if (this.param_b_view) {
            this.param_b_view.destroy();
        }
    },
    getTitle(name) {
        const title_hash = {
            fixed: 'Fixed',
            operable: 'Operable',
        };

        return title_hash[name] || '';
    },
    templateContext() {
        return {
            title: this.getTitle(this.model.get('name')),
        };
    },
    initialize() {
        this.param_a_view = new BaseInputView({
            model: this.model,
            param: 'param_a',
        });

        this.param_b_view = new BaseInputView({
            model: this.model,
            param: 'param_b',
        });
    },
});
