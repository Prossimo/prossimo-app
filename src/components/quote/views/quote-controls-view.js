import Marionette from 'backbone.marionette';
import $ from 'jquery';
import moment from 'moment';

import App from '../../../main';
import template from '../templates/quote-controls-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'quote-controls-container',
    template,
    ui: {
        $download_button: '.js-download-pdf',
        $revision_checkbox: 'input[name="increase_revision"]',
        $date_checkbox: 'input[name="set_current_date"]',
    },
    events: {
        'click .js-download-pdf': 'onDownloadClick',
        'change input[type="checkbox"]': 'onCheckboxClick',
    },
    onCheckboxClick(e) {
        const $target = $(e.target);
        const option_name = $target.attr('name');
        const new_value = $target.is(':checked');

        this[option_name] = new_value;

        this.render();
    },
    onDownloadClick(e) {
        const updates = {};

        if (this.increase_revision) {
            updates.revision = this.getNewRevision();
        }

        if (this.set_current_date) {
            updates.date = this.getNewDate();
        }

        if (updates) {
            e.preventDefault();

            //  Async is set to false here becase otherwise browser
            //  will block a popup
            this.options.quote.persist(updates, {
                wait: true,
                async: false,
                success: () => {
                    const new_url = App.settings.getPdfDownloadUrl(this.options.quote_mode);

                    window.open(new_url);
                    this.render();
                },
            });
        }
    },
    getNewRevision() {
        return parseInt(this.options.quote.get('revision'), 10) + 1;
    },
    getNewDate() {
        return moment().format('D MMMM, YYYY');
    },
    templateContext() {
        const project_settings = App.settings.getProjectSettings();

        return {
            urlToDownloadPdf: App.settings.getPdfDownloadUrl(this.options.quote_mode),
            new_revision: this.getNewRevision(),
            new_date: this.getNewDate(),
            increase_revision: this.increase_revision,
            set_current_date: this.set_current_date,
            increase_revision_enabled: this.options.increase_revision_enabled,
            set_current_date_enabled: this.options.set_current_date_enabled,
            show_export_options: this.options.increase_revision_enabled || this.options.set_current_date_enabled,
            display_options: this.options.display_options,
            inches_display_mode: project_settings.getReadableValue('inches_display_mode'),
            show_drawings_in_quote: project_settings.getReadableValue('show_drawings_in_quote'),
        };
    },
    initialize() {
        const project_settings = App.settings.getProjectSettings();

        this.increase_revision = this.options.increase_revision_enabled;
        this.set_current_date = this.options.set_current_date_enabled;

        this.listenTo(project_settings, 'change', this.render);
    },
});
