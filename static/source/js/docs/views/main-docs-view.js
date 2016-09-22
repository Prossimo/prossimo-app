var app = app || {};

(function () {
    'use strict';

    app.MainDocsView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen docs-screen',
        template: app.templates['docs/main-docs-view'],
        ui: {
            $download_button: '.docs-controls-container .download-pdf',
            $switch_button: '.docs-controls-container .switch-docs',
            $wrapper_container: '.docs-wrapper-container'
        },
        events: {
            'click @ui.$download_button': 'downloadPDF',
            'click @ui.$switch_button': 'switchType'
        },
        downloadPDF: function (e) {
            e.preventDefault();
            var url = app.settings.getPdfDownloadUrl(this.type);
            var downloadTab = window.open(url, '_blank');

            downloadTab.focus();
        },
        switchType: function (e) {
            if (e) {
                e.preventDefault();
            }

            this.type = (this.type === 'quote') ? 'supplier' : 'quote';

            if (this.doc_view) {
                this.doc_view.destroy();
            }

            this.ui.$switch_button.removeClass('quote supplier').addClass(this.type);
            this.doc_view = new app[this.types[this.type].view]();
            this.ui.$wrapper_container.append(this.doc_view.render().el);
        },
        initialize: function () {
            this.types = {
                quote: {
                    title: 'Quote',
                    view: 'MainQuoteView'
                },
                supplier: {
                    title: 'Supplier',
                    view: 'MainSupplierRequestView'
                }
            };
        },
        onRender: function () {
            this.switchType();
        },
        onDestroy: function () {
            this.doc_view.destroy();
        }
    });
})();
