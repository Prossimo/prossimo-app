var app = app || {};

(function () {
    'use strict';

    app.RequestItemView = Marionette.ItemView.extend({
        tagName: 'tr',
        className: 'request-item',
        template: app.templates['supplier-request/request-item-view'],
        getDescription: function () {
            var f = app.utils.format;

            var name_title_hash = {
                mark: 'Mark',
                size: 'Size',
                type: 'Type',
                glazing: 'Glazing',
                desc: 'Description',
                threshold: 'Threshold'
            };

            var params_source = {
                mark: this.model.get('mark'),
                size: f.dimensions(this.model.get('width'), this.model.get('height'), 'fraction'),
                type: this.model.get('type'),
                glazing: this.model.get('glazing'),
                desc: this.model.get('description'),
                threshold: this.model.profile.isThresholdPossible() ?
                    this.model.profile.getThresholdType() : false
            };

            return _.map(name_title_hash, function (item, key) {
                return { name: key, title: item, value: params_source[key] };
            }, this);
        },
        serializeData: function () {
            return {
                reference_id: this.model.getRefNum(),
                description: this.getDescription(),
                notes: this.model.get('notes'),
                quantity: this.model.get('quantity')
            };
        }
    });
})();
