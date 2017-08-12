import Marionette from 'backbone.marionette';

import App from '../../../main';
import BaseInputView from '../../../core/views/base/base-input-view';
import EquationParamsView from './equation-params-view';
import PricingGridsEditorView from './pricing-grids-editor-view';
import template from '../templates/profile-connections-table-item-view.hbs';

import {
    PRICING_SCHEME_PRICING_GRIDS,
    PRICING_SCHEME_LINEAR_EQUATION,
} from '../../../constants';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'table-item',
    template,
    ui: {
        $grid_container: '.grid-container',
        $cost_per_item_container: 'td.profile-cost-per-item',
        $equation_params_container: 'td.profile-linear-cost',
        $toggle_grid: '.js-toggle-grid',
    },
    regions: {
        grid_container: '@ui.$grid_container',
        cost_per_item_container: '@ui.$cost_per_item_container',
        equation_params_container: '@ui.$equation_params_container',
    },
    events: {
        'click @ui.$toggle_grid': 'toggleGrid',
    },
    toggleGrid() {
        this.show_grid = !this.show_grid;

        // TODO: we do this instead of calling this.render() to avoid
        // issues with event delegation, although I'm not sure if this is
        // an optimal way, we probably have to use regions
        this.ui.$grid_container.toggleClass('is-open', this.show_grid);

        if (this.ui.$grid_container.hasClass('is-open') && this.pricing_grids_view) {
            this.pricing_grids_view.updateTable();
        }
    },
    //  TODO: this causes some issues (like Expand doesn't work sometimes).
    //  Maybe we should avoid re-rendering (we also lose open grid state
    //  for some reason) or just fix delegation problems
    onChangeIsDefault() {
        this.render();
    },
    getProfileName() {
        const profile_id = this.model.get('profile_id');
        const profile = App.settings.profiles.get(profile_id);

        return profile ? profile.get('name') : `Err: no profile with ID=${profile_id}`;
    },
    getPricingGridString() {
        const grids = this.model.get('pricing_grids');
        let grid_string = '--';

        if (grids && grids.length) {
            const values_num = grids
                .map(item => item.get('data').length).reduce((memo, item) => memo + item, 0);
            grid_string = `${grids.length} grids, ${values_num} values`;
        }

        return grid_string;
    },
    templateContext() {
        const pricing_data = this.model.getPricingData();
        const has_grids = pricing_data && pricing_data.scheme === PRICING_SCHEME_PRICING_GRIDS;
        const has_linear_cost = pricing_data && pricing_data.scheme === PRICING_SCHEME_LINEAR_EQUATION;
        const has_per_item_cost = pricing_data && pricing_data.has_per_item_cost;
        const has_per_length_cost = pricing_data && pricing_data.has_per_length_cost;

        return {
            has_grids,
            has_per_item_cost,
            has_linear_cost,
            has_per_length_cost,
            show_grids: this.show_grids,
            profile_name: this.getProfileName(),
            pricing_grid_string: has_grids && this.getPricingGridString(),
        };
    },
    onRender() {
        const context = this.templateContext();

        if (context.has_grids) {
            this.showChildView('grid_container', new PricingGridsEditorView({
                grids: this.model.get('pricing_grids'),
                parent_view: this,
                show_notice: true,
            }));
        }

        if (context.has_per_item_cost || context.has_per_length_cost) {
            this.showChildView('cost_per_item_container', new BaseInputView({
                model: this.model,
                param: 'cost_per_item',
            }));
        }

        if (context.has_linear_cost) {
            this.showChildView('equation_params_container', new EquationParamsView({
                collection: this.model.get('pricing_equation_params'),
            }));
        }
    },
    initialize() {
        this.show_grids = false;

        this.listenTo(this.model, 'change:is_default', this.onChangeIsDefault);
    },
});
