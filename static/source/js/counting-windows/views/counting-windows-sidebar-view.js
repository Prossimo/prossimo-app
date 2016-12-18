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
            'click @ui.$stamp_plus': 'onStampAdd',
            'click @ui.$label_plus': 'onLabelAdd',
            'click .nav-tabs a': 'onTabClick',
            'click @ui.$sidebar_toggle': 'onSidebarToggle',
            'click .counting-page':'onClickPageTable',
            'click .delete-stamp' : 'onDeleteStamp',
            'click .delete-label' : 'onDeleteLabel'
        },
        keyShortcuts: {
            up: 'onUpBtn',
            down: 'onDownBtn',
            left: 'onLeftBtn',
            right: 'onRightBtn'
        },
        initialize: function () {
            this.tabs = [
                {
                    title: 'Pages',
                    is_active: true
                },
                {
                    title: 'Stamps By Page',
                    is_active: false
                },
                {
                    title: 'Manage Labels',
                    is_active: false
                }                
            ];
            this.active_tab_Idx = 0;

            this.countpages = app.countpages.toJSON();
            this.stamps     = app.stamps.toJSON();

            this.selpage    = 0;
            this.lastSelectedStampIdx = 0;

            app.vent.trigger('counting_windows_view:page:load', 0);            
        },
        setActiveTab: function (tabIdx) {

            this.tabs[this.active_tab_Idx].is_active = false;
            this.tabs[tabIdx].is_active = true;
           
            this.active_tab_Idx = tabIdx;            
        },
        onClickPageTable: function(e) {
            
            $("tr.counting-page").removeClass("selected");
            $(e.target).closest("tr").addClass("selected");
            this.selpage = parseInt($(e.target).closest("tr").data('param')) - 1;

            app.vent.trigger('counting_windows_view:page:load', this.selpage);      
        },
        onTabClick: function (e) {
            var idx = $(e.target).attr('href').replace('#', '');

            e.preventDefault();
            this.setActiveTab(idx);
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
        onUpBtn: function() {

            this.lastSelectedStampIdx--;           

            if (this.lastSelectedStampIdx < 0) {
                this.lastSelectedStampIdx = app.stamps.length - 1;                
            }

            this.render();
        },
        onDownBtn: function(){            

            this.lastSelectedStampIdx++;           

            if (this.lastSelectedStampIdx >= app.stamps.length) {
                this.lastSelectedStampIdx = 0;                
            }

            this.render();
        },
        onLeftBtn: function() {

            this.tabs[this.active_tab_Idx].is_active = false;
            this.active_tab_Idx--;
            if(this.active_tab_Idx <0) {
                this.active_tab_Idx = this.tabs.length - 1;
            }
            this.tabs[this.active_tab_Idx].is_active = true;
 
            this.render();
        },
        onRightBtn: function() {

            this.tabs[this.active_tab_Idx].is_active = false;
            this.active_tab_Idx++;
            if(this.active_tab_Idx >= this.tabs.length) {
                this.active_tab_Idx = 0;
            }

            this.tabs[this.active_tab_Idx].is_active = true;
 
            this.render();
        },
        onStampAdd: function() {

            var index = this.ui.$select.val();
            var st = app.stamps.at(index);

            var page = this.countpages[this.selpage];                        
            var lb = {          
                        index: page.labels[page.labels.length - 1].index + 1 ,                                    
                        position: { left: 0 ,  top:0 },
                        stamp: st.get("stamp")
                    }; 
            
            page.labels.push(lb);

            app.countpages.updateItemByIndex(this.selpage, new app.CountPage(page));
            this.countpages = app.countpages.toJSON();          
            
            this.lastSelectedStampIdx = index;

            this.updateLabels(st.get("stamp"), '+');

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
        onSidebarToggle: function () {
            this.$el.trigger({ type: 'sidebar-toggle' });
        },
   
        serializeData: function () {

            return {                                
                selectedpage: this.countpages[this.selpage],                
                countpages: this.countpages,
                stamps:this.stamps,
                lastSelectedStamp: app.stamps.at(this.lastSelectedStampIdx).get("stamp"),
                tabs: this.tabs
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
