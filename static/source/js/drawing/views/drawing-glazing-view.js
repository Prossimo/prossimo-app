var app = app || {};

(function () {
    'use strict';

    app.DrawingGlazingPopup = Marionette.ItemView.extend({
        className: 'drawing-glazing-popup',
        template: app.templates['drawing/drawing-glazing-view'],
        initialize: function () {
            // console.log('initialized!', this);
            app.$container.append( this.render().el );
        },
        ui: {
            $modal: '#glazingPopup'
        },
        events: {

        },
        onRender: function () {
            // console.log('rendered');
        },
        destroy: function () {
            this.ui.$modal.remove();
        },
        setSection: function (section_id) {
            this.section = this.model.getSection(section_id);
            return this;
        },
        showModal: function () {
            this.ui.$modal.modal('show');
            return this;
        },
        hideModal: function () {
            this.ui.$modal.modal('hide');
            return this;
        }
    });

})();
