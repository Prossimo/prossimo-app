import Marionette from 'backbone.marionette';

import { format } from '../../../utils';
import Unit from '../../../core/models/unit';
import Multiunit from '../../../core/models/multiunit';
import DrawingSidebarMultiunitDetailsView from './drawing-sidebar-multiunit-details-view';
import DrawingSidebarUnitDetailsView from './drawing-sidebar-unit-details-view';
import template from '../templates/drawing-sidebar-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'drawing-sidebar',
    template,
    ui: {
        $select: '.selectpicker',
        $prev: '.js-prev-unit',
        $next: '.js-next-unit',
        $sidebar_toggle: '.js-sidebar-toggle',
        $unit_details_container: '.unit-details-container',
        $edit_parent_multiunit: '.js-edit-parent-multiunit',
        $edit_selected_subunit: '.js-edit-selected-subunit',
    },
    events: {
        'change @ui.$select': 'onChange',
        'click @ui.$prev': 'onPrevBtn',
        'click @ui.$next': 'onNextBtn',
        'click .nav-tabs a': 'onTabClick',
        'click @ui.$sidebar_toggle': 'onSidebarToggle',
        'click @ui.$edit_parent_multiunit': 'onEditParentMultiunitClick',
        'click @ui.$edit_selected_subunit': 'onEditSelectedSubunitClick',
    },
    keyShortcuts: {
        left: 'onPrevBtn',
        right: 'onNextBtn',
    },
    initialize() {
        this.data_store = this.getOption('data_store');

        this.listenTo(this.options.parent_view.active_unit, 'all', this.render);
        this.listenTo(this.options.parent_view, 'drawing_view:onSetState', this.render);
        this.listenTo(this.data_store.current_project.settings, 'change', this.render);
    },
    //  Models are sorted like this: [1, 1a, 1b, 2, 2a, 3, 4]
    getModels() {
        return (this.options.multiunits ?
            this.options.multiunits.models.concat(this.collection.models) :
            this.collection.models
        ).sort((a, b) => {
            const a_num = a.getRefNum();
            const b_num = b.getRefNum();

            return parseInt(a_num, 10) === parseInt(b_num, 10) ? a.getRefNum() > b.getRefNum() : parseInt(a_num, 10) - parseInt(b_num, 10);
        });
    },
    selectUnit(model) {
        this.ui.$select.selectpicker('val', model.cid);

        this.$el.trigger({
            type: 'unit-selected',
            model,
        });

        this.render();
    },
    onChange() {
        let model = this.collection.get(this.ui.$select.val());

        if (!model) {
            model = this.options.multiunits.get(this.ui.$select.val());
        }

        this.selectUnit(model);
    },
    onNextBtn() {
        const models = this.getModels();
        let next_index;

        if (models.length > 1 && this.options.parent_view.active_unit) {
            next_index = models.indexOf(this.options.parent_view.active_unit) + 1;

            if (next_index >= models.length) {
                next_index = 0;
            }

            this.selectUnit(models[next_index]);
        }
    },
    onPrevBtn() {
        const models = this.getModels();
        let prev_index;

        if (models.length > 1 && this.options.parent_view.active_unit) {
            prev_index = models.indexOf(this.options.parent_view.active_unit) - 1;

            if (prev_index < 0) {
                prev_index = models.length - 1;
            }

            this.selectUnit(models[prev_index]);
        }
    },
    onEditParentMultiunitClick() {
        const parent_multiunit = this.getParentMultiunit();

        this.selectUnit(parent_multiunit);
    },
    onEditSelectedSubunitClick() {
        const selected_subunit = this.getSelectedSubunit();

        this.selectUnit(selected_subunit);
    },
    onSidebarToggle() {
        this.$el.trigger({ type: 'sidebar-toggle' });
    },
    getSelectedSubunit() {
        const is_multiunit = this.options.parent_view.active_unit && this.options.parent_view.active_unit.isMultiunit();
        const selected_subunit_id = is_multiunit && this.options.parent_view.getDrawingBuilderState('selected:subunit');
        let selected_subunit;

        if (selected_subunit_id) {
            selected_subunit = this.collection.get(selected_subunit_id);
        }

        return selected_subunit;
    },
    getParentMultiunit() {
        const is_subunit = this.options.parent_view.active_unit && this.options.parent_view.active_unit.isSubunit();
        const parent_multiunit_cid = is_subunit && this.options.parent_view.active_unit.getParentMultiunit().cid;
        let parent_multiunit;

        if (parent_multiunit_cid) {
            parent_multiunit = this.options.multiunits.get(parent_multiunit_cid);
        }

        return parent_multiunit;
    },
    templateContext() {
        const models = this.getModels();
        const selected_subunit = this.getSelectedSubunit();
        const parent_multiunit = this.getParentMultiunit();

        return {
            unit_list: models.map(item => ({
                is_selected: this.options.parent_view.active_unit &&
                    item.cid === this.options.parent_view.active_unit.cid,
                reference_id: item.getRefNum(),
                cid: item.cid,
                mark: item instanceof Unit ? item.getMark() : item.get('mark'),
                dimensions: format.dimensions(
                    item.getInMetric('width', 'inches'),
                    item.getInMetric('height', 'inches'),
                    'fraction',
                ),
                unit_relation: item.getRelation(),
            })),
            selected_subunit_cid: selected_subunit && selected_subunit.cid,
            parent_multiunit_cid: parent_multiunit && parent_multiunit.cid,
        };
    },
    onRender() {
        const active_unit = this.options.parent_view.active_unit;

        this.ui.$select.selectpicker({
            showSubtext: true,
        });

        if (this.unit_details_view) {
            this.unit_details_view.destroy();
        }

        if (active_unit) {
            if (active_unit instanceof Multiunit) {
                this.unit_details_view = new DrawingSidebarMultiunitDetailsView({
                    model: active_unit,
                    data_store: this.data_store,
                });
            } else {
                this.unit_details_view = new DrawingSidebarUnitDetailsView({
                    model: active_unit,
                    data_store: this.data_store,
                });
            }

            this.ui.$unit_details_container.append(this.unit_details_view.render().el);
        }
    },
    onDestroy() {
        if (this.unit_details_view) {
            this.unit_details_view.destroy();
        }
    },
});
