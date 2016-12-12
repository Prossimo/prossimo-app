var app = app || {};

(function () {
    'use strict';

    app.MainQuoteView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen quote-screen',
        template: app.templates['quote/main-quote-view'],
        ui: {
            $quote_container: '.quote-container',
            $header_container: '.quote-header-container',
            $table_container: '.quote-table-container'                  
        },
        initialize: function () {        
            this.initCanvas = false;
/*
            this.listenTo(app.vent, 'main_quoteview:show_canvas:render', this.onInitCanvas);
            this.listenTo(app.vent, 'main_quoteview:add_comment:render', this.onAddComment);
            this.listenTo(app.vent, 'main_quoteview:comment_status:changed', this.onRedrawComments);
            this.listenTo(app.vent, 'main_quoteview:selected_comment:render', this.onRenderCommentFromList);*/
        },
        serializeData: function () {
            return {
                urlToDownloadPdf: app.settings.getPdfDownloadUrl('quote')
            };
        },
        onInitCanvas: function() {
            if (this.initCanvas) { 
                return true; 
            }

            var el = $('<canvas id="c"/>');
            var ctx = el[0].getContext('2d');           
            
            ctx.canvas.height = this.ui.$quote_container.height() + 70; // padding: left + right 
            ctx.canvas.width =  this.ui.$quote_container.width() + 80; // padding: top + bottom 
            
            this.ui.$quote_container.append(el);
            this.Canvas = new fabric.CanvasEx(el[0]);

            this.Canvas.on('object:moving', function (options) {

                var model = options.target.model;
                model.get('position').left = options.target.left
                model.get('position').top  = options.target.top;
 
            });          

            this.drawAllCommentsOnCanvas();
            this.initCanvas = true;            
        },        
        onRedrawComments: function() {
            this.removeAllCommentsOnCanvas();
            this.drawAllCommentsOnCanvas();
        },
        onRenderCommentFromList:function(index) {
  
            var top = app.comments.at(index).get('position').top - 50;                  
            $('.quote-outer-container').scrollTop(top);
        },
        onAddComment: function() {
            if (this.initCanvas === false ) {
                return false;
            }

            var info ={                       
                        index: 1,
                        status:  0,
                        position: {left: 120 ,  top:200 },
                        comment: { text: 'I am focusing on this problem',
                              date: '26/10/2016',
                              author: 'aaaaatest1@gmail.com'
                            },
                        replies: []
                    }
            
            info.index = app.comments.length + 1;
            info.position.top = Math.abs(this.ui.$quote_container.position().top) + 100;

            var cmt = new app.Comment (info); 
            app.comments.add(cmt);

            this.drawComment(cmt);
        },
        drawComment: function (model) {                                    

            var color = "red";
            if (model.get("status") == 1) {
                color = 'green';
            }

            var number = new fabric.Text(model.get("index").toString(), {
              fontSize: 24,
              fill: 'white',
              originX: 'center',
              originY: 'center',
              textAlign:'center'    
            });

            var circle = new fabric.Circle({
              radius: 15,
              fill: color,           
              originX: 'center',
              originY: 'center'
            });
            var cmt = new fabric.Group([circle,number], {
              model: model,
              left:  model.get("position").left,
              top: model.get("position").top      
            });
        
            cmt.on('object:dblclick', function (options) {  
                
                app.dialogs.showDialog('commentDetail', {model: this.model});
                
            });

            this.Canvas.add(cmt).setActiveObject(cmt);

            cmt['hasControls'] = false; 
            cmt['hasBorders'] = false;

        },
        drawAllCommentsOnCanvas: function() {
            var _self = this;
            app.comments.each(function(model, index) {
                _self.drawComment(model);
            });
        },
        removeAllCommentsOnCanvas: function() {
            this.Canvas.clear();
        },
        onRender: function () {
            
            this.units_table_view = new app.UnitsTableView({
                collection: app.current_project.units,
                extras: app.current_project.extras,
                parent_view: this
            });

            this.quote_header_view = new app.QuoteHeaderView({
                model: app.current_project
            });

            this.quote_table_view = new app.QuoteTableView({
                project: app.current_project,
                collection: app.current_project.units,
                extras: app.current_project.extras,
                show_outside_units_view: true
            });

            this.$el.append(this.units_table_view.render().el);
            this.ui.$header_container.append(this.quote_header_view.render().el);
            this.ui.$table_container.append(this.quote_table_view.render().el);
        },
        onDestroy: function () {
            this.units_table_view.destroy();
            this.quote_header_view.destroy();
            this.quote_table_view.destroy();
        }
    });
})();
