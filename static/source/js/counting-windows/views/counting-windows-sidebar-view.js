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
            $page_loading_btn: '.js-loading-btn',
            $page_preview_btn: '.js-preview-btn',
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
            'click .delete-label' : 'onDeleteLabel',
            'click @ui.$page_loading_btn': 'onLoadPageList',
            'click @ui.$page_preview_btn': 'onPreviewPage'
        },
        keyShortcuts: {
            up: 'onUpBtn',
            down: 'onDownBtn',
            left: 'onLeftBtn',
            right: 'onRightBtn'
        },
        initialize: function () {
            
            this.pdfURL = "https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf";

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

            this.countpages = []; 
            this.stamps     = []; 

            this.selpage    = 0;
            this.lastSelectedStampIdx = -1;

            if (this.countpages.length > 0) {
                app.vent.trigger('counting_windows_view:page:load', 0);            
            }

        },
        onLoadPageList: function() {
            if ($(".pageload").val() === "") {
                return;
            }

            var self = this;

            /*  test pdf api */
            var authToken       = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXUyJ9.eyJleHAiOjE0ODI0MTAyMTgsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOiIxNDgyMzIzODE4In0.Qr-ZY1DnPTAQn-ZhZHagtrjbrCD2Hlgt2y8Pbdm9FEmzxya7ExxiN1rwI-vDTDHsKx3QBXefo-_dpJchy2_WeDK7G7Xa3izhR4ymOTmse-w7_nsO_YeGPBBjWEK1pzMj1sW2KDSR1I5AXBIo21LMP8ztcBiuT43wX05dFy0vp5QEjacD-0YGz6pr_s6jmSAxUrK9OfVl9VbuIjqJ5tJgIanz-2sRJPceIFcPtmokuoCfZlLUD7N90X8_xdFPlAZqozy8fIbmJFdVjV8i1rKdccG4oZTa8VpT78Mmhf2m-SlLskh4AIczVie9nbrcuBAs-F6DK8TurlA7vj8zccGijU6CNu3vcOICJqBnTtPbMyKCQB9eAO1ys3LolnRNAPx66x3b--LxjsHCR0PwQ_QDY28C7mO0bPp34k4r-LMPg0pTvdTVtKXNYwjiUKo5q2h4eSK5VWjxtPPjwC4nwoH_pmBz3TyNl3Y4wMzwqQp0s_HF1CZBe9H1zneTHSjuDnS089xkJ-CaXL1pNtwMlmnrhutCCzniFYcZVpDZV-y00HD0MrZ-ukjFfU3odyZs01baLMUiQcpc9licrhuKdgPFhcYq9lJBucPwNKnQIk3qA--Y5OE93sDmUAdc9KtK8O2pT_k6IzZjbxjqi1jj6zm177GzDQ5bVgK1AkiOy1i9W10";
            var baseUrlofJpeg   = "http://dev.prossimo.us/storage";

            $.ajax({
                method: 'POST',
                url: 'http://dev.prossimo.us/api/api/pdf/splitmerge',
                headers: {
                    'Accept': 'application/json',
                    //'Authorization': 'Bearer ' + window.localStorage.getItem('authToken')
                    'Authorization': 'Bearer ' + authToken
                },
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({
                    url: self.pdfURL,                    
                    pages: $(".pageload").val() 
                }),
                complete: function (xhr, status) {               

                    if (status === "success") {                                    
                        app.countpages.reset();

                        for (var i  in xhr.responseJSON.pages) {
                            
                            var item = {
                                            "pagenum": i,
                                            "title": "Window - " + i,
                                            "url": baseUrlofJpeg + xhr.responseJSON.pages[i],
                                            "labels": [] 
                                        };

                            app.countpages.add(new app.CountPage(item));
                        }

                        self.countpages = app.countpages.toJSON();
                        self.stamps     = []; //app.stamps.toJSON();
                        app.stamps.reset();

                        self.selpage    = 0;
                        self.lastSelectedStampIdx = -1;

                        if (self.countpages.length > 0) {
                            app.vent.trigger('counting_windows_view:page:load', 0);            
                        }
                      
                        self.render();
                    }                
                }
            });

        },
        onPreviewPage: function() {
            
            window.open(this.pdfURL);

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

            var max = 0; 
            if (page.labels.length != 0) {
                max = page.labels[page.labels.length - 1].index;
            }


            var lb = {          
                        index: max  + 1 ,                                    
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
                selectedpage: this.countpages.length !=0 ?this.countpages[this.selpage]:null,                
                countpages: this.countpages,
                stamps:this.stamps,
                lastSelectedStamp: this.lastSelectedStampIdx !=-1? app.stamps.at(this.lastSelectedStampIdx).get("stamp"): "",
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
