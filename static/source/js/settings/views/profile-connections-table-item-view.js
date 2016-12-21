var app = app || {};

(function () {
    'use strict';

    app.ProfileConnectionsTableItemView = Marionette.View.extend({
        tagName: 'div',
        className: 'table-item',
        template: app.templates['settings/profile-connections-table-item-view'],
        ui: {
            $grid_container: '.grid-container',
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
        },
        getProfileName: function () {
            var profile_id = this.model.get('profile_id');
            var profile = app.settings.profiles.get(profile_id);

            return profile ? profile.get('name') : 'Err: no profile with ID=' + profile_id;
        },
        //  TODO: it should maybe compare with defaults
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
            return {
                show_grid: this.show_grid,
                profile_name: this.getProfileName(),
                pricing_grid_string: this.getPricingGridString()
            };
        },
        onRender: function () {
            if ( this.pricing_grid_view ) {
                this.ui.$grid_container.append(this.pricing_grid_view.render().el);
            }
        },
        onBeforeDestroy: function () {
            if ( this.pricing_grid_view ) {
                this.pricing_grid_view.destroy();
            }
        },
        initialize: function () {
            this.show_grid = false;

            //  TODO: the actual name of attribure might be different for
            //  filling types / dictionary entries
            if ( this.model.get('pricing_grids') ) {
                this.pricing_grid_view = new app.PerProfilePricingGridsEditorView({
                    grids: this.model.get('pricing_grids'),
                    parent_view: this
                });
            }
        }
    });
})();
