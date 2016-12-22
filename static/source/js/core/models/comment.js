var app = app || {};

(function () {
    'use strict';

    function getCommentDefaults() {
        return {
            index: 1,
            status:  1,
            position: {left: 150 ,  top:200 },
            comment: new app.CommentItem,            
            replies: new app.Replies
        };
    }

    function getCommentItemDefaults() {
        return {            
                text: '',
                date:'',
                author:''            
            };
    }


    app.CommentItem = Backbone.Model.extend({
        defaults: getCommentItemDefaults(),
        reset: function () {
            this.set(getCommentItemDefaults());
        }
    });

    app.Replies = Backbone.Collection.extend({ 
        model: app.CommentItem
    });

    app.Comment = Backbone.Model.extend({
        defaults: getCommentDefaults(),
        reset: function () {
            this.set(getCommentDefaults());
        }
    });

    app.Comments = Backbone.Collection.extend({
        initialize: function (options) {
            this.on("error", this.error, this);
            this.fetch();
        },
        model: app.Comment,
       
        url:'/fake_comments.json',
       
        parse: function(response, options) {
            console.log(response);

            return response.entries;
        },
        
        error: function(model, response, options) {
            console.log(model);
            console.log(response);
            console.log(options);
        }
    });

})();
