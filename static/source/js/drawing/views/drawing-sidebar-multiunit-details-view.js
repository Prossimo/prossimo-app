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
                'ref_num', 'mark', 'width', 'height', 'description', 'notes', 'exceptions'
            ];

            var custom_titles = {
                ref_num: 'Ref #',
                width: 'Width (inches)',
                height: 'Height (inches)'
            };

            params_source = {
                ref_num: this.model.getRefNum(),
                width: f.dimension(this.model.getWidth(), null,
                    project_settings && project_settings.get('inches_display_mode')),
                height: f.dimension(this.model.getHeight(), null,
                    project_settings && project_settings.get('inches_display_mode'))
            };

            multiunit_properties = _.map(relevant_properties, function (prop_name) {
                var title = custom_titles[prop_name] || this.model.getTitles([prop_name])[0];
                var value = params_source[prop_name] || this.model.get(prop_name);

                return {
                    title: title || '',
                    value: value || ''
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
