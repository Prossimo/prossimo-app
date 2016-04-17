var app = app || {};

(function () {
    'use strict';

    var parent = app.DrawingModule;
    var module = Marionette.Module.extend({
        startWithParent: false,

        // Module common functions
        initialize: function () {},
        onStart: function () {
            console.log( this.moduleName + ' has been started!' );

            parent.on('update', this.update);
        },
        onStop: function () {
            console.log( this.moduleName + ' was stoped!' );

            parent.off('update', this.update);
        },

        // Define setter/getter
        set: function (name, val) {
            parent.set(name, val);
        },
        get: function (name) {
            return parent.get(name);
        },

        // Logic
        update: function () {
            console.log('Composer updated!');
        }
    });

    app.App.module('DrawingModule.Composer', module);

})();
