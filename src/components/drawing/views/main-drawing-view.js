import Marionette from 'backbone.marionette';

import App from '../../../main';
import DrawingView from './drawing-view';
import DrawingSidebarView from './drawing-sidebar-view';
import template from '../templates/main-drawing-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'screen drawing-screen',
    template: template,
    ui: {
        $drawing_container: '.drawing-container',
        $sidebar_container: '.drawing-sidebar-container'
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
        this.updateDrawingView(true);
    },
    getGlobalInsideView: function () {
        return this.global_inside_view;
    },
    setGlobalInsideView: function (value) {
        this.global_inside_view = value;
    },
    initialize: function () {
        //  Used to store external state for the drawing_view
        this.global_inside_view = false;

        this.listenTo(App.current_project.settings, 'change', this.updateDrawingView);
    },
    updateDrawingView: function (update_rendered_flag) {
        if (this.drawing_view) {
            this.stopListening(this.drawing_view);
            this.drawing_view.destroy();
        }

        if (this.active_unit) {
            this.drawing_view = new DrawingView({
                parent_view: this,
                model: this.active_unit
            });

            this.listenTo(this.drawing_view, 'all', this.onDrawingViewEvents);

            this.ui.$drawing_container.empty().append(this.drawing_view.render().el);

            if (this.isAttached() && update_rendered_flag) {
                this.drawing_view.trigger('update_rendered');
            }
        }
    },
    onDrawingViewEvents: function (e) {
        this.trigger('drawing_view:' + e);
    },
    onRender: function () {
        this.active_unit = App.current_quote.units.length ?
            App.current_quote.units.first() : null;

        this.updateDrawingView();

        this.sidebar_view = new DrawingSidebarView({
            collection: App.current_quote.units,
            parent_view: this
        });

        this.ui.$sidebar_container.append(this.sidebar_view.render().el);
    },
    onAttach: function () {
        if (this.drawing_view) {
            this.drawing_view.trigger('update_rendered');
        }
    },
    onBeforeDestroy: function () {
        this.sidebar_view.destroy();

        if (this.drawing_view) {
            this.stopListening(this.drawing_view);
            this.drawing_view.destroy();
        }
    }
});
