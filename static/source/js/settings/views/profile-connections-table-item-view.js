var app = app || {};

(function () {
    'use strict';

    app.ProfileConnectionsTableItemView = Marionette.View.extend({
        tagName: 'div',
        className: 'table-item',
        template: app.templates['settings/profile-connections-table-item-view'],
        ui: {
            $grid_container: '.grid-container',
            $cost_per_item_container: 'td.profile-cost-per-item',
            $toggle_grid: '.js-toggle-grid'
        },
        events: {
            'click @ui.$toggle_grid': 'toggleGrid'
        },
        toggleGrid: function () {
            this.show_grid = !this.show_grid;

            // TODO: we do this instead of calling this.render() to avoid
            // issues with event delegation, although I'm not sure if this is
            // an optimal way, we probably have to use regions
            this.ui.$grid_container.toggleClass('is-open', this.show_grid);

            if ( this.ui.$grid_container.hasClass('is-open') && this.pricing_grids_view ) {
                this.pricing_grids_view.updateTable();
            }
        },
        //  TODO: this causes some issues (like Expand doesn't work sometimes).
        //  Maybe we should avoid re-rendering (we also lose open grid state
        //  for some reason) or just fix delegation problems
        onChangeIsDefault: function () {
            this.render();
        },
        getProfileName: function () {
            var profile_id = this.model.get('profile_id');
            var profile = app.settings.profiles.get(profile_id);

            return profile ? profile.get('name') : 'Err: no profile with ID=' + profile_id;
        },
        getPricingGridString: function () {
            var grids = this.model.get('pricing_grids');
            var grid_string = '--';

            if ( grids && grids.length ) {
                var values_num = grids
                    .map(function (item) {
                        return item.get('data').length;
                    }).reduce(function (memo, item) {
                        return memo + item;
                    }, 0);
                grid_string = grids.length + ' grids, ' + values_num + ' values';
            }

            return grid_string;
        },
        templateContext: function () {
            var pricing_data = this.model.getPricingData();
            var has_grids = pricing_data && pricing_data.scheme === 'PRICING_GRIDS';
            var has_per_item_cost = pricing_data && pricing_data.scheme === 'PER_ITEM';

            return {
                has_grids: has_grids,
                has_per_item_cost: has_per_item_cost,
                show_grids: this.show_grids,
                profile_name: this.getProfileName(),
                pricing_grid_string: has_grids && this.getPricingGridString()
            };
        },
        onRender: function () {
            var context = this.templateContext();

            if ( this.pricing_grid_view ) {
                this.pricing_grids_view.destroy();
            }

            if ( this.per_item_cost_editor_view ) {
                this.per_item_cost_editor_view.destroy();
            }

            if ( context.has_grids ) {
                this.pricing_grids_view = new app.PerProfilePricingGridsEditorView({
                    grids: this.model.get('pricing_grids'),
                    parent_view: this
                });
                this.ui.$grid_container.append(this.pricing_grids_view.render().el);
            }

            if ( context.has_per_item_cost ) {
                this.per_item_cost_editor_view = new app.BaseInputView({
                    model: this.model,
                    param: 'cost_per_item'
                });
                this.ui.$cost_per_item_container.append(this.per_item_cost_editor_view.render().el);
            }
        },
        onBeforeDestroy: function () {
            if ( this.pricing_grid_view ) {
                this.pricing_grids_view.destroy();
            }

            if ( this.per_item_cost_editor_view ) {
                this.per_item_cost_editor_view.destroy();
            }
        },
        initialize: function () {
            this.show_grids = false;

            this.listenTo(this.model, 'change:is_default', this.onChangeIsDefault);
        }
    });
})();
