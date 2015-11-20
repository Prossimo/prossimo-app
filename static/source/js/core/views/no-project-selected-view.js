var app = app || {};

(function () {
    'use strict';

    app.NoProjectSelectedView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen no-project-selected-screen',
        template: app.templates['core/no-project-selected-view']
    });
})();
