var app = app || {};

$(function () {
    'use strict';

    app.App = new Marionette.Application();

    app.App.on('start', function (data) {
        //  Register a communication channel for all events in the app
        app.vent = {};
        _.extend(app.vent, Backbone.Events);
        
        app.main_region = new Marionette.Region({ el: '#main' });

        //init settings
        app.settings = new app.Settings({
            profiles: data.profiles,
            fillings: data.fillings,
            dictionaries: data.dictionaries
        });

        //init project
        app.current_project=new app.Project(data.project);
        app.settings.setProjectSettings();

        app.main_region.show(new app.MainQuoteView());
    });
});
