import _ from 'underscore';

// Avoid closures
function _createWrapper(_behaviourFn, prototypeFn) {
    // you can't use arrow functions
    return function (...args) { // eslint-disable-line func-names
        let returnValue;
        [_behaviourFn, prototypeFn].forEach((fn) => {
            const returnedValue = _.isFunction(fn) ? fn.apply(this, args) : fn;
            returnValue = (typeof returnedValue === 'undefined'
                ? returnValue
                : returnedValue);
        });

        return returnValue;
    };
}

/**
 * Function to create mixin as decorator
 * thanks http://raganwald.com/2015/06/26/decorators-in-es7.html
 *
 * @example
 * const Mixin = mixin({
 *     onRender() {
 *         console.log('onRender from Mixin');
 *     }
 * });
 *
 * @Mixin
 * export default class extends Marionette.View {}
 *
 * @function
 */
export default function (behaviour, sharedBehaviour = {}) {
    const instanceKeys = Reflect.ownKeys(behaviour);
    const sharedKeys = Reflect.ownKeys(sharedBehaviour);
    const typeTag = Symbol('isa');
    function _mixin(clazz) {
        instanceKeys.forEach((property) => {
            let value;
            // if parent class property anb property is function, we need to call it.
            if (Object.prototype.hasOwnProperty.call(clazz.prototype, property) && _.isFunction(clazz.prototype[property])) {
                value = _createWrapper(behaviour[property], clazz.prototype[property]);
            } else {
                value = behaviour[property];
            }
            Object.defineProperty(clazz.prototype, property,
                { value, writable: true });
        });
        Object.defineProperty(clazz.prototype, typeTag, { value: true });
        return clazz;
    }

    sharedKeys.forEach((property) => {
        Object.defineProperty(_mixin, property, {
            value: sharedBehaviour[property],
            enumerable: Object.prototype.propertyIsEnumerable.call(sharedBehaviour, property),
        });
    });
    Object.defineProperty(_mixin, Symbol.hasInstance, {
        value: i => !!i[typeTag],
    });
    return _mixin;
}
