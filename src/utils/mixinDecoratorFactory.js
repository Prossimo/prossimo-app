import _ from 'underscore';

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
            const _behaviourFn = behaviour[property];
            // if parent class property anb property is function, we need to call it.
            if (Object.prototype.hasOwnProperty.call(clazz.prototype, property) && _.isFunction(clazz.prototype[property])) {
                value = function _wrapper(...args) {
                    let returnValue;
                    [_behaviourFn, clazz.prototype[property]].forEach((fn) => {
                        const returnedValue = _.isFunction(fn) ? fn.apply(this, args) : fn;
                        returnValue = (typeof returnedValue === 'undefined' ? returnValue : returnedValue);
                    });

                    return returnValue;
                };
            } else {
                value = _behaviourFn;
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
