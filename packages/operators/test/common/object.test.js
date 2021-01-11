import object from '../../src/common/object';

test('_object valid methods', () => {
  expect(object({ params: [{ a: 11, b: 22 }], method: 'keys', location: 'locationId' })).toEqual([
    'a',
    'b',
  ]);
  expect(object({ params: [{ a: 11, b: 22 }], method: 'values', location: 'locationId' })).toEqual([
    11,
    22,
  ]);
  expect(
    object({ params: [{ a: 11, b: 22 }, 'b'], method: 'hasOwnProperty', location: 'locationId' })
  ).toEqual(true);
});

test('_object called with no method or params', () => {
  expect(() => object({ location: 'locationId' })).toThrow(
    'Operator Error: _object takes an array with the first argument as an object on which to evaluate "undefined". Received: {"_object.undefined":undefined} at locationId.'
  );
});

test('_object invalid method', () => {
  expect(() => object({ params: [{ a: 1 }], method: 'X', location: 'locationId' })).toThrow(
    'Operator Error: _object must be called with one of the following: keys, values, hasOwnProperty. Received: {"_object.X":[{"a":1}]} at locationId.'
  );
});

test('_object invalid method args', () => {
  expect(() => object({ params: 'X', method: 'flat', location: 'locationId' })).toThrow(
    'Operator Error: _object takes an array with the first argument as an object on which to evaluate "flat". Received: {"_object.flat":"X"} at locationId.'
  );
});
