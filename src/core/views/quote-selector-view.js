import Marionette from 'backbone.marionette';

import { globalChannel } from '../../utils/radio';
import App from '../../main';
import template from '../../templates/core/quote-selector-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'quote-selector',
    template,
    ui: {
        $select: '.selectpicker',
    },
    events: {
        'change @ui.$select': 'onChange',
    },
    onChange() {
        const new_id = this.ui.$select.val();

        this.setCurrentQuote(new_id);
    },
    setCurrentQuote(new_id) {
        App.current_quote = this.collection.get(new_id);

        globalChannel.trigger('current_quote_changed');

        if (App.current_quote) {
            App.current_quote.trigger('set_active');

            this.stopListening(App.current_quote);

            if (App.current_quote._wasLoaded) {
                globalChannel.trigger('quote_selector:load_current:stop');
            } else {
                this.listenToOnce(App.current_quote, 'fully_loaded', () => {
                    globalChannel.trigger('quote_selector:load_current:stop');
                }, this);
            }

            this.listenTo(App.current_quote, 'remove', () => {
                this.selectFirstOrDefaultQuote();
            });
        } else {
            //  Even if no quote is selected (like in a case when project
            //  has no quotes) we still want this event so the current
            //  screen will reload
            globalChannel.trigger('quote_selector:load_current:stop');
        }

        this.render();
    },
    onRender() {
        this.ui.$select.selectpicker({
            style: 'btn-xs',
            size: 10,
        });
    },
    templateContext() {
        const is_disabled = !this.collection || !this.collection.length;

        return {
            is_disabled,
            quote_list: !is_disabled ? this.collection.map(item => ({
                is_selected: App.current_quote && item.id === App.current_quote.id,
                id: item.id,
                quote_name: item.getName(),
            })) : [],
        };
    },
    selectFirstOrDefaultQuote() {
        const first_quote = this.collection.at(0);
        const default_quote = this.collection.getDefaultQuote();

        if (first_quote && first_quote.id) {
            this.setCurrentQuote(first_quote.id);
        } else if (default_quote && default_quote.id) {
            this.setCurrentQuote(default_quote.id);
        } else {
            this.setCurrentQuote(undefined);
        }
    },
    //  When project was changed, we want to select a default quote
    onCurrentProjectLoaded() {
        if (this.collection) {
            this.stopListening(this.collection);
        }

        if (App.current_project) {
            this.collection = App.current_project.quotes;
            this.listenTo(this.collection, 'all', this.render);

            //  See if window hash contains quote id
            const hash_parts = (window.location.hash) ? window.location.hash.substr(1).split('/') : false;
            const hash_quote_id = hash_parts && hash_parts.length > 1 ? parseInt(hash_parts[1], 10) : false;

            if (hash_quote_id) {
                this.setCurrentQuote(hash_quote_id);
            } else {
                this.selectFirstOrDefaultQuote();
            }
        }
    },
    initialize() {
        this.listenTo(globalChannel, 'project_selector:fetch_current:stop', this.onCurrentProjectLoaded);
    },
});
