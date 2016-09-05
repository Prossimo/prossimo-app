var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryListView = Marionette.CompositeView.extend({
        tagName: 'div',
        className: 'options-dictionary-list-panel',
        template: app.templates['settings/options-dictionary-list-view'],
        childView: app.OptionsDictionaryListItemView,
        childViewContainer: '.options-list-container',
        childViewOptions: function () {
            return {
                parent_view: this
            };
        },
        ui: {
            $container: '.options-list-container',
            $add_new_dictionary: '.js-add-new-dictionary'
        },
        events: {
            'click @ui.$add_new_dictionary': 'addNewDictionary'
        },
        addNewDictionary: function (e) {
            var new_position = this.collection.length ? this.collection.getMaxPosition() + 1 : 0;
            var new_dictionary = new app.OptionsDictionary({
                position: new_position
            });

            e.stopPropagation();
            this.collection.add(new_dictionary);
            this.ui.$add_new_dictionary.blur();
            this.render();
        },
        setActiveItem: function (model) {
            this.options.parent_view.setActiveItem(model);
        },
        getActiveItem: function () {
            return this.options.parent_view.getActiveItem();
        },
        onSort: function (event) {
            this.collection.setItemPosition(event.oldIndex, event.newIndex);
        },
        serializeData: function () {
            return {
                dictionaries_length: this.collection.length
            };
        },
        onRender: function () {
            var self = this;

            this.ui.$container.sortable({
                draggable: '.options-list-item',
                onSort: function (event) {
                    self.onSort(event);
                }
            });
        },
        onDestroy: function () {
            this.ui.$container.sortable('destroy');
        }
    });
})();
