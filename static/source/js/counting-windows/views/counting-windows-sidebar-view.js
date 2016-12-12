var app = app || {};

(function () {
    'use strict';

    var UNSET_VALUE = '--';

    app.CountingWindowSidebarView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'drawing-sidebar',
        template: app.templates['counting-windows/counting-windows-sidebar-view'],
        ui: {
            $select: '.selectpicker',
            $newLabel: '.newLabel',
            $stamp_plus: '.js-plus-stamp',            
            $label_plus: '.js-plus-label',
            $sidebar_toggle: '.js-sidebar-toggle',
            $tab_container: '.tab-container'           
        },
        events: {
            'change @ui.$select': 'onChange',
            'click @ui.$stamp_plus': 'onStampAdd',
            'click @ui.$label_plus': 'onLabelAdd',
            'click .nav-tabs a': 'onTabClick',
            'click @ui.$sidebar_toggle': 'onSidebarToggle',
            'click .counting-page':'onClickPageTable',
            'click .delete-stamp' : 'onDeleteStamp',
            'click .delete-label' : 'onDeleteLabel'
        },       
        initialize: function () {
            this.tabs = {
                active_pages: {
                    title: 'Pages'
                },
                active_stamps_by_page: {
                    title: 'Stamps By Page'
                },
                active_manage_labels: {
                    title: 'Manage Labels'
                }                
            };
            this.active_tab = 'active_pages';

            this.countpages = app.countpages.toJSON();
            this.stamps     = app.stamps.toJSON();

            this.selpage    = -1;


            //app.vent.trigger('main_quoteview:selected_comment:render', index);       
            /*this.listenTo(this.options.parent_view.active_unit, 'all', this.render);
            this.listenTo(this.options.parent_view, 'drawing_view:onSetState', this.render);
            this.listenTo(app.current_project.settings, 'change', this.render);*/
        },
        setActiveTab: function (tab_name) {
            if ( _.contains(_.keys(this.tabs), tab_name) ) {
                this.active_tab = tab_name;
            }
        },
        onClickPageTable: function(e) {
            
            $("tr.counting-page").removeClass("selected");
            $(e.target).closest("tr").addClass("selected");
            this.selpage = parseInt($(e.target).closest("tr").data('param')) - 1;

            app.vent.trigger('counting_windows_view:page:load', this.selpage);      
        },
        onTabClick: function (e) {
            var target = $(e.target).attr('href').replace('#', '');

            e.preventDefault();
            this.setActiveTab(target);
            this.render();
        },
        onDeleteStamp: function(e) {
            var i = parseInt($(e.target).data('param'));

            this.updateLabels(this.countpages[this.selpage].labels[i].stamp, '-');
            this.countpages[this.selpage].labels.splice(i, 1);            
            this.render();
            
            app.countpages.updateItemByIndex(this.selpage, new app.CountPage(this.countpages[this.selpage]));
                        
            app.vent.trigger('counting_windows_view:page:load', this.selpage);  
        },
        onDeleteLabel: function(e) {
            var lb = $(e.target).data('param');
            
            var model = app.stamps.find(function(model) { return model.get('stamp') === lb; });            
            app.stamps.remove(model);
            
            this.stamps = app.stamps.toJSON();
            
            this.render();
        },
        onStampAdd: function() {

            var st = this.ui.$select.val();
            if (st === '') 
                return;

            var page = this.countpages[this.selpage];                        
            var lb = {          
                        index: page.labels[page.labels.length - 1].index + 1 ,                                    
                        position: { left: 0 ,  top:0 },
                        stamp: st           
                    }; 
            
            page.labels.push(lb);

            app.countpages.updateItemByIndex(this.selpage, new app.CountPage(page));
            this.countpages = app.countpages.toJSON();          

            this.updateLabels(st, '+');

            this.render();

            app.vent.trigger('counting_windows_view:add_stamp:render', lb);
        },
        updateLabels: function(lb, action) {
            
            var model = app.stamps.find(function(model) { return model.get('stamp') === lb; });

            if (action === "+") {
                model.set('quantity',  model.get('quantity') + 1);
            } else {
                model.set('quantity',  model.get('quantity') - 1);    
            }
            
            this.stamps = app.stamps.toJSON();
            
        },
        onLabelAdd: function() {
            var st = this.ui.$newLabel.val();
            if (st === '') 
                return;           

            app.stamps.add(
                new app.Stamp({
                                stamp: st,
                                quantity: 0})
            );

            this.stamps = app.stamps.toJSON();

            this.render();
        },        

        selectUnit: function (model) {
            this.$el.trigger({
                type: 'unit-selected',
                model: model
            });

            this.render();
        },
        onChange: function () {
            //this.selectUnit(this.collection.get(this.ui.$select.val()));
        },        

        onSidebarToggle: function () {
            this.$el.trigger({ type: 'sidebar-toggle' });
        },
   
        serializeData: function () {

            return {                                
                selectedpage: this.countpages[this.selpage],                
                countpages: this.countpages,
                stamps:this.stamps,
                tabs: _.each(this.tabs, function (item, key) {
                    item.is_active = key === this.active_tab;

                    return item;
                }, this)
            };
        },
        onRender: function () {
            this.ui.$select.selectpicker({
                showSubtext: true
            });
        }
    });

    Handlebars.registerHelper('ifCond', function(v1, v2, options) {        
      if(v1 === v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

})();
