import $ from 'jquery';
import _ from 'underscore';
import Marionette from 'backbone.marionette';

import App from '../../../main';
import BaseInputView from '../../../core/views/base/base-input-view';
import ProfileConnectionsTableView from './profile-connections-table-view';
import template from '../templates/options-dictionary-entries-item-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'options-dictionary-entries-item',
    template,
    ui: {
        $name_container: '.entry-name',
        $supplier_name_container: '.entry-supplier-name',
        $profiles_list_container: '.entry-profiles p',
        $edit_profiles: '.js-edit-entry-profiles',
        $clone: '.js-clone-entry',
        $remove: '.js-remove-entry',
        $expand: '.js-expand-entry',
        $expand_container: '.profile-availability',
    },
    is_expanded:false,
    events: {
        'click @ui.$edit_profiles': 'editProfiles',
        'click @ui.$clone': 'cloneEntry',
        'click @ui.$remove': 'removeEntry',
        'click @ui.$expand': 'expandEntry',
    },
    editProfiles() {
        App.dialogs.showDialog('items-profiles-table', {
            collection_title: this.model.collection.options.dictionary.get('name'),
            active_item: this.model,
            collection: this.model.collection,
            profiles: App.settings.profiles,
            filter_condition(item) {
                return item.get('name') && !item.hasOnlyDefaultAttributes();
            },
        });
    },
    getProfilesNamesList() {
        const profiles_ids = this.model.get('dictionary_entry_profiles').pluck('profile_id');
        let profiles_names_list = [];

        if (profiles_ids && profiles_ids.length) {
            if (App.settings) {
                profiles_names_list = App.settings.profiles.getProfileNamesByIds(profiles_ids.sort());
            } else {
                profiles_names_list = profiles_ids.sort();
            }
        }

        return profiles_names_list;
    },
    removeEntry() {
        this.model.destroy();
    },
    cloneEntry() {
        this.model.duplicate();
    },
    expandEntry() {
        this.is_expanded = !this.is_expanded;

        this.ui.$expand_container.toggleClass('is-shown', this.is_expanded);
        if(this.is_expanded){
            this.ui.$expand_container.append(this.profile_connections_table_view.render().el);
        }
    },
    templateContext() {
        const profiles = this.getProfilesNamesList();

        return {
            is_expanded: this.is_expanded,
            name: this.model.get('name'),
            supplier_name: this.model.get('supplier_name'),
            profiles,
            profiles_string: profiles.length ? profiles.join(', ') : '--',
        };
    },
    onRender() {
        const profiles = this.templateContext().profiles;

        this.ui.$name_container.empty().append(this.name_input_view.render().el);
        this.ui.$supplier_name_container.empty().append(this.supplier_name_input_view.render().el);

        this.ui.$profiles_list_container.on('mouseenter', () => {
            const $this = $(this);

            if (profiles && this.offsetWidth < this.scrollWidth) {
                $this.tooltip({
                    title: _.map(profiles, item => `<p>${item}</p>`),
                    html: true,
                    trigger: 'manual',
                });
                $this.tooltip('show');
            }
        });
        this.ui.$profiles_list_container.on('mouseleave', () => {
            $(this).tooltip('hide').tooltip('destroy');
        });

        if (this.model.hasOnlyDefaultAttributes()) {
            this.$el.addClass('is-new');
        } else {
            this.$el.removeClass('is-new');
        }


    },
    onBeforeDestroy() {
        if (this.name_input_view) {
            this.name_input_view.destroy();
        }

        if (this.profile_connections_table_view) {
            this.profile_connections_table_view.destroy();
        }

        if (this.supplier_name_input_view) {
            this.supplier_name_input_view.destroy();
        }

        this.ui.$profiles_list_container.off();
        this.ui.$profiles_list_container.tooltip('destroy');
    },
    initialize() {
        this.is_expanded = false;
        this.name_input_view = new BaseInputView({
            model: this.model,
            param: 'name',
            input_type: 'text',
            placeholder: 'New Entry',
        });

        this.supplier_name_input_view = new BaseInputView({
            model: this.model,
            param: 'supplier_name',
            input_type: 'text',
            placeholder: '',
        });

        this.profile_connections_table_view = new ProfileConnectionsTableView({
            collection: this.model.get('dictionary_entry_profiles'),
        });

        this.listenTo(this.model, 'change:dictionary_entry_profiles change:namechange:supplier_name', () => {
            this.render();
            this.name_input_view.delegateEvents();
            this.supplier_name_input_view.delegateEvents();
        });
    },
});
