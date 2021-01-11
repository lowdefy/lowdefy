import array from '../../src/common/array';

test('_array valid methods', () => {
  expect(
    array({
      params: [
        [1, 2],
        [3, 4],
      ],
      method: 'concat',
      location: 'locationId',
    })
  ).toEqual([1, 2, 3, 4]);
  expect(
    array({
      params: [[1, 2, 3, 4], 0, 2, 4],
      method: 'copyWithin',
      location: 'locationId',
    })
  ).toEqual([3, 4, 3, 4]);
  expect(
    array({
      params: [[1, 2, 3, 4], 6],
      method: 'fill',
      location: 'locationId',
    })
  ).toEqual([6, 6, 6, 6]);
  expect(
    array({
      params: [[1, [2]]],
      method: 'flat',
      location: 'locationId',
    })
  ).toEqual([1, 2]);
  expect(
    array({
      params: [[1, 2, 3], 2],
      method: 'includes',
      location: 'locationId',
    })
  ).toEqual(true);
  expect(
    array({
      params: [[1, 2, 3], 2],
      method: 'indexOf',
      location: 'locationId',
    })
  ).toEqual(1);
  expect(
    array({
      params: [[1, 2, 3]],
      method: 'join',
      location: 'locationId',
    })
  ).toEqual('1,2,3');
  expect(
    array({
      params: [[1, 2, 3, 2], 2],
      method: 'lastIndexOf',
      location: 'locationId',
    })
  ).toEqual(3);
  expect(
    array({
      params: [[1, 2, 3]],
      method: 'reverse',
      location: 'locationId',
    })
  ).toEqual([3, 2, 1]);
  expect(
    array({
      params: [[1, 2, 3, 4], 1, 3],
      method: 'slice',
      location: 'locationId',
    })
  ).toEqual([2, 3]);
  expect(
    array({
      params: [['b', 'c', 'a']],
      method: 'sort',
      location: 'locationId',
    })
  ).toEqual(['a', 'b', 'c']);
  expect(
    array({
      params: [['b', 'c', 'a']],
      method: 'toString',
      location: 'locationId',
    })
  ).toEqual('b,c,a');
});

test('_array where the return type differ from the js implementation', () => {
  expect(
    array({
      params: [['b', 'c', 'a'], 1, 0, 'x'],
      method: 'splice',
      location: 'locationId',
    })
  ).toEqual(['b', 'x', 'c', 'a']);
  expect(
    array({
      params: [[1, 2, 3]],
      method: 'shift',
      location: 'locationId',
    })
  ).toEqual([2, 3]);
  expect(
    array({
      params: [[1, 2, 3]],
      method: 'pop',
      location: 'locationId',
    })
  ).toEqual([1, 2]);
  expect(
    array({
      params: [[1, 2, 3], 1],
      method: 'push',
      location: 'locationId',
    })
  ).toEqual([1, 2, 3, 1]);
  expect(
    array({
      params: [[1, 2, 3], 4],
      method: 'unshift',
      location: 'locationId',
    })
  ).toEqual([4, 1, 2, 3]);
});

test('_array valid properties', () => {
  expect(array({ params: [[1, 2, 3, 4]], method: 'length', location: 'locationId' })).toEqual(4);
});
test('_array invalid instnace', () => {
  expect(() => array({ params: [1, 2, 3, 4], method: 'length', location: 'locationId' })).toThrow(
    'Operator Error: _array takes an array with the first argument as an array on which to evaluate "length". Received: {"_array.length":[1,2,3,4]} at locationId'
  );
});

test('_array called with no method or params', () => {
  expect(() => array({ location: 'locationId' })).toThrow(
    'Operator Error: _array takes an array with the first argument as an array on which to evaluate "undefined". Received: {"_array.undefined":undefined} at locationId.'
  );
});

test('_array invalid method', () => {
  expect(() => array({ params: [['a']], method: 'X', location: 'locationId' })).toThrow(
    'Operator Error: _array must be called with one of the following properties: length; or methods: concat, copyWithin, fill, flat, includes, indexOf, join, lastIndexOf, pop, push, reverse, shift, slice, sort, splice, toString, unshift. Received: {"_array.X":[["a"]]} at locationId.'
  );
});

test('_array invalid method args', () => {
  expect(() => array({ params: 'X', method: 'flat', location: 'locationId' })).toThrow(
    'Operator Error: _array takes an array with the first argument as an array on which to evaluate "flat". Received: {"_array.flat":"X"} at locationId.'
  );
});
