var app = app || {};

$(function () {
    'use strict';

    // Fix bug with empty json response
    $.ajaxSetup({
        dataFilter: function (rawData, type) {
            if (rawData) {
                return rawData;
            }

            if (type === 'json') {
                return null;
            }
        }
    });

    app.App = new Marionette.Application();

    app.App.on('start', function () {
        //  Register a communication channel for all events in the app
        app.vent = {};
        _.extend(app.vent, Backbone.Events);


        //get comments from server side
        app.comments  = new app.Comments(); 
        app.countpages  = new app.CountPages();
        app.stamps      = new app.Stamps();

        /*  test pdf api */
        var authToken       = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXUyJ9.eyJleHAiOjE0ODIyNjY4OTksInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOiIxNDgyMTgwNDk5In0.hH7chit3_MqerNs45COa4-vD8BAY5H7c8IwReYbVB-mK0fVDKveSKEXOWUEP3GHqj3Y0SrL59cn69MNp4WhAb3mDLHG1-ljoLiHmneVMpHnjWlBVmfjsIRPyUDSaheUGcRRvCBgLT-LJ629CRWswy402m5zZvYEJyZQAcFR5eylcGGB4qt_JtKgjW1ahKW-utbhon_vUMXXwFoKaNYTDVxrhmY_zgmDmndjmXPTREQh6oRD-DN0kY7jkg4ZmUGj8Ejn5WrOV4wFvAUizu_LC1RArmAAw1-92H2EgmZwrcfz16y8bqn8CA77MKxYU5aJypRcdtI3j83rQOafIiGbktQb4Vdnyw81DQnE39FIJKpK2Rx1fxzyvlDZFgk5KC0QLB3-52Rt3Hc3lSC50C4WXswRxvtSJPNNbgcR5gLT22npsdmpmWtik8F6emg99oivfGDzAG1PCZ8yxmAw4TxQaDGtYnizOVb-eWSJpGhsUzTkGpGFd__NwmDWseRDnhqQYMhtQv_yG87zfqR0jlMlx6vQmyWbinoC8xS0jd_A10jpBd-Wlf9vXt_Xv-jBebMVX4czqfSl8b1RAZXYpbuj9cMPdX7zaE34FkbRiYkduwjG59UFpXMt82-tszVGBuYBtUBRrm_JF1yAXVSrM-d_poqxjW8hx8BHDXK2utSLIQG4";
        var baseUrlofJpeg   = "http://dev.prossimo.us/storage";

        $.ajax({
            method: 'POST',
            url: 'http://dev.prossimo.us/api/api/pdf/splitmerge',
            headers: {
                'Accept': 'application/json',
                //'Authorization': 'Bearer ' + window.localStorage.getItem('authToken')
                'Authorization': 'Bearer ' + authToken //window.localStorage.getItem('authToken')
            },
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                url: 'https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf',
                //url: "http://localhost:9987/countingdata/windows.pdf",
                pages: '1-9'
            }),
            complete: function (xhr, status) {               

                if (status === "success") {                                    
                
                    for (var i  in xhr.responseJSON.pages) {
                        var item = {
                                        "pagenum": i,
                                        "title": "Window - " + i,
                                        "url": baseUrlofJpeg + xhr.responseJSON.pages[i],
                                        "labels": [] 
                                    };

                        app.countpages.add(new app.CountPage(item));
                    }                    
                    
                }                
            }
        });


        //  Object to hold project-independent properties
        app.settings = new app.Settings();
        app.session = new app.Session();
        app.router = new app.AppRouter();

        app.projects = new app.ProjectCollection();
        app.top_bar_view = new app.TopBarView({ collection: app.projects });

        app.main_region = new Marionette.Region({ el: '#main' });
        app.dialogs = new app.Dialogs();

        app.main_navigation = new app.MainNavigationView({
            dashboard: {
                title: 'Dashboard',
                path: 'dashboard',
                icon_name: 'dashboard',
                onShow: function () {
                    app.main_region.show(new app.MainDashboardView());
                }
            },
            counting_windows: {
                title: 'Counting Windows',
                path: 'counting-windows',
                icon_name: 'eye-open',
                onShow: function () {
                    app.main_region.show(new app.MainCountingWindowsView());
                }                
            },
            units_table: {
                title: 'Units',
                path: 'units',
                icon_name: 'th',
                onShow: function () {
                    app.main_region.show(new app.MainUnitsTableView());
                }
            },
            drawing: {
                title: 'Drawing',
                path: 'drawing',
                icon_name: 'pencil',
                onShow: function () {
                    app.main_region.show(new app.MainDrawingView());
                }
            },
            quote: {
                title: 'Quote',
                path: 'quote',
                icon_name: 'shopping-cart',
                onShow: function () {
                    app.main_region.show(new app.MainQuoteView());
                }
            },
            supplier_request: {
                title: 'Supplier',
                path: 'supplier',
                icon_name: 'send',
                onShow: function () {
                    app.main_region.show(new app.MainSupplierRequestView());
                }
            },            
            settings: {
                title: 'Settings',
                path: 'settings',
                icon_name: 'wrench',
                onShow: function () {
                    app.main_region.show(new app.MainSettingsView());
                }
            }                        
        });

        app.paste_image_helper = new app.PasteImageHelper();
        app.session.checkAuth();

        app.vent.on('auth:initial_login auth:no_backend', function () {
            Backbone.history.start({ pushState: true });

            if ( Backbone.history.fragment === '' ) {                
                app.router.navigate('/dashboard/', { trigger: true });
            }
        });
    });
  

    app.App.start();
});
