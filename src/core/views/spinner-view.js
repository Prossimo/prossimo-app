import Marionette from 'backbone.marionette';
import $ from 'jquery';
import Spinner from 'spin.js';

import { globalChannel } from '../../utils/radio';
import template from '../../templates/core/spinner-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'project-loading-spinner',
    template,
    ui: {
        $container: '.spinner-icon',
    },
    initialize() {
        this.spinner_options = {
            length: 5,
            width: 2,
            radius: 3,
            color: '#ccc',
            speed: 0.8,
        };

        this.active_request_counter = 0;

        this.listenTo(globalChannel, 'settings:fetch_data:start', this.show);
        this.listenTo(globalChannel, 'settings:fetch_data:stop', this.hide);
        this.listenTo(globalChannel, 'project_selector:fetch_list:start', this.show);
        this.listenTo(globalChannel, 'project_selector:fetch_list:stop', this.hide);
        this.listenTo(globalChannel, 'project_selector:fetch_current:start', this.show);
        this.listenTo(globalChannel, 'project_selector:fetch_current:stop', this.hide);
    },
    onRender() {
        this.spinner = this.spinner || new Spinner(this.spinner_options);
    },
    show() {
        this.active_request_counter += 1;

        if (this.active_request_counter > 0) {
            $('body').addClass('is-loading');
            this.spinner.spin(this.ui.$container.get(0));
        }
    },
    hide() {
        this.active_request_counter -= 1;

        if (this.active_request_counter < 1) {
            $('body').removeClass('is-loading');
            this.spinner.stop();
        }
    },
});
