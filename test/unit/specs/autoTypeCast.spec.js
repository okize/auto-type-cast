import autoTypeCast from '../../../src/autoTypeCast';
import { registerClass } from '../../../src/classRegistry';

/* eslint-disable class-methods-use-this */
class TestA { testA() { return 'testA'; }}
class TestB { testB() { return 'testB'; }}
/* eslint-enable class-methods-use-this */
registerClass(TestA);
registerClass(TestB);

describe('autoTypeCast', () => {
  test('converts the object to the class specified by __type', () => {
    const obj = { arbitraryAttribute: 'testA', __type: 'TestA' };
    expect(obj.testA).toBeUndefined();
    expect(obj.constructor).toEqual(Object);

    expect(autoTypeCast(obj)).toEqual(obj);
    expect(obj.testA()).toEqual('testA');
    expect(obj.constructor.name).toEqual('TestA');
    expect(obj.arbitraryAttribute).toEqual('testA');
  });

  test('it converts nested objects', () => {
    const obj = {
      arbitraryAttribute: 'testA',
      __type: 'TestA',
      b: { arbitraryAttribute: 'testB', __type: 'TestB' },
    };

    autoTypeCast(obj);

    expect(obj.b.testB()).toEqual('testB');
    expect(obj.b.constructor.name).toEqual('TestB');
    expect(obj.b.arbitraryAttribute).toEqual('testB');
  });

  test('it converts objects within in iterable', () => {
    const iterable = [
      { arbitraryAttribute: 'testA', __type: 'TestA' },
      { arbitraryAttribute: 'testA', __type: 'TestA' },
    ];
    expect(iterable.constructor.name).toEqual('Array');
    iterable.forEach((obj) => {
      expect(obj.testA).toBeUndefined();
      expect(obj.constructor).toEqual(Object);
    });

    expect(autoTypeCast(iterable)).toEqual(iterable);
    expect(iterable.constructor.name).toEqual('Array');
    iterable.forEach((obj) => {
      expect(obj.testA()).toEqual('testA');
      expect(obj.constructor.name).toEqual('TestA');
      expect(obj.arbitraryAttribute).toEqual('testA');
    });
  });

  test('it converts nested iterables', () => {
    const obj = { iterable: [{ arbitraryAttribute: 'testA', __type: 'TestA' }] };

    autoTypeCast(obj);

    expect(obj.iterable[0].testA()).toEqual('testA');
    expect(obj.iterable[0].constructor.name).toEqual('TestA');
    expect(obj.iterable[0].arbitraryAttribute).toEqual('testA');
  });

  test('does not convert objects without a __type', () => {
    const obj = { arbitraryAttribute: 'testA', type: 'TestA' };

    expect(autoTypeCast(obj)).toEqual(obj);
    expect(obj.testA).toBeUndefined();
    expect(obj.constructor).toEqual(Object);
    expect(obj.arbitraryAttribute).toEqual('testA');
  });

  test('does convert deeply nested objects within objects without a __type', () => {
    const obj = {
      arbitraryAttribute: 'testA',
      type: 'TestA',
      iterable: [{ convertMe: false, b: { arbitraryAttribute: 'testB', __type: 'TestB' } }],
    };

    autoTypeCast(obj);

    expect(obj.iterable[0].b.testB()).toEqual('testB');
    expect(obj.iterable[0].b.constructor.name).toEqual('TestB');
    expect(obj.iterable[0].b.arbitraryAttribute).toEqual('testB');
  });

  test('does not convert an instance of a class created by a constructor', () => {
    const a = new TestA();
    a.__type = 'TestB';

    expect(autoTypeCast(a).constructor.name).toEqual('TestA');
  });

  test('does not convert an instance that was previously autoTypeCasted', () => {
    const a = autoTypeCast({ __type: 'TestA' });
    a.__type = 'TestB';

    expect(autoTypeCast(a).constructor.name).toEqual('TestA');
  });

  test('can convert using a key name given as a parameter', () => {
    const objects = [
      { __type: 'TestA' },
      { typeName: 'TestA' },
      { nested: { __type: 'TestA', typeName: 'TestB' } },
    ];

    autoTypeCast(objects, { typeKey: 'typeName' });

    expect(objects[0].constructor).toEqual(Object);
    expect(objects[1].constructor).toEqual(TestA);
    expect(objects[2].nested.constructor).toEqual(TestB);
  });

  test('it does not convert an object if the type is not registered', () => {
    const obj = { __type: 'TestZ' };

    autoTypeCast(obj);

    expect(obj.constructor).toEqual(Object);
  });

  // todo: class does not exist in registry and option to throw is set

  describe('no-op types', () => {
    test('does nothing if passed null', () => {
      expect(autoTypeCast(null)).toEqual(null);
    });

    test('does nothing if passed a boolean', () => {
      expect(autoTypeCast(true)).toEqual(true);
    });

    test('does nothing if passed a string', () => {
      expect(autoTypeCast('test')).toEqual('test');
    });

    test('does nothing if passed a number', () => {
      expect(autoTypeCast(1.2)).toEqual(1.2);
    });
  });
});
