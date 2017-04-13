import _ from 'underscore';
import Backbone from 'backbone';

import { object } from '../../../utils';
import PricingGrid from '../../models/inline/pricing-grid';

function getDefaultGridCollection() {
    return [
        {
            name: 'fixed',
            data: [
                { height: 500, width: 500, value: 0 },
                { height: 914, width: 1514, value: 0 },
                { height: 2400, width: 3000, value: 0 },
            ],
        },
        {
            name: 'operable',
            data: [
                { height: 500, width: 500, value: 0 },
                { height: 914, width: 1514, value: 0 },
                { height: 1200, width: 2400, value: 0 },
            ],
        },
    ];
}

export default Backbone.Collection.extend({
    model: PricingGrid,
    parse(data) {
        let data_object = object.extractObjectOrNull(data);

        //  This is to deal with the old grids format
        if (data_object && !_.isArray(data_object) && _.isObject(data_object)) {
            data_object = [
                { name: 'fixed', data: data_object.fixed || [] },
                { name: 'operable', data: data_object.operable || [] },
            ];
        }

        return data_object;
    },
    getByName(grid_name) {
        return this.findWhere({ name: grid_name });
    },
    getValueForGrid(grid_name, options) {
        const target_grid = this.getByName(grid_name);

        return target_grid && target_grid.getValue(options);
    },
    initialize(attribures, options) {
        if (options.append_default_grids && this.length === 0) {
            this.set(getDefaultGridCollection(), { parse: true });
        }
    },
});
