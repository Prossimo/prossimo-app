import _ from 'underscore';
import Marionette from 'backbone.marionette';

import App from '../../../main';
import { format } from '../../../utils';
import template from '../templates/drawing-sidebar-multiunit-details-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'drawing-sidebar-multiunit-details',
    template,
    getMultiunitProperties() {
        const project_settings = App.settings.getProjectSettings();
        let multiunit_properties = [];
        let params_source = {};

        const relevant_properties = [
            'ref_num', 'mark', 'width', 'height', 'description', 'notes', 'exceptions', 'connector_width', 'connector_face_width',
        ];

        const custom_titles = {
            ref_num: 'Ref #',
            width: 'Width (inches)',
            height: 'Height (inches)',
            connector_width: 'Conn. Width (mm)',
            connector_face_width: 'Conn. Face Width (mm)',
        };

        params_source = {
            ref_num: this.model.getRefNum(),
            width: format.dimension(this.model.getWidth(), null,
                project_settings && project_settings.get('inches_display_mode')),
            height: format.dimension(this.model.getHeight(), null,
                project_settings && project_settings.get('inches_display_mode')),
        };

        multiunit_properties = _.map(relevant_properties, (prop_name) => {
            const title = custom_titles[prop_name] || this.model.getTitles([prop_name])[0];
            const value = params_source[prop_name] || this.model.get(prop_name);

            return {
                title: title || '',
                value: value || '',
            };
        }, this).filter(property => !_.isUndefined(property.value));

        return multiunit_properties;
    },
    templateContext() {
        return {
            multiunit_properties: this.getMultiunitProperties(),
        };
    },
});
