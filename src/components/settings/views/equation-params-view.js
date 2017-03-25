var app = app || {};

(function () {
    'use strict';

    app.EquationParamsView = Marionette.CollectionView.extend({
        className: 'equation-params-container',
        tagName: 'div',
        childView: app.EquationParamsItemView
    });
})();
