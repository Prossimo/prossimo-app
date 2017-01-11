var app = app || {};

(function () {
    'use strict';

    app.DrawingSidebarView = Marionette.View.extend({
        tagName: 'div',
        className: 'drawing-sidebar',
        template: app.templates['drawing/drawing-sidebar-view'],
        ui: {
            $select: '.selectpicker',
            $prev: '.js-prev-unit',
            $next: '.js-next-unit',
            $sidebar_toggle: '.js-sidebar-toggle',
            $unit_details_container: '.unit-details-container'
        },
        events: {
            'change @ui.$select': 'onChange',
            'click @ui.$prev': 'onPrevBtn',
            'click @ui.$next': 'onNextBtn',
            'click @ui.$sidebar_toggle': 'onSidebarToggle'
        },
        keyShortcuts: {
            left: 'onPrevBtn',
            right: 'onNextBtn'
        },
        getModels: function () {
            return (this.options.multiunits) ?
                this.options.multiunits.models.concat(this.collection.models) :
                this.collection.models;
        },
        selectUnit: function (model) {
            this.ui.$select.selectpicker('val', model.cid);

            this.$el.trigger({
                type: 'unit-selected',
                model: model
            });

            this.render();
        },
        onChange: function () {
            var model = this.collection.get(this.ui.$select.val());

            if (!model) {
                model = this.collection.multiunits.get(this.ui.$select.val());
            }

            this.selectUnit(model);
        },
        onNextBtn: function () {
            var models = this.getModels();
            var next_index;

            if ( models.length > 1 && this.options.parent_view.active_unit ) {
                next_index = models.indexOf(this.options.parent_view.active_unit) + 1;

                if ( next_index >= models.length ) {
                    next_index = 0;
                }

                this.selectUnit(models[next_index]);
            }
        },
        onPrevBtn: function () {
            var models = this.getModels();
            var prev_index;

            if ( models.length > 1 && this.options.parent_view.active_unit ) {
                prev_index = models.indexOf(this.options.parent_view.active_unit) - 1;

                if ( prev_index < 0 ) {
                    prev_index = models.length - 1;
                }

                this.selectUnit(models[prev_index]);
            }
        },
        onSidebarToggle: function () {
            this.$el.trigger({ type: 'sidebar-toggle' });
        },
        templateContext: function () {
            var models = this.getModels();

            return {
                unit_list: models.map(function (item) {
                    return {
                        is_selected: this.options.parent_view.active_unit &&
                            item.cid === this.options.parent_view.active_unit.cid,
                        reference_id: item.getRefNum(),
                        cid: item.cid,
                        mark: item.get('mark'),
                        dimensions: app.utils.format.dimensions(item.get('width'), item.get('height'), 'fraction'),
                        unit_relation: item.getRelation()
                    };
                }, this)
            };
        },
        onRender: function () {
            var active_unit = this.options.parent_view.active_unit;

            this.ui.$select.selectpicker({
                showSubtext: true
            });

            if ( this.unit_details_view ) {
                this.unit_details_view.destroy();
            }

            if ( active_unit ) {
                if ( active_unit instanceof app.Multiunit ) {
                    this.unit_details_view = new app.DrawingSidebarMultiunitDetailsView({
                        model: active_unit
                    });
                } else {
                    this.unit_details_view = new app.DrawingSidebarUnitDetailsView({
                        model: active_unit
                    });
                }

                this.ui.$unit_details_container.append(this.unit_details_view.render().el);
            }
        },
        onDestroy: function () {
            if ( this.unit_details_view ) {
                this.unit_details_view.destroy();
            }
        },
        initialize: function () {
            this.listenTo(this.options.parent_view.active_unit, 'all', this.render);
            this.listenTo(this.options.parent_view, 'drawing_view:onSetState', this.render);
            this.listenTo(app.current_project.settings, 'change', this.render);
        }
    });
})();
