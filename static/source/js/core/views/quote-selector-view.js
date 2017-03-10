var app = app || {};

(function () {
    'use strict';

    app.QuoteSelectorView = Marionette.View.extend({
        tagName: 'div',
        className: 'quote-selector',
        template: app.templates['core/quote-selector-view'],
        ui: {
            $select: '.selectpicker'
        },
        events: {
            'change @ui.$select': 'onChange'
        },
        onChange: function () {
            var new_id = this.ui.$select.val();

            this.setCurrentQuote(new_id);
        },
        setCurrentQuote: function (new_id) {
            app.current_quote = this.collection.get(new_id);

            if ( !app.current_quote ) {
                return;
            }

            app.vent.trigger('current_quote_changed');
            app.current_quote.trigger('set_active');

            this.stopListening(app.current_quote);

            if ( app.current_quote._wasLoaded ) {
                app.vent.trigger('quote_selector:load_current:stop');
            } else {
                this.listenToOnce(app.current_quote, 'fully_loaded', function () {
                    app.vent.trigger('quote_selector:load_current:stop');
                }, this);
            }

            this.render();
        },
        onRender: function () {
            this.ui.$select.selectpicker({
                style: 'btn-xs',
                size: 10
            });
        },
        templateContext: function () {
            var is_disabled = !this.collection || !this.collection.length;

            return {
                is_disabled: is_disabled,
                quote_list: !is_disabled ? this.collection.map(function (item) {
                    return {
                        is_selected: app.current_quote && item.id === app.current_quote.id,
                        id: item.id,
                        quote_name: item.getName()
                    };
                }) : []
            };
        },
        //  When project was changed, we want to select a default quote
        onCurrentProjectLoaded: function () {
            if ( this.collection ) {
                this.stopListening(this.collection);
            }

            if ( app.current_project ) {
                this.collection = app.current_project.quotes;
                this.listenTo(this.collection, 'all', this.render);

                //  See if window hash contains quote id
                var hash_parts = (window.location.hash) ? window.location.hash.substr(1).split('/') : false;
                var hash_quote_id = hash_parts && hash_parts.length > 1 ? parseInt(hash_parts[1], 10) : false;

                var first_quote = this.collection.at(0);
                var default_quote = this.collection.getDefaultQuote();

                if ( hash_quote_id ) {
                    this.setCurrentQuote(hash_quote_id);
                } else if ( first_quote && first_quote.id ) {
                    this.setCurrentQuote(first_quote.id);
                } else if ( default_quote && default_quote.id ) {
                    this.setCurrentQuote(default_quote.id);
                }

                this.render();
            }
        },
        initialize: function () {
            this.listenTo(app.vent, 'project_selector:fetch_current:stop', this.onCurrentProjectLoaded);
        }
    });
})();
