import runInstance from '../src/runInstance';

const location = 'locationId';
const operator = '_op';
const Instance = {
  double: (a) => a * 2,
  add: (a, b, c) => a + b + c,
  constant: 42,
};
const allowedMethods = ['double', 'add'];
const allowedProperties = ['constant'];

test('evaluate method', () => {
  expect(
    runInstance({
      allowedMethods,
      allowedProperties,
      location,
      method: 'double',
      operator,
      params: [Instance, 2],
    })
  ).toEqual(4);
});

test('evaluate method, spread properties', () => {
  expect(
    runInstance({
      allowedMethods,
      allowedProperties,
      location,
      method: 'add',
      operator,
      params: [Instance, 1, 2, 3],
    })
  ).toEqual(6);
});

test('evaluate get property from key', () => {
  expect(
    runInstance({
      allowedMethods,
      allowedProperties,
      location,
      method: 'constant',
      operator,
      params: [Instance],
    })
  ).toEqual(42);
});

test('instance is null', () => {
  expect(
    runInstance({
      allowedMethods,
      allowedProperties,
      location,
      method: 'add',
      operator,
      params: [null, 1, 2, 3],
    })
  ).toEqual(null);
});

test('instance is undefined', () => {
  expect(() =>
    runInstance({
      allowedMethods,
      allowedProperties,
      location,
      method: 'add',
      operator,
      params: [undefined, 1, 2, 3],
    })
  ).toThrow(
    'Operator Error: _op takes an array with the first argument the instance on which to evaluate "add". Received: {"_op.add":[null,1,2,3]} at locationId.'
  );
});

test('instance method or property does not exist', () => {
  expect(() =>
    runInstance({
      allowedMethods,
      allowedProperties,
      location,
      method: 'x',
      operator,
      params: [undefined, 1, 2, 3],
    })
  ).toThrow(
    'Operator Error: _op must be called with one of the following properties: constant; or methods: double, add. Received: {"_op.x":[null,1,2,3]} at locationId.'
  );
});

test('method undefined', () => {
  expect(() =>
    runInstance({
      allowedMethods,
      allowedProperties,
      location,
      operator,
      params: [undefined, 1, 2, 3],
    })
  ).toThrow(
    'Operator Error: _op must be called with one of the following properties: constant; or methods: double, add. Received: {"_op.undefined":[null,1,2,3]} at locationId.'
  );
});
