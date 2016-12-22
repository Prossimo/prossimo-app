var app = app || {};

(function () {
    'use strict';

    function getCountPageDefaults() {
        return {
                    pagenum: 0,
                    title: '',
                    url: '',
                    labels: new app.Labels
                };
    }

    function getLabelDefaults() {
        return {                                           
                    index: 0,                                    
                    position: { left: 0 ,  top:0 },
                    stamp: ''                                                               
                };
    }

    function getStampDefaults() {
        return {                 
                    stamp: '',
                    quantity: 0
                };
    }

    app.Label = Backbone.Model.extend({
        defaults: getLabelDefaults(),
        reset: function () {
            this.set(getLabelDefaults());
        }
    });

    app.Stamp = Backbone.Model.extend({
        defaults: getStampDefaults(),
        reset: function () {
            this.set(getStampDefaults());
        }
    });

    app.Labels = Backbone.Collection.extend({ 
        model: app.Label
    });

    app.CountPage = Backbone.Model.extend({
        defaults: getCountPageDefaults(),
        reset: function () {
            this.set(getCountPageDefaults());
        }
    });

    /* Pages including labels   */
    app.CountPages = Backbone.Collection.extend({ 
        initialize: function (options) {
            this.on("error", this.error, this);
            //this.fetch();
        },        
        model: app.CountPage,

        /*url:'/fake_count_pages.json',
       
        parse: function(response, options) {
            console.log(response);

            return response.pages;
        },*/

        updateItemByIndex : function(index, value) {
            this.models[index] = value;
        },
        
        error: function(model, response, options) {
            console.log(model);
            console.log(response);
            console.log(options);
        } 
    });


    app.Stamps = Backbone.Collection.extend({ 
        initialize: function (options) {
            this.on("error", this.error, this);
            //this.fetch();
        },        
        model: app.Stamp,

        /*url:'/fake_count_pages.json',
       
        parse: function(response, options) {
            console.log(response);

            return response.stamps;
        },*/
        
        error: function(model, response, options) {
            console.log(model);
            console.log(response);
            console.log(options);
        } 
    });
    
})();
