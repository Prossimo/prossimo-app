var app = app || {};

(function () {
    'use strict';

    app.DrawingSidebarMultiunitDetailsView = Marionette.View.extend({
        tagName: 'div',
        className: 'drawing-sidebar-multiunit-details',
        template: app.templates['drawing/drawing-sidebar-multiunit-details-view'],
        getMultiunitProperties: function () {
            var f = app.utils.format;
            var multiunit_properties = [];
            var params_source = {};
            var project_settings = app.settings.getProjectSettings();

            var relevant_properties = [
                'mark', 'width', 'height', 'description', 'notes', 'exceptions'
            ];

            params_source = {
                width: f.dimension(this.model.get('width'), null,
                    project_settings && project_settings.get('inches_display_mode')),
                height: f.dimension(this.model.get('height'), null,
                    project_settings && project_settings.get('inches_display_mode'))
            };

            multiunit_properties = _.map(relevant_properties, function (prop_name) {
                var title = this.model.getTitles([prop_name])[0] || '';
                var value = params_source[prop_name] || this.model.get(prop_name);

                return {
                    title: title,
                    value: value
                };
            }, this).filter(function (property) {
                return !_.isUndefined(property.value);
            });

            return multiunit_properties;
        },
        templateContext: function () {
            return {
                multiunit_properties: this.getMultiunitProperties()
            };
        }
    });
})();
