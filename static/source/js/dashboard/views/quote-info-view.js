var app = app || {};

(function () {
    'use strict';

    var UNSET_VALUE = '--';

    //  TODO: also show quote id and allow to edit name for non-default
    app.QuoteInfoView = Marionette.View.extend({
        tagName: 'div',
        className: 'quote-info',
        template: app.templates['dashboard/quote-info-view'],
        ui: {
            $revision_container: '.quote-revision-container',
            $date_container: '.quote-date-container'
        },
        templateContext: function () {
            return {
                is_default: this.model.get('is_default'),
                quote_name: this.model.get('is_default') ? 'Default Quote' : this.model.get('name')
            };
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
                param: 'revision'
            });

            this.date_view = new app.BaseDatepickerInputView({
                model: this.model,
                param: 'date',
                placeholder: UNSET_VALUE
            });
        }
    });
})();
