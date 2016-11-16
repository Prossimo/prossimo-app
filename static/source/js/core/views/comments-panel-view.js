var app = app || {};

(function () {
    'use strict';

    app.CommentsPanelView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'comments-panel',
        template: app.templates['core/comments-panel-view'],
        ui: {
            $container: '.comments-container',
            $add_comment: '.add-comment-button',
            $row: '.row'
        },
        events: {            
            'click @ui.$add_comment': 'onAddCommentBtn',
            'click @ui.$row':'onClickComment'
        },
        initialize: function () {
            this.listenTo(app.vent, 'main_quoteview:comment_status:changed', this.onStatusChanged);
        },        
        onClickComment: function(e) {
            var index = parseInt($(e.target).data('param')) - 1;

            app.vent.trigger('main_quoteview:selected_comment:render', index);         
        },
        onAddCommentBtn: function() {
            app.vent.trigger('main_quoteview:add_comment:render');

            this.render();
        },           
        onStatusChanged: function() {

            this.render();
        },         
        onRender: function () {
            
            console.log(this.collection);
        }
    });
})();
