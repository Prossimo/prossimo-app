import chaiSubset from 'chai-subset';

global.chai.use(chaiSubset);

global.ok = (actual, message) => {
    it(message, () => {
        expect(actual).to.be.ok;
    });
};

global.notOk = (actual, message) => {
    it(message, () => {
        expect(actual).to.not.be.ok;
    });
};

global.equal = (actual, expected, message = 'no_mess') => {
    it(message, () => {
        expect(actual).to.equal(expected);
    });
};

global.deepEqual = (actual, expected, message = 'no_mess') => {
    it(message, () => {
        expect(actual).to.deep.equal(expected);
    });
};

global.instanceOf = (actual, expected, message = 'no_mess') => {
    it(message, () => {
        expect(actual).to.be.instanceof(expected);
    });
};

global.containSubset = (actual, expected, message = 'no_mess') => {
    it(message, () => {
        expect(actual).to.containSubset(expected);
    });
};

global.test = (message, callback) => {
    describe(message, callback);
};

global.test.only = (message, callback) => {
    describe.only(message, callback);
};

global.test.skip = (message, callback) => {
    describe.skip(message, callback);
};

before(() => {
});
