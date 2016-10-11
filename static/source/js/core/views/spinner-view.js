var app = app || {};

(function () {
    'use strict';

    app.SpinnerView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'project-loading-spinner',
        template: app.templates['core/spinner-view'],
        ui: {
            $container: '.spinner-icon'
        },
        initialize: function () {
            this.spinner_options = {
                length: 5,
                width: 2,
                radius: 3,
                color: '#ccc',
                speed: 0.8
            };

            this.active_request_counter = 0;

            this.listenTo(app.vent, 'settings:fetch_data:start', this.show );
            this.listenTo(app.vent, 'settings:fetch_data:stop', this.hide );
            this.listenTo(app.vent, 'project_selector:fetch_list:start', this.show );
            this.listenTo(app.vent, 'project_selector:fetch_list:stop', this.hide );
            this.listenTo(app.vent, 'project_selector:fetch_current:start', this.show );
            this.listenTo(app.vent, 'project_selector:fetch_current:stop', this.hide );
        },
        onRender: function () {
            this.spinner = this.spinner || new Spinner(this.spinner_options);
        },
        show: function () {
            this.active_request_counter += 1;

            if ( this.active_request_counter > 0 ) {
                $('body').addClass('is-loading');
                this.spinner.spin(this.ui.$container.get(0));
            }
        },
        hide: function () {
            this.active_request_counter -= 1;

            if ( this.active_request_counter < 1 ) {
                $('body').removeClass('is-loading');
                this.spinner.stop();
            }
        }
    });
})();
