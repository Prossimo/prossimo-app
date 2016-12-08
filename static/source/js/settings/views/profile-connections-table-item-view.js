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

            // console.log( 'toggle grid', this.show_grid );

            // this.render();
            // TODO: we do this instead of callign this.render() to avoid
            // issues with event delegation, although I'm not sure if this is
            // an optimal way, we probably have to use regions
            this.ui.$grid_container.toggleClass('is-open', this.show_grid);
        },
        getProfileName: function () {
            var profile_id = this.model.get('id');
            var profile = app.settings.profiles.get(profile_id);

            return profile ? profile.get('name') : 'Err: no profile with ID=' + profile_id;
        },
        getPricingGridString: function () {
            // var grid = this.model.get('pricing_grid');
            var grids = this.model.grids;
            var grid_string = '--';

            // console.log( 'this.model', this.model );
            // console.log( 'grids', grids );

            if ( grids && grids.length ) {
                var values_num = grids
                    .map(function (item) {
                        return item.get('data').length;
                    }).reduce(function (memo, item) {
                        return memo + item;
                    }, 0);
                grid_string = grids.length + ' grids, ' + values_num + ' values';
                // grid_string = grids.length + ' values';
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
            this.ui.$grid_container.append(this.pricing_grid_view.render().el);
        },
        onBeforeDestroy: function () {
            if ( this.pricing_grid_view ) {
                this.pricing_grid_view.destroy();
            }
        },
        initialize: function () {
            this.show_grid = false;

            // console.log( 'this.model', this.model );

            this.pricing_grid_view = new app.PerProfilePricingGridsEditorView({
                grids: this.model.grids,
                parent_view: this
            });
        }
    });
})();
