var app = app || {};

(function () {
    'use strict';

    app.MainCountingWindowsView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen drawing-screen',
        template: app.templates['counting-windows/main-counting-windows-view'],
        ui: {
            $drawing_container: '.counting-container',
            $sidebar_container: '.counting-sidebar-container'
        },
        events: {
            'unit-selected': 'onUnitSelected',
            'sidebar-toggle': 'onSidebarToggle'
        },
        onUnitSelected: function (e) {
            this.active_unit = e.model;
            this.updateDrawingView(true);
        },
        onSidebarToggle: function () {
            this.$el.toggleClass('sidebar-hidden');            
        },        
        initialize: function () {
      
            this.listenTo(app.current_project.settings, 'change', this.updateDrawingView);
        },
        updateDrawingView: function (update_rendered_flag) {
            if ( this.drawing_view ) {
                this.stopListening(this.drawing_view);
                this.drawing_view.destroy();
            }

            if ( this.active_unit ) {
                this.drawing_view = new app.CountingWindosDrawingView({
                    parent_view: this,
                });

                this.listenTo(this.drawing_view, 'all', this.onDrawingViewEvents);

                this.ui.$drawing_container.empty().append(this.drawing_view.render().el);

                if ( this._isShown && update_rendered_flag ) {
                    this.drawing_view.trigger('update_rendered');
                }
            }
        },
        onDrawingViewEvents: function (e) {
            this.trigger('drawing_view:' + e);
        },
        onRender: function () {
            this.active_unit = app.current_project.units.length ?
                app.current_project.units.first() : null;

            this.updateDrawingView();

            this.sidebar_view = new app.CountingWindowSidebarView({                
                parent_view: this
            });

            this.ui.$sidebar_container.append(this.sidebar_view.render().el);
        },
        onAttach: function () {
            if ( this.drawing_view ) {
                this.drawing_view.trigger('update_rendered');
            }
        },
        onDestroy: function () {
            this.sidebar_view.destroy();

            if ( this.drawing_view ) {
                this.stopListening(this.drawing_view);
                this.drawing_view.destroy();
            }


            //reflecting stamps into units
            app.stamps.each(function(stamp){
              
                var model = app.current_project.units.find(function(model) { return model.get('mark') === stamp.get('stamp'); });

                if( model ) {
                    model.set('quantity', stamp.get('quantity'));
                } else {
                    var m = new app.Unit({
                                        mark: stamp.get('stamp'),
                                        quantity: stamp.get('quantity')
                                    });
                    app.current_project.units.add(m);
                }
            });

        }
    });
})();
