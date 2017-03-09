var app = app || {};

(function () {
    'use strict';

    var UNSET_VALUE = '--';

    app.QuoteInfoView = Marionette.View.extend({
        tagName: 'div',
        className: 'quote-info',
        template: app.templates['dashboard/quote-info-view'],
        templateContext: function () {
            return {
                id: this.model.id,
                is_default: this.model.get('is_default'),
                name: this.model.getName()
            };
        },
        regions: {
            name: {
                el: '.quote-name-container'
            },
            revision: {
                el: '.quote-revision-container'
            },
            date: {
                el: '.quote-date-container'
            }
        },
        onRender: function () {
            if ( this.model.get('is_default') !== true ) {
                this.showChildView('name', new app.BaseInputView({
                    model: this.model,
                    param: 'name'
                }));
            }

            this.showChildView('revision', new app.BaseInputView({
                model: this.model,
                param: 'revision'
            }));

            this.showChildView('date', new app.BaseDatepickerInputView({
                model: this.model,
                param: 'date',
                placeholder: UNSET_VALUE
            }));
        }
    });
})();
