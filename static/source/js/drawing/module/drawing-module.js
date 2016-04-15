var app = app || {};

(function () {
    'use strict';

    app.DrawingModule = Marionette.Module.extend({
        startWithParent: false,

        initialize: function (ModuleName) {
            console.log(ModuleName + ' has been initialized!');
        },

        define: function (Module) {
            console.log( 'Module defined!' );
            console.log( Module );
            console.log( '--' );
        },

        onStart: function () {
            console.log( 'Module started!' );
            console.log( arguments );
        },

        onStop: function () {
            console.log( 'Module stoped!' );
            console.log( arguments );

        }
    });

    console.log(app);

    // app.module('DrawingModule', app.DrawingModule);

})();
