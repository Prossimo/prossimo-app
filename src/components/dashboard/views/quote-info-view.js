import Marionette from 'backbone.marionette';

import BaseInputView from '../../../core/views/base/base-input-view';
import BaseDatepickerInputView from '../../../core/views/base/base-datepicker-input-view';
import template from '../templates/quote-info-view.hbs';

const UNSET_VALUE = '--';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'quote-info',
    template,
    templateContext() {
        return {
            id: this.model.id,
            name: this.model.getName(),
        };
    },
    regions: {
        name: {
            el: '.quote-name-container',
        },
        revision: {
            el: '.quote-revision-container',
        },
        date: {
            el: '.quote-date-container',
        },
    },
    onRender() {
        this.showChildView('name', new BaseInputView({
            model: this.model,
            param: 'name',
            placeholder: this.model.getName(),
        }));

        this.showChildView('revision', new BaseInputView({
            model: this.model,
            param: 'revision',
        }));

        this.showChildView('date', new BaseDatepickerInputView({
            model: this.model,
            param: 'date',
            placeholder: UNSET_VALUE,
        }));
    },
});
