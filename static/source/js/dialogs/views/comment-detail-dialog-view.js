var app = app || {};

(function () {
    'use strict';

    app.CommentDetailDialogView = app.BaseDialogView.extend({
        className: 'open-comment-detail-modal modal fade',
        template: app.templates['dialogs/comment-detail-dialog-view'],
        ui: {
            $add_reply:  '.modal-body .btn-save',
            $status: '.modal-body .status',
            $delete_reply:'.reply-delete-btn'           
        },
        events: {
            'click  @ui.$add_reply': 'onAddReply',
            'click  @ui.$delete_reply': 'onDeleteReply',
            'change @ui.$status': 'onSelectStatus'               
        },        
        onSelectStatus: function(e) {            

            this.model.set({
                'status': parseInt($('.status').val())
            });

            app.vent.trigger('main_quoteview:comment_status:changed');           

        },
        onDeleteReply: function(e) {
           
            var index = $(e.target).data('param');            
            this.model.get("replies").splice(index, 1);

            this.render();
        },
        onAddReply: function (e) {
            e.preventDefault();

            var options = { year: "numeric", month: "2-digit",  day: "numeric" };
            var date = new Date();
            
            this.model.get("replies").push( {
                "text": $('.feedback').val(),
                "date": date.toLocaleTimeString("en-US", options),
                "author": "test@gmail.com"
            });
            
            this.render();            
        },
        onRender: function () {
            if (!this.$el.find('.modal-header').find('h4').length) {
                this.$el.find('.modal-header').append('<h4></h4>');
            }

            this.$el.find('.modal-header').find('h4').text('Comment');           
        }
    });

    window.Handlebars.registerHelper('select', function( value, options ){
        var $el = $('<select />').html( options.fn(this) );
        $el.find('[value="' + value + '"]').attr({'selected':'selected'});
        return $el.html();
    });
})();
