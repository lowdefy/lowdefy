import runClass from '../src/runClass';

const location = 'locationId';
const operator = '_op';
const Cls = {
  double: (a) => a * 2,
  add: (a, b, c) => a + b + c,
  constant: 42,
};
const allowedMethods = ['double', 'add'];
const allowedProperties = ['constant'];

test('evaluate method', () => {
  expect(
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      method: 'double',
      operator,
      params: [2],
    })
  ).toEqual(4);
});

test('evaluate method, spread properties', () => {
  expect(
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      method: 'add',
      operator,
      params: [1, 2, 3],
    })
  ).toEqual(6);
});

test('not an allowed method', () => {
  expect(() =>
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      method: 'x',
      operator,
      params: [1, 2, 3],
    })
  ).toThrow(
    'Operator Error: _op must be called with one of the following: double, add. Received: {"_op.x":[1,2,3]} at locationId.'
  );
});

test('get property', () => {
  expect(
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      operator,
      params: 'constant',
    })
  ).toEqual(42);
});

test('not an allowed property', () => {
  expect(() =>
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      operator,
      params: 'x',
    })
  ).toThrow(
    'Operator Error: _op must be called with one of the following values: constant. Received: {"_op":"x"} at locationId.'
  );
});

test('method operator not called with a method', () => {
  expect(() =>
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      operator,
      params: 123,
    })
  ).toThrow(
    'Operator Error: _op must be called with one of the following properties: constant; or methods: double, add. Received: 123 at locationId.'
  );
});
