window.ok = (actual, message) => {
    it(message, () => {
        expect(actual).to.be.ok;
    });
};

window.notOk = (actual, message) => {
    it(message, () => {
        expect(actual).to.not.be.ok;
    });
};

window.equal = (actual, expected, message = 'no_mess') => {
    it(message, () => {
        expect(actual).to.to.equal(expected);
    });
};

window.deepEqual = (actual, expected, message = 'no_mess') => {
    it(message, () => {
        expect(actual).to.deep.equal(expected);
    });
};

window.instanceOf = (actual, expected, message = 'no_mess') => {
    it(message, () => {
        expect(actual).to.be.instanceof(expected);
    });
};

window.test = (message, callback) => {
    describe(message, callback);
};

before(function () {
});
