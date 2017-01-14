import $ from 'jquery';
import _ from 'underscore';
import Marionette from 'backbone.marionette';
import App from '../../../main';
import Dialogs from '../../../dialogs';
import BaseInputView from '../../../core/views/base/base-input-view';
import template from '../templates/options-dictionary-entries-item-view.hbs';

export default Marionette.View.extend({
    tagName: 'tr',
    className: 'options-dictionary-entries-item',
    template: template,
    ui: {
        $name_container: '.entry-name',
        $profiles_list_container: '.entry-profiles p',
        $edit_profiles: '.js-edit-entry-profiles',
        $clone: '.js-clone-entry',
        $remove: '.js-remove-entry'
    },
    events: {
        'click @ui.$edit_profiles': 'editProfiles',
        'click @ui.$clone': 'cloneEntry',
        'click @ui.$remove': 'removeEntry'
    },
    editProfiles: function () {
        (new Dialogs()).showDialog('items-profiles-table', {
            collection_title: this.model.collection.options.dictionary.get('name'),
            active_item: this.model,
            collection: this.model.collection,
            profiles: App.settings.profiles,
            filter_condition: function (item) {
                return item.get('name') && !item.hasOnlyDefaultAttributes();
            }
        });
    },
    getProfilesNamesList: function () {
        var profiles_ids = _.pluck(this.model.get('profiles'), 'id');
        var profiles_names_list = [];

        if (profiles_ids && profiles_ids.length) {
            if (App.settings) {
                profiles_names_list = App.settings.getProfileNamesByIds(profiles_ids.sort());
            } else {
                profiles_names_list = profiles_ids.sort();
            }
        }

        return profiles_names_list;
    },
    removeEntry: function () {
        this.model.destroy();
    },
    cloneEntry: function () {
        this.model.duplicate();
    },
    templateContext: function () {
        var profiles = this.getProfilesNamesList();

        return {
            name: this.model.get('name'),
            profiles: profiles,
            profiles_string: profiles.length ? profiles.join(', ') : '--'
        };
    },
    onRender: function () {
        var profiles = this.templateContext().profiles;

        this.ui.$name_container.empty().append(this.name_input_view.render().el);

        this.ui.$profiles_list_container.on('mouseenter', function () {
            var $this = $(this);

            if (profiles && this.offsetWidth < this.scrollWidth) {
                $this.tooltip({
                    title: _.map(profiles, function (item) {
                        return '<p>' + item + '</p>';
                    }),
                    html: true,
                    trigger: 'manual'
                });
                $this.tooltip('show');
            }
        });
        this.ui.$profiles_list_container.on('mouseleave', function () {
            $(this).tooltip('hide').tooltip('destroy');
        });

        if (this.model.hasOnlyDefaultAttributes()) {
            this.$el.addClass('is-new');
        } else {
            this.$el.removeClass('is-new');
        }
    },
    onBeforeDestroy: function () {
        if (this.name_input_view) {
            this.name_input_view.destroy();
        }

        this.ui.$profiles_list_container.off();
        this.ui.$profiles_list_container.tooltip('destroy');
    },
    initialize: function () {
        this.name_input_view = new BaseInputView({
            model: this.model,
            param: 'name',
            input_type: 'text',
            placeholder: 'New Entry'
        });

        this.listenTo(this.model, 'change:profiles change:name', function () {
            this.render();
            this.name_input_view.delegateEvents();
        });
    }
});
