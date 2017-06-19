import mixin from '../mixinDecoratorFactory';
/**
 * Decorator to extend a class with default properties
 *
 * @example
 * const opt = {
 *     className: 'create-project-modal modal fade',
 * };
 *
 * @props(opt)
 * export default class extends Marionette.View {}
 *
 * @function
 */
export default mixin;
