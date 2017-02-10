var app = app || {};

(function () {
    'use strict';

    app.EquationParamsItemView = Marionette.View.extend({
        className: 'equation-params-set',
        template: app.templates['settings/equation-params-item-view'],
        ui: {
            $param_a_container: '.param-a-container',
            $param_b_container: '.param-b-container'
        },
        onRender: function () {
            this.ui.$param_a_container.append(this.param_a_view.render().el);
            this.ui.$param_b_container.append(this.param_b_view.render().el);
        },
        onBeforeDestroy: function () {
            if ( this.param_a_view ) {
                this.param_a_view.destroy();
            }

            if ( this.param_b_view ) {
                this.param_b_view.destroy();
            }
        },
        getTitle: function (name) {
            var title_hash = {
                fixed: 'Fixed',
                operable: 'Operable'
            };

            return title_hash[name] || '';
        },
        templateContext: function () {
            return {
                title: this.getTitle(this.model.get('name'))
            };
        },
        initialize: function () {
            this.param_a_view = new app.BaseInputView({
                model: this.model,
                param: 'param_a'
            });

            this.param_b_view = new app.BaseInputView({
                model: this.model,
                param: 'param_b'
            });
        }
    });
})();
