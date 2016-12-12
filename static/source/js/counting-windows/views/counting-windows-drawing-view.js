var app = app || {};

(function () {
    'use strict';

    app.CountingWindosDrawingView = Marionette.ItemView.extend({
        tagName: 'div',
        template: app.templates['counting-windows/counting-windows-drawing-view'],
       
        ui: {
            $canvas_container: '.counting-windows-area'        
        },
        events: {
            'mousewheel @ui.$canvas_container':'onMouseWheel',
            'DOMMouseScroll @ui.$canvas_container':'onMouseWheel'
        },
        initialize: function () {        
            this.initCanvas = false;
            this.Canvas = null;
            this.addedStamp = false;

            this.listenTo(app.vent, 'counting_windows_view:page:load', this.onPageLoad);
            this.listenTo(app.vent, 'counting_windows_view:add_stamp:render', this.onAddStamp);            
        },       
        onInitCanvas: function() {

            var el = $('<canvas id="c"/>');
            var ctx = el[0].getContext('2d');           
                      
            this.ui.$canvas_container.append(el);
            this.Canvas = new fabric.CanvasEx(el[0]);

            this.Canvas.on('object:moving', function (options) {

                var model = options.target.model;
                model.position.left = options.target.left
                model.position.top  = options.target.top;
 
            });          
            
            var self = this;
            this.Canvas.on('mouse:move', function(event) {
                 
                  if (self.addedStamp) {    
                        var obj = self.Canvas.getActiveObject();
                        var pointer = self.Canvas.getPointer(event.e);

                        obj.left = pointer.x;
                        obj.top = pointer.y;
                        obj.model.position.left = pointer.x;
                        obj.model.position.top = pointer.y;
                        
                        obj.setCoords();
                        self.Canvas.renderAll();
                  }
            });

            this.Canvas.on('mouse:down', function(event) {                

                  if (self.addedStamp) {                        
                      self.addedStamp = false;                      

                  }
            });

            this.initCanvas = true;            
        },        
        onPageLoad: function(pagenum) {
            if (!this.initCanvas) 
                this.onInitCanvas();

            var _self= this;
            this.removeAllStampsOnCanvas();
            
            fabric.Image.fromURL(app.countpages.at(pagenum).get('url'), function (img) {
                _self.Canvas.setWidth(img.width);
                _self.Canvas.setHeight(img.height);                  
            });

            this.Canvas.setBackgroundImage(app.countpages.at(pagenum).get('url'), this.Canvas.renderAll.bind(this.Canvas), {
                backgroundImageOpacity: 0.5,
                backgroundImageStretch: true
            });            

            this.drawAllStampsOnCanvas(pagenum);
        },
        onMouseWheel: function(e) {            
            
            if(e.ctrlKey == true)
            {
                e.preventDefault();
                if(e.originalEvent.wheelDelta > 0) {                     
                     this.Canvas.setZoom(this.Canvas.getZoom() / 1.1 ) ;
                 }else {                     
                     this.Canvas.setZoom(this.Canvas.getZoom() * 1.1 ) ;
                 }
            }
  
        },
        onRedrawComments: function() {
            this.removeAllCommentsOnCanvas();
            this.drawAllCommentsOnCanvas();
        },
        onRenderCommentFromList:function(index) {
  
            var top = app.comments.at(index).get('position').top - 50;                  
            $('.quote-outer-container').scrollTop(top);
        },
        onAddStamp: function(stamp) {
            if (this.initCanvas === false ) {
                return false;
            }                         
                        
            this.addedStamp = true;
            this.drawStamp(stamp);
        },
        drawStamp: function (info) {                                    

            var color = "red";            

            var number = new fabric.Text(info.stamp, {
              fontSize: 17,
              fontWeight: 'bold',
              fill: 'red',
              originX: 'center',
              originY: 'center',
              textAlign:'center',

              model: info,
              left: info.position.left,
              top: info.position.top      
            });
        
    
            number.on('object:dblclick', function (options) {  

                //propagate comment's click event to main controller
                //show popover
                
            });

            this.Canvas.add(number).setActiveObject(number);

            number['hasControls'] = false; 
            number['hasBorders'] = false;         
        },
        drawAllStampsOnCanvas: function(pagenum) {
            var _self = this;

            for (var i = 0; i < app.countpages.at(pagenum).get('labels').length; i++) {
                var stamp = app.countpages.at(pagenum).get('labels')[i];
                _self.drawStamp(stamp);
            }              
            
        },
        removeAllStampsOnCanvas: function() {
            
            this.Canvas.clear();
        },
        onRender: function () {
            
        },
        onDestroy: function () {
      
        }
    });
})();
