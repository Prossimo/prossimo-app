import mixin from '../../../src/utils/mixinDecoratorFactory';

test('Create mixin as decorator tests', () => {
    @mixin({
        mixin2Prop: 'mixin2',
        testclass: 'mixin2',
        testmixin1: 'mixin2',
        getMixin2Prop() {
            return this.mixin2Prop;
        },
        behaviourFn() {
            this.mixin2Prop = true;
        },
    })
    @mixin({
        mixin1Prop: 'mixin1',
        testclass: 'mixin1',
        testmixin1: 'mixin1',
        getMixin1Prop() {
            return this.mixin1Prop;
        },
        behaviourFn() {
            this.mixin1Prop = true;
        },
    })
    class TestClass {
        constructor() {
            this.prop = 'isClassProp';
            this.testclass = 'testclass';
        }

        getProp() {
            return this.prop;
        }

        behaviourFn() {
            this.prop = true;
        }
    }
    test('methods and properties correctly mixed', () => {
        const testClass = new TestClass();

        deepEqual({
            prop: testClass.prop,
            mixin1Prop: testClass.mixin1Prop,
            mixin2Prop: testClass.mixin2Prop,
        }, {
            prop: 'isClassProp',
            mixin1Prop: 'mixin1',
            mixin2Prop: 'mixin2',
        }, 'properties are added correctly');

        deepEqual({
            prop: testClass.getProp(),
            mixin1Prop: testClass.getMixin1Prop(),
            mixin2Prop: testClass.getMixin2Prop(),
        }, {
            prop: 'isClassProp',
            mixin1Prop: 'mixin1',
            mixin2Prop: 'mixin2',
        }, 'execution context saved');

        deepEqual({
            testclass: testClass.testclass,
            testmixin1: testClass.testmixin1,
        }, {
            testclass: 'testclass',
            testmixin1: 'mixin2',
        }, 'same properties are replaced');

        testClass.behaviourFn();

        deepEqual({
            prop: testClass.prop,
            mixin1Prop: testClass.mixin1Prop,
            mixin2Prop: testClass.mixin2Prop,
        }, {
            prop: true,
            mixin1Prop: true,
            mixin2Prop: true,
        }, 'same methods are called cascading');
    });
});
