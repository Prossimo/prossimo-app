var app = app || {};

(function () {
    'use strict';

    var UNSET_VALUE = '--';

    app.QuoteInfoView = Marionette.View.extend({
        tagName: 'div',
        className: 'quote-info',
        template: app.templates['dashboard/quote-info-view'],
        ui: {
            $revision_container: '.quote-revision-container',
            $date_container: '.quote-date-container'
        },
        //  TODO: quote data is not real
        templateContext: function () {
            return {
                quote_name: 'Default Quote'
            };

            // return _.extend({}, this.model.toJSON(), {editMode: this.editMode});
        },
        onRender: function () {
            this.ui.$revision_container.append(this.revision_view.render().el);
            this.ui.$date_container.append(this.date_view.render().el);
        },
        onBeforeDestroy: function () {
            if (this.revision_view) {
                this.revision_view.destroy();
            }

            if (this.date_view) {
                this.date_view.destroy();
            }
        },
        initialize: function () {
            this.revision_view = new app.BaseInputView({
                model: this.model,
                param: 'quote_revision'
            });

            this.date_view = new app.BaseDatepickerInputView({
                model: this.model,
                param: 'quote_date',
                placeholder: UNSET_VALUE
            });
        }
    });
})();
