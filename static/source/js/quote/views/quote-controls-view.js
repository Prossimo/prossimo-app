var app = app || {};

(function () {
    'use strict';

    app.QuoteControlsView = Marionette.View.extend({
        tagName: 'div',
        className: 'quote-controls-container',
        template: app.templates['quote/quote-controls-view'],
        ui: {
            $download_button: '.js-download-pdf',
            $revision_checkbox: 'input[name="increase_revision"]',
            $date_checkbox: 'input[name="set_current_date"]'
        },
        events: {
            'click .js-download-pdf': 'onDownloadClick',
            'change input[type="checkbox"]': 'onCheckboxClick'
        },
        onCheckboxClick: function (e) {
            var $target = $(e.target);
            var option_name = $target.attr('name');
            var new_value = $target.is(':checked');

            this[option_name] = new_value;

            this.render();
        },
        onDownloadClick: function (e) {
            var self = this;
            var updates = {};

            if ( this.increase_revision ) {
                updates.revision = this.getNewRevision();
            }

            if ( this.set_current_date ) {
                updates.date = this.getNewDate();
            }

            if ( updates ) {
                e.preventDefault();

                //  Async is set to false here becase otherwise browser
                //  will block a popup
                this.options.quote.persist(updates, {
                    wait: true,
                    async: false,
                    success: function () {
                        var new_url = app.settings.getPdfDownloadUrl(self.options.quote_mode);

                        window.open(new_url);
                        self.render();
                    }
                });
            }
        },
        getNewRevision: function () {
            return parseInt(this.options.quote.get('revision'), 10) + 1;
        },
        getNewDate: function () {
            return moment().format('D MMMM, YYYY');
        },
        templateContext: function () {
            return {
                urlToDownloadPdf: app.settings.getPdfDownloadUrl(this.options.quote_mode),
                new_revision: this.getNewRevision(),
                new_date: this.getNewDate(),
                increase_revision: this.increase_revision,
                set_current_date: this.set_current_date,
                increase_revision_enabled: this.options.increase_revision_enabled,
                set_current_date_enabled: this.options.set_current_date_enabled
            };
        },
        initialize: function () {
            this.increase_revision = this.options.increase_revision_enabled;
            this.set_current_date = this.options.set_current_date_enabled;
        }
    });
})();
