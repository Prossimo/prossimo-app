import _ from 'underscore';
import clone from 'clone';
import Backbone from 'backbone';

import Schema from '../../../schema';
import { math, object } from '../../../utils';

const GRID_ITEM_PROPERTIES = [
    { name: 'height', title: 'Height', type: 'number' },
    { name: 'width', title: 'Width', type: 'number' },
    { name: 'value', title: 'Value', type: 'number' },
];

export const GridItem = Backbone.Model.extend({
    schema: Schema.createSchema(GRID_ITEM_PROPERTIES),
    defaults() {
        return {
            height: 0,
            width: 0,
            value: 0,
        };
    },
    persist(...args) {
        return this.set(...args);
    },
    parse(data) {
        const data_to_parse = clone(data);

        //  This is for compatibility reasons with the old format
        if (data_to_parse && data_to_parse.price_per_square_meter) {
            data_to_parse.value = data_to_parse.price_per_square_meter;
        }

        return Schema.parseAccordingToSchema(data_to_parse, this.schema);
    },
    getArea() {
        return this.get('width') * this.get('height');
    },
});

export const Grid = Backbone.Collection.extend({
    model: GridItem,
    comparator(item) {
        return item.getArea();
    },
    //  How this algorithm works:
    //  1. Grid items are already sorted by area size
    //  2. If our size < lowest size, price = lowest size price
    //  3. If our size > largest size, price = largest size price
    //  4. If our size === some size, price = some size price
    //  5. If our size > some size and < some other size, price is
    //  a linear interpolation between prices for these sizes
    getValue(options) {
        const target_area = options.width * options.height;
        let value = 0;

        if (this.length) {
            if (target_area < this.first().getArea()) {
                value = this.first().get('value');
            } else if (target_area > this.last().getArea()) {
                value = this.last().get('value');
            } else {
                this.models.some((grid_item, index) => {
                    if (target_area === grid_item.getArea()) {
                        value = grid_item.get('value');
                        return true;
                    } else if (this.at(index + 1) &&
                        target_area < this.at(index + 1).getArea() &&
                        target_area > grid_item.getArea()
                    ) {
                        value = math.linear_interpolation(
                            target_area,
                            grid_item.getArea(),
                            this.at(index + 1).getArea(),
                            grid_item.get('value'),
                            this.at(index + 1).get('value'),
                        );
                        return true;
                    }

                    return false;
                });
            }
        }

        return value;
    },
});

function getDefaultGridData() {
    return [
        { height: 500, width: 500, value: 0 },
        { height: 914, width: 1514, value: 0 },
        { height: 2400, width: 3000, value: 0 },
    ];
}

const PRICING_GRID_PROPERTIES = [
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'data', title: 'Grid Data', type: 'collection:Grid' },
];

//  TODO: we could have like Backbone.InlineModel class, or use a mixin
export default Backbone.Model.extend({
    defaults() {
        const defaults = {};

        _.each(PRICING_GRID_PROPERTIES, (item) => {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        });

        return defaults;
    },
    getDefaultValue(name, type) {
        let default_value = '';

        const type_value_hash = {
            number: 0,
        };

        const name_value_hash = {
            data: new Grid(getDefaultGridData()),
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    getValue(...args) {
        return this.get('data').getValue(...args);
    },
    toJSON(...args) {
        const json = Backbone.Model.prototype.toJSON.apply(this, args);

        json.data = this.get('data').toJSON();

        return json;
    },
    persist(...args) {
        return this.set(...args);
    },
    //  TODO: we need to have some common behavior for inlined models like
    //  try to parse as json if it's a string, then try to check if it's a
    //  proper object, and just return the default set if it's not (or
    //  throw if this specific model doesn't want to fallback to defaults)
    //  TODO: we also want to have { parse: true } by default for this
    //  kind of models, is there a way to enable that? We could check if
    //  parse is set to true on model initialize and throw if it is not
    parse(attributes) {
        const attrs = attributes || {};
        const grid_data = (attributes && attributes.data) || {};

        attrs.data = new Grid(object.extractObjectOrNull(grid_data), { parse: true });

        return attrs;
    },
    initialize() {
        //  The order of events doesn't really match the way events
        //  propagate from model to collection, but it should be okay for
        //  the purpose of persisting the model on grid item change
        this.listenTo(this.get('data'), 'change update', (changed_object) => {
            this.trigger('change:data change', changed_object);
        });
    },
});
