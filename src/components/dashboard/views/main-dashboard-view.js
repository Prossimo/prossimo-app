import Marionette from 'backbone.marionette';
import _ from 'underscore';

import App from '../../../main';
import ProjectInfoView from './project-info-view';
import ProjectDocumentsView from './project-documents-view';
import QuoteTotalsView from './quote-totals-view';
import QuoteInfoView from './quote-info-view';
import template from '../templates/main-dashboard-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'screen dashboard-screen',
    template,
    ui: {
        $totals: '#totals',
        $project_info: '#project-info',
        $documents: '#documents',
        $quote_info: '#quote-info',
        $export_button: '.js-toggle-export-dialog',
        
        $invoice_button:    '.create-invoice',
    },
    events: {
        'click @ui.$export_button': 'showProjectExportDialog',
        
        'click @ui.$invoice_button': 'sendDataToInvoiceService',
    },
    showProjectExportDialog() {
        App.dialogs.showDialog('project-export', {
            model: App.current_project,
            quote: App.current_quote,
        });
    },
    onRender() {
        this.ui.$project_info.append(this.project_info_view.render().el);
        this.ui.$totals.append(this.totals_view.render().el);
        this.ui.$quote_info.append(this.quote_info_view.render().el);
        this.ui.$documents.append(this.documents_view.render().el);
    },
    onBeforeDestroy() {
        this.project_info_view.destroy();
        this.totals_view.destroy();
        this.quote_info_view.destroy();
        this.documents_view.destroy();
    },
    initialize() {
        const currentProject = App.current_project;
        const currentQuote = App.current_quote;

        this.project_info_view = new ProjectInfoView({
            model: currentProject,
        });

        this.totals_view = new QuoteTotalsView({
            model: currentQuote,
        });

        this.quote_info_view = new QuoteInfoView({
            model: currentQuote,
        });

        this.documents_view = new ProjectDocumentsView({
            collection: currentProject.files,
        });
    },
    addItemToInvoice(item, tax, descriptionAttr){
        descriptionAttr = descriptionAttr || 'description'
        let unitPrice=item.getUnitPrice();
        return {
            AccountCode:    200,
            Description:    item.get(descriptionAttr),
            Quantity:       Number(parseFloat(item.get('quantity'))).toFixed(2),
            DiscountRate:   Number(parseFloat(item.get('discount'))).toFixed(2),
            UnitAmount:     Number(parseFloat(unitPrice)).toFixed(2),  //without discount
            TaxType:        tax ? 'OUTPUT': 'NONE',
            TaxAmount:      Number(parseFloat(item.get('quantity'))*parseFloat(item.getUnitPriceDiscounted())* (tax ? tax: 0)).toFixed(2),
        };
    },
    sendDataToInvoiceService (){
        let url=`${App.settings.get('invoice_base_path')}`;            

        /*
         * now only current quote used!
         */
        let quote=App.current_quote, tax=quote.extras.getTotalTaxPercent()/100;
        let arrExtras=_.map(quote.extras.getRegularItems(), e=>{
            return this.addItemToInvoice(e,tax);
        });
        
        let arrShipping=_.map(quote.extras.getShipping(), e=>{
            return this.addItemToInvoice(e,0);  // zero taxes for shipping
        });
        
        let arrItems=quote.units.map(e=>{
            return this.addItemToInvoice(e,tax,'mark');
        });
        
        var dataToSend={
            pricingData:    _.union(arrItems, arrExtras, arrShipping),
            clientAddr:     App.current_project.get('client_address'),
            clientName:     App.current_project.get('client_company_name'),
        }
        console.log(dataToSend);
        $.ajax(url,{
            method: 'POST',
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(dataToSend),
            success:    res => alert('Успех!'),   
        })
    }
});
