import _ from 'underscore';
import Backbone from 'backbone';

import Schema from '../../../schema';
import utils from '../../../utils';

var GRID_ITEM_PROPERTIES = [
    {name: 'height', title: 'Height', type: 'number'},
    {name: 'width', title: 'Width', type: 'number'},
    {name: 'value', title: 'Value', type: 'number'}
];

export const GridItem = Backbone.Model.extend({
    schema: Schema.createSchema(GRID_ITEM_PROPERTIES),
    defaults: function () {
        return {
            height: 0,
            width: 0,
            value: 0
        };
    },
    persist: function () {
        return this.set.apply(this, arguments);
    },
    parse: function (data) {
        //  This is for compatibility reasons with the old format
        if (data && data.price_per_square_meter) {
            data.value = data.price_per_square_meter;
        }

        return Schema.parseAccordingToSchema(data, this.schema);
    },
    getArea: function () {
        return this.get('width') * this.get('height');
    }
});

export const Grid = Backbone.Collection.extend({
    model: GridItem,
    comparator: function (item) {
        return item.getArea();
    },
    //  How this algorithm works:
    //  1. Grid items are already sorted by area size
    //  2. If our size < lowest size, price = lowest size price
    //  3. If our size > largest size, price = largest size price
    //  4. If our size === some size, price = some size price
    //  5. If our size > some size and < some other size, price is
    //  a linear interpolation between prices for these sizes
    getValue: function (options) {
        var target_area = options.width * options.height;
        var value = 0;

        if (this.length) {
            if (target_area < this.first().getArea()) {
                value = this.first().get('value');
            } else if (target_area > this.last().getArea()) {
                value = this.last().get('value');
            } else {
                this.models.some(function (grid_item, index) {
                    if (target_area === grid_item.getArea()) {
                        value = grid_item.get('value');
                        return true;
                    } else if (this.at(index + 1) &&
                        target_area < this.at(index + 1).getArea() &&
                        target_area > grid_item.getArea()
                    ) {
                        value = utils.math.linear_interpolation(
                            target_area,
                            grid_item.getArea(),
                            this.at(index + 1).getArea(),
                            grid_item.get('value'),
                            this.at(index + 1).get('value')
                        );
                        return true;
                    }

                    return false;
                }, this);
            }
        }

        return value;
    }
});

function getDefaultGridData() {
    return [
        {height: 500, width: 500, value: 0},
        {height: 914, width: 1514, value: 0},
        {height: 2400, width: 3000, value: 0}
    ];
}

var PRICING_GRID_PROPERTIES = [
    {name: 'name', title: 'Name', type: 'string'},
    {name: 'data', title: 'Grid Data', type: 'collection:Grid'}
];

//  TODO: we could have like Backbone.InlineModel class, or use a mixin
export default Backbone.Model.extend({
    defaults: function () {
        var defaults = {};

        _.each(PRICING_GRID_PROPERTIES, function (item) {
            defaults[item.name] = this.getDefaultValue(item.name, item.type);
        }, this);

        return defaults;
    },
    getDefaultValue: function (name, type) {
        var default_value = '';

        var type_value_hash = {
            number: 0
        };

        var name_value_hash = {
            data: new Grid(getDefaultGridData())
        };

        if (_.indexOf(_.keys(type_value_hash), type) !== -1) {
            default_value = type_value_hash[type];
        }

        if (_.indexOf(_.keys(name_value_hash), name) !== -1) {
            default_value = name_value_hash[name];
        }

        return default_value;
    },
    getValue: function () {
        return this.get('data').getValue.apply(this.get('data'), arguments);
    },
    toJSON: function () {
        var json = Backbone.Model.prototype.toJSON.apply(this, arguments);

        json.data = this.get('data').toJSON();

        return json;
    },
    persist: function () {
        return this.set.apply(this, arguments);
    },
    //  TODO: we need to have some common behavior for inlined models like
    //  try to parse as json if it's a string, then try to check if it's a
    //  proper object, and just return the default set if it's not (or
    //  throw if this specific model doesn't want to fallback to defaults)
    //  TODO: we also want to have { parse: true } by default for this
    //  kind of models, is there a way to enable that? We could check if
    //  parse is set to true on model initialize and throw if it is not
    parse: function (attributes) {
        var attrs = attributes || {};
        var grid_data = attributes && attributes.data || {};

        attrs.data = new Grid(utils.object.extractObjectOrNull(grid_data), {parse: true});

        return attrs;
    },
    initialize: function () {
        //  The order of events doesn't really match the way events
        //  propagate from model to collection, but it should be okay for
        //  the purpose of persisting the model on grid item change
        this.listenTo(this.get('data'), 'change update', function (changed_object) {
            this.trigger('change:data change', changed_object);
        });
    }
});
