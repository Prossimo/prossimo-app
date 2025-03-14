import _ from 'underscore';

import App from '../../../../src/main';
import Unit from '../../../../src/core/models/unit';
import UnitCollection from '../../../../src/core/collections/unit-collection';
import Quote from '../../../../src/core/models/quote';
import Profile from '../../../../src/core/models/profile';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

describe('Units collection:', () => {
    describe('instanceOf tests', () => {
        const units_collection = new UnitCollection();
        const UnitModel = units_collection.model;
        const unit_model = new UnitModel();
        const quote = new Quote();

        instanceOf(unit_model, Unit, 'collection model should belong to Unit object');
        instanceOf(quote.units, UnitCollection, 'app.Quote().units should belong to app.UnitCollection object');
    });

    describe('basic tests', () => {
        const data = [{
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
            discount: 20,
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
            discount: 20,
        }];
        const units_collection = new UnitCollection(data);

        equal(units_collection.getTotalUnitTypes(), 2, '#getTotalUnitTypes() should return correct number of models');
        equal(units_collection.getTotalUnitQuantity(), 3, '#getTotalUnitQuantity() should return sum all "quantity"');
        equal(units_collection.getTotalSquareFeet(), 21, '#getTotalSquareFeet() should return sum all squares');
    });

    describe('by profiles', () => {
        const data = [{
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
            discount: 20,
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
            discount: 20,
        }];
        const units_collection = new UnitCollection(data);
        const profileUnits_collection = units_collection.getUnitsByProfiles();

        ok(_.isArray(profileUnits_collection), '#getUnitsByProfiles() should return array');
        equal(profileUnits_collection.length, 1, '#getUnitsByProfiles() should return array');

        _.map(profileUnits_collection, (profileUnit) => {
            const ProfileUnitModel = profileUnit.model;
            const profileUnitModel = new ProfileUnitModel();

            instanceOf(profileUnit, UnitCollection, 'Project().units should belong to UnitCollection object');
            instanceOf(profileUnitModel, Unit, 'collection model should belong to Unit object');

            instanceOf(profileUnit.profile, Profile, 'this.profile should belong to app.Profile object');

            equal(profileUnit.getTotalUnitTypes(), 2, '#getTotalUnitTypes() should return correct number of models');
            equal(profileUnit.getTotalUnitQuantity(), 3, '#getTotalUnitQuantity() should return sum all "quantity"');
            equal(profileUnit.getTotalSquareFeet(), 21, '#getTotalSquareFeet() should return sum all squares');
        });
    });
});
