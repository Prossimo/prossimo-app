/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

var c = app.utils.convert;

app.session = new app.Session();
app.session.set('no_backend', true);

app.settings = new app.Settings();

test('units collection instanceOf tests', function () {
    var units_collection = new app.BaseunitCollection();
    var unit_model = new units_collection.model();
    var project = new app.Project();

    instanceOf(units_collection, Backbone.Collection, 'should belong to Backbone.Collection object');
    instanceOf(unit_model, Backbone.Model, 'collection model should belong to Backbone.Model object');
    instanceOf(unit_model, app.Baseunit, 'collection model should belong to app.Baseunit object');
    instanceOf(project.units, app.BaseunitCollection, 'app.Project().units should belong to app.BaseunitCollection object');
});

test('units collection basic tests', function () {
    var data = [{
        mark: 'A',
        width: 30,
        height: 40,
        quantity: 1,
        description: 'Tilt and turn inswing / fixed PVC',
        notes: 'Opening restriction cord included',
        original_cost: 399,
        original_currency: 'EUR',
        conversion_rate: 0.90326078,
        price_markup: 2.3,
        uw: 0.77,
        glazing: '3Std U=.09 SGHC=.5',
        discount: 20
    }, {
        mark: 'B1',
        width: 38,
        height: 24,
        quantity: 2,
        description: 'Tilt and turn inswing above / removable ac sash below. PVC',
        notes: 'Opening restriction cord included',
        original_cost: 279,
        original_currency: 'EUR',
        conversion_rate: 0.90326078,
        price_markup: 2.3,
        uw: 0.78,
        glazing: '3Std U=.09 SGHC=.5',
        discount: 20
    }];
    var units_collection = new app.BaseunitCollection(data);

    equal(units_collection.getTotalUnitTypes(), 2, '#getTotalUnitTypes() should return correct number of models');
    equal(units_collection.getTotalUnitQuantity(), 3, '#getTotalUnitQuantity() should return sum all "quantity"');
    equal(units_collection.getTotalSquareFeet(), 21, '#getTotalSquareFeet() should return sum all squares');
});

test('units collection by profiles', function () {
    var data = [{
        mark: 'A',
        width: 30,
        height: 40,
        quantity: 1,
        description: 'Tilt and turn inswing / fixed PVC',
        notes: 'Opening restriction cord included',
        original_cost: 399,
        original_currency: 'EUR',
        conversion_rate: 0.90326078,
        price_markup: 2.3,
        uw: 0.77,
        glazing: '3Std U=.09 SGHC=.5',
        discount: 20
    }, {
        mark: 'B1',
        width: 38,
        height: 24,
        quantity: 2,
        description: 'Tilt and turn inswing above / removable ac sash below. PVC',
        notes: 'Opening restriction cord included',
        original_cost: 279,
        original_currency: 'EUR',
        conversion_rate: 0.90326078,
        price_markup: 2.3,
        uw: 0.78,
        glazing: '3Std U=.09 SGHC=.5',
        discount: 20
    }];
    var units_collection = new app.BaseunitCollection(data);
    var profileUnits_collection = units_collection.getUnitsByProfiles();

    ok(_.isArray(profileUnits_collection), '#getUnitsByProfiles() should return array');
    equal(profileUnits_collection.length, '1', '#getUnitsByProfiles() should return array');

    _.map(profileUnits_collection, function (profileUnit) {
        var profileUnitModel = new profileUnit.model();

        instanceOf(profileUnit, Backbone.Collection, 'should belong to Backbone.Collection object');
        instanceOf(profileUnit, app.BaseunitCollection, 'app.Project().units should belong to app.BaseunitCollection object');
        instanceOf(profileUnitModel, Backbone.Model, 'collection model should belong to Backbone.Model object');
        instanceOf(profileUnitModel, app.Baseunit, 'collection model should belong to app.Baseunit object');

        instanceOf(profileUnit.profile, app.Profile, 'this.profile should belong to app.Profile object');

        equal(profileUnit.getTotalUnitTypes(), 2, '#getTotalUnitTypes() should return correct number of models');
        equal(profileUnit.getTotalUnitQuantity(), 3, '#getTotalUnitQuantity() should return sum all "quantity"');
        equal(profileUnit.getTotalSquareFeet(), 21, '#getTotalSquareFeet() should return sum all squares');
    });
});

